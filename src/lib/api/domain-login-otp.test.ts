import { afterEach, describe, expect, it, vi } from "vitest";
import { loginByDomain } from "./auth";
import type { LoginDomainRequestDto } from "@/lib/contracts/api";
afterEach(() => vi.unstubAllGlobals());
describe("domain login client", () => {
  it.each<LoginDomainRequestDto>([
    { action: "start", domain: "example.test" },
    { action: "verify", domain: "example.test", code: "001234", challengeId: "a".repeat(64) },
    { action: "password", domain: "example.test", password: " spaces " },
  ])("does not auto retry side effects ($action)", async input => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"message":"unavailable"}', { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(loginByDomain(input)).rejects.toMatchObject({ status: 502 }); expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(input);
  });
});
