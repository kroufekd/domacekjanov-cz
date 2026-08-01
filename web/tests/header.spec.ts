import { expect, test, type Page } from "@playwright/test";

/**
 * Walks to `y` a frame at a time. A single scrollTo would look like a scripted
 * jump to the header and get ignored, which is not what these tests are after.
 */
async function scrollTo(page: Page, y: number) {
  await page.evaluate(async (target) => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const step = target > window.scrollY ? 100 : -100;

    while (Math.abs(window.scrollY - target) > Math.abs(step)) {
      window.scrollBy({ top: step, behavior: "instant" });
      await frame();
    }
    window.scrollTo({ top: target, behavior: "instant" });
  }, y);
  // Long enough for the rAF read plus the 340ms slide.
  await page.waitForTimeout(500);
}

/** A nudge upwards is how a real visitor calls the retracted bar back. */
async function revealHeader(page: Page) {
  await scrollTo(page, (await page.evaluate(() => window.scrollY)) - 200);
}

const header = ".site-header";
const hidden = ".site-header--hidden";

test("retracts the header on the way down and brings it back on the way up", async ({
  page,
}) => {
  await page.goto("/");

  // Over the hero the bar floats in its light variant.
  await expect(page.locator(header)).not.toHaveClass(/site-header--scrolled/);

  // Still close to the top - solid, but nowhere near retracting.
  await scrollTo(page, 120);
  await expect(page.locator(header)).toHaveClass(/site-header--scrolled/);
  await expect(page.locator(hidden)).toHaveCount(0);

  await scrollTo(page, 900);
  await expect(page.locator(hidden)).toHaveCount(1);
  // Fully off screen, not just partially clipped.
  const box = await page.locator(header).boundingBox();
  expect(box?.y ?? 0).toBeLessThanOrEqual(-(box?.height ?? 1) + 1);

  // The smallest scroll back up is enough to call it in.
  await scrollTo(page, 880);
  await expect(page.locator(hidden)).toHaveCount(0);
});

test("keeps the header in place while an anchor jump is in flight", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await scrollTo(page, 1200);
  await expect(page.locator(hidden)).toHaveCount(1);
  await revealHeader(page);

  // Narrow viewports reach the same links through the menu instead of the bar.
  if (isMobile) {
    await page.getByRole("button", { name: "Otevřít menu" }).click();
    await expect(page.locator(".mobile-menu--open")).toBeVisible();
  }

  // Contact sits far down the page, so the smooth scroll runs for a while.
  await page.locator('.site-header a[href="#kontakt"]:visible').first().click();
  // Without the hold, this downward jump would retract the bar mid-flight.
  await page.waitForTimeout(600);
  await expect(page.locator(hidden)).toHaveCount(0);
  await page.waitForTimeout(2000);
  await expect(page.locator(hidden)).toHaveCount(0);

  // Once the jump has landed, scrolling down hides it again as usual.
  await scrollTo(page, (await page.evaluate(() => window.scrollY)) + 400);
  await expect(page.locator(hidden)).toHaveCount(1);
});

test("stays visible when a deep link scrolls the page on load", async ({
  page,
}) => {
  // The browser animates its way down to the section - the bar must not read
  // that as the visitor scrolling away from it.
  await page.goto("/#kontakt");
  await page.waitForTimeout(2000);

  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  await expect(page.locator(hidden)).toHaveCount(0);
});

test("holds the header open while the mobile menu is", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "The toggle only exists on narrow viewports.");

  await page.goto("/");
  await scrollTo(page, 1400);
  await expect(page.locator(hidden)).toHaveCount(1);
  await revealHeader(page);

  await page.getByRole("button", { name: "Otevřít menu" }).click();
  await expect(page.locator(".mobile-menu--open")).toBeVisible();

  // The menu locks the body, but the bar must stay put even if scrolling leaks through.
  await scrollTo(page, 2000);
  await expect(page.locator(hidden)).toHaveCount(0);
  await expect(page.locator(".menu-toggle")).toBeInViewport();
});

test("never slides the header away under reduced motion", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await scrollTo(page, 900);
  // The class may still be set - the transform must not be.
  await expect(page.locator(header)).toHaveCSS("transform", "none");
  await context.close();
});
