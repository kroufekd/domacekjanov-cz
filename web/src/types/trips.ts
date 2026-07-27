/**
 * Typy pro interaktivní mapu turistických výletů.
 *
 * Trasy se nepočítají v prohlížeči - jsou předpočítané skriptem
 * `scripts/build-trip-routes.mjs` a uložené v `src/data/trip-routes.json`,
 * takže běh webu nestojí žádné volání routovacího API.
 */

/** Barva značené trasy KČT pro hlavní variantu výletu. */
export type TrailColour =
  | "cervena"
  | "modra"
  | "zelena"
  | "zluta"
  | "naucna"
  | "neznaceno";

/** Kategorie cíle - určuje ikonu na mapě i štítek v kartě. */
export type TripKind =
  | "vyhlidka"
  | "skala"
  | "rozhledna"
  | "zricenina"
  | "soutesky"
  | "udoli"
  | "obec"
  | "technicka";

/** Zeměpisný bod ve WGS-84. */
export type GeoPoint = {
  readonly lat: number;
  readonly lon: number;
};

/** Výchozí bod výletu - buď přímo domeček, nebo obec / parkoviště. */
export type TripStart = {
  readonly name: string;
  readonly point: GeoPoint;
  /** true, když se vyráží pěšky od domečku (bez přejezdu autem). */
  readonly fromCottage: boolean;
};

/** Jeden výlet: cíl, výchozí bod a text do karty. */
export type Trip = {
  readonly id: string;
  readonly title: string;
  readonly kind: TripKind;
  readonly point: GeoPoint;
  /** Nadmořská výška cíle v metrech, pokud ji známe. */
  readonly elevation?: number;
  readonly trail: TrailColour;
  readonly start: TripStart;
  /** Okružní trasa se vrací do výchozího bodu (např. bunkry kolem Janova). */
  readonly loop?: boolean;
  /** Průjezdní body pro okruhy a trasy, které by se jinak vedly jinudy. */
  readonly waypoints?: readonly GeoPoint[];
  /** Jedna až dvě věty do karty a do popupu na mapě. */
  readonly summary: string;
  /** Upozornění na uzavírku nebo omezení, které mění reálnou podobu trasy. */
  readonly note?: string;
  /** Vzdálenost uvedená v podkladech klienta, jen pro kontrolu při generování. */
  readonly statedDistanceKm?: number;
};

/** Kdo trasu spočítal. Rozhoduje o textu v atribuci pod mapou. */
export type RouteSource = "mapy" | "brouter";

/** Předpočítaná geometrie jedné trasy. */
export type TripRoute = {
  readonly id: string;
  readonly lengthM: number;
  readonly durationS: number;
  /** Nastoupané metry, pokud je zdroj umí spočítat. */
  readonly ascentM?: number;
  readonly source: RouteSource;
  /** Dvojice [lat, lon] - pořadí odpovídá tomu, co chce Leaflet. */
  readonly coordinates: ReadonlyArray<readonly [number, number]>;
};

/** Obsah `src/data/trip-routes.json`. */
export type TripRouteFile = {
  readonly generatedAt: string;
  readonly source: RouteSource;
  readonly routes: readonly TripRoute[];
};
