import "server-only";
import { z } from "zod";
import { parseWpJson, type WpGraphqlResponse } from "./wp-graphql-client";

type Failure = { ok: false; status: number; message: string };
type Result<T> = { ok: true; data: T } | Failure;
const pendingSchema = z.object({
  ok: z.literal(true), challengeId: z.string().regex(/^[a-f0-9]{64}$/),
  retryAfterSec: z.literal(60), expiresInSec: z.literal(300),
});
const tokensSchema = z.object({
  authToken: z.string().min(1), refreshToken: z.string().min(1).nullable().optional(),
  username: z.string().min(1), domain: z.string().min(1),
});
const failure: Failure = { ok: false, status: 502, message: "He thong tam thoi gian doan. Vui long thu lai sau." };
const genericLoginError = "Thong tin dang nhap khong dung";

async function execute<T>(endpoint: string, field: string, query: string, variables: Record<string, string>, schema: z.ZodType<T>): Promise<Result<T>> {
  try {
    const response = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }), cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return { ok: false, status: 401, message: genericLoginError };
      if (response.status === 429) return { ok: false, status: 429, message: "Ban thao tac qua nhanh. Vui long thu lai sau." };
      return failure;
    }
    const json = await parseWpJson<WpGraphqlResponse<Record<string, unknown>>>(response);
    if (!json || typeof json !== "object") return failure;
    if (json.errors?.length) {
      const message = json.errors[0]?.message;
      if (message === genericLoginError) return { ok: false, status: 401, message: genericLoginError };
      if (message === "Ban thao tac qua nhanh, vui long thu lai sau") return { ok: false, status: 429, message };
      if (message === "Vui long thu lai sau") return { ok: false, status: 409, message };
      return failure;
    }
    const parsed = schema.safeParse(json.data?.[field]);
    return parsed.success ? { ok: true, data: parsed.data } : failure;
  } catch { return failure; }
}

export function wpStartDomainLoginOtp(endpoint: string, domain: string, flow: string) {
  return execute(endpoint, "startDomainLoginOtp", `mutation StartDomainOtp($domain: String!, $flow: String!) {
    startDomainLoginOtp(input: {domain: $domain, flow: $flow}) { ok challengeId retryAfterSec expiresInSec }
  }`, { domain, flow }, pendingSchema);
}

export async function wpAuthenticateDomain(
  endpoint: string,
  input: { action: "verify"; domain: string; challengeId: string; code: string; flow: string }
    | { action: "password"; domain: string; password: string },
) {
  const result = input.action === "verify"
    ? await execute(endpoint, "verifyDomainLoginOtp", `mutation VerifyDomainOtp($domain: String!, $challengeId: String!, $code: String!, $flow: String!) {
        verifyDomainLoginOtp(input: {domain: $domain, challengeId: $challengeId, code: $code, flow: $flow}) {authToken refreshToken username domain}
      }`, { domain: input.domain, challengeId: input.challengeId, code: input.code, flow: input.flow }, tokensSchema)
    : await execute(endpoint, "loginDomainWithPassword", `mutation LoginDomainPassword($domain: String!, $password: String!) {
        loginDomainWithPassword(input: {domain: $domain, password: $password}) {authToken refreshToken username domain}
      }`, { domain: input.domain, password: input.password }, tokensSchema);
  if (result.ok && result.data.domain !== input.domain) return failure;
  return result;
}
