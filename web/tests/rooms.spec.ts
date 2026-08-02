import { expect, test } from "@playwright/test";

const rooms = ".rooms-list article";
const triggers = ".rooms-list button";
const activeSlideImage = ".rooms-showcase__slide.is-active img";

async function activeSlideSrc(page: import("@playwright/test").Page) {
  return page.locator(activeSlideImage).getAttribute("src");
}

test("výchozí fotka drží, dokud si host nevybere pokoj", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(`${rooms}.is-active`)).toHaveCount(0);
  await expect(page.locator(activeSlideImage)).toHaveCount(1);
});

test("klik na pokoj přehodí fotku i na dotyku, kde hover není", async ({
  page,
}) => {
  await page.goto("/");

  const before = await activeSlideSrc(page);
  await page.locator(triggers).nth(1).click();

  await expect(page.locator(rooms).nth(1)).toHaveClass(/is-active/);
  expect(await activeSlideSrc(page)).not.toBe(before);
});

test("klávesnice projde pokoje a fotka jde s ní", async ({ page }) => {
  await page.goto("/");

  await page.locator(triggers).first().focus();
  await expect(page.locator(rooms).first()).toHaveClass(/is-active/);

  const first = await activeSlideSrc(page);

  await page.keyboard.press("Tab");
  await expect(page.locator(rooms).nth(1)).toHaveClass(/is-active/);
  expect(await activeSlideSrc(page)).not.toBe(first);
});

test("myš zůstává, jak byla", async ({ page }) => {
  await page.goto("/");

  await page.locator(rooms).nth(2).hover();
  await expect(page.locator(rooms).nth(2)).toHaveClass(/is-active/);
});

test("popis pokoje se ovládacím prvkem neztratí", async ({ page }) => {
  await page.goto("/");

  const room = page.locator(rooms).first();
  await expect(room.getByRole("heading", { level: 3 })).toBeVisible();
  await expect(room.locator("p")).toBeVisible();
});
