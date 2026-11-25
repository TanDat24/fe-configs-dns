import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmailVerificationCode, verifyEmailVerificationCode } from "./auth";
afterEach(() => { vi.unstubAllGlobals(); });
describe("email verification browser API", () => {
  it.each([
    { call: () => sendEmailVerificationCode({ email: "owner@example.com" }), path: "/api/auth/email-verification/send" },
    { call: () => verifyEmailVerificationCode({ code: "001234" }), path: "/api/auth/email-verification/verify" },
  ])("never retries after HTTP 502: $path", async ({ call, path }) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"message":"upstream failed"}', { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(call()).rejects.toMatchObject({ status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(fetchMock.mock.calls[0][0]).toBe(path);
  });
  it("sends code as a string without browser-supplied identity", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true,"email":"owner@example.com"}'));
    vi.stubGlobal("fetch", fetchMock);
    await verifyEmailVerificationCode({ code: " 001234 " });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ code: "001234" });
  });
});
