import { expect, test } from "@playwright/test";

import { fallbackContent } from "@/lib/content/fallback";
import { buildStructuredData, parsePrice } from "@/lib/structured-data";
import type { SiteContent } from "@/types/content";

/**
 * Strukturovaná data se skládají z obsahu, který může majitel přepsat ve Studiu.
 * Testy proto hlídají hlavně to, co se stane s nečekaným vstupem - vymyšlená
 * cena nebo prázdný seznam se do JSON-LD nesmí dostat.
 */

const siteUrl = "https://www.domecekjanov.cz";

const withRates = (rates: SiteContent["rates"]): SiteContent => ({
  ...fallbackContent.cs,
  rates,
});

test.describe.configure({ mode: "parallel" });

test("čte cenu i z formátu, jak ho píše člověk", () => {
  expect(parsePrice("55 000 Kč")).toBe(55000);
  expect(parsePrice("55 000 Kč")).toBe(55000); // nezlomitelná mezera
  expect(parsePrice("od 2 000 Kč / pobyt")).toBe(2000);
  expect(parsePrice("1 500,-")).toBe(1500);
});

test("z ceny bez čísla nedělá nabídku", () => {
  expect(parsePrice("na dotaz")).toBeUndefined();
  expect(parsePrice("")).toBeUndefined();
  expect(parsePrice("0 Kč")).toBeUndefined();

  const graph = buildStructuredData(
    withRates([
      { id: "dotaz", title: "Na dotaz", price: "dohodou", unit: "celý dům" },
      { id: "vikend", title: "Víkend", price: "25 000 Kč", unit: "víkend" },
    ]),
    "cs",
    siteUrl,
  );

  const lodging = graph["@graph"][0] as Record<string, unknown>;
  const offers = lodging.makesOffer as Array<Record<string, unknown>>;
  expect(offers).toHaveLength(1);
  expect(offers[0].price).toBe(25000);
  expect(lodging.priceRange).toContain("25");
});

test("bez cen neuvádí ani cenové rozpětí", () => {
  const lodging = buildStructuredData(withRates([]), "cs", siteUrl)[
    "@graph"
  ][0] as Record<string, unknown>;

  expect(lodging.makesOffer).toEqual([]);
  expect(lodging).not.toHaveProperty("priceRange");
});

test("každá jazyková verze ukazuje na tentýž objekt", () => {
  const czech = buildStructuredData(fallbackContent.cs, "cs", siteUrl);
  const german = buildStructuredData(fallbackContent.de, "de", siteUrl);

  const lodgingId = (czech["@graph"][0] as Record<string, unknown>)["@id"];
  expect((german["@graph"][0] as Record<string, unknown>)["@id"]).toBe(
    lodgingId,
  );

  // Stránky se naopak liší, jinak by si jazykové verze přepsaly identitu.
  const czechPage = czech["@graph"][2] as Record<string, unknown>;
  const germanPage = german["@graph"][2] as Record<string, unknown>;
  expect(czechPage["@id"]).not.toBe(germanPage["@id"]);
  expect(germanPage.url).toBe(`${siteUrl}/de`);
  expect(germanPage.inLanguage).toBe("de");
});
