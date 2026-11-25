import "server-only";
import { z } from "zod";
import type {
  EmailVerificationStatusDto,
  SendEmailVerificationRequestDto,
  SendEmailVerificationResponseDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from "@/lib/contracts/api";
import { parseWpJson, type WpGraphqlResponse } from "./wp-graphql-client";

type Failure = { ok: false; status: number; message: string };
type Result<T> = { ok: true; data: T } | Failure;
type MutationField = "sendCodeVerifyEmail" | "verifyEmailByCode" | "dnsMyEmailVerification";
type Payload = { ok?: unknown; message?: unknown; email?: unknown };

const SEND_MUTATION = `
  mutation SendCodeVerifyEmail($email: String!) {
    sendCodeVerifyEmail(input: { email: $email }) { ok message }
  }
`;
const VERIFY_MUTATION = `
  mutation VerifyEmailByCode($code: String!) {
    verifyEmailByCode(input: { code: $code }) { ok message email }
  }
`;
const STATUS_QUERY = `
  query MyEmailVerification {
    dnsMyEmailVerification { email verified canVerify pending retryAfterSec }
  }
`;
const statusSchema = z.object({
  email: z.string(),
  verified: z.boolean(),
  canVerify: z.boolean(),
  pending: z.boolean(),
  retryAfterSec: z.number().int().min(0).max(300),
});

// Only known user-facing errors cross this boundary; never expose arbitrary WP output.
const EXPECTED_ERRORS: Record<string, number> = {
  "Phien dang nhap khong hop le": 401,
  "Vui long su dung email hien tai hop le cua tai khoan": 400,
  "Ban thao tac qua nhanh, vui long thu lai sau": 429,
  "Vui long thu lai sau": 409,
  "Ma xac thuc khong hop le": 400,
  "Ma xac thuc khong hop le hoac da het han. Vui long gui lai ma": 400,
};
const UPSTREAM_FAILURE: Failure = {
  ok: false,
  status: 502,
  message: "Khong the hoan tat xac minh email. Vui long thu lai sau.",
};

async function executeRequest(
  endpoint: string,
  token: string,
  field: MutationField,
  query: string,
  variables: Record<string, string>,
): Promise<Result<Payload>> {
  try {
    // These mutations have side effects. A timeout must never trigger an automatic retry.
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { ok: false, status: response.status, message: "Phien dang nhap khong hop le." };
      }
      return UPSTREAM_FAILURE;
    }
    const json = await parseWpJson<WpGraphqlResponse<Partial<Record<MutationField, Payload>>>>(response);
    if (!json || typeof json !== "object") return UPSTREAM_FAILURE;
    if (json.errors?.length) {
      const message = json.errors[0]?.message;
      const status = typeof message === "string" ? EXPECTED_ERRORS[message] : undefined;
      return status ? { ok: false, status, message } : UPSTREAM_FAILURE;
    }
    const payload = json.data?.[field];
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return UPSTREAM_FAILURE;
    if (field !== "dnsMyEmailVerification" && payload.ok !== true) return UPSTREAM_FAILURE;
    return { ok: true, data: payload };
  } catch {
    return UPSTREAM_FAILURE;
  }
}

export async function wpSendEmailVerificationCode(
  endpoint: string,
  token: string,
  input: SendEmailVerificationRequestDto,
): Promise<Result<SendEmailVerificationResponseDto>> {
  const result = await executeRequest(endpoint, token, "sendCodeVerifyEmail", SEND_MUTATION, { email: input.email });
  if (!result.ok) return result;
  return { ok: true, data: { ok: true, message: "Da gui ma xac thuc den email hien tai." } };
}

export async function wpVerifyEmailCode(
  endpoint: string,
  token: string,
  input: VerifyEmailRequestDto,
): Promise<Result<VerifyEmailResponseDto>> {
  const result = await executeRequest(endpoint, token, "verifyEmailByCode", VERIFY_MUTATION, { code: input.code });
  if (!result.ok) return result;
  if (typeof result.data.email !== "string" || !/^\S+@\S+\.\S+$/.test(result.data.email)) return UPSTREAM_FAILURE;
  return {
    ok: true,
    data: { ok: true, message: "Email xac thuc thanh cong.", email: result.data.email },
  };
}

export async function wpGetEmailVerificationStatus(
  endpoint: string,
  token: string,
): Promise<Result<EmailVerificationStatusDto>> {
  const result = await executeRequest(endpoint, token, "dnsMyEmailVerification", STATUS_QUERY, {});
  if (!result.ok) return result;
  const parsed = statusSchema.safeParse(result.data);
  return parsed.success ? { ok: true, data: parsed.data } : UPSTREAM_FAILURE;
}
