import type { Locale } from "@/i18n/config";
import { localeMeta } from "@/i18n/config";
import type { TripsDictionary } from "@/i18n/trips-dictionary";
import { formatTemplate } from "@/lib/format";
import type { TrailColour, TripKind } from "@/types/trips";

/** Nezalomitelná mezera - drží číslo a jednotku pohromadě. */
const NBSP = " ";

/** Míra je jedno slovo: mezery uvnitř nesmí zalomit řádek. */
const tight = (text: string): string => text.replace(/ /g, NBSP);

/** Desetinná čárka v češtině a němčině, tečka v angličtině. */
const decimal = (value: number, locale: Locale): string =>
  new Intl.NumberFormat(localeMeta[locale].htmlLang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

/** "2,6 km" pro delší trasy, "850 m" pro ty krátké. */
export function formatDistance(
  metres: number,
  locale: Locale,
  units: TripsDictionary["units"],
): string {
  if (metres < 1000) {
    return tight(`${Math.round(metres / 10) * 10} ${units.metre}`);
  }
  const km = metres / 1000;
  const text = km >= 10 ? Math.round(km).toString() : decimal(km, locale);
  return tight(`${text} ${units.kilometre}`);
}

/** "45 min" nebo "1 h 20 min" - pěší tempo bez zastávek. */
export function formatDuration(
  seconds: number,
  units: TripsDictionary["units"],
): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) {
    return tight(`${totalMinutes} ${units.minute}`);
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return tight(
    minutes === 0
      ? `${hours} ${units.hour}`
      : `${hours} ${units.hour} ${minutes} ${units.minute}`,
  );
}

export function formatElevation(
  metres: number,
  units: TripsDictionary["units"],
): string {
  return tight(formatTemplate(units.elevation, { value: metres }));
}

/** Štítek kategorie; u neznámé hodnoty raději obecný text než prázdné místo. */
export const tripKindLabel = (
  kind: TripKind,
  dictionary: TripsDictionary,
): string => dictionary.kind[kind] ?? dictionary.kindFilter.all;

/** Množné číslo pro filtrovací tlačítka - "Vyhlídky (4)" čte líp než "Vyhlídka (4)". */
export const tripKindPlural = (
  kind: TripKind,
  dictionary: TripsDictionary,
): string => dictionary.kindPlural[kind] ?? dictionary.kindFilter.all;

/** Pořadí kategorií ve filtru - od těch, kterých je nejvíc a lidi je hledají první. */
export const TRIP_KIND_ORDER: readonly TripKind[] = [
  "vyhlidka",
  "skala",
  "rozhledna",
  "zricenina",
  "soutesky",
  "udoli",
  "obec",
  "technicka",
];

export const trailLabel = (
  trail: TrailColour,
  dictionary: TripsDictionary,
): string => dictionary.trail[trail] ?? dictionary.trail.neznaceno;

/** Barvy pásových značek KČT - tečka u výletu v seznamu. */
const TRAIL_COLOURS: Readonly<Record<TrailColour, string>> = {
  cervena: "#c8322b",
  modra: "#1f5fa9",
  zelena: "#2f7d32",
  zluta: "#e0a800",
  naucna: "#7a6a52",
  neznaceno: "#8d8577",
};

export const trailColourHex = (trail: TrailColour): string =>
  TRAIL_COLOURS[trail] ?? TRAIL_COLOURS.neznaceno;

/**
 * Odkaz na tutéž trasu v Mapy.com - turistická vrstva a profil `foot_hiking`,
 * takže se návštěvníkovi otevře stejná cesta, jakou kreslíme my.
 */
export function mapyRouteUrl(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number },
): string {
  const params = new URLSearchParams({
    mapset: "outdoor",
    routeType: "foot_hiking",
    start: `${start.lon},${start.lat}`,
    end: `${end.lon},${end.lat}`,
  });
  return `https://mapy.com/fnc/v1/route?${params.toString()}`;
}
