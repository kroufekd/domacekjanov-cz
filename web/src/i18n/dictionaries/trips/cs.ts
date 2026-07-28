import type { TripsDictionary } from "@/i18n/trips-dictionary";

export const tripsCs: TripsDictionary = {
  mapLabel: "Mapa turistických výletů v okolí Domečku Janov",
  startFilter: {
    group: "Filtr výchozího bodu",
    all: "Všechny výlety",
    onFoot: "Pěšky od domečku",
  },
  kindFilter: {
    group: "Filtr typu výletu",
    all: "Vše",
  },
  hint: {
    idle: "Vyberte cíl a mapa dokreslí cestu z výchozího bodu.",
    selected: "Klikněte znovu pro zrušení výběru.",
  },
  detailEmpty:
    "Vyberte výlet v mapě nebo v seznamu. Ukážeme vám, kudy se jde a jak dlouho to trvá.",
  callout: {
    close: "Zavřít detail výletu",
    route: "Trasa v Mapy.com",
  },
  detail: {
    route: "Otevřít trasu v Mapy.com",
  },
  meta: {
    onFoot: "pěšky",
    onFootFromCottage: "pěšky od domečku",
    startAt: "start {name}",
    fromStart: "od {name}",
    approximate: "cca {duration}",
  },
  stats: {
    start: "Výchozí bod",
    length: "Délka trasy",
    duration: "Čas chůze",
    ascent: "Stoupání",
    trail: "Značení",
    elevation: "Nadmořská výška",
    loopSuffix: " (okruh)",
  },
  errors: {
    map: "Mapu se nepodařilo načíst. Zkuste stránku obnovit.",
    route: "Trasu se nepodařilo vykreslit. Zkuste stránku obnovit.",
  },
  credit: {
    mapy: "Mapové podklady a trasy Mapy.com, profil pěší turistika.",
    osm: "Mapové podklady OpenStreetMap a Waymarked Trails, trasy počítané po značených stezkách.",
  },
  kind: {
    vyhlidka: "Vyhlídka",
    skala: "Skály",
    rozhledna: "Rozhledna",
    zricenina: "Zřícenina",
    soutesky: "Soutěsky",
    udoli: "Údolí",
    obec: "Obec",
    technicka: "Technická památka",
  },
  kindPlural: {
    vyhlidka: "Vyhlídky",
    skala: "Skály",
    rozhledna: "Rozhledny",
    zricenina: "Zříceniny",
    soutesky: "Soutěsky",
    udoli: "Údolí",
    obec: "Obce",
    technicka: "Památky",
  },
  trail: {
    cervena: "po červené",
    modra: "po modré",
    zelena: "po zelené",
    zluta: "po žluté",
    naucna: "po naučné stezce",
    neznaceno: "po lesních cestách",
  },
  units: {
    metre: "m",
    kilometre: "km",
    minute: "min",
    hour: "h",
    elevation: "{value} m n. m.",
  },
};
