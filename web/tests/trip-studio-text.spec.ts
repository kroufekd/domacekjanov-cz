import { expect, test } from "@playwright/test";

import { tripTextCs } from "@/data/trip-text/cs";
import { TRIPS } from "@/data/trips";
import { normalizeTripTexts } from "@/lib/content/from-sanity";
import { getTrips } from "@/lib/trips";

/**
 * Smlouva mezi Studiem a mapou výletů: dokument `trip` řídí jen wording,
 * souřadnice a trasy zůstávají v kódu. Testy hlídají tři místa, kde by se to
 * dalo rozbít - párování přes `tripId`, ústup před nedokončeným překladem
 * a mazání upozornění na uzavírku.
 */

const localeText = (cs?: string, de?: string, en?: string) => ({
  _type: "localeText",
  ...(cs ? { cs } : {}),
  ...(de ? { de } : {}),
  ...(en ? { en } : {}),
});

/** Výlet, který má v kódu upozornění na uzavírku. */
const WITH_NOTE = "pravcicka-brana";

const tripById = (id: string, locale: "cs" | "de" | "en", raw: unknown) => {
  const trips = getTrips(locale, normalizeTripTexts(raw, locale));
  const trip = trips.find((item) => item.id === id);
  if (!trip) throw new Error(`Výlet ${id} v mapě chybí.`);
  return trip;
};

test.describe.configure({ mode: "parallel" });

test("Studio přepíše vestavěný název i popis", () => {
  const trip = tripById("rozhledna-janov", "de", [
    {
      tripId: "rozhledna-janov",
      title: localeText("Rozhledna", "Aussichtsturm Janov"),
      summary: localeText("Česky", "Frisch aus dem Studio."),
    },
  ]);

  expect(trip.title).toBe("Aussichtsturm Janov");
  expect(trip.summary).toBe("Frisch aus dem Studio.");
});

test("nevyplněné pole nechá vestavěný překlad být", () => {
  const raw = [{ tripId: "rozhledna-janov", title: localeText("Nový název") }];

  const czech = tripById("rozhledna-janov", "cs", raw);
  expect(czech.title).toBe("Nový název");
  expect(czech.summary).toBe(tripTextCs["rozhledna-janov"].summary);

  // Němčina v dokumentu chybí celá, takže si drží vestavěný německý text.
  const german = tripById("rozhledna-janov", "de", raw);
  expect(german.title).not.toBe("Nový název");
  expect(german.title.trim()).not.toBe("");
});

test("prázdné upozornění uzavírku smaže, chybějící dokument ji nechá", () => {
  expect(tripTextCs[WITH_NOTE].note).toBeTruthy();

  const cleared = tripById(WITH_NOTE, "cs", [
    { tripId: WITH_NOTE, title: localeText("Pravčická brána") },
  ]);
  expect(cleared.note).toBeUndefined();

  const untouched = tripById(WITH_NOTE, "cs", []);
  expect(untouched.note).toBe(tripTextCs[WITH_NOTE].note);
});

test("dokument s neznámým id mapu neovlivní", () => {
  const overrides = normalizeTripTexts(
    [{ tripId: "vylet-ktery-neexistuje", title: localeText("Nikam") }],
    "cs",
  );

  expect(overrides).toEqual({});
  expect(getTrips("cs", overrides)).toHaveLength(TRIPS.length);
});

test("texty ze Studia se nedotknou geometrie", () => {
  const [first] = TRIPS;
  const trip = tripById(first.id, "cs", [
    { tripId: first.id, title: localeText("Jiný název") },
  ]);

  expect(trip.point).toEqual(first.point);
  expect(trip.trail).toBe(first.trail);
  expect(trip.start).toEqual(first.start);
});
