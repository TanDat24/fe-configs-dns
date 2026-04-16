import { beforeEach, describe, expect, it, vi } from "vitest";

const wpGraphqlLogin = vi.fn();

vi.mock("@/lib/server/wp-login", () => ({
  wpGraphqlLogin,
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.WP_GRAPHQL_URL = "https://example.com/graphql";
  });

  it("returns 400 when payload invalid", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const req = new Request("https://app.local/api/auth/login", {
      method: "POST",
      headers: { origin: "https://app.local", "content-type": "application/json" },
      body: JSON.stringify({ username: "", password: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns auth token on success", async () => {
    wpGraphqlLogin.mockResolvedValue({ ok: true, authToken: "token-123" });
    const { POST } = await import("@/app/api/auth/login/route");
    const req = new Request("https://app.local/api/auth/login", {
      method: "POST",
      headers: { origin: "https://app.local", "content-type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "secret" }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authToken).toBe("token-123");
  });
});
