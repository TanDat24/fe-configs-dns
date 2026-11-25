import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ cookies: new Map<string, string>() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => mocks.cookies.has(name) ? { value: mocks.cookies.get(name) } : undefined }) }));
vi.mock("@/lib/server/observability", () => ({ observe: vi.fn() }));
import { POST } from "@/app/api/auth/login-domain/route";

const fetchMock = vi.fn();
const challengeId = "c".repeat(64);
const flow = "a".repeat(64);
const pending = { ok: true, challengeId, retryAfterSec: 60, expiresInSec: 300 };
const tokens = { authToken: "wp-session-secret", refreshToken: "wp-refresh-secret", username: "owner", domain: "example.test" };
let nextIp = 0;
function request(body: unknown, options: { ip?: string; origin?: string; raw?: string } = {}) {
  return new Request("https://app.example.test/api/auth/login-domain", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: options.origin ?? "https://app.example.test", "X-Forwarded-For": options.ip ?? `domain-${++nextIp}`, "X-Forwarded-Proto": "https" },
    body: options.raw ?? JSON.stringify(body),
  });
}
function upstream(value: unknown, status = 200) { fetchMock.mockImplementation(async () => new Response(JSON.stringify(value), { status })); }
function readyToVerify() { mocks.cookies.set("domain_login_flow", flow); }
const verifyBody = { action: "verify", domain: "example.test", challengeId, code: "001234" };

beforeEach(() => {
  vi.clearAllMocks(); mocks.cookies.clear();
  vi.stubEnv("WP_GRAPHQL_URL", "https://wp.example.test/graphql");
  vi.stubEnv("INTERNAL_API_ALLOWED_ORIGINS", "https://app.example.test");
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("domain OTP login boundary", () => {
  it("starts anonymously with a private browser flow but never issues login tokens", async () => {
    upstream({ data: { startDomainLoginOtp: { ...pending, email: "private@example.test", authToken: "not-yet" } } });
    const response = await POST(request({ action: "start", domain: " HTTPS://WWW.Example.test/path ", email: "attacker@example.test", userId: 99 }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, step: "otp", challengeId, retryAfterSec: 60, expiresInSec: 300 });
    expect(JSON.stringify(body)).not.toMatch(/private@example|not-yet/);
    const cookie = response.cookies.get("domain_login_flow");
    expect(cookie?.value).toMatch(/^[a-f0-9]{64}$/);
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/api/auth/login-domain", maxAge: 300 });
    expect(JSON.stringify(body)).not.toContain(cookie!.value);
    expect(response.cookies.get("wp_graphql_auth")).toBeUndefined();
    expect(response.cookies.get("wp_graphql_refresh")).toBeUndefined();
    const init = fetchMock.mock.calls[0][1];
    expect(JSON.parse(init.body).variables).toEqual({ domain: "example.test", flow: cookie!.value });
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.cache).toBe("no-store"); expect(init.redirect).toBe("error");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("resends using the same private flow and a new backend challenge", async () => {
    readyToVerify(); upstream({ data: { startDomainLoginOtp: pending } });
    const response = await POST(request({ action: "start", domain: "example.test" }));
    expect(response.cookies.get("domain_login_flow")?.value).toBe(flow);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables.flow).toBe(flow);
  });
  it("verifies leading-zero code and creates cookies only after a complete WP result", async () => {
    readyToVerify(); upstream({ data: { verifyDomainLoginOtp: tokens } });
    const response = await POST(request({ ...verifyBody, flow: "attacker", userId: 99 }));
    expect(response.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables).toEqual({ domain: "example.test", challengeId, code: "001234", flow });
    expect(await response.json()).toEqual({ ok: true, step: "authenticated", username: "owner", domain: "example.test", requestId: expect.any(String) });
    expect(response.cookies.get("wp_graphql_auth")).toMatchObject({ value: "wp-session-secret", httpOnly: true, secure: true });
    expect(response.cookies.get("wp_graphql_refresh")?.value).toBe("wp-refresh-secret");
    expect(response.cookies.get("domain_login_flow")).toMatchObject({ value: "", maxAge: 0, path: "/api/auth/login-domain" });
  });
  it("uses WP-password mutation and preserves password spaces", async () => {
    upstream({ data: { loginDomainWithPassword: tokens } });
    const response = await POST(request({ action: "password", domain: "example.test", password: " significant spaces " }));
    expect(response.status).toBe(200);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.query).toContain("loginDomainWithPassword("); expect(body.query).not.toContain("loginWithDomain(");
    expect(body.variables).toEqual({ domain: "example.test", password: " significant spaces " });
  });
  it("clears a previous account's refresh cookie if new WP result omits refresh", async () => {
    mocks.cookies.set("wp_graphql_refresh", "old-account");
    upstream({ data: { loginDomainWithPassword: { ...tokens, refreshToken: null } } });
    const response = await POST(request({ action: "password", domain: "example.test", password: "password" }));
    expect(response.cookies.get("wp_graphql_refresh")).toMatchObject({ value: "", maxAge: 0 });
    expect(response.cookies.get("wp_graphql_auth")?.value).toBe("wp-session-secret");
  });
  it.each([undefined, "malformed"])("cannot verify without private flow cookie (%s)", async value => {
    if (value) mocks.cookies.set("domain_login_flow", value);
    const response = await POST(request(verifyBody)); expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled(); expect(response.cookies.get("wp_graphql_auth")).toBeUndefined();
  });
  it.each([
    {}, { domain: "example.test", password: "old-contract" },
    { action: "unknown", domain: "example.test" }, { action: "start", domain: "bad..test" },
    { action: "start", domain: "-bad.test" }, { ...verifyBody, code: 123456 },
    { ...verifyBody, code: "12345" }, { ...verifyBody, challengeId: "bad" },
    { action: "password", domain: "example.test", password: "" },
  ])("rejects invalid inputs or old ambiguous contract", async body => {
    expect((await POST(request(body))).status).toBe(400); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON, missing config and foreign origin", async () => {
    expect((await POST(request({}, { raw: "{" }))).status).toBe(400);
    expect((await POST(request({}, { origin: "https://evil.example.test" }))).status).toBe(403);
    vi.stubEnv("WP_GRAPHQL_URL", ""); expect((await POST(request({}))).status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    ["Thong tin dang nhap khong dung", 401],
    ["Ban thao tac qua nhanh, vui long thu lai sau", 429], ["Vui long thu lai sau", 409],
    ["private SQL or email details", 502],
  ])("denies backend errors even when HTTP is 200 (%s)", async (message, status) => {
    readyToVerify(); upstream({ errors: [{ message }], data: { verifyDomainLoginOtp: tokens } });
    const response = await POST(request(verifyBody)); expect(response.status).toBe(status);
    expect(response.cookies.get("wp_graphql_auth")).toBeUndefined();
    expect(await response.text()).not.toContain("private SQL");
  });
  it.each([
    { authToken: "", refreshToken: null, username: "owner", domain: "example.test" },
    { ...tokens, domain: "another.test" }, { ...tokens, username: null },
    null, {},
  ])("never creates session from incomplete or mismatched token payload", async value => {
    readyToVerify(); upstream({ data: { verifyDomainLoginOtp: value } });
    const response = await POST(request(verifyBody)); expect(response.status).toBe(502);
    expect(response.cookies.get("wp_graphql_auth")).toBeUndefined();
  });
  it.each([
    { ...pending, ok: false }, { ...pending, challengeId: "bad" }, { ...pending, retryAfterSec: -1 }, null,
  ])("does not accept malformed start response", async value => {
    upstream({ data: { startDomainLoginOtp: value } });
    const response = await POST(request({ action: "start", domain: "example.test" }));
    expect(response.status).toBe(502); expect(response.cookies.get("domain_login_flow")).toBeUndefined();
  });
  it.each([401,403,429,500])("handles HTTP failure %s without issuing tokens", async status => {
    readyToVerify(); upstream({ data: { verifyDomainLoginOtp: tokens } }, status);
    const response = await POST(request(verifyBody));
    expect(response.status).toBe(status >= 500 ? 502 : status === 403 ? 401 : status);
    expect(response.cookies.get("wp_graphql_auth")).toBeUndefined();
  });
  it("does not retry a failed request or log credentials", async () => {
    readyToVerify(); fetchMock.mockRejectedValue(new Error("private secret"));
    expect((await POST(request(verifyBody))).status).toBe(502); expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(/private secret|001234|aaaaaa|cccccc/);
  });
  it("fails closed for non-JSON WordPress output", async () => {
    fetchMock.mockResolvedValue(new Response("<html>error</html>"));
    expect((await POST(request({ action: "start", domain: "example.test" }))).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("enforces request rate limits independently of domain existence", async () => {
    upstream({ data: { startDomainLoginOtp: pending } }); const ip = `limited-${++nextIp}`;
    for(let i=0;i<10;i++) expect((await POST(request({ action: "start", domain: "example.test" }, { ip }))).status).toBe(200);
    const response = await POST(request({ action: "start", domain: "example.test" }, { ip }));
    expect(response.status).toBe(429); expect(response.headers.get("retry-after")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});
