import { expect, test } from "@playwright/test";

/** The hero plate only has room from 1240px up; below that the footer card takes over. */
const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 1100, height: 900 };

test("opens the certificate and pages through the years", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/");

  const plate = page.locator(".hero-award");
  await expect(plate).toBeVisible();
  await plate.click();

  const viewer = page.getByRole("dialog", { name: "Ocenění Booking.com" });
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText("2025");

  await page.keyboard.press("ArrowRight");
  await expect(viewer).toContainText("2024");

  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  // Focus has to come back to the plate that opened the viewer.
  await expect(plate).toBeFocused();
});

test("swaps the hero plate for the footer card on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize(NARROW);
  await page.goto("/");

  await expect(page.locator(".hero-award")).toBeHidden();

  const card = page.locator(".award-badge");
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();

  await card.click();
  await expect(page.getByRole("dialog", { name: "Ocenění Booking.com" })).toBeVisible();
});

test("stops taking clicks once the hero has scrolled away", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await page.waitForTimeout(400);

  await expect(page.locator(".hero-award")).toHaveCSS("pointer-events", "none");
});

test("labels the award in every language", async ({ page }) => {
  const cases: Array<[string, RegExp]> = [
    ["/", /Zobrazit certifikát/],
    ["/de", /Zertifikat .* anzeigen/],
    ["/en", /Show the Booking\.com/],
  ];

  await page.setViewportSize(WIDE);
  for (const [path, label] of cases) {
    await page.goto(path);
    await expect(page.locator(".hero-award")).toHaveAttribute("aria-label", label);
  }
});
