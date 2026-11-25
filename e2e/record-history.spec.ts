import { expect, test } from "@playwright/test";

const record = { host: "@", type: "A", value: "192.0.2.10", ttl: "300", priority: "" };
const entry = { id: 20, operationId: "test-operation", actorId: 7, actorName: "History Test User", occurredAt: "2026-11-20T06:00:00Z", source: "graphql", status: "unverified", baselineSource: "local", applicationOk: true, added: 1, removed: 0, modified: 0 };

test.beforeEach(async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "wp_graphql_auth", value: "mock-session", url: baseURL ?? "http://localhost:3000" }]);
  // Every API call is intercepted: these tests must never reach WordPress or iNET.
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown;
    if (path === "/api/auth/viewer") body = { viewer: { name: "Test", username: "test", email: null, roles: { nodes: [] } } };
    else if (path === "/api/domain/list") body = { items: [{ id: 1, domain: "one.example.test", slug: "one-example-test" }] };
    else if (path === "/api/domain/templates" || path === "/api/domain/security-packages") body = { items: [] };
    else if (path === "/api/domain/one-example-test") body = { item: { id: 1, domain: "one.example.test", slug: "one-example-test", dns_records_json: [record], name_servers_json: [], child_dns_json: [], email_forwards_json: [], security_services_json: [] } };
    else if (path.endsWith("/record-history/20")) body = { item: { ...entry, before: [], requested: [{ ...record, ttl: 300, priority: null }], observed: null, diff: { added: [{ ...record, ttl: 300, priority: null }], removed: [], modified: [] } } };
    else if (path.endsWith("/record-history")) body = { items: [entry], nextCursor: null };
    else return route.fulfill({ status: 403, json: { message: "Unexpected mocked API request" } });
    await route.fulfill({ json: body });
  });
});

test("opens history and distinguishes requested records from verified changes", async ({ page }) => {
  await page.goto("/domains");
  await page.getByRole("button", { name: "Lịch sử thay đổi", exact: true }).click();
  const panel = page.getByRole("region", { name: "Lịch sử thay đổi record" });
  await expect(panel.getByText("History Test User", { exact: false })).toBeVisible();
  await expect(panel.getByText("Ứng dụng báo thành công — chưa xác minh iNET", { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "Xem chi tiết" }).click();
  await expect(panel.getByRole("heading", { name: "Danh sách yêu cầu lưu — chưa xác minh trên iNET (1)" })).toBeVisible();
});

test("history failure leaves DNS editing available", async ({ page }) => {
  await page.route("**/record-history?**", route => route.fulfill({ status: 403, json: { message: "Không có quyền xem lịch sử" } }));
  await page.goto("/domains");
  await page.getByRole("button", { name: "Lịch sử thay đổi", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Không có quyền");
  await expect(page.locator('input[value="192.0.2.10"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Thêm bản ghi", exact: true }).first()).toBeEnabled();
});
