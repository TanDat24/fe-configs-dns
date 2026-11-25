import { expect, test, type Page } from "@playwright/test";
import type { EmailVerificationStatusDto } from "../src/lib/contracts/api";

const initial: EmailVerificationStatusDto = {
  email: "owner@example.com", verified: false, canVerify: true, pending: false, retryAfterSec: 0,
};
async function mockEmailApi(page: Page, overrides: Partial<EmailVerificationStatusDto> = {}, lostVerify = false, hasDomains = true) {
  let state = { ...initial, ...overrides };
  const calls = { send: 0, verify: 0 };
  // Block every unexpected API call; never contact WordPress or send actual mail.
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/viewer") return route.fulfill({ json: { viewer: {
      databaseId: 7, name: "Test", username: "test", email: state.email, roles: { nodes: [] },
    } } });
    if (path === "/api/domain/list") return route.fulfill({ json: { items: hasDomains
      ? [{ id: 1, domain: "example.test", slug: "example-test" }] : [] } });
    if (path === "/api/domain/templates" || path === "/api/domain/security-packages") return route.fulfill({ json: { items: [] } });
    if (path === "/api/domain/example-test") return route.fulfill({ json: { item: {
      id: 1, domain: "example.test", slug: "example-test", security_services_json: [],
      dns_records_json: [], name_servers_json: [], child_dns_json: [], email_forwards_json: [],
    } } });
    if (path.startsWith("/api/customer-data/")) return route.fulfill({ json: { items: [], item: null, total: 0 } });
    if (path === "/api/auth/email-verification") return route.fulfill({ json: state });
    if (path.endsWith("/email-verification/send")) {
      calls.send++;
      state = { ...state, pending: true, retryAfterSec: 60 };
      return route.fulfill({ json: { ok: true, message: "sent" } });
    }
    if (path.endsWith("/email-verification/verify")) {
      calls.verify++;
      if (route.request().postDataJSON().code !== "001234") {
        return route.fulfill({ status: 400, json: { message: "Mã xác minh không hợp lệ" } });
      }
      state = { ...state, verified: true, pending: false };
      return route.fulfill(lostVerify
        ? { status: 502, json: { message: "response lost" } }
        : { json: { ok: true, message: "verified", email: state.email } });
    }
    return route.fulfill({ status: 403, json: { message: "Unexpected mocked API request" } });
  });
  return calls;
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "wp_graphql_auth", value: "mock-session", url: baseURL ?? "http://localhost:3000" }]);
});

test("sends, verifies and retains server state after reload", async ({ page }) => {
  const calls = await mockEmailApi(page);
  await page.goto("/dashboard");
  const profile = page.getByText("Email tài khoản", { exact: true }).locator("..");
  await expect(profile).toContainText("Chưa xác minh");
  await page.getByRole("link", { name: "Xác minh email", exact: true }).click();
  await expect(page).toHaveURL(/#email-verification$/);
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click();
  await expect(page.getByRole("button", { name: /Gửi lại mã/ })).toBeDisabled();
  await page.getByLabel("Mã xác minh (6 chữ số)").fill("001234");
  await page.getByRole("button", { name: "Xác nhận mã", exact: true }).click();
  await expect(page.getByText("Email này đã được xác minh.", { exact: true })).toBeVisible();
  await expect(profile).toContainText("Đã xác minh");
  await page.reload();
  await expect(page.getByText("Email này đã được xác minh.", { exact: true })).toBeVisible();
  expect(calls).toEqual({ send: 1, verify: 1 });
});

test("keeps a wrong code editable without automatic retry", async ({ page }) => {
  const calls = await mockEmailApi(page, { pending: true });
  await page.goto("/dashboard");
  await page.getByLabel("Mã xác minh (6 chữ số)").fill("999999");
  await page.getByRole("button", { name: "Xác nhận mã", exact: true }).click();
  await expect(page.getByRole("region", { name: "Xác minh email tài khoản" }).getByRole("alert")).toContainText("Mã xác minh không hợp lệ");
  await expect(page.getByLabel("Mã xác minh (6 chữ số)")).toBeEnabled();
  expect(calls.verify).toBe(1);
});

test("does not offer delivery to synthetic email", async ({ page }) => {
  await mockEmailApi(page, { email: "user@zalo.local", canVerify: false });
  await page.goto("/dashboard");
  await expect(page.getByText(/Tài khoản chưa có email thật/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Gửi mã xác minh", exact: true })).toHaveCount(0);
});

test("reconciles a successful verification after its response is lost", async ({ page }) => {
  const calls = await mockEmailApi(page, { pending: true }, true);
  await page.goto("/dashboard");
  await page.getByLabel("Mã xác minh (6 chữ số)").fill("001234");
  await page.getByRole("button", { name: "Xác nhận mã", exact: true }).click();
  await expect(page.getByText("Email này đã được xác minh.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Xác minh email tài khoản" }).getByRole("alert")).toHaveCount(0);
  expect(calls.verify).toBe(1);
});


test("account email verification remains available without domains", async ({ page }) => {
  await mockEmailApi(page, {}, false, false);
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: "Gửi mã xác minh", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bạn chưa có tên miền nào" })).toBeVisible();
});
