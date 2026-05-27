import { test, expect } from "@playwright/test";

test("share-target redirects to song editor", async ({ page }) => {
  await page.goto("/share?url=https://youtu.be/abc&title=Ndakuvara");
  await page.waitForURL(/\/learn\/.+/);
  await expect(page.locator("h1")).toContainText(/.+/);
});
