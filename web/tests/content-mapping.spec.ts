import { expect, test } from "@playwright/test";

import { fallbackContent } from "@/lib/content/fallback";
import {
  normalizeAccommodation,
  normalizeCopy,
  normalizeGallery,
  normalizeRates,
  normalizeSettings,
} from "@/lib/content/from-sanity";
import { localizedList, localizedText } from "@/sanity/normalize";

/**
 * The contract between the Studio and the website: how `{cs, de, en}` objects
 * written by `studio/scripts/seed.mjs` turn into rendered strings.
 */

const localeString = (cs: string, de?: string, en?: string) => ({
  _type: "localeString",
  cs,
  ...(de ? { de } : {}),
  ...(en ? { en } : {}),
});

test.describe.configure({ mode: "parallel" });

test("reads the requested language and nothing else", () => {
  const value = localeString("Ceník", "Preise", "Prices");

  expect(localizedText(value, "cs")).toBe("Ceník");
  expect(localizedText(value, "de")).toBe("Preise");
  expect(localizedText(value, "en")).toBe("Prices");
});

test("leaves a missing translation undefined instead of borrowing Czech", () => {
  const value = localeString("Ceník");

  expect(localizedText(value, "cs")).toBe("Ceník");
  expect(localizedText(value, "de")).toBeUndefined();
  expect(localizedText(value, "en")).toBeUndefined();
});

test("treats a pre-multilingual plain string as Czech only", () => {
  expect(localizedText("Celý dům", "cs")).toBe("Celý dům");
  expect(localizedText("Celý dům", "de")).toBeUndefined();
});

test("reads a list written as rows of translations", () => {
  const rows = [
    localeString("první", "erste", "first"),
    localeString("druhá", "zweite", "second"),
  ];

  expect(localizedList(rows, "de")).toEqual(["erste", "zweite"]);
  expect(localizedList(rows, "en")).toEqual(["first", "second"]);
});

test("skips list rows that are missing the language", () => {
  const rows = [
    localeString("první", "erste"),
    localeString("druhá"),
  ];

  expect(localizedList(rows, "de")).toEqual(["erste"]);
  expect(localizedList(rows, "en")).toBeUndefined();
});

test("keeps the built-in wording for untranslated settings fields", () => {
  const fallback = fallbackContent.de.settings;
  const settings = normalizeSettings(
    {
      title: "Domeček Janov",
      heroTitle: localeString("Jen pro vaši partu."),
      heroEyebrow: localeString("Janov", "Janov bei Hřensko"),
      phone: "+420111222333",
    },
    "de",
    fallback,
  );

  expect(settings.heroEyebrow).toBe("Janov bei Hřensko");
  expect(settings.heroTitle).toBe(fallback.heroTitle);
  expect(settings.phone).toBe("+420111222333");
});

test("falls back to the whole local list when nothing is translated", () => {
  const fallback = fallbackContent.en.accommodation;
  const accommodation = normalizeAccommodation(
    {
      capacity: 18,
      rooms: [
        { title: localeString("Pokoj"), description: localeString("Popis") },
      ],
    },
    "en",
    fallback,
  );

  expect(accommodation.capacity).toBe(18);
  expect(accommodation.rooms).toEqual(fallback.rooms);
});

test("maps a translated room list onto the rendered shape", () => {
  const accommodation = normalizeAccommodation(
    {
      rooms: [
        {
          title: localeString("Pokoj", "Zimmer", "Room"),
          description: localeString("Popis", "Beschreibung", "Description"),
        },
      ],
    },
    "de",
    fallbackContent.de.accommodation,
  );

  expect(accommodation.rooms).toEqual([
    { title: "Zimmer", description: "Beschreibung" },
  ]);
});

test("merges the interface copy field by field", () => {
  const copy = normalizeCopy(
    {
      nav: { pricing: localeString("Ceník", "Preise", "Prices") },
      pricing: {
        notes: [localeString("poplatek", "Kurtaxe", "fee")],
      },
    },
    "de",
    fallbackContent.de.copy,
  );

  expect(copy.nav.pricing).toBe("Preise");
  expect(copy.nav.gallery).toBe(fallbackContent.de.copy.nav.gallery);
  expect(copy.pricing.notes).toEqual(["Kurtaxe"]);
});

test("drops photos and rates that have no alt or title in the language", () => {
  const photos = [
    {
      id: "one",
      src: "https://cdn.sanity.io/one.jpg",
      alt: localeString("Kuchyň", "Küche"),
      width: 1600,
      height: 1200,
      category: "spolecne",
    },
    {
      id: "two",
      src: "https://cdn.sanity.io/two.jpg",
      alt: localeString("Ložnice"),
      width: 1600,
      height: 1200,
      category: "pokoje",
    },
  ];

  expect(normalizeGallery(photos, "de")).toHaveLength(1);
  expect(normalizeGallery(photos, "en")).toBeUndefined();

  const rates = [
    {
      id: "summer",
      title: localeString("Léto", "Sommer"),
      price: "55 000 Kč",
      unit: localeString("týden", "Woche"),
    },
  ];

  expect(normalizeRates(rates, "de")).toEqual([
    {
      id: "summer",
      title: "Sommer",
      price: "55 000 Kč",
      unit: "Woche",
      note: undefined,
      featured: false,
    },
  ]);
  expect(normalizeRates(rates, "en")).toBeUndefined();
});

test("ships a complete translation for every language", () => {
  for (const locale of ["cs", "de", "en"] as const) {
    const content = fallbackContent[locale];
    expect(content.gallery).toHaveLength(35);
    expect(content.rates).toHaveLength(3);
    expect(content.tripTips).toHaveLength(4);
    expect(content.settings.heroTitle).toMatch(/\S/);
    expect(content.copy.nav.pricing).toMatch(/\S/);
    for (const image of content.gallery) {
      expect(image.alt).toMatch(/\S/);
      expect(image.caption).toMatch(/\S/);
    }
  }
});
