import { expect, test } from "@playwright/test";

// All API calls are intercepted. Never send real mail, call WordPress or iNET here.
test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.route("**/api/**", route => route.fulfill({ status: 403, json: { message: "Unexpected mocked API call" } }));
});

test("domain login requests OTP verification and respects a rejection", async ({ page }) => {
  let sends = 0; let verifies = 0;
  await page.route("**/api/auth/login-domain", async route => {
    const body = route.request().postDataJSON();
    if (body.action === "start") {
      sends++;
      return route.fulfill({ json: { ok: true, step: "otp", challengeId: "a".repeat(64), retryAfterSec: 60, expiresInSec: 300 } });
    }
    expect(body).toMatchObject({ action: "verify", code: "001234", challengeId: "a".repeat(64) });
    verifies++;
    return route.fulfill({ status: 401, json: { message: "Mock verification reached; no real session issued" } });
  });
  await page.goto("/logout");
  await page.getByLabel("Tên miền", { exact: true }).fill("example.test");
  await page.getByRole("button", { name: "Gửi mã đăng nhập", exact: true }).click();
  await expect(page.getByLabel("Mã đăng nhập (6 chữ số)")).toBeVisible();
  await expect(page.getByRole("button", { name: /Gửi lại mã sau/ })).toBeDisabled();
  await expect(page).toHaveURL(/\/logout/);
  await page.getByLabel("Mã đăng nhập (6 chữ số)").fill("001234");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Mock verification reached");
  expect(sends).toBe(1); expect(verifies).toBe(1);
});

test("changing domain discards the previous challenge", async ({ page }) => {
  await page.route("**/api/auth/login-domain", route => route.fulfill({ json: {
    ok: true, step: "otp", challengeId: "a".repeat(64), retryAfterSec: 60, expiresInSec: 300,
  } }));
  await page.goto("/logout");
  await page.getByLabel("Tên miền", { exact: true }).fill("example.test");
  await page.getByRole("button", { name: "Gửi mã đăng nhập", exact: true }).click();
  await page.getByLabel("Mã đăng nhập (6 chữ số)").fill("001234");
  await page.getByLabel("Tên miền", { exact: true }).fill("other.test");
  await expect(page.getByLabel("Mã đăng nhập (6 chữ số)")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Gửi mã đăng nhập", exact: true })).toBeVisible();
});

test("fallback submits WP account password without starting OTP", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/auth/login-domain", route => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({ action: "password", domain: "example.test", password: " spaces " });
    return route.fulfill({ status: 401, json: { message: "Mock password validation reached" } });
  });
  await page.goto("/logout");
  await page.getByLabel("Tên miền", { exact: true }).fill("example.test");
  await page.getByRole("button", { name: "Dùng mật khẩu tài khoản", exact: true }).click();
  await page.getByPlaceholder("Mật khẩu tài khoản", { exact: true }).fill(" spaces ");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Mock password validation reached");
  expect(calls).toBe(1);
});
