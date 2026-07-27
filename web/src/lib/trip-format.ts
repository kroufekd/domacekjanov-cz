import type { TrailColour, TripKind } from "@/types/trips";

/** Nezalomitelná mezera - drží číslo a jednotku pohromadě. */
const NBSP = " ";

/** "2,6 km" pro delší trasy, "850 m" pro ty krátké. */
export function formatDistance(metres: number): string {
  if (metres < 1000) {
    return `${Math.round(metres / 10) * 10}${NBSP}m`;
  }
  const km = metres / 1000;
  const text = km >= 10 ? km.toFixed(0) : km.toFixed(1).replace(".", ",");
  return `${text}${NBSP}km`;
}

/** "45 min" nebo "1 h 20 min" - pěší tempo bez zastávek. */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes}${NBSP}min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0
    ? `${hours}${NBSP}h`
    : `${hours}${NBSP}h${NBSP}${minutes}${NBSP}min`;
}

export function formatElevation(metres: number): string {
  return `${metres}${NBSP}m${NBSP}n.${NBSP}m.`;
}

const TRIP_KIND_LABELS: Readonly<Record<TripKind, string>> = {
  vyhlidka: "Vyhlídka",
  skala: "Skály",
  rozhledna: "Rozhledna",
  zricenina: "Zřícenina",
  soutesky: "Soutěsky",
  udoli: "Údolí",
  obec: "Obec",
  technicka: "Technická památka",
};

/** Štítek kategorie; u neznámé hodnoty raději obecný text než prázdné místo. */
export const tripKindLabel = (kind: TripKind): string =>
  TRIP_KIND_LABELS[kind] ?? "Výlet";

/** Množné číslo pro filtrovací tlačítka - "Vyhlídky (4)" čte líp než "Vyhlídka (4)". */
const TRIP_KIND_PLURALS: Readonly<Record<TripKind, string>> = {
  vyhlidka: "Vyhlídky",
  skala: "Skály",
  rozhledna: "Rozhledny",
  zricenina: "Zříceniny",
  soutesky: "Soutěsky",
  udoli: "Údolí",
  obec: "Obce",
  technicka: "Památky",
};

export const tripKindPlural = (kind: TripKind): string =>
  TRIP_KIND_PLURALS[kind] ?? "Výlety";

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

const TRAIL_LABELS: Readonly<Record<TrailColour, string>> = {
  cervena: "po červené",
  modra: "po modré",
  zelena: "po zelené",
  zluta: "po žluté",
  naucna: "po naučné stezce",
  neznaceno: "po lesních cestách",
};

export const trailLabel = (trail: TrailColour): string =>
  TRAIL_LABELS[trail] ?? TRAIL_LABELS.neznaceno;

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
