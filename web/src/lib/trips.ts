import { TRIPS } from "@/data/trips";
import { tripTextCs } from "@/data/trip-text/cs";
import { tripTextDe } from "@/data/trip-text/de";
import { tripTextEn } from "@/data/trip-text/en";
import type { Locale } from "@/i18n/config";
import type { LocalisedTrip } from "@/types/trips";

const TRIP_TEXT = {
  cs: tripTextCs,
  de: tripTextDe,
  en: tripTextEn,
} as const;

/**
 * Spojí geometrii výletů s texty zvoleného jazyka.
 *
 * Volá se na serveru a výsledek se předává mapě propem, takže se do prohlížeče
 * nedostanou překlady, které host stejně neuvidí.
 */
export function getTrips(locale: Locale): readonly LocalisedTrip[] {
  const texts = TRIP_TEXT[locale];
  return TRIPS.map((trip) => ({ ...trip, ...texts[trip.id] }));
}
