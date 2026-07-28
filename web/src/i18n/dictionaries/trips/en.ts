import type { TripsDictionary } from "@/i18n/trips-dictionary";

export const tripsEn: TripsDictionary = {
  mapLabel: "Map of hiking trips around Domeček Janov",
  startFilter: {
    group: "Starting point filter",
    all: "All trips",
    onFoot: "On foot from the cottage",
  },
  kindFilter: {
    group: "Trip type filter",
    all: "All",
  },
  hint: {
    idle: "Pick a destination and the map draws the route from the starting point.",
    selected: "Click again to clear the selection.",
  },
  detailEmpty:
    "Pick a trip on the map or in the list. We will show you which way it goes and how long it takes.",
  callout: {
    close: "Close trip detail",
    route: "Route on Mapy.com",
  },
  detail: {
    route: "Open the route on Mapy.com",
  },
  meta: {
    onFoot: "on foot",
    onFootFromCottage: "on foot from the cottage",
    startAt: "start {name}",
    fromStart: "from {name}",
    approximate: "approx. {duration}",
  },
  stats: {
    start: "Starting point",
    length: "Route length",
    duration: "Walking time",
    ascent: "Ascent",
    trail: "Waymarking",
    elevation: "Elevation",
    loopSuffix: " (loop)",
  },
  errors: {
    map: "The map could not be loaded. Please refresh the page.",
    route: "The route could not be drawn. Please refresh the page.",
  },
  credit: {
    mapy: "Map data and routes by Mapy.com, hiking profile.",
    osm: "Map data by OpenStreetMap and Waymarked Trails, routes calculated along waymarked paths.",
  },
  kind: {
    vyhlidka: "Viewpoint",
    skala: "Rocks",
    rozhledna: "Lookout tower",
    zricenina: "Ruin",
    soutesky: "Gorge",
    udoli: "Valley",
    obec: "Village",
    technicka: "Historic structure",
  },
  kindPlural: {
    vyhlidka: "Viewpoints",
    skala: "Rocks",
    rozhledna: "Lookout towers",
    zricenina: "Ruins",
    soutesky: "Gorges",
    udoli: "Valleys",
    obec: "Villages",
    technicka: "Structures",
  },
  trail: {
    cervena: "on the red trail",
    modra: "on the blue trail",
    zelena: "on the green trail",
    zluta: "on the yellow trail",
    naucna: "on a nature trail",
    neznaceno: "on forest paths",
  },
  units: {
    metre: "m",
    kilometre: "km",
    minute: "min",
    hour: "h",
    elevation: "{value} m a.s.l.",
  },
};
