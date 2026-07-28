import type { TripKind } from "@/types/trips";

/**
 * Cesty ikon vytažené z balíčku lucide (stejná sada, jakou používá zbytek webu).
 * Značky na mapě staví Leaflet z HTML řetězce, takže tu potřebujeme holé `d`,
 * ne React komponentu - jinak bychom do klientského bundlu tahali renderer.
 */
type IconPaths = readonly string[];

const ICON_PATHS = {
  mountain: ["m8 3 4 8 5-5 5 15H2L8 3z"],
  eye: [
    "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ],
  tower: [
    "M4.9 16.1C1 12.2 1 5.8 4.9 1.9",
    "M7.8 4.7a6.14 6.14 0 0 0-.8 7.5",
    "M12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    "M16.2 4.8c2 2 2.26 5.11.8 7.47",
    "M19.1 1.9a9.96 9.96 0 0 1 0 14.1",
    "M9.5 18h5",
    "m8 22 4-11 4 11",
  ],
  castle: [
    "M10 5V3",
    "M14 5V3",
    "M15 21v-3a3 3 0 0 0-6 0v3",
    "M18 3v8",
    "M18 5H6",
    "M22 11H2",
    "M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9",
    "M6 3v8",
  ],
  ship: [
    "M12 10.189V14",
    "M12 2v3",
    "M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6",
    "M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76",
    "M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
  ],
  trees: [
    "M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z",
    "M7 16v6",
    "M13 19v3",
    "M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5",
  ],
  landmark: [
    "M10 18v-7",
    "M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z",
    "M14 18v-7",
    "M18 18v-7",
    "M3 22h18",
    "M6 18v-7",
  ],
  shield: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  ],
  house: [
    "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
    "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  ],
} as const satisfies Record<string, IconPaths>;

type IconName = keyof typeof ICON_PATHS;

const KIND_ICON: Readonly<Record<TripKind, IconName>> = {
  vyhlidka: "eye",
  skala: "mountain",
  rozhledna: "tower",
  zricenina: "castle",
  soutesky: "ship",
  udoli: "trees",
  obec: "landmark",
  technicka: "shield",
};

/** Escapuje hodnoty, které skládáme do HTML atributů značky. */
const attr = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function svg(paths: IconPaths, size: number, colour: string): string {
  const body = paths.map((d) => `<path d="${d}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"` +
    ` fill="none" stroke="${attr(colour)}" stroke-width="2" stroke-linecap="round"` +
    ` stroke-linejoin="round" aria-hidden="true">${body}</svg>`
  );
}

export type MarkerVisual = "active" | "idle" | "dimmed";

/**
 * Značky jsou plné kolečko bez rámečku - na pestrých turistických dlaždicích
 * je odliší sytá výplň, ne obrys. Proto drobné rozměry: v okolí Janova leží
 * několik cílů pár set metrů od sebe a větší pin by je slepil dohromady.
 *
 * Barvy kopírují proměnné z `globals.css` (--forest-soft, --terracotta, --sage);
 * Leaflet skládá značku z HTML řetězce mimo React, takže `var()` tu nepoužijeme.
 */
const MARKER_STYLE: Readonly<
  Record<MarkerVisual, { size: number; fill: string; ink: string; shadow: string }>
> = {
  active: {
    size: 26,
    fill: "#c45d4a",
    ink: "#fffdf8",
    shadow: "0 4px 12px rgba(32, 37, 33, 0.38)",
  },
  idle: {
    size: 22,
    fill: "#2f7f50",
    ink: "#fffdf8",
    shadow: "0 2px 7px rgba(20, 53, 34, 0.34)",
  },
  dimmed: {
    size: 18,
    fill: "#8fbb9c",
    ink: "#f7fbf7",
    shadow: "0 1px 4px rgba(20, 53, 34, 0.2)",
  },
};

/**
 * HTML jedné značky cíle - Leaflet ho vloží do `L.divIcon`.
 *
 * Neznámá kategorie spadne na obecnou ikonu: značky se zakládají ve smyčce
 * uvnitř inicializace mapy, takže vyhozená výjimka by uživateli nechala
 * prázdné dlaždice bez jediného pinu i bez chybové hlášky.
 */
export function tripMarkerHtml(kind: TripKind, visual: MarkerVisual): string {
  const style = MARKER_STYLE[visual];
  const icon = svg(
    ICON_PATHS[KIND_ICON[kind] ?? "landmark"],
    Math.round(style.size * 0.62),
    style.ink,
  );
  return (
    `<span class="trip-pin trip-pin--${visual}" style="width:${style.size}px;height:${style.size}px;` +
    `background:${style.fill};box-shadow:${style.shadow}">${icon}</span>`
  );
}

export const COTTAGE_MARKER_SIZE = 30;

/** Značka domečku - vždy tmavě zelená, ať je jasné, odkud se vyráží. */
export function cottageMarkerHtml(): string {
  const icon = svg(ICON_PATHS.house, 18, "#f5f0e6");
  return (
    `<span class="trip-pin trip-pin--cottage" style="width:${COTTAGE_MARKER_SIZE}px;` +
    `height:${COTTAGE_MARKER_SIZE}px;background:#195d36;` +
    `box-shadow:0 5px 16px rgba(20, 53, 34, 0.45)">${icon}</span>`
  );
}

export const MARKER_SIZE: Readonly<Record<MarkerVisual, number>> = {
  active: MARKER_STYLE.active.size,
  idle: MARKER_STYLE.idle.size,
  dimmed: MARKER_STYLE.dimmed.size,
};
