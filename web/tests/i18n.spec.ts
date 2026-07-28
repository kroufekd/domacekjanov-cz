import { expect, test } from "@playwright/test";

test("switches to German through the language menu", async ({ page }) => {
  await page.goto("/");

  const trigger = page.getByRole("button", { name: /Změnit jazyk/ });
  await expect(trigger).toBeVisible();

  const german = page.getByRole("menuitem", { name: /Deutsch/ });
  await expect(german).toBeHidden();

  await trigger.click();
  await expect(german).toBeVisible();
  await german.click();

  await expect(page).toHaveURL(/\/de\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(
    page.getByRole("button", { name: /Sprache wechseln/ }),
  ).toBeVisible();
});

test("keeps the current section when the language changes", async ({ page }) => {
  await page.goto("/#cenik");
  await page.waitForTimeout(300);

  await page.getByRole("button", { name: /Změnit jazyk/ }).click();
  await page.getByRole("menuitem", { name: /English/ }).click();

  await expect(page).toHaveURL(/\/en\/?#cenik$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("serves English copy and the matching metadata", async ({ page }) => {
  await page.goto("/en");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("button", { name: /Change language/ }),
  ).toBeVisible();
  await expect(
    page.locator('link[rel="alternate"][hreflang="de"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('link[rel="alternate"][hreflang="x-default"]'),
  ).toHaveCount(1);
});

test("closes the language menu with Escape", async ({ page }) => {
  await page.goto("/");

  const trigger = page.getByRole("button", { name: /Změnit jazyk/ });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("menuitem", { name: /Deutsch/ })).toBeHidden();
});

test("answers with 404 for an unknown language", async ({ page }) => {
  const response = await page.goto("/fr");
  expect(response?.status()).toBe(404);
});
