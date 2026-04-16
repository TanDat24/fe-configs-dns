import { describe, expect, it } from "vitest";
import { parseJsonArray, toDomainConfig } from "@/lib/domain-parser";

describe("domain-parser", () => {
  it("parseJsonArray returns array for valid json", () => {
    const result = parseJsonArray<{ name: string }>('[{"name":"ns1"}]');
    expect(result).toEqual([{ name: "ns1" }]);
  });

  it("parseJsonArray returns empty array for invalid json", () => {
    const result = parseJsonArray("not json");
    expect(result).toEqual([]);
  });

  it("toDomainConfig applies defaults safely", () => {
    const result = toDomainConfig({
      id: 1,
      domain: "example.com",
      dns_records_json: '[{"host":"@"}]',
    });
    expect(result.id).toBe(1);
    expect(result.domain).toBe("example.com");
    expect(result.owner_name).toBe("");
    expect(Array.isArray(result.dns_records_json)).toBe(true);
  });
});
