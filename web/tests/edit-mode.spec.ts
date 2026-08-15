import { expect, test } from "@playwright/test";

/**
 * Testy běží bez `EDIT_PIN`, `EDIT_SECRET` a zápisového tokenu, takže popisují
 * vypnutý editační režim - tedy stav, ve kterém web běží pro návštěvníky.
 * Zapnutou variantu ověřit takhle nejde, ta by potřebovala živý dataset.
 */

test("bez nastavení editační API neexistuje", async ({ request }) => {
  expect((await request.get("/api/edit/session")).status()).toBe(404);
  expect(
    (await request.post("/api/edit/login", { data: { pin: "12345678" } })).status(),
  ).toBe(404);
  expect(
    (await request.post("/api/edit/save", { data: { locale: "cs", changes: [] } }))
      .status(),
  ).toBe(404);
});

test("bez přihlášení se seznam textů nevydá", async ({ request }) => {
  // Vypnutý režim odpovídá 404; se zapnutým by tu bylo 401. Ani jedno nesmí
  // vrátit obsah.
  const response = await request.get("/api/edit/fields?locale=cs");
  expect([401, 404]).toContain(response.status());
  expect(await response.text()).not.toContain("groups");
});

test("běžná stránka o editačním panelu nic neví", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-domecek-edit]")).toHaveCount(0);
});

test("?edit bez nastavení stránku nijak nezmění", async ({ page }) => {
  await page.goto("/?edit");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-domecek-edit]")).toHaveCount(0);
  await expect(page.getByText("Úprava textů")).toHaveCount(0);
});
