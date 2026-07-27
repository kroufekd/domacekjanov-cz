import type { GeoPoint, Trip } from "@/types/trips";

/**
 * Turistické výlety v okolí Janova u Hřenska.
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

const fromCottage = {
  name: "Domeček Janov",
  point: COTTAGE,
  fromCottage: true,
} as const;

const from = (name: string, lat: number, lon: number) => ({
  name,
  point: { lat, lon },
  fromCottage: false,
});

export const TRIPS: readonly Trip[] = [
  {
    id: "rozhledna-janov",
    title: "Rozhledna Janov",
    kind: "rozhledna",
    point: { lat: 50.860949, lon: 14.269728 },
    elevation: 348,
    trail: "zluta",
    start: fromCottage,
    summary:
      "Kovová rozhledna z roku 2013 stojí přímo v obci. Sto šedesát dva schodů a nahoře 360° výhled na České i Saské Švýcarsko.",
  },
  {
    id: "bunkry-janov",
    title: "Bunkry Janov",
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
    summary:
      "Okruh po předválečných řopících z třicátých let. Vede z obce lesními cestami kolem několika zachovalých pevnůstek s informačními tabulemi.",
  },
  {
    id: "hrensko",
    title: "Hřensko",
    kind: "obec",
    point: { lat: 50.873961, lon: 14.236556 },
    elevation: 115,
    trail: "zelena",
    start: fromCottage,
    summary:
      "Nejníže položená obec v Česku a vstupní brána národního parku. Odtud se vyráží do soutěsek Kamenice i k Pravčické bráně.",
  },
  {
    id: "ruzovsky-vrch",
    title: "Růžovský vrch",
    kind: "skala",
    point: { lat: 50.83273, lon: 14.330251 },
    elevation: 619,
    trail: "zluta",
    start: fromCottage,
    summary:
      "Čedičový vrchol 619 m n. m. s průseky do širokého okolí. Z Janova k němu vede žlutá značka Hřensko - Srbská Kamenice.",
  },
  {
    id: "pravcicka-brana",
    title: "Pravčická brána",
    kind: "skala",
    point: { lat: 50.88371, lon: 14.281252 },
    elevation: 447,
    trail: "cervena",
    start: from("Mezní Louka", 50.87353, 14.317137),
    summary:
      "Největší pískovcová brána v Evropě - 26,5 metru na výšku. Vyhlídková terasa Sokolího hnízda i restaurace jsou přímo pod ní.",
    note: "Červená Gabrielina stezka je po požáru z roku 2022 stále uzavřená, proto trasa obchází přes Tři prameny. Před výletem si ověřte aktuální stav na npcs.cz.",
  },
  {
    id: "divoka-soutesky",
    title: "Divoká soutěska",
    kind: "soutesky",
    point: { lat: 50.864217, lon: 14.303201 },
    elevation: 157,
    trail: "zluta",
    start: from("Hřensko, k soutěskám", 50.873894, 14.251741),
    summary:
      "Plavba na pramicích kaňonem Kamenice mezi stěnami vysokými až 150 metrů. Přeprava jede od Velikonoc do konce října.",
    note: "Cesta vede přes Edmundovu soutěsku, která bývá kvůli sanaci skal uzavřená. Aktuální stav najdete na soutesky.cz.",
  },
  {
    id: "mezni-louka",
    title: "Mezní Louka",
    kind: "obec",
    point: { lat: 50.873705, lon: 14.317415 },
    elevation: 280,
    trail: "cervena",
    start: from("Hřensko", 50.873927, 14.240255),
    summary:
      "Osada uprostřed parku a hlavní křižovatka tras. Prostorné parkoviště, autobus z Děčína a odtud se rozbíhají značky na všechny strany.",
  },
  {
    id: "labska-vyhlidka",
    title: "Labská vyhlídka (Belvedér)",
    kind: "vyhlidka",
    point: { lat: 50.849549, lon: 14.221441 },
    elevation: 250,
    trail: "cervena",
    start: from("Bynovec", 50.820815, 14.2638),
    summary:
      "Skalní ochoz 130 metrů nad meandrem Labe. Z Bynovce se k němu jde po Knížecí cestě, zvládnou ji i děti, a v cíli bývá otevřené občerstvení.",
  },
  {
    id: "rozhledna-ruzenka",
    title: "Rozhledna Růženka",
    kind: "rozhledna",
    point: { lat: 50.844056, lon: 14.301083 },
    trail: "zelena",
    start: from("Růžová", 50.84216, 14.293785),
    statedDistanceKm: 1.5,
    summary:
      "Betonová rozhledna na Pastevním vrchu, tvarem připomíná Kaplického knihovnu. Z Růžové je to kousek a vstup je zdarma.",
  },
  {
    id: "dolsky-mlyn",
    title: "Dolský mlýn",
    kind: "zricenina",
    point: { lat: 50.848486, lon: 14.347615 },
    trail: "zelena",
    start: from("Vysoká Lípa", 50.862184, 14.355276),
    summary:
      "Zřícenina mlýna ze 16. století na břehu Kamenice, nejstarší v celém parku. Cesta klesá údolím řeky ve stínu lesa.",
  },
  {
    id: "mala-pravcicka-brana",
    title: "Malá Pravčická brána",
    kind: "skala",
    point: { lat: 50.871432, lon: 14.351091 },
    elevation: 390,
    trail: "cervena",
    start: from("Vysoká Lípa", 50.862184, 14.355276),
    summary:
      "Menší sestra slavné brány, schovaná v hlubokém lese. Vede k ní žlutá k rozcestí Pod Šaunštejnem a dál červená - bez vstupného a bez front.",
  },
  {
    id: "saunstejn",
    title: "Šaunštejn",
    kind: "zricenina",
    point: { lat: 50.868658, lon: 14.352095 },
    elevation: 340,
    trail: "cervena",
    start: from("Vysoká Lípa", 50.855819, 14.349869),
    summary:
      "Skalní hrad ze 14. století, později doupě loupežníků. Poslední úsek se leze po žebřících ve skále - za deště a námrazy raději jinam.",
  },
  {
    id: "rudolfuv-kamen",
    title: "Rudolfův kámen",
    kind: "vyhlidka",
    point: { lat: 50.871527, lon: 14.399722 },
    elevation: 484,
    trail: "zelena",
    start: from("Vysoká Lípa", 50.862184, 14.355276),
    summary:
      "Vyhlídka na pískovcovém suku ve výšce 484 metrů. Závěr výstupu tvoří kovové žebříky a schody vytesané do skály.",
  },
  {
    id: "vileminina-stena",
    title: "Vilemínina stěna",
    kind: "vyhlidka",
    point: { lat: 50.863178, lon: 14.403897 },
    elevation: 439,
    trail: "cervena",
    start: from("Jetřichovice", 50.852479, 14.396781),
    summary:
      "Nejfotogeničtější vyhlídka Jetřichovických stěn, na hraně téměř kolmé stěny. Mírné stoupání lesem zvládne i méně zkušený turista.",
  },
  {
    id: "mariina-vyhlidka",
    title: "Mariina vyhlídka",
    kind: "vyhlidka",
    point: { lat: 50.860428, lon: 14.404998 },
    elevation: 428,
    trail: "cervena",
    start: from("Jetřichovice", 50.852478, 14.396781),
    summary:
      "Skalní ostroh se zábradlím a výhledem přes 180 stupňů. Cesta z Jetřichovic je středně náročná a končí schody vytesanými do skály.",
  },
  {
    id: "falkenstejn",
    title: "Falkenštejn",
    kind: "zricenina",
    point: { lat: 50.854829, lon: 14.405435 },
    elevation: 303,
    trail: "zluta",
    start: from("Jetřichovice", 50.852389, 14.393909),
    summary:
      "Skalní hrad ze 13. století, jméno znamená Sokolí kámen. Průchod úzkými průrvami a výstup po schodištích vytesaných do pískovce.",
  },
  {
    id: "trpaslici-skaly",
    title: "Trpasličí skály",
    kind: "skala",
    point: { lat: 50.849888, lon: 14.416949 },
    trail: "zelena",
    start: from("Jetřichovice", 50.852389, 14.393909),
    summary:
      "Labyrint skalních průchodů, věží a převisů - zmenšenina velkých skalních měst. Na průzkum všech zákoutí si nechte aspoň dvě hodiny.",
  },
  {
    id: "pavlinino-udoli",
    title: "Pavlínino údolí",
    kind: "udoli",
    point: { lat: 50.837907, lon: 14.376786 },
    trail: "modra",
    start: from("Jetřichovice", 50.852389, 14.393909),
    statedDistanceKm: 5,
    summary:
      "Údolí Chřibské Kamenice z Jetřichovic až k osadě Všemily. Skoro žádné převýšení, takže projde i méně zdatná parta.",
  },
  {
    id: "kyjovske-udoli",
    title: "Kyjovské údolí",
    kind: "udoli",
    point: { lat: 50.916629, lon: 14.433647 },
    elevation: 350,
    trail: "cervena",
    start: from("Kyjov u Krásné Lípy", 50.913768, 14.462875),
    summary:
      "Naučná stezka údolím Křinice s dřevěnými lávkami a mosty přes říčku. Nenáročná, vhodná pro všechny věkové kategorie.",
  },
  {
    id: "decinsky-sneznik",
    title: "Rozhledna Sněžník",
    kind: "rozhledna",
    point: { lat: 50.793047, lon: 14.108508 },
    elevation: 723,
    trail: "cervena",
    start: from("Sněžník", 50.791227, 14.087326),
    summary:
      "Nejstarší kamenná rozhledna v Čechách z roku 1864, vysoká 33 metrů. Z vyhlídkové plošiny je vidět od Krušných hor po Krkonoše.",
  },
  {
    id: "tiske-steny",
    title: "Tiské stěny",
    kind: "skala",
    point: { lat: 50.787666, lon: 14.028762 },
    elevation: 613,
    trail: "cervena",
    start: from("Tisá", 50.784499, 14.031301),
    summary:
      "Skalní město s Velkým a Malým okruhem, natáčely se tu Letopisy Narnie. Samotné okruhy uvnitř skal zaberou dvě až tři hodiny.",
  },
];

/** Rychlé dohledání výletu podle id. */
export const TRIP_BY_ID: ReadonlyMap<string, Trip> = new Map(
  TRIPS.map((trip) => [trip.id, trip]),
);
