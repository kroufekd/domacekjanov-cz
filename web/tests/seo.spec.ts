import { expect, test, type Page } from "@playwright/test";

/** Vytáhne `@graph` ze značky JSON-LD, kterou stránka vykresluje na konci těla. */
async function readGraph(page: Page) {
  const raw = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  const parsed = JSON.parse(raw ?? "{}");
  expect(Array.isArray(parsed["@graph"])).toBe(true);
  return parsed["@graph"] as Record<string, unknown>[];
}

const nodeOfType = (graph: Record<string, unknown>[], type: string) =>
  graph.find((node) => {
    const value = node["@type"];
    return Array.isArray(value) ? value.includes(type) : value === type;
  });

test("describes the house as one linked JSON-LD graph", async ({ page }) => {
  await page.goto("/");
  const graph = await readGraph(page);

  const lodging = nodeOfType(graph, "LodgingBusiness");
  const website = nodeOfType(graph, "WebSite");
  const webPage = nodeOfType(graph, "WebPage");
  expect(lodging).toBeTruthy();
  expect(website).toBeTruthy();
  expect(webPage).toBeTruthy();

  // Stránka odkazuje na web i na objekt přes @id, ne přes zkopírovaná data.
  expect(webPage!.isPartOf).toEqual({ "@id": website!["@id"] });
  expect(webPage!.about).toEqual({ "@id": lodging!["@id"] });
  expect(website!.publisher).toEqual({ "@id": lodging!["@id"] });
});

test("carries the local signals a rental needs", async ({ page }) => {
  await page.goto("/");
  const lodging = nodeOfType(await readGraph(page), "LodgingBusiness")!;

  expect(lodging.geo).toMatchObject({
    "@type": "GeoCoordinates",
    latitude: 50.85606,
    longitude: 14.26754,
  });
  expect(lodging.address).toMatchObject({
    streetAddress: "Janov 167",
    postalCode: "405 02",
    addressCountry: "CZ",
  });
  expect(lodging.petsAllowed).toBe(false);
  expect(lodging.smokingAllowed).toBe(false);
  expect(lodging.sameAs).toContain(
    "https://www.e-chalupy.cz/domecek-janov-ubytovani-o17320",
  );
});

test("turns every rate into a machine readable offer", async ({ page }) => {
  await page.goto("/");
  const lodging = nodeOfType(await readGraph(page), "LodgingBusiness")!;

  const offers = lodging.makesOffer as Array<Record<string, unknown>>;
  expect(offers.length).toBe(3);
  for (const offer of offers) {
    expect(typeof offer.price).toBe("number");
    expect(offer.price as number).toBeGreaterThan(0);
    expect(offer.priceCurrency).toBe("CZK");
  }
  expect(lodging.priceRange).toMatch(/Kč/);
  expect((lodging.containsPlace as unknown[]).length).toBeGreaterThan(0);
});

test("asks Google for large image previews", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute(
    "content",
    /max-image-preview:large/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https?:\/\/.+/,
  );
  await expect(
    page.locator('link[rel="preconnect"][href="https://cdn.sanity.io"]'),
  ).toHaveCount(1);
});

test("shares a photo cropped to the Open Graph ratio", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
    "content",
    "630",
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    /\S/,
  );
});

test("keeps robots.txt open for search and language models", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();

  expect(body).toContain("Disallow: /api/");
  expect(body).toContain("GPTBot");
  expect(body).toContain("ClaudeBot");
  expect(body).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/);
});

test("lists all three languages in the sitemap", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();

  expect(body.match(/<url>/g)?.length).toBe(3);
  expect(body).toContain('hreflang="x-default"');
  expect(body).toContain('hreflang="de"');
});

test("publishes a summary for language models", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");

  const body = await response.text();
  expect(body).toContain("# Domeček Janov");
  expect(body).toContain("17 hostů");
  expect(body).toContain("50.85606");
});
