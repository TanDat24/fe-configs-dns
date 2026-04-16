import { describe, expect, it, vi } from "vitest";
import { ApiError, apiJson } from "@/lib/api/client";

describe("apiJson", () => {
  it("returns parsed json on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiJson<{ ok: boolean }>("/api/test", { method: "GET" });
    expect(result.ok).toBe(true);
  });

  it("retries when first attempt fails with 5xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "server error" }), { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiJson<{ ok: boolean }>("/api/test", { retry: 1 });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws ApiError on bad response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Bad request" }), { status: 400, statusText: "Bad Request" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiJson("/api/test")).rejects.toBeInstanceOf(ApiError);
  });
});
