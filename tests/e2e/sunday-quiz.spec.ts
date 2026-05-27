import { test, expect } from "@playwright/test";

test("user completes a quiz and sees a score", async ({ page }) => {
  // Requires a seeded lesson + song in the live store. Skipped until /e2e/seed
  // exists or a fixture lesson is created in CI. The test code below is the
  // shape the page should support once data is present.
  test.skip(true, "requires seeded lesson; wire into CI in a follow-up");
  await page.goto("/quiz/test-lesson-id");
  const items = await page.locator("[data-quiz-item]").count();
  for (let i = 0; i < items; i++) {
    const input = page.locator("[data-quiz-item] input, [data-quiz-item] textarea").first();
    await input.fill("answer");
    await page.getByRole("button", { name: /submit/i }).click();
  }
  await expect(page.locator("[data-score]")).toContainText(/%/);
});
