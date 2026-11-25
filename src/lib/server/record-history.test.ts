import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ token: "test-session" as string | undefined, graphql: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => mocks.token ? { value: mocks.token } : undefined }) }));
vi.mock("@/lib/server/wp-graphql-client", () => ({ wpGraphqlWithAuth: mocks.graphql }));
import { recordHistoryResponse } from "./record-history";

const request = (query = "") => new Request(`http://localhost/api/domain/one/record-history${query}`);
const entry = { id: 12, operationId: "test-op", actorId: 7, actorName: "Test", occurredAt: "2026-11-20T06:00:00Z", source: "graphql", status: "unverified", baselineSource: "local", applicationOk: true, added: 1, removed: 0, modified: 0 };

describe("record history read API", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.token = "test-session";
    vi.stubEnv("WP_GRAPHQL_URL", "https://wordpress.example.test/graphql");
  });
  it("requires a session before querying WordPress", async () => {
    mocks.token = undefined;
    const response = await recordHistoryResponse(request(), "one");
    expect(response.status).toBe(401); expect(mocks.graphql).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it.each(["?limit=51", "?limit=0", "?beforeId=oops", "?beforeId=-1"])("rejects invalid pagination %s", async query => {
    expect((await recordHistoryResponse(request(query), "one")).status).toBe(400);
    expect(mocks.graphql).not.toHaveBeenCalled();
  });
  it("passes authenticated identity and bounds to the ACL-protected query", async () => {
    mocks.graphql.mockResolvedValue({ data: { dnsRecordHistory: { ok: true, items: [entry], nextCursor: 12 } } });
    const response = await recordHistoryResponse(request("?beforeId=30&limit=10"), "one");
    expect(await response.json()).toEqual({ items: [entry], nextCursor: 12 });
    expect(mocks.graphql).toHaveBeenCalledWith("https://wordpress.example.test/graphql", "test-session", expect.stringContaining("dnsRecordHistory("), { slug: "one", beforeId: 30, limit: 10 });
    expect(mocks.graphql.mock.calls[0][2]).not.toContain("beforeJson");
  });
  it.each([undefined, "12"])("honors WordPress ACL for list and detail (%s)", async id => {
    const denial = { ok: false, code: "FORBIDDEN" };
    mocks.graphql.mockResolvedValue({ data: { dnsRecordHistory: denial, dnsRecordHistoryItem: denial } });
    expect((await recordHistoryResponse(request(), "other", id)).status).toBe(403);
  });
  it("returns a domain-scoped missing item as 404", async () => {
    mocks.graphql.mockResolvedValue({ data: { dnsRecordHistoryItem: { ok: false, code: "NOT_FOUND" } } });
    expect((await recordHistoryResponse(request(), "one", "22")).status).toBe(404);
  });
  it("decodes detail snapshots without returning raw JSON fields", async () => {
    mocks.graphql.mockResolvedValue({ data: { dnsRecordHistoryItem: { ok: true, item: { ...entry, beforeJson: "[]", requestedJson: "[]", observedJson: null, diffJson: '{"added":[],"removed":[],"modified":[]}' } } } });
    const response = await recordHistoryResponse(request(), "one", "12");
    const body = await response.json();
    expect(body.item).toMatchObject({ before: [], requested: [], observed: null });
    expect(body.item).not.toHaveProperty("beforeJson");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("does not expose upstream errors or corrupt snapshots", async () => {
    mocks.graphql.mockRejectedValue(new Error("private upstream data"));
    const response = await recordHistoryResponse(request(), "one");
    expect(response.status).toBe(502); expect(await response.text()).not.toContain("private upstream");
  });
});
