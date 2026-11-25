import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { wpSaveDomainJsonTab } from "./wp-domain";

afterEach(() => vi.unstubAllGlobals());
describe("save history warning compatibility", () => {
  it.each([true, false])("preserves the save result and history warning (ok=%s)", async ok => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { saveDnsDomainJsonTab: { ok, message: "existing result", historyWarning: "audit unavailable" } } })));
    vi.stubGlobal("fetch", fetchMock);
    const result = await wpSaveDomainJsonTab("https://wordpress.example.test/graphql", "test-cookie", { domainId: 1, field: "dns_records_json", payloadJson: "[]" });
    expect(result.ok).toBe(ok); expect(result.historyWarning).toBe("audit unavailable");
    expect(result.message).toBe("existing result"); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
