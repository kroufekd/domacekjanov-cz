import type { TrailColour, TripKind } from "@/types/trips";

/**
 * Strings of the trip map. They stay in the codebase rather than in Sanity:
 * they are filter labels, table headings and accessibility names, not copy a
 * site owner would rewrite.
 *
 * `{name}`, `{value}` and `{duration}` placeholders are filled by
 * `formatTemplate`.
 */
export type TripsDictionary = {
  /** Accessible name of the Leaflet canvas. */
  mapLabel: string;
  startFilter: {
    group: string;
    all: string;
    onFoot: string;
  };
  kindFilter: {
    group: string;
    all: string;
  };
  hint: {
    /** Shown while nothing is selected. */
    idle: string;
    /** Shown once a trip is selected. */
    selected: string;
  };
  /** Placeholder in the detail panel before the first pick. */
  detailEmpty: string;
  callout: {
    close: string;
    route: string;
  };
  detail: {
    route: string;
  };
  /** Meta line under the trip name in the list and in the callout. */
  meta: {
    onFoot: string;
    onFootFromCottage: string;
    /** `start {name}` */
    startAt: string;
    /** `od {name}` */
    fromStart: string;
    /** `cca {duration}` - walking time is an estimate, never a promise. */
    approximate: string;
  };
  stats: {
    start: string;
    length: string;
    duration: string;
    ascent: string;
    trail: string;
    elevation: string;
    /** Appended to the length of a circular route. */
    loopSuffix: string;
  };
  errors: {
    map: string;
    route: string;
  };
  credit: {
    mapy: string;
    osm: string;
  };
  kind: Record<TripKind, string>;
  /** Plural used on the filter chips - "Viewpoints (4)" reads better. */
  kindPlural: Record<TripKind, string>;
  trail: Record<TrailColour, string>;
  units: {
    metre: string;
    kilometre: string;
    minute: string;
    hour: string;
    /** `{value} m n. m.` - metres above sea level. */
    elevation: string;
  };
};
