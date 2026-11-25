import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ token: "session-secret" as string | undefined }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => mocks.token ? { value: mocks.token } : undefined }) }));
vi.mock("@/lib/server/observability", () => ({ observe: vi.fn() }));
import { POST as send } from "@/app/api/auth/email-verification/send/route";
import { POST as verify } from "@/app/api/auth/email-verification/verify/route";

let ip = 0;
const fetchMock = vi.fn();
const endpoint = "https://wp.example.test/graphql";
function request(body: unknown, options: { origin?: string; raw?: string; ip?: string } = {}) {
  return new Request("https://app.example.test/api/auth/email-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: options.origin ?? "https://app.example.test", "X-Forwarded-For": options.ip ?? `test-${++ip}` },
    body: options.raw ?? JSON.stringify(body),
  });
}
function upstream(value: unknown, status = 200) {
  fetchMock.mockImplementation(async () => new Response(JSON.stringify(value), { status }));
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.token = "session-secret";
  vi.stubEnv("WP_GRAPHQL_URL", endpoint);
  vi.stubEnv("INTERNAL_API_ALLOWED_ORIGINS", "https://app.example.test");
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("email verification Next -> WordPress boundary", () => {
  it("forwards only normalized email and cookie identity; scrubs upstream details", async () => {
    upstream({ data: { sendCodeVerifyEmail: { ok: true, message: "private details", code: "123456", authToken: "private" } } });
    const response = await send(request({ email: " Owner@Example.com ", userId: 99, token: "attacker" }));
    expect(response.status).toBe(200);
    const init = fetchMock.mock.calls[0][1];
    expect(fetchMock.mock.calls[0][0]).toBe(endpoint);
    expect(init.headers.Authorization).toBe("Bearer session-secret");
    expect(init.cache).toBe("no-store"); expect(init.redirect).toBe("error");
    expect(JSON.parse(init.body).variables).toEqual({ email: "owner@example.com" });
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, requestId: expect.any(String) });
    expect(Object.keys(body).sort()).toEqual(["message", "ok", "requestId"]);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("preserves leading zeroes and verifies without changing the session", async () => {
    upstream({ data: { verifyEmailByCode: { ok: true, email: "owner@example.com" } } });
    const response = await verify(request({ code: " 001234 ", email: "attacker@example.com", userId: 99 }));
    expect(response.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables).toEqual({ code: "001234" });
    expect(await response.json()).toMatchObject({ ok: true, email: "owner@example.com" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it.each([send, verify])("rejects absent session", async handler => {
    mocks.token = undefined;
    expect((await handler(request({ email: "owner@example.com", code: "123456" }))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([send, verify])("rejects foreign and missing origins", async handler => {
    expect((await handler(request({}, { origin: "https://evil.example.test" }))).status).toBe(403);
    const req = request({}); req.headers.delete("Origin");
    expect((await handler(req)).status).toBe(403); expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    { handler: send, body: { email: "bad" } }, { handler: send, body: {} },
    { handler: verify, body: { code: 123456 } }, { handler: verify, body: { code: "12345" } },
    { handler: verify, body: { code: "abcdef" } }, { handler: verify, body: null },
  ])("rejects malformed input before upstream", async ({ handler, body }) => {
    expect((await handler(request(body))).status).toBe(400); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON and missing endpoint", async () => {
    expect((await send(request({}, { raw: "{" }))).status).toBe(400);
    vi.stubEnv("WP_GRAPHQL_URL", "");
    expect((await send(request({ email: "owner@example.com" }))).status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    ["Phien dang nhap khong hop le", 401], ["Ma xac thuc khong hop le", 400],
    ["Ma xac thuc khong hop le hoac da het han. Vui long gui lai ma", 400],
    ["Ban thao tac qua nhanh, vui long thu lai sau", 429], ["Vui long thu lai sau", 409],
  ])("honors backend denial %s even with HTTP 200", async (message, status) => {
    upstream({ errors: [{ message }], data: { verifyEmailByCode: { ok: true, email: "owner@example.com" } } });
    const response = await verify(request({ code: "123456" }));
    expect(response.status).toBe(status); expect(await response.json()).toMatchObject({ message });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([
    { data: { verifyEmailByCode: { ok: false } } },
    { data: { verifyEmailByCode: { ok: "true", email: "owner@example.com" } } },
    { data: { verifyEmailByCode: { ok: true } } },
    { data: { verifyEmailByCode: { ok: true, email: "bad" } } },
    { errors: [{ message: "private SQL and server data" }] }, {}, null,
  ])("fails closed for incomplete or unexpected response", async value => {
    upstream(value); const response = await verify(request({ code: "123456" }));
    expect(response.status).toBe(502); expect(await response.text()).not.toContain("private SQL");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403, 500])("honors HTTP failure %s", async status => {
    upstream({ data: { sendCodeVerifyEmail: { ok: true } } }, status);
    expect((await send(request({ email: "owner@example.com" }))).status).toBe(status >= 500 ? 502 : status);
  });
  it("does not retry network errors or expose error details in logs", async () => {
    fetchMock.mockRejectedValue(new Error("private token or code"));
    expect((await verify(request({ code: "001234" }))).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(/session-secret|001234|private token/);
  });
  it("handles non-JSON upstream without retry", async () => {
    fetchMock.mockResolvedValue(new Response("<html>upstream failure</html>"));
    expect((await send(request({ email: "owner@example.com" }))).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("limits sends and returns retry metadata without another upstream call", async () => {
    upstream({ data: { sendCodeVerifyEmail: { ok: true } } }); const clientIp = `limited-${++ip}`;
    for (let i = 0; i < 3; i++) expect((await send(request({ email: "owner@example.com" }, { ip: clientIp }))).status).toBe(200);
    const response = await send(request({ email: "owner@example.com" }, { ip: clientIp }));
    expect(response.status).toBe(429); expect(response.headers.get("retry-after")).toBeTruthy();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("email verification status API", () => {
  it("returns only current-account status without challenge secrets", async () => {
    const { GET } = await import("@/app/api/auth/email-verification/route");
    upstream({ data: { dnsMyEmailVerification: {
      email: "owner@example.com", verified: false, canVerify: true, pending: true, retryAfterSec: 60,
      code: "123456", digest: "private", userId: 99,
    } } });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      email: "owner@example.com", verified: false, canVerify: true, pending: true, retryAfterSec: 60,
      requestId: expect.any(String),
    });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer session-secret");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("requires a session for status", async () => {
    const { GET } = await import("@/app/api/auth/email-verification/route");
    mocks.token = undefined;
    expect((await GET()).status).toBe(401); expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    null,
    { email: "owner@example.com", verified: "true", canVerify: true, pending: false, retryAfterSec: 0 },
    { email: "owner@example.com", verified: true, canVerify: true, pending: false, retryAfterSec: -1 },
  ])("rejects missing or invalid authoritative status", async status => {
    const { GET } = await import("@/app/api/auth/email-verification/route");
    upstream({ data: { dnsMyEmailVerification: status } });
    expect((await GET()).status).toBe(502);
  });
});
