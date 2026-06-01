import { test, expect } from "@playwright/test";

test("share-target redirects to song editor", async ({ page }) => {
  test.skip(
    !process.env.UPSTASH_REDIS_REST_URL,
    "requires Upstash creds + a YouTube fixture; wire into CI in a follow-up",
  );
  await page.goto("/share?url=https://youtu.be/abc&title=Ndakuvara");
  await page.waitForURL(/\/learn\/.+/);
  await expect(page.locator("h1")).toContainText(/.+/);
});
