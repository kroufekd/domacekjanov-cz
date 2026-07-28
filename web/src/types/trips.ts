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
  readonly point: GeoPoint;
  /** true, když se vyráží pěšky od domečku (bez přejezdu autem). */
  readonly fromCottage: boolean;
};

/**
 * Jeden výlet bez textů: souřadnice a metadata, která platí ve všech jazycích.
 * Názvy a popisy žijí odděleně v `TripText`, ať se geometrie nekopíruje třikrát.
 */
export type Trip = {
  readonly id: string;
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
  /** Vzdálenost uvedená v podkladech klienta, jen pro kontrolu při generování. */
  readonly statedDistanceKm?: number;
};

/** Texty jednoho výletu v jednom jazyce. */
export type TripText = {
  readonly title: string;
  /** Jméno výchozího bodu tak, jak ho návštěvník najde na rozcestníku. */
  readonly startName: string;
  /** Jedna až dvě věty do karty a do bublinky na mapě. */
  readonly summary: string;
  /** Upozornění na uzavírku nebo omezení, které mění reálnou podobu trasy. */
  readonly note?: string;
};

/** Výlet i s texty pro zvolený jazyk - to, co dostane komponenta mapy. */
export type LocalisedTrip = Trip & TripText;

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
