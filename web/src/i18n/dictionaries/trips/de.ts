import type { TripsDictionary } from "@/i18n/trips-dictionary";

export const tripsDe: TripsDictionary = {
  mapLabel: "Karte der Wanderziele rund um Domeček Janov",
  startFilter: {
    group: "Filter für den Startpunkt",
    all: "Alle Ausflüge",
    onFoot: "Zu Fuß vom Haus",
  },
  kindFilter: {
    group: "Filter nach Art des Ziels",
    all: "Alle",
  },
  hint: {
    idle: "Wählen Sie ein Ziel, die Karte zeichnet den Weg vom Startpunkt ein.",
    selected: "Ein erneuter Klick hebt die Auswahl auf.",
  },
  detailEmpty:
    "Wählen Sie einen Ausflug in der Karte oder in der Liste. Wir zeigen Ihnen, wo es langgeht und wie lange es dauert.",
  callout: {
    close: "Detail des Ausflugs schließen",
    route: "Route auf Mapy.com",
  },
  detail: {
    route: "Route auf Mapy.com öffnen",
  },
  meta: {
    onFoot: "zu Fuß",
    onFootFromCottage: "zu Fuß vom Haus",
    startAt: "Start {name}",
    fromStart: "ab {name}",
    approximate: "ca. {duration}",
  },
  stats: {
    start: "Startpunkt",
    length: "Länge der Route",
    duration: "Gehzeit",
    ascent: "Anstieg",
    trail: "Markierung",
    elevation: "Höhe über dem Meer",
    loopSuffix: " (Rundweg)",
  },
  errors: {
    map: "Die Karte konnte nicht geladen werden. Bitte laden Sie die Seite neu.",
    route: "Die Route konnte nicht gezeichnet werden. Bitte laden Sie die Seite neu.",
  },
  credit: {
    mapy: "Kartengrundlage und Routen von Mapy.com, Profil Wandern.",
    osm: "Kartengrundlage OpenStreetMap und Waymarked Trails, Routen entlang markierter Wege berechnet.",
  },
  kind: {
    vyhlidka: "Aussichtspunkt",
    skala: "Felsen",
    rozhledna: "Aussichtsturm",
    zricenina: "Burgruine",
    soutesky: "Klamm",
    udoli: "Tal",
    obec: "Ort",
    technicka: "Technisches Denkmal",
  },
  kindPlural: {
    vyhlidka: "Aussichtspunkte",
    skala: "Felsen",
    rozhledna: "Aussichtstürme",
    zricenina: "Burgruinen",
    soutesky: "Klammen",
    udoli: "Täler",
    obec: "Orte",
    technicka: "Denkmäler",
  },
  trail: {
    cervena: "auf der roten Markierung",
    modra: "auf der blauen Markierung",
    zelena: "auf der grünen Markierung",
    zluta: "auf der gelben Markierung",
    naucna: "auf dem Lehrpfad",
    neznaceno: "auf Waldwegen",
  },
  units: {
    metre: "m",
    kilometre: "km",
    minute: "min",
    hour: "Std.",
    elevation: "{value} m ü. NN",
  },
};
