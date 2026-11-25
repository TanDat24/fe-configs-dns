import { describe, expect, it } from "vitest";
import { historySourceLabel, historyStatusLabel } from "./record-history";

describe("history labels", () => {
  it("does not describe application success as verified iNET success", () => {
    expect(historyStatusLabel("unverified")).toContain("chưa xác minh");
    expect(historyStatusLabel("pending")).toContain("Chưa xác định");
    expect(historyStatusLabel("unknown")).toContain("Chưa xác định");
  });
  it("distinguishes externally observed changes and provider rejection", () => {
    expect(historyStatusLabel("observed")).toContain("quan sát");
    expect(historyStatusLabel("upstream_rejected")).toBe("iNET trả lỗi");
    expect(historySourceLabel("inet_cron")).toContain("tự động");
  });
});
