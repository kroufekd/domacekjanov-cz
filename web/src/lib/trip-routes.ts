import type { RouteSource, TripRoute } from "@/types/trips";

/**
 * Validace předpočítaných tras.
 *
 * `src/data/trip-routes.json` generuje skript, ale je to soubor na hranici
 * aplikace - když se generátor rozbije nebo někdo soubor ručně upraví,
 * nechceme to zjistit až pádem Leafletu uprostřed vykreslování.
 */

const ROUTE_SOURCES: readonly RouteSource[] = ["mapy", "brouter"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function parseCoordinates(value: unknown): ReadonlyArray<readonly [number, number]> | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const points: Array<readonly [number, number]> = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length < 2) {
      return null;
    }
    const [lat, lon] = entry;
    if (!isFiniteNumber(lat) || !isFiniteNumber(lon)) {
      return null;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return null;
    }
    points.push([lat, lon]);
  }
  return points;
}

function parseRoute(value: unknown): TripRoute | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, lengthM, durationS, ascentM, source, coordinates } = value;
  if (typeof id !== "string" || id.length === 0) {
    return null;
  }
  if (!isFiniteNumber(lengthM) || !isFiniteNumber(durationS)) {
    return null;
  }
  if (typeof source !== "string" || !ROUTE_SOURCES.includes(source as RouteSource)) {
    return null;
  }

  const points = parseCoordinates(coordinates);
  if (!points) {
    return null;
  }

  return {
    id,
    lengthM,
    durationS,
    ...(isFiniteNumber(ascentM) ? { ascentM } : {}),
    source: source as RouteSource,
    coordinates: points,
  };
}

/**
 * Vrátí mapu id -> trasa. Poškozené záznamy tiše přeskočí a zbytek pustí dál,
 * protože jedna rozbitá trasa nemá shodit celou mapu; v konzoli o ní řekne.
 */
export function parseTripRoutes(value: unknown): ReadonlyMap<string, TripRoute> {
  const routes = new Map<string, TripRoute>();
  if (!isRecord(value) || !Array.isArray(value.routes)) {
    return routes;
  }

  for (const entry of value.routes) {
    const route = parseRoute(entry);
    if (route) {
      routes.set(route.id, route);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn("Přeskakuji poškozený záznam v trip-routes.json:", entry);
    }
  }

  return routes;
}
