import { expect, test } from "@playwright/test";

/**
 * Interaktivní mapa výletů. Testy běží proti podkladu, který se v CI nedotahuje
 * z Mapy.com, proto se nikde neopíráme o obsah dlaždic - jen o chování komponenty.
 */

const openMap = async (page: import("@playwright/test").Page) => {
  await page.goto("/#okoli");
  await page.locator("#okoli").scrollIntoViewIfNeeded();
  await page.waitForSelector(".leaflet-container", { timeout: 30_000 });
  // Trasy se dotahují dynamickým importem, seznam bez nich nemá metadata.
  await expect(page.locator(".trip-map__item-meta").first()).toContainText("km");
};

test("shows every hiking trip in the list with distance and walking time", async ({ page }) => {
  await openMap(page);

  const items = page.locator(".trip-map__item");
  await expect(items).toHaveCount(21);
  await expect(items.first()).toContainText("Rozhledna Janov");
  await expect(page.locator(".trip-map__item-meta").first()).toContainText("min");
});

test("draws a route and shows trip details after selecting a trip", async ({ page }) => {
  await openMap(page);

  await expect(page.locator(".trip-map__detail-empty")).toBeVisible();
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);

  const trip = page
    .locator(".trip-map__item")
    .filter({ hasText: "Pravčická brána" })
    .first();
  await trip.click();

  await expect(trip).toHaveAttribute("aria-pressed", "true");
  // Trasa se kreslí ve dvou vrstvách - podkres a linka.
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(2);
  await expect(page.locator(".trip-map__detail h3")).toHaveText("Pravčická brána");
  await expect(page.locator(".trip-map__stats")).toContainText("Mezní Louka");
});

test("shows a callout above the marker that may overflow the map frame", async ({ page }) => {
  await openMap(page);

  await page.locator(".trip-map__item").filter({ hasText: "Pravčická brána" }).first().click();

  const callout = page.locator(".trip-map__callout-card");
  await expect(callout).toContainText("Pravčická brána");
  // Bublinka nesmí žít uvnitř ořezaného rámečku, jinak by se u horní hrany uřízla.
  await expect(page.locator(".trip-map__frame .trip-map__callout-card")).toHaveCount(0);

  const box = await callout.boundingBox();
  const frame = await page.locator(".trip-map__frame").boundingBox();
  expect(box).not.toBeNull();
  expect(frame).not.toBeNull();
  // Celá karta je vidět, i když přesahuje nad mapu.
  expect(box!.height).toBeGreaterThan(60);
  expect(box!.y).toBeLessThan(frame!.y + frame!.height);
});

test("closes the callout with its close button", async ({ page }) => {
  await openMap(page);

  await page.locator(".trip-map__item").filter({ hasText: "Hřensko" }).first().click();
  await expect(page.locator(".trip-map__callout-card")).toBeVisible();

  await page.getByRole("button", { name: "Zavřít detail výletu" }).click();

  await expect(page.locator(".trip-map__callout-card")).toHaveCount(0);
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
});

test("filters the list by trip kind and combines with the start filter", async ({ page }) => {
  await openMap(page);

  const chip = page.locator(".trip-map__kind-chip").filter({ hasText: "Rozhledny" });
  await expect(chip).toContainText("3");
  await chip.click();

  await expect(page.locator(".trip-map__item")).toHaveCount(3);
  for (const kind of await page.locator(".trip-map__item-kind").all()) {
    await expect(kind).toHaveText("Rozhledna");
  }

  // Kombinace s filtrem výchozího bodu: z domečku vede jen jedna rozhledna.
  await page.locator(".trip-map__chip").filter({ hasText: "Pěšky od domečku" }).click();
  await expect(page.locator(".trip-map__item")).toHaveCount(1);
  await expect(page.locator(".trip-map__item-title")).toHaveText("Rozhledna Janov");

  // Druhé kliknutí filtr zruší.
  await page.locator(".trip-map__kind-chip").filter({ hasText: "Rozhledny" }).click();
  await expect(page.locator(".trip-map__item")).toHaveCount(4);
});

test("drops the selection when the kind filter hides the selected trip", async ({ page }) => {
  await openMap(page);

  await page.locator(".trip-map__item").filter({ hasText: "Dolský mlýn" }).first().click();
  await expect(page.locator(".trip-map__detail h3")).toHaveText("Dolský mlýn");

  await page.locator(".trip-map__kind-chip").filter({ hasText: "Údolí" }).click();

  await expect(page.locator(".trip-map__detail-empty")).toBeVisible();
  await expect(page.locator(".trip-map__callout-card")).toHaveCount(0);
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
});

test("links the selected trip to the same hiking route on Mapy.com", async ({ page }) => {
  await openMap(page);
  await page.locator(".trip-map__item").filter({ hasText: "Rozhledna Janov" }).first().click();

  const link = page.getByRole("link", { name: /Otevřít trasu v Mapy.com/ });
  const href = await link.getAttribute("href");
  expect(href).toContain("routeType=foot_hiking");
  expect(href).toContain("mapset=outdoor");
  // Výchozím bodem je domeček, ne cíl.
  expect(href).toContain("start=14.26754%2C50.85606");
  await expect(link).toHaveAttribute("target", "_blank");
});

test("clicking the selected trip again clears the route", async ({ page }) => {
  await openMap(page);

  const trip = page.locator(".trip-map__item").filter({ hasText: "Hřensko" }).first();
  await trip.click();
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(2);

  await trip.click();
  await expect(trip).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
  await expect(page.locator(".trip-map__detail-empty")).toBeVisible();
});

test("filters down to trips that start at the cottage", async ({ page }) => {
  await openMap(page);

  await page.locator(".trip-map__chip").filter({ hasText: "Pěšky od domečku" }).click();

  const items = page.locator(".trip-map__item");
  await expect(items).toHaveCount(4);
  for (const meta of await page.locator(".trip-map__item-meta").all()) {
    await expect(meta).toContainText("pěšky od domečku");
  }
});

test("drops the selection when the filter hides the selected trip", async ({ page }) => {
  await openMap(page);

  await page.locator(".trip-map__item").filter({ hasText: "Tiské stěny" }).first().click();
  await expect(page.locator(".trip-map__detail h3")).toHaveText("Tiské stěny");

  await page.locator(".trip-map__chip").filter({ hasText: "Pěšky od domečku" }).click();

  await expect(page.locator(".trip-map__detail-empty")).toBeVisible();
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
});

test("selects a trip by clicking its marker on the map", async ({ page, isMobile }) => {
  // Na mobilu se značky při základním přiblížení překrývají, výběr tam vede přes seznam.
  test.skip(Boolean(isMobile), "kliknutí do značek testujeme na velkém plátně");
  await openMap(page);

  await page.locator('.leaflet-marker-icon[title="Pravčická brána"]').click();

  await expect(page.locator(".trip-map__detail h3")).toHaveText("Pravčická brána");
  await expect(
    page.locator(".trip-map__item").filter({ hasText: "Pravčická brána" }).first(),
  ).toHaveAttribute("aria-pressed", "true");
});

test("keeps trip markers clickable where they sit close to the cottage", async ({
  page,
  isMobile,
}) => {
  test.skip(Boolean(isMobile), "kliknutí do značek testujeme na velkém plátně");
  await openMap(page);

  // Rozhledna leží ~500 m od domečku, při základním přiblížení se značky překrývají.
  await page.locator('.leaflet-marker-icon[title="Rozhledna Janov"]').click();

  await expect(page.locator(".trip-map__detail h3")).toHaveText("Rozhledna Janov");
});

/**
 * Mapa se skládá z geometrie a textů zvoleného jazyka. Kdyby se prop s texty
 * ztratil, host by na /de a /en dostal českou mapu - proto sáhneme na obojí:
 * na názvy cílů i na okolní ovládání.
 */
test("serves the map in German", async ({ page }) => {
  await page.goto("/de#okoli");
  await page.locator("#okoli").scrollIntoViewIfNeeded();
  await page.waitForSelector(".leaflet-container", { timeout: 30_000 });

  await expect(page.getByRole("button", { name: "Alle Ausflüge" })).toBeVisible();
  await expect(page.locator(".trip-map__item").first()).toContainText("Aussichtsturm Janov");
  await expect(page.locator(".trip-map__item-meta").first()).toContainText("zu Fuß vom Haus");

  await page.locator(".trip-map__item").filter({ hasText: "Prebischtor" }).first().click();
  await expect(page.locator(".trip-map__stats dt").first()).toHaveText("Startpunkt");
  await expect(page.locator(".trip-map__note")).toContainText("Gabrielensteig");
});

test("serves the map in English", async ({ page }) => {
  await page.goto("/en#okoli");
  await page.locator("#okoli").scrollIntoViewIfNeeded();
  await page.waitForSelector(".leaflet-container", { timeout: 30_000 });

  await expect(page.getByRole("button", { name: "All trips" })).toBeVisible();
  await expect(page.locator(".trip-map__item").first()).toContainText("Janov Lookout Tower");
  await expect(page.locator(".trip-map__detail-empty")).toContainText("Pick a trip");

  await page.locator(".trip-map__item").first().click();
  await expect(page.locator(".trip-map__stats dt").first()).toHaveText("Starting point");
  // Angličtina píše desetinnou tečku, čeština čárku.
  await expect(page.locator(".trip-map__item-meta").first()).toContainText(/\d+\.\d\s?km|\d+\s?m/);
});

test("holds Leaflet back until the map section comes near", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Leaflet si při inicializaci označí kontejner třídou `leaflet-container`.
  // Dokud je mapa daleko pod ohybem, nemá se co stahovat ani spouštět.
  await page.waitForTimeout(1_500);
  await expect(page.locator(".leaflet-container")).toHaveCount(0);

  await page.locator("#okoli").scrollIntoViewIfNeeded();
  await expect(page.locator(".leaflet-container")).toBeVisible({
    timeout: 30_000,
  });
});
