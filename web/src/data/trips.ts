import type { GeoPoint, Trip, TripStart } from "@/types/trips";

/**
 * Turistické výlety v okolí Janova u Hřenska - souřadnice a metadata.
 *
 * Názvy, popisy a upozornění tu nejsou: žijí v `src/data/trip-text/<jazyk>.ts`,
 * protože web běží ve třech jazycích a geometrie je pro všechny stejná.
 *
 * Souřadnice cílů pocházejí z OpenStreetMap, výchozí body jsou KČT rozcestníky
 * u parkovišť a autobusových zastávek - ne těžiště obcí, aby trasa začínala tam,
 * kde návštěvník opravdu vystoupí z auta.
 *
 * Barvy značek a délky byly ověřeny proti OSM a KČT; podklady od majitele
 * v několika případech uvádějí jinou barvu nebo kratší vzdálenost, než jaká
 * reálně platí, a přednost dostala ověřená skutečnost.
 */

/** Domeček Janov - výchozí bod pro trasy "pěšky od domečku". */
export const COTTAGE: GeoPoint = { lat: 50.85606, lon: 14.26754 };

const fromCottage: TripStart = { point: COTTAGE, fromCottage: true };

const from = (lat: number, lon: number): TripStart => ({
  point: { lat, lon },
  fromCottage: false,
});

export const TRIPS = [
  {
    id: "rozhledna-janov",
    kind: "rozhledna",
    point: { lat: 50.860949, lon: 14.269728 },
    elevation: 348,
    trail: "zluta",
    start: fromCottage,
  },
  {
    id: "bunkry-janov",
    kind: "technicka",
    point: { lat: 50.869976, lon: 14.243802 },
    trail: "neznaceno",
    start: fromCottage,
    loop: true,
    waypoints: [
      { lat: 50.870186, lon: 14.253237 },
      { lat: 50.870372, lon: 14.24793 },
      { lat: 50.869976, lon: 14.243802 },
      { lat: 50.86966, lon: 14.241911 },
    ],
  },
  {
    id: "hrensko",
    kind: "obec",
    point: { lat: 50.873961, lon: 14.236556 },
    elevation: 115,
    trail: "zelena",
    start: fromCottage,
  },
  {
    id: "ruzovsky-vrch",
    kind: "skala",
    point: { lat: 50.83273, lon: 14.330251 },
    elevation: 619,
    trail: "zluta",
    start: fromCottage,
  },
  {
    id: "pravcicka-brana",
    kind: "skala",
    point: { lat: 50.88371, lon: 14.281252 },
    elevation: 447,
    trail: "cervena",
    start: from(50.87353, 14.317137),
  },
  {
    id: "divoka-soutesky",
    kind: "soutesky",
    point: { lat: 50.864217, lon: 14.303201 },
    elevation: 157,
    trail: "zluta",
    start: from(50.873894, 14.251741),
  },
  {
    id: "mezni-louka",
    kind: "obec",
    point: { lat: 50.873705, lon: 14.317415 },
    elevation: 280,
    trail: "cervena",
    start: from(50.873927, 14.240255),
  },
  {
    id: "labska-vyhlidka",
    kind: "vyhlidka",
    point: { lat: 50.849549, lon: 14.221441 },
    elevation: 250,
    trail: "cervena",
    start: from(50.820815, 14.2638),
  },
  {
    id: "rozhledna-ruzenka",
    kind: "rozhledna",
    point: { lat: 50.844056, lon: 14.301083 },
    trail: "zelena",
    start: from(50.84216, 14.293785),
    statedDistanceKm: 1.5,
  },
  {
    id: "dolsky-mlyn",
    kind: "zricenina",
    point: { lat: 50.848486, lon: 14.347615 },
    trail: "zelena",
    start: from(50.862184, 14.355276),
  },
  {
    id: "mala-pravcicka-brana",
    kind: "skala",
    point: { lat: 50.871432, lon: 14.351091 },
    elevation: 390,
    trail: "cervena",
    start: from(50.862184, 14.355276),
  },
  {
    id: "saunstejn",
    kind: "zricenina",
    point: { lat: 50.868658, lon: 14.352095 },
    elevation: 340,
    trail: "cervena",
    start: from(50.855819, 14.349869),
  },
  {
    id: "rudolfuv-kamen",
    kind: "vyhlidka",
    point: { lat: 50.871527, lon: 14.399722 },
    elevation: 484,
    trail: "zelena",
    start: from(50.862184, 14.355276),
  },
  {
    id: "vileminina-stena",
    kind: "vyhlidka",
    point: { lat: 50.863178, lon: 14.403897 },
    elevation: 439,
    trail: "cervena",
    start: from(50.852479, 14.396781),
  },
  {
    id: "mariina-vyhlidka",
    kind: "vyhlidka",
    point: { lat: 50.860428, lon: 14.404998 },
    elevation: 428,
    trail: "cervena",
    start: from(50.852478, 14.396781),
  },
  {
    id: "falkenstejn",
    kind: "zricenina",
    point: { lat: 50.854829, lon: 14.405435 },
    elevation: 303,
    trail: "zluta",
    start: from(50.852389, 14.393909),
  },
  {
    id: "trpaslici-skaly",
    kind: "skala",
    point: { lat: 50.849888, lon: 14.416949 },
    trail: "zelena",
    start: from(50.852389, 14.393909),
  },
  {
    id: "pavlinino-udoli",
    kind: "udoli",
    point: { lat: 50.837907, lon: 14.376786 },
    trail: "modra",
    start: from(50.852389, 14.393909),
    statedDistanceKm: 5,
  },
  {
    id: "kyjovske-udoli",
    kind: "udoli",
    point: { lat: 50.916629, lon: 14.433647 },
    elevation: 350,
    trail: "cervena",
    start: from(50.913768, 14.462875),
  },
  {
    id: "decinsky-sneznik",
    kind: "rozhledna",
    point: { lat: 50.793047, lon: 14.108508 },
    elevation: 723,
    trail: "cervena",
    start: from(50.791227, 14.087326),
  },
  {
    id: "tiske-steny",
    kind: "skala",
    point: { lat: 50.787666, lon: 14.028762 },
    elevation: 613,
    trail: "cervena",
    start: from(50.784499, 14.031301),
  },
] as const satisfies readonly Trip[];

/**
 * Id všech výletů. Slovníky textů jsou typované na tento svazek, takže vynechaný
 * nebo překlepnutý výlet v překladu neprojde přes `tsc`.
 */
export type TripId = (typeof TRIPS)[number]["id"];
