import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Config DNS/i);
  });

  test("forgot password page is reachable", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("contacts page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page).not.toHaveURL(/\/contacts$/);
  });
});
