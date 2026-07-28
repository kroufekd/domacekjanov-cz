/**
 * Předpočítá geometrii turistických tras pro mapu výletů.
 *
 *   npm run build:routes --workspace web
 *
 * Trasy se počítají jednou při vývoji a výsledek se commituje do
 * `src/data/trip-routes.json`. Web tak za běhu nevolá žádné routovací API.
 *
 * Poskytovatelé (v tomto pořadí):
 *   1. Mapy.com  - `foot_hiking`, kopíruje značené KČT stezky. Vyžaduje MAPY_API_KEY.
 *   2. BRouter   - profil `hiking-beta` nad OSM daty. Zdarma, bez klíče, záloha.
 *
 * Skript se spouští přes `node --experimental-strip-types`, proto importuje
 * datový soubor s příponou `.ts`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { TRIPS } from "../src/data/trips.ts";
import type { GeoPoint, RouteSource, Trip, TripRoute } from "../src/types/trips.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(HERE, "../src/data/trip-routes.json");

const MAPY_KEY = process.env.MAPY_API_KEY?.trim();
const MAPY_ENDPOINT = "https://api.mapy.com/v1/routing/route";
const BROUTER_ENDPOINT = "https://brouter.de/brouter";

/** Zjednodušení geometrie - pod tímto odstupem v metrech bod zahodíme. */
const SIMPLIFY_TOLERANCE_M = 8;
/** Počet desetinných míst - 5 míst je zhruba metr, jemnější rozlišení nemá smysl. */
const COORD_PRECISION = 5;
/** Pauza mezi voláními, ať zbytečně netlučeme do cizího API. */
const THROTTLE_MS = 350;

type LonLat = readonly [number, number];

type ProviderResult = {
  readonly lengthM: number;
  readonly durationS: number;
  readonly ascentM?: number;
  /** Body v pořadí [lon, lat], jak je vrací GeoJSON. */
  readonly line: readonly LonLat[];
};

class RouteError extends Error {
  readonly tripId: string;
  readonly provider: RouteSource;

  constructor(tripId: string, provider: RouteSource, message: string) {
    super(`[${provider}] ${tripId}: ${message}`);
    this.name = "RouteError";
    this.tripId = tripId;
    this.provider = provider;
  }
}

const sleep = (ms: number) =>
  new Promise((done) => {
    setTimeout(done, ms);
  });

const lonLat = (point: GeoPoint): string => `${point.lon},${point.lat}`;

/**
 * Body trasy od výchozího bodu k cíli.
 * U okruhu se na konec vrací výchozí bod, aby trasa uzavřela smyčku.
 */
const waypointsOf = (trip: Trip): readonly GeoPoint[] => {
  const middle = trip.waypoints ?? [];
  const end = trip.loop ? trip.start.point : trip.point;
  return [trip.start.point, ...middle, end];
};

async function fetchJson(url: string, tripId: string, provider: RouteSource) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(60_000),
    });
  } catch (cause) {
    throw new RouteError(
      tripId,
      provider,
      `síťová chyba: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }

  if (!response.ok) {
    const body = (await response.text().catch(() => "")).slice(0, 200);
    throw new RouteError(tripId, provider, `HTTP ${response.status} ${body}`);
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new RouteError(
      tripId,
      provider,
      `odpověď není JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
}

/** Vytáhne pole souřadnic z GeoJSON Feature i z holé LineString. */
function readLineString(geometry: unknown, tripId: string, provider: RouteSource): readonly LonLat[] {
  const node = geometry as { type?: string; geometry?: unknown; coordinates?: unknown };
  if (node?.type === "Feature") {
    return readLineString(node.geometry, tripId, provider);
  }

  const coordinates = node?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new RouteError(tripId, provider, "geometrie neobsahuje použitelnou linii");
  }

  return coordinates.map((pair, index) => {
    if (!Array.isArray(pair) || typeof pair[0] !== "number" || typeof pair[1] !== "number") {
      throw new RouteError(tripId, provider, `bod ${index} není dvojice čísel`);
    }
    return [pair[0], pair[1]] as const;
  });
}

async function routeViaMapy(trip: Trip): Promise<ProviderResult> {
  if (!MAPY_KEY) {
    throw new RouteError(trip.id, "mapy", "chybí MAPY_API_KEY");
  }

  const points = waypointsOf(trip);
  const via = points.slice(1, -1);
  if (via.length > 15) {
    throw new RouteError(trip.id, "mapy", `Mapy.com zvládne 15 průjezdních bodů, dostal ${via.length}`);
  }

  const params = new URLSearchParams({
    start: lonLat(points[0]),
    end: lonLat(points[points.length - 1]),
    routeType: "foot_hiking",
    format: "geojson",
    lang: "cs",
    apikey: MAPY_KEY,
  });
  if (via.length > 0) {
    params.set("waypoints", via.map(lonLat).join(";"));
  }

  const payload = (await fetchJson(
    `${MAPY_ENDPOINT}?${params.toString()}`,
    trip.id,
    "mapy",
  )) as { length?: number; duration?: number; geometry?: unknown };

  if (typeof payload.length !== "number" || typeof payload.duration !== "number") {
    throw new RouteError(trip.id, "mapy", "odpověď neobsahuje length/duration");
  }

  return {
    lengthM: payload.length,
    durationS: payload.duration,
    line: readLineString(payload.geometry, trip.id, "mapy"),
  };
}

async function routeViaBrouter(trip: Trip): Promise<ProviderResult> {
  const params = new URLSearchParams({
    lonlats: waypointsOf(trip).map(lonLat).join("|"),
    profile: "hiking-beta",
    alternativeidx: "0",
    format: "geojson",
  });

  const payload = (await fetchJson(
    `${BROUTER_ENDPOINT}?${params.toString()}`,
    trip.id,
    "brouter",
  )) as { features?: Array<{ properties?: Record<string, string>; geometry?: unknown }> };

  const feature = payload.features?.[0];
  if (!feature) {
    throw new RouteError(trip.id, "brouter", "odpověď neobsahuje žádnou trasu");
  }

  const properties = feature.properties ?? {};
  const lengthM = Number(properties["track-length"]);
  const durationS = Number(properties["total-time"]);
  const ascentM = Number(properties["filtered ascend"]);

  if (!Number.isFinite(lengthM) || !Number.isFinite(durationS)) {
    throw new RouteError(trip.id, "brouter", "chybí track-length nebo total-time");
  }

  return {
    lengthM: Math.round(lengthM),
    durationS: Math.round(durationS),
    ascentM: Number.isFinite(ascentM) ? Math.round(ascentM) : undefined,
    line: readLineString(feature.geometry, trip.id, "brouter"),
  };
}

/** Kolmá vzdálenost bodu od úsečky v metrech (rovinná aproximace, na tyhle vzdálenosti stačí). */
function perpendicularDistanceM(point: LonLat, from: LonLat, to: LonLat): number {
  const metresPerDegLat = 111_320;
  const metresPerDegLon = metresPerDegLat * Math.cos((point[1] * Math.PI) / 180);

  const px = (point[0] - from[0]) * metresPerDegLon;
  const py = (point[1] - from[1]) * metresPerDegLat;
  const vx = (to[0] - from[0]) * metresPerDegLon;
  const vy = (to[1] - from[1]) * metresPerDegLat;

  const lengthSq = vx * vx + vy * vy;
  if (lengthSq === 0) {
    return Math.hypot(px, py);
  }

  const t = Math.max(0, Math.min(1, (px * vx + py * vy) / lengthSq));
  return Math.hypot(px - t * vx, py - t * vy);
}

/** Douglas-Peucker - vyhodí body, které tvar linie nemění. */
function simplify(line: readonly LonLat[], toleranceM: number): readonly LonLat[] {
  if (line.length < 3) {
    return line;
  }

  const first = line[0];
  const last = line[line.length - 1];
  let farthest = 0;
  let maxDistance = 0;

  for (let index = 1; index < line.length - 1; index += 1) {
    const distance = perpendicularDistanceM(line[index], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      farthest = index;
    }
  }

  if (maxDistance <= toleranceM) {
    return [first, last];
  }

  const head = simplify(line.slice(0, farthest + 1), toleranceM);
  const tail = simplify(line.slice(farthest), toleranceM);
  return [...head.slice(0, -1), ...tail];
}

const round = (value: number) => Number(value.toFixed(COORD_PRECISION));

async function buildRoute(trip: Trip): Promise<{ route: TripRoute; warnings: readonly string[] }> {
  const warnings: string[] = [];
  let result: ProviderResult | null = null;
  let source: RouteSource = "brouter";

  if (MAPY_KEY) {
    try {
      result = await routeViaMapy(trip);
      source = "mapy";
    } catch (error) {
      warnings.push(
        `Mapy.com selhalo, padám na BRouter - ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (!result) {
    result = await routeViaBrouter(trip);
    source = "brouter";
  }

  const simplified = simplify(result.line, SIMPLIFY_TOLERANCE_M);
  const stated = trip.statedDistanceKm;
  const actualKm = result.lengthM / 1000;
  if (stated && Math.abs(actualKm - stated) > Math.max(1.5, stated * 0.6)) {
    warnings.push(
      `spočtená délka ${actualKm.toFixed(1)} km se hodně liší od uváděných ${stated} km - zkontroluj výchozí bod`,
    );
  }

  return {
    route: {
      id: trip.id,
      lengthM: result.lengthM,
      durationS: result.durationS,
      ...(result.ascentM === undefined ? {} : { ascentM: result.ascentM }),
      source,
      // Leaflet chce [lat, lon], GeoJSON dává [lon, lat] - tady to obracíme jednou provždy.
      coordinates: simplified.map(([lon, lat]) => [round(lat), round(lon)] as const),
    },
    warnings,
  };
}

async function main() {
  if (!MAPY_KEY) {
    console.warn(
      "MAPY_API_KEY není nastaven - trasy se spočítají přes BRouter (hiking-beta nad OSM).",
    );
  }

  const routes: TripRoute[] = [];
  const failures: string[] = [];
  let mapyCount = 0;

  for (const trip of TRIPS) {
    try {
      const { route, warnings } = await buildRoute(trip);
      routes.push(route);
      if (route.source === "mapy") {
        mapyCount += 1;
      }
      const km = (route.lengthM / 1000).toFixed(1);
      const minutes = Math.round(route.durationS / 60);
      console.log(
        `✓ ${trip.id.padEnd(22)} ${km.padStart(5)} km  ${String(minutes).padStart(4)} min  ${route.coordinates.length
          .toString()
          .padStart(4)} bodů  (${route.source})`,
      );
      for (const warning of warnings) {
        console.warn(`  ! ${warning}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.error(`✗ ${trip.id}: ${message}`);
    }
    await sleep(THROTTLE_MS);
  }

  if (routes.length === 0) {
    throw new Error("Nepodařilo se spočítat ani jednu trasu - soubor nechávám beze změny.");
  }

  const source: RouteSource = mapyCount === routes.length ? "mapy" : "brouter";
  const payload = {
    generatedAt: new Date().toISOString(),
    source,
    routes,
  };

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(payload, null, 1)}\n`, "utf8");

  console.log(
    `\nHotovo: ${routes.length}/${TRIPS.length} tras (${mapyCount} z Mapy.com) -> ${OUTPUT}`,
  );

  if (failures.length > 0) {
    throw new Error(`${failures.length} tras se nepodařilo spočítat, viz výpis výše.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
