"use client";

import "leaflet/dist/leaflet.css";

import type { LatLngBoundsExpression, Map as LeafletMap, Marker, Polyline } from "leaflet";
import { Car, ExternalLink, Footprints, TrendingUp, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { COTTAGE } from "@/data/trips";
import type { Locale } from "@/i18n/config";
import type { TripsDictionary } from "@/i18n/trips-dictionary";
import { formatTemplate } from "@/lib/format";
import {
  COTTAGE_MARKER_SIZE,
  MARKER_SIZE,
  cottageMarkerHtml,
  tripMarkerHtml,
  type MarkerVisual,
} from "@/lib/trip-map-icons";
import {
  TRIP_KIND_ORDER,
  formatDistance,
  formatDuration,
  formatElevation,
  mapyRouteUrl,
  trailColourHex,
  trailLabel,
  tripKindLabel,
  tripKindPlural,
} from "@/lib/trip-format";
import { parseTripRoutes } from "@/lib/trip-routes";
import type { LocalisedTrip, TripKind, TripRoute } from "@/types/trips";

/** Klíč k Mapy.com. Když chybí, mapa spadne na OpenStreetMap s vrstvou značených tras. */
const MAPY_KEY = process.env.NEXT_PUBLIC_MAPY_API_KEY;

const MAP_CENTRE: [number, number] = [50.862, 14.28];
const MAP_ZOOM = 11;

/** Barva vykreslené trasy - terakota z palety webu, na zelené mapě dobře čitelná. */
const ROUTE_COLOUR = "#c45d4a";
const ROUTE_CASING = "#fffdf8";

/*
 * Délka a čas se berou z odpovědi routovacího API, ne z vykreslené linie.
 * Linie je kvůli velikosti souboru zjednodušená (Douglas-Peucker, 8 m), takže
 * dopočítaná hodnota by byla o kus nepřesnější než ta původní.
 */

/** Jak dlouho trvá přelet na vybranou trasu. */
const FLY_DURATION_S = 0.9;
/** Nižší hodnota = výraznější zpomalení na konci přeletu. */
const FLY_EASE = 0.28;

/** Šířka bublinky s detailem výletu; musí sedět s `.trip-map__callout-card` v CSS. */
const CALLOUT_WIDTH_PX = 236;
/** Špička nesmí utéct za roh karty. */
const CALLOUT_TIP_INSET_PX = 26;

/** Hosté se zapnutým omezením pohybu dostanou skok místo přeletu. */
const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type StartFilter = "vse" | "pesky";

type TripMapProps = {
  /** Rozhoduje o formátu čísel - "2,6 km" v češtině, "2.6 km" v angličtině. */
  locale: Locale;
  dictionary: TripsDictionary;
  /** Výlety už s texty zvoleného jazyka; skládá je `getTrips` na serveru. */
  trips: readonly LocalisedTrip[];
};

export function TripMap({ locale, dictionary, trips }: TripMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [startFilter, setStartFilter] = useState<StartFilter>("vse");
  const [kindFilter, setKindFilter] = useState<TripKind | null>(null);
  const [routes, setRoutes] = useState<ReadonlyMap<string, TripRoute>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const routeLayersRef = useRef<Polyline[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const calloutRef = useRef<HTMLDivElement | null>(null);
  const calloutCardRef = useRef<HTMLDivElement | null>(null);
  /** Bod, nad kterým bublinka visí. Drží se v refu, ať ji jde posouvat bez rerenderu. */
  const calloutAnchorRef = useRef<[number, number] | null>(null);
  /** První usazení mapy se neanimuje - není odkud letět. */
  const hasFramedRef = useRef(false);
  /** Drží aktuální handler, aby se posluchače značek nemusely přepínat při každém renderu. */
  const selectRef = useRef<(id: string) => void>(() => {});
  /**
   * Značky se zakládají jednou při inicializaci mapy. Jazyk se bez nového načtení
   * stránky nemění, takže si výlety držíme v refu a mapa se kvůli nim nestaví znovu.
   */
  const tripsRef = useRef(trips);

  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);

  const startFiltered = useMemo(
    () => (startFilter === "pesky" ? trips.filter((trip) => trip.start.fromCottage) : trips),
    [startFilter, trips],
  );

  /** Kolik výletů zbývá v každé kategorii po použití filtru výchozího bodu. */
  const kindCounts = useMemo(() => {
    const counts = new Map<TripKind, number>();
    for (const trip of startFiltered) {
      counts.set(trip.kind, (counts.get(trip.kind) ?? 0) + 1);
    }
    return counts;
  }, [startFiltered]);

  const visibleTrips = useMemo(
    () => (kindFilter ? startFiltered.filter((trip) => trip.kind === kindFilter) : startFiltered),
    [kindFilter, startFiltered],
  );

  /**
   * Výběr odvozujeme z filtrů místo abychom ho hlídali efektem - když filtr
   * schová vybraný výlet, prostě přestane být vybraný.
   */
  const activeTrip = useMemo(
    () => (activeId ? (visibleTrips.find((trip) => trip.id === activeId) ?? null) : null),
    [activeId, visibleTrips],
  );
  const selectedId = activeTrip?.id ?? null;
  const activeRoute = selectedId ? routes.get(selectedId) : undefined;

  const select = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : id));
  }, []);

  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  /**
   * Posadí bublinku nad značku.
   *
   * Bublinka záměrně nežije uvnitř Leafletu: jeho popup se kreslí v kontejneru
   * s `overflow: hidden` (kvůli zaobleným rohům mapy), takže by se u horního
   * okraje ořízl. Tady leží vedle rámečku a může volně přetéct.
   */
  const positionCallout = useCallback(() => {
    const map = mapRef.current;
    const wrapper = calloutRef.current;
    const anchor = calloutAnchorRef.current;
    if (!map || !wrapper || !anchor) {
      return;
    }

    const point = map.latLngToContainerPoint(anchor);
    const width = map.getSize().x;
    const half = CALLOUT_WIDTH_PX / 2;
    // Vodorovně kartu držíme nad plátnem, ať nezmizí za okrajem stránky.
    const clampedX =
      width > CALLOUT_WIDTH_PX ? Math.min(Math.max(point.x, half), width - half) : width / 2;
    const maxShift = half - CALLOUT_TIP_INSET_PX;
    const tipShift = Math.min(Math.max(point.x - clampedX, -maxShift), maxShift);

    wrapper.style.transform = `translate3d(${Math.round(clampedX)}px, ${Math.round(point.y)}px, 0)`;
    calloutCardRef.current?.style.setProperty("--tip-shift", `${Math.round(tipShift)}px`);
  }, []);

  // Předpočítané trasy dotahujeme až s mapou, ať nezdržují první vykreslení stránky.
  useEffect(() => {
    let cancelled = false;

    import("@/data/trip-routes.json")
      .then((module) => {
        if (cancelled) {
          return;
        }
        setRoutes(parseTripRoutes(module.default ?? module));
      })
      .catch(() => {
        // Trasy jsou doplněk - mapa se značkami funguje i bez nich.
        if (!cancelled) {
          setRoutes(new Map());
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Inicializace Leafletu. Běží jednou, mapa se pak jen aktualizuje.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let map: LeafletMap | null = null;
    const markers = markersRef.current;

    const setup = async () => {
      let L: typeof import("leaflet");
      try {
        L = await import("leaflet");
      } catch {
        if (!cancelled) {
          setMapError(dictionary.errors.map);
        }
        return;
      }
      if (cancelled) {
        return;
      }

      map = L.map(container, {
        center: MAP_CENTRE,
        zoom: MAP_ZOOM,
        scrollWheelZoom: false,
        attributionControl: true,
        // Vlastní pozice, jinak by zoom seděl pod filtrovacími tlačítky.
        zoomControl: false,
      });
      mapRef.current = map;
      L.control.zoom({ position: "topright" }).addTo(map);

      // Bublinka je mimo Leaflet, takže si její pozici musíme držet sami.
      map.on("move zoom resize", positionCallout);

      // Sekce s mapou je při načtení stránky mimo viewport a Leaflet si zapamatuje
      // nulovou velikost - bez přeměření by fitBounds počítal se špatným plátnem.
      const observer = new ResizeObserver(() => {
        mapRef.current?.invalidateSize({ animate: false });
      });
      observer.observe(container);
      resizeObserverRef.current = observer;

      if (MAPY_KEY) {
        // Turistická vrstva Mapy.com - obsahuje značené KČT trasy.
        L.tileLayer(
          `https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${MAPY_KEY}`,
          {
            minZoom: 6,
            maxZoom: 19,
            attribution:
              '<a href="https://api.mapy.com/copyright" target="_blank" rel="noreferrer">&copy; Seznam.cz a.s. a další</a>',
          },
        ).addTo(map);

        // Logo je podmínkou licence Mapy.com, proto ho přidáváme jako vlastní control.
        const LogoControl = L.Control.extend({
          options: { position: "bottomleft" as const },
          onAdd() {
            const link = L.DomUtil.create("a", "trip-map__mapy-logo");
            link.href = "https://mapy.com/";
            link.target = "_blank";
            link.rel = "noreferrer";
            link.title = "Mapy.com";
            link.innerHTML =
              '<img src="https://api.mapy.com/img/api/logo.svg" alt="Mapy.com" width="60" height="18" />';
            L.DomEvent.disableClickPropagation(link);
            return link;
          },
        });
        map.addControl(new LogoControl());
      } else {
        // Náhradní podklad bez klíče: OSM + oficiální vrstva značených turistických tras.
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          minZoom: 6,
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }).addTo(map);
        L.tileLayer("https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png", {
          minZoom: 6,
          maxZoom: 18,
          opacity: 0.5,
          attribution:
            '<a href="https://hiking.waymarkedtrails.org/" target="_blank" rel="noreferrer">Waymarked Trails</a>',
        }).addTo(map);
      }

      L.marker([COTTAGE.lat, COTTAGE.lon], {
        icon: L.divIcon({
          html: cottageMarkerHtml(),
          className: "trip-pin-wrapper",
          iconSize: [COTTAGE_MARKER_SIZE, COTTAGE_MARKER_SIZE],
          iconAnchor: [COTTAGE_MARKER_SIZE / 2, COTTAGE_MARKER_SIZE / 2],
        }),
        title: "Domeček Janov",
        keyboard: false,
        // Pod cíle: v Janově leží rozhledna i bunkry pár set metrů od domu,
        // takže by jim velká značka domečku při oddáleném pohledu brala kliknutí.
        zIndexOffset: -200,
      })
        .addTo(map)
        .bindTooltip("Domeček Janov", {
          direction: "top",
          offset: [0, -(COTTAGE_MARKER_SIZE / 2 + 2)],
        });

      for (const trip of tripsRef.current) {
        const marker = L.marker([trip.point.lat, trip.point.lon], {
          icon: L.divIcon({
            html: tripMarkerHtml(trip.kind, "idle"),
            className: "trip-pin-wrapper",
            iconSize: [MARKER_SIZE.idle, MARKER_SIZE.idle],
            iconAnchor: [MARKER_SIZE.idle / 2, MARKER_SIZE.idle / 2],
          }),
          title: trip.title,
          alt: trip.title,
          riseOnHover: true,
        });
        marker.on("click", () => selectRef.current(trip.id));
        marker.on("keydown", (event) => {
          const key = (event as unknown as { originalEvent?: KeyboardEvent }).originalEvent?.key;
          if (key === "Enter" || key === " ") {
            selectRef.current(trip.id);
          }
        });
        marker.addTo(map);
        markers.set(trip.id, marker);
      }

      setMapReady(true);
    };

    void setup();

    return () => {
      cancelled = true;
      map?.stop();
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markers.clear();
      routeLayersRef.current = [];
      calloutAnchorRef.current = null;
      mapRef.current = null;
      map?.off("move zoom resize", positionCallout);
      map?.remove();
    };
  }, [dictionary.errors.map, positionCallout]);

  // Překreslení podle vybraného výletu a filtrů.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    let cancelled = false;

    const paint = async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) {
        return;
      }

      for (const layer of routeLayersRef.current) {
        layer.remove();
      }
      routeLayersRef.current = [];

      const visibleIds = new Set(visibleTrips.map((trip) => trip.id));

      for (const trip of trips) {
        const marker = markersRef.current.get(trip.id);
        if (!marker) {
          continue;
        }

        if (!visibleIds.has(trip.id)) {
          marker.remove();
          continue;
        }
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }

        const visual: MarkerVisual =
          selectedId === trip.id ? "active" : selectedId === null ? "idle" : "dimmed";
        const size = MARKER_SIZE[visual];
        marker.setIcon(
          L.divIcon({
            html: tripMarkerHtml(trip.kind, visual),
            className: "trip-pin-wrapper",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          }),
        );
        marker.setZIndexOffset(selectedId === trip.id ? 800 : 0);
      }

      // Přelet místo skoku: hosté tak vidí, kam se mapa přesouvá.
      const fly = hasFramedRef.current && !prefersReducedMotion();
      const frame = (bounds: LatLngBoundsExpression, padding: [number, number]) => {
        if (fly) {
          map.flyToBounds(bounds, {
            padding,
            duration: FLY_DURATION_S,
            easeLinearity: FLY_EASE,
          });
        } else {
          map.fitBounds(bounds, { padding, animate: false });
        }
        hasFramedRef.current = true;
      };

      if (!selectedId) {
        calloutAnchorRef.current = null;
        frame(
          [
            [COTTAGE.lat, COTTAGE.lon],
            ...visibleTrips.map((trip) => [trip.point.lat, trip.point.lon] as [number, number]),
          ],
          [48, 48],
        );
        return;
      }

      const trip = trips.find((item) => item.id === selectedId);
      if (!trip) {
        return;
      }

      const route = routes.get(selectedId);
      calloutAnchorRef.current = [trip.point.lat, trip.point.lon];

      if (route && route.coordinates.length > 1) {
        const path = route.coordinates.map(([lat, lon]) => [lat, lon] as [number, number]);
        const casing = L.polyline(path, {
          color: ROUTE_CASING,
          weight: 9,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map);
        const line = L.polyline(path, {
          color: ROUTE_COLOUR,
          weight: 4.5,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map);
        routeLayersRef.current = [casing, line];
        frame(line.getBounds(), [56, 56]);
      } else if (fly) {
        map.flyTo([trip.point.lat, trip.point.lon], 14, {
          duration: FLY_DURATION_S,
          easeLinearity: FLY_EASE,
        });
        hasFramedRef.current = true;
      } else {
        map.setView([trip.point.lat, trip.point.lon], 14, { animate: false });
        hasFramedRef.current = true;
      }

      positionCallout();
    };

    paint().catch(() => {
      if (!cancelled) {
        setMapError(dictionary.errors.route);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dictionary.errors.route, mapReady, positionCallout, routes, selectedId, trips, visibleTrips]);

  // Bublinka se vykresluje až po nastavení výběru, takže ji musíme doposadit.
  useEffect(() => {
    if (selectedId) {
      positionCallout();
    }
  }, [positionCallout, selectedId]);

  const { units } = dictionary;
  const showDistance = (metres: number) => formatDistance(metres, locale, units);
  const showDuration = (seconds: number) => formatDuration(seconds, units);

  const startFilters: ReadonlyArray<{ id: StartFilter; label: string }> = [
    { id: "vse", label: dictionary.startFilter.all },
    { id: "pesky", label: dictionary.startFilter.onFoot },
  ];

  const calloutMeta = activeTrip
    ? [
        activeRoute
          ? `${
              activeTrip.start.fromCottage
                ? dictionary.meta.onFoot
                : formatTemplate(dictionary.meta.fromStart, { name: activeTrip.startName })
            } ${showDistance(activeRoute.lengthM)} · ${formatTemplate(
              dictionary.meta.approximate,
              { duration: showDuration(activeRoute.durationS) },
            )}`
          : null,
        activeTrip.elevation ? formatElevation(activeTrip.elevation, units) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="trip-map">
      <div className="trip-map__canvas">
        <div className="trip-map__frame">
          <div
            ref={containerRef}
            className="trip-map__leaflet"
            role="application"
            aria-label={dictionary.mapLabel}
          />
        </div>

        {mapError ? <p className="trip-map__error">{mapError}</p> : null}

        <div className="trip-map__filters" role="group" aria-label={dictionary.startFilter.group}>
          {startFilters.map((option) => (
            <button
              key={option.id}
              type="button"
              className="trip-map__chip"
              aria-pressed={startFilter === option.id}
              onClick={() => setStartFilter(option.id)}
            >
              {option.id === "pesky" ? (
                <Footprints aria-hidden="true" size={14} />
              ) : (
                <Car aria-hidden="true" size={14} />
              )}
              {option.label}
            </button>
          ))}
        </div>

        {activeTrip ? (
          <div ref={calloutRef} className="trip-map__callout">
            <div ref={calloutCardRef} className="trip-map__callout-card">
              <button
                type="button"
                className="trip-map__callout-close"
                aria-label={dictionary.callout.close}
                onClick={() => setActiveId(null)}
              >
                <X aria-hidden="true" size={15} />
              </button>
              <p className="trip-map__item-kind">{tripKindLabel(activeTrip.kind, dictionary)}</p>
              <h4 className="trip-map__callout-title">{activeTrip.title}</h4>
              {calloutMeta ? <p className="trip-map__callout-meta">{calloutMeta}</p> : null}
              {activeTrip.note ? (
                <p className="trip-map__callout-note">{activeTrip.note}</p>
              ) : null}
              <a
                className="trip-map__callout-link"
                href={mapyRouteUrl(activeTrip.start.point, activeTrip.point)}
                target="_blank"
                rel="noreferrer"
              >
                {dictionary.callout.route}
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <div className="trip-map__panel">
        <div className="trip-map__kinds" role="group" aria-label={dictionary.kindFilter.group}>
          <button
            type="button"
            className="trip-map__kind-chip"
            aria-pressed={kindFilter === null}
            onClick={() => setKindFilter(null)}
          >
            {dictionary.kindFilter.all}
            <span>{startFiltered.length}</span>
          </button>
          {TRIP_KIND_ORDER.filter((kind) => (kindCounts.get(kind) ?? 0) > 0).map((kind) => (
            <button
              key={kind}
              type="button"
              className="trip-map__kind-chip"
              aria-pressed={kindFilter === kind}
              onClick={() => setKindFilter((current) => (current === kind ? null : kind))}
            >
              {tripKindPlural(kind, dictionary)}
              <span>{kindCounts.get(kind)}</span>
            </button>
          ))}
        </div>

        <p className="trip-map__hint">
          {activeTrip ? dictionary.hint.selected : dictionary.hint.idle}
        </p>

        <ul className="trip-map__list">
          {visibleTrips.map((trip) => {
            const route = routes.get(trip.id);
            const isActive = trip.id === selectedId;
            return (
              <li key={trip.id}>
                <button
                  type="button"
                  className="trip-map__item"
                  aria-pressed={isActive}
                  onClick={() => select(trip.id)}
                >
                  <span
                    className="trip-map__trail"
                    style={{ background: trailColourHex(trip.trail) }}
                    aria-hidden="true"
                  />
                  <span className="trip-map__item-body">
                    <span className="trip-map__item-kind">
                      {tripKindLabel(trip.kind, dictionary)}
                    </span>
                    <span className="trip-map__item-title">{trip.title}</span>
                    <span className="trip-map__item-meta">
                      {trip.start.fromCottage
                        ? dictionary.meta.onFootFromCottage
                        : formatTemplate(dictionary.meta.startAt, { name: trip.startName })}
                      {route ? ` · ${showDistance(route.lengthM)}` : ""}
                      {route ? ` · ${showDuration(route.durationS)}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="trip-map__detail" aria-live="polite">
        {activeTrip ? (
          <>
            <div className="trip-map__detail-head">
              <p className="trip-map__item-kind">{tripKindLabel(activeTrip.kind, dictionary)}</p>
              <h3>{activeTrip.title}</h3>
            </div>
            <p className="trip-map__detail-text">{activeTrip.summary}</p>
            {activeTrip.note ? (
              <p className="trip-map__note">
                <TriangleAlert aria-hidden="true" size={15} />
                {activeTrip.note}
              </p>
            ) : null}
            <dl className="trip-map__stats">
              <div>
                <dt>{dictionary.stats.start}</dt>
                <dd>{activeTrip.startName}</dd>
              </div>
              {activeRoute ? (
                <div>
                  <dt>{dictionary.stats.length}</dt>
                  <dd>
                    {showDistance(activeRoute.lengthM)}
                    {activeTrip.loop ? dictionary.stats.loopSuffix : ""}
                  </dd>
                </div>
              ) : null}
              {activeRoute ? (
                <div>
                  <dt>{dictionary.stats.duration}</dt>
                  <dd>{showDuration(activeRoute.durationS)}</dd>
                </div>
              ) : null}
              {activeRoute?.ascentM ? (
                <div>
                  <dt>{dictionary.stats.ascent}</dt>
                  <dd>
                    <TrendingUp aria-hidden="true" size={14} />
                    {activeRoute.ascentM} {units.metre}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>{dictionary.stats.trail}</dt>
                <dd>
                  <span
                    className="trip-map__trail trip-map__trail--inline"
                    style={{ background: trailColourHex(activeTrip.trail) }}
                    aria-hidden="true"
                  />
                  {trailLabel(activeTrip.trail, dictionary)}
                </dd>
              </div>
              {activeTrip.elevation ? (
                <div>
                  <dt>{dictionary.stats.elevation}</dt>
                  <dd>{formatElevation(activeTrip.elevation, units)}</dd>
                </div>
              ) : null}
            </dl>
            <a
              className="text-link"
              href={mapyRouteUrl(activeTrip.start.point, activeTrip.point)}
              target="_blank"
              rel="noreferrer"
            >
              {dictionary.detail.route}
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          </>
        ) : (
          <p className="trip-map__detail-empty">{dictionary.detailEmpty}</p>
        )}
      </div>

      <p className="trip-map__credit">
        {MAPY_KEY ? dictionary.credit.mapy : dictionary.credit.osm}
      </p>
    </div>
  );
}
