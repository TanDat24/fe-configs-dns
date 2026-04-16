import { expect, test } from "@playwright/test";

test("login -> open domain -> dns tab -> save flow", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authToken: "mock-token" }),
    });
  });

  await page.route("**/api/domain/list", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [{ id: 1, domain: "raotin247.com", slug: "raotin247-com" }] }),
    });
  });

  await page.route("**/api/domain/templates", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    });
  });

  await page.route("**/api/domain/security-packages", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    });
  });

  await page.route("**/api/domain/raotin247-com", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        item: {
          id: 1,
          domain: "raotin247.com",
          slug: "raotin247-com",
          owner_name: "",
          owner_address: "",
          owner_phone: "",
          owner_email: "",
          owner_postcode: "",
          registration_date: "",
          expiry_date: "",
          estimated_value: "",
          domain_status: "",
          protection_level: "1",
          profile_cccd_verified: "0",
          profile_declaration_verified: "0",
          profile_owner_verified: "0",
          profile_domain_verified: "0",
          redemption_days: "30",
          pending_delete_days: "5",
          dns_records_json: [],
          name_servers_json: [],
          child_dns_json: [],
          email_forwards_json: [],
          security_services_json: [],
          two_factor_enabled: "0",
        },
      }),
    });
  });

  await page.route("**/api/domain/save-tab", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Da luu" }),
    });
  });

  await page.goto("/logout");
  await page.getByLabel("Tên người dùng hoặc địa chỉ email").fill("admin");
  await page.getByLabel("Mật khẩu").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await page.goto("/");
  await page.getByRole("button", { name: "DNS" }).click();
  await page.getByRole("button", { name: "Lưu cấu hình" }).first().click();

  await expect(page.getByText("Đã lưu cấu hình bản ghi DNS.")).toBeVisible();
});
