import { expect, test } from "@playwright/test";

import { tripTextCs } from "@/data/trip-text/cs";
import { tripTextDe } from "@/data/trip-text/de";
import { tripTextEn } from "@/data/trip-text/en";
import { TRIPS } from "@/data/trips";
import { locales } from "@/i18n/config";
import { tripsCs } from "@/i18n/dictionaries/trips/cs";
import { tripsDe } from "@/i18n/dictionaries/trips/de";
import { tripsEn } from "@/i18n/dictionaries/trips/en";
import { formatDistance, formatDuration, formatElevation } from "@/lib/trip-format";
import { getTrips } from "@/lib/trips";

/**
 * Překlady mapy výletů. `tsc` uhlídá, že žádný výlet nechybí, ale ne že texty
 * dávají smysl - tyhle testy hlídají zbytek: upozornění na uzavírky, formát
 * čísel a to, že se do cizího jazyka nepropsala čeština.
 */

const TEXTS = { cs: tripTextCs, de: tripTextDe, en: tripTextEn } as const;
const DICTIONARIES = { cs: tripsCs, de: tripsDe, en: tripsEn } as const;

test.describe.configure({ mode: "parallel" });

test("every language describes every trip", () => {
  const ids = TRIPS.map((trip) => trip.id).sort();

  for (const locale of locales) {
    expect(Object.keys(TEXTS[locale]).sort(), locale).toEqual(ids);

    for (const [id, text] of Object.entries(TEXTS[locale])) {
      expect(text.title.trim(), `${locale}/${id} title`).not.toBe("");
      expect(text.startName.trim(), `${locale}/${id} start`).not.toBe("");
      expect(text.summary.trim(), `${locale}/${id} summary`).not.toBe("");
    }
  }
});

/**
 * Uzavírky mění reálnou podobu trasy. Kdyby upozornění vypadlo z překladu,
 * německý host by vyrazil na cestu, kterou Čech vidí označenou jako zavřenou.
 */
test("keeps the closure notices in every language", () => {
  for (const [id, czech] of Object.entries(tripTextCs)) {
    if (!czech.note) {
      continue;
    }
    for (const locale of locales) {
      const note = TEXTS[locale][id as keyof typeof tripTextCs].note;
      expect(note?.trim(), `${locale}/${id} note`).toBeTruthy();
    }
  }
});

test("does not leave Czech strings in the other languages", () => {
  const czechTitles = new Set(Object.values(tripTextCs).map((text) => text.summary));

  for (const locale of ["de", "en"] as const) {
    for (const [id, text] of Object.entries(TEXTS[locale])) {
      expect(czechTitles.has(text.summary), `${locale}/${id} summary`).toBe(false);
    }
    expect(DICTIONARIES[locale].startFilter.all).not.toBe(tripsCs.startFilter.all);
    expect(DICTIONARIES[locale].stats.duration).not.toBe(tripsCs.stats.duration);
  }
});

test("merges geometry with the texts of the requested language", () => {
  const czech = getTrips("cs");
  const german = getTrips("de");

  expect(czech).toHaveLength(TRIPS.length);
  expect(czech[0].title).toBe("Rozhledna Janov");
  expect(german[0].title).toBe("Aussichtsturm Janov");
  // Geometrie je společná, mění se jen texty.
  expect(german[0].point).toEqual(czech[0].point);
  expect(german[0].start.fromCottage).toBe(true);
});

/** Míry sázíme s nezalomitelnými mezerami; v očekáváních je vrátíme na obyčejné. */
const plain = (text: string) => text.replace(/\u00a0/g, " ");

test("writes distances the way each language does", () => {
  expect(plain(formatDistance(2640, "cs", tripsCs.units))).toBe("2,6 km");
  expect(plain(formatDistance(2640, "de", tripsDe.units))).toBe("2,6 km");
  expect(plain(formatDistance(2640, "en", tripsEn.units))).toBe("2.6 km");
  // Pod kilometr zaokrouhlujeme na desítky metrů, jednotka je všude stejná.
  expect(plain(formatDistance(842, "cs", tripsCs.units))).toBe("840 m");
});

test("writes walking times and elevations in the local convention", () => {
  expect(plain(formatDuration(4800, tripsCs.units))).toBe("1 h 20 min");
  expect(plain(formatDuration(4800, tripsDe.units))).toBe("1 Std. 20 min");
  expect(plain(formatDuration(2700, tripsEn.units))).toBe("45 min");

  expect(plain(formatElevation(348, tripsCs.units))).toBe("348 m n. m.");
  expect(plain(formatElevation(348, tripsDe.units))).toBe("348 m ü. NN");
  expect(plain(formatElevation(348, tripsEn.units))).toBe("348 m a.s.l.");
});

/** Číslo a jednotka musí zůstat na jednom řádku, proto nezalomitelná mezera. */
test("keeps a measurement on one line", () => {
  expect(formatDistance(2640, "cs", tripsCs.units)).toContain("\u00a0");
  expect(formatElevation(348, tripsCs.units)).not.toContain(" ");
});
