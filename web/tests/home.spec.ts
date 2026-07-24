import { expect, test } from "@playwright/test";

test("renders the complete landing page and contact actions", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Všichni spolu. A přesto s místem pro sebe.",
    }),
  ).toBeVisible();
  await expect(page.getByText("4 000 m²", { exact: true }).first()).toBeVisible();
  await expect(
    page.locator('a[href="tel:+420777181920"]:visible').first(),
  ).toBeVisible();
  await expect(
    page.locator('a[href="mailto:majitel@akcenaseveru.cz"]'),
  ).toBeAttached();
});

test("filters and opens the accessible gallery", async ({ page }) => {
  await page.goto("/#galerie");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Pokoje", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Otevřít fotografii/ }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /Otevřít fotografii/ }).first().click();
  await expect(page.getByRole("dialog", { name: "Prohlížeč fotografií" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Prohlížeč fotografií" })).toBeHidden();
});

test("starts Matterport only after user interaction", async ({ page }) => {
  await page.goto("/#3d-prohlidka");
  await page.waitForTimeout(300);
  await expect(page.locator('iframe[title="3D prohlídka Domečku Janov"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Spustit 3D prohlídku" }).click();
  await expect(page.locator('iframe[title="3D prohlídka Domečku Janov"]')).toHaveCount(1);
});

test("opens the availability calendar modal", async ({ page }) => {
  await page.goto("/#cenik");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Zkontrolovat obsazenost" }).click();
  await expect(page.getByRole("dialog", { name: "Volné termíny" })).toBeVisible();
  await expect(
    page.locator('iframe[title="Kalendář obsazenosti Domečku Janov"]'),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Volné termíny" })).toBeHidden();
});

test("supports reduced motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".hero")).toHaveCSS("height", /.+/);
  await context.close();
});
