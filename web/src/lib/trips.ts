import { TRIPS } from "@/data/trips";
import { tripTextCs } from "@/data/trip-text/cs";
import { tripTextDe } from "@/data/trip-text/de";
import { tripTextEn } from "@/data/trip-text/en";
import type { Locale } from "@/i18n/config";
import type {
  LocalisedTrip,
  TripText,
  TripTextOverride,
  TripTextOverrides,
} from "@/types/trips";

const TRIP_TEXT = {
  cs: tripTextCs,
  de: tripTextDe,
  en: tripTextEn,
} as const;

/**
 * Přebije vestavěný text tím, co k výletu napsalo Studio.
 *
 * Nevyplněné pole se ignoruje, u `note` ale rozlišujeme prázdno od chybějícího
 * dokumentu: `null` uzavírku smaže, `undefined` nechá vestavěné upozornění být.
 */
function applyOverride(
  base: TripText,
  override: TripTextOverride | undefined,
): TripText {
  if (!override) return base;

  return {
    title: override.title ?? base.title,
    startName: override.startName ?? base.startName,
    summary: override.summary ?? base.summary,
    note: override.note === undefined ? base.note : (override.note ?? undefined),
  };
}

/**
 * Spojí geometrii výletů s texty zvoleného jazyka.
 *
 * Volá se na serveru a výsledek se předává mapě propem, takže se do prohlížeče
 * nedostanou překlady, které host stejně neuvidí. Souřadnice a trasy zůstávají
 * v kódu, ze Studia přicházejí jen názvy, popisy a upozornění.
 */
export function getTrips(
  locale: Locale,
  overrides: TripTextOverrides = {},
): readonly LocalisedTrip[] {
  const texts = TRIP_TEXT[locale];
  return TRIPS.map((trip) => ({
    ...trip,
    ...applyOverride(texts[trip.id], overrides[trip.id]),
  }));
}
