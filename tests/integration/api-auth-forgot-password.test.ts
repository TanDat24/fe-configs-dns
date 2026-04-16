import { beforeEach, describe, expect, it, vi } from "vitest";

const wpGraphqlForgotPassword = vi.fn();

vi.mock("@/lib/server/wp-forgot-password", () => ({
  wpGraphqlForgotPassword,
}));

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.WP_GRAPHQL_URL = "https://example.com/graphql";
  });

  it("returns 400 when body is invalid", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new Request("https://app.local/api/auth/forgot-password", {
      method: "POST",
      headers: { origin: "https://app.local", "content-type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 when WP accepts request", async () => {
    wpGraphqlForgotPassword.mockResolvedValue({
      ok: true,
      message: "Email sent",
      clientMutationId: "abc",
    });
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new Request("https://app.local/api/auth/forgot-password", {
      method: "POST",
      headers: { origin: "https://app.local", "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com" }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toBe("Email sent");
  });
});
