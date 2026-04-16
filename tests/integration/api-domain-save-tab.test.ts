import { beforeEach, describe, expect, it, vi } from "vitest";

const wpSaveDomainJsonTab = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => ({ value: "jwt-token" }),
  }),
}));

vi.mock("@/lib/server/wp-domain", () => ({
  wpSaveDomainJsonTab,
}));

describe("POST /api/domain/save-tab", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.WP_GRAPHQL_URL = "https://example.com/graphql";
  });

  it("returns 400 for invalid field", async () => {
    const { POST } = await import("@/app/api/domain/save-tab/route");
    const req = new Request("https://app.local/api/domain/save-tab", {
      method: "POST",
      headers: { origin: "https://app.local", "content-type": "application/json" },
      body: JSON.stringify({ domainId: 1, field: "hack_field", payload: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 when save succeeds", async () => {
    wpSaveDomainJsonTab.mockResolvedValue({ ok: true, message: "saved" });
    const { POST } = await import("@/app/api/domain/save-tab/route");
    const req = new Request("https://app.local/api/domain/save-tab", {
      method: "POST",
      headers: { origin: "https://app.local", "content-type": "application/json" },
      body: JSON.stringify({ domainId: 1, field: "dns_records_json", payload: [{ host: "@" }] }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toBe("saved");
  });
});
