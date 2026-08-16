import { TRIPS } from "@/data/trips";
import type { Locale } from "@/i18n/config";
import {
  localizedList,
  localizedText,
  mergeLocalized,
} from "@/lib/content/normalize";
import type {
  Accommodation,
  GalleryCategory,
  MediaImage,
  Rate,
  SiteCopy,
  SiteSettings,
} from "@/types/content";
import type { TripTextOverride, TripTextOverrides } from "@/types/trips";

/**
 * Turns raw content documents into the shapes the page renders.
 *
 * Anything the Studio has not translated for the requested language keeps the
 * built-in wording, and a list entry without a translation is left out of that
 * language. If a whole list ends up empty, the built-in list takes over - so a
 * half-finished translation never blanks out a section and never mixes
 * languages on one page.
 */

const galleryCategories: readonly GalleryCategory[] = [
  "exterier",
  "spolecne",
  "pokoje",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const plainText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const positiveNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;

const asCategory = (value: unknown): GalleryCategory | undefined =>
  galleryCategories.find((category) => category === value);

const knownTripIds: ReadonlySet<string> = new Set(TRIPS.map((trip) => trip.id));

const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

function normalizeImage(
  raw: unknown,
  locale: Locale,
  fallback: MediaImage | undefined,
): MediaImage | undefined {
  if (!isRecord(raw)) return fallback;
  const src = plainText(raw.src);
  if (!src) return fallback;

  return {
    id: plainText(raw.id) ?? src,
    src,
    alt: localizedText(raw.alt, locale) ?? fallback?.alt ?? "",
    width: positiveNumber(raw.width) ?? fallback?.width ?? 1600,
    height: positiveNumber(raw.height) ?? fallback?.height ?? 1200,
    category: asCategory(raw.category) ?? fallback?.category,
    caption: localizedText(raw.caption, locale) ?? fallback?.caption,
    featured:
      typeof raw.featured === "boolean" ? raw.featured : fallback?.featured,
  };
}

export function normalizeSettings(
  raw: unknown,
  locale: Locale,
  fallback: SiteSettings,
): SiteSettings {
  if (!isRecord(raw)) return fallback;

  const translated = <K extends keyof SiteSettings>(key: K): string =>
    localizedText(raw[key], locale) ?? (fallback[key] as string);

  return {
    ...fallback,
    title: plainText(raw.title) ?? fallback.title,
    description: translated("description"),
    seoTitle: localizedText(raw.seoTitle, locale) ?? fallback.seoTitle,
    seoDescription:
      localizedText(raw.seoDescription, locale) ?? fallback.seoDescription,
    seoImage: normalizeImage(raw.seoImage, locale, fallback.seoImage),
    phone: plainText(raw.phone) ?? fallback.phone,
    phoneDisplay: plainText(raw.phoneDisplay) ?? fallback.phoneDisplay,
    email: plainText(raw.email) ?? fallback.email,
    address: translated("address"),
    heroEyebrow: translated("heroEyebrow"),
    heroTitle: translated("heroTitle"),
    heroDescription: translated("heroDescription"),
    heroImage:
      normalizeImage(raw.heroImage, locale, fallback.heroImage) ??
      fallback.heroImage,
    matterportUrl: plainText(raw.matterportUrl) ?? fallback.matterportUrl,
    calendarUrl: plainText(raw.calendarUrl) ?? fallback.calendarUrl,
    listingUrl: plainText(raw.listingUrl) ?? fallback.listingUrl,
    mapUrl: plainText(raw.mapUrl) ?? fallback.mapUrl,
    facebookUrl: plainText(raw.facebookUrl) ?? fallback.facebookUrl,
    instagramUrl: plainText(raw.instagramUrl) ?? fallback.instagramUrl,
  };
}

export function normalizeAccommodation(
  raw: unknown,
  locale: Locale,
  fallback: Accommodation,
): Accommodation {
  if (!isRecord(raw)) return fallback;

  const facts = records(raw.facts)
    .map((item) => ({
      value: localizedText(item.value, locale),
      label: localizedText(item.label, locale),
    }))
    .filter(
      (item): item is Accommodation["facts"][number] =>
        Boolean(item.value) && Boolean(item.label),
    );

  const rooms = records(raw.rooms)
    .map((item) => ({
      title: localizedText(item.title, locale),
      description: localizedText(item.description, locale),
    }))
    .filter(
      (item): item is Accommodation["rooms"][number] =>
        Boolean(item.title) && Boolean(item.description),
    );

  const amenities = records(raw.amenities)
    .map((item) => ({
      title: localizedText(item.title, locale),
      items: localizedList(item.items, locale),
    }))
    .filter(
      (item): item is Accommodation["amenities"][number] =>
        Boolean(item.title) && Boolean(item.items),
    );

  return {
    introTitle: localizedText(raw.introTitle, locale) ?? fallback.introTitle,
    introText: localizedList(raw.introText, locale) ?? fallback.introText,
    capacity: positiveNumber(raw.capacity) ?? fallback.capacity,
    bedrooms: positiveNumber(raw.bedrooms) ?? fallback.bedrooms,
    gardenArea: positiveNumber(raw.gardenArea) ?? fallback.gardenArea,
    facts: facts.length > 0 ? facts : fallback.facts,
    rooms: rooms.length > 0 ? rooms : fallback.rooms,
    amenities: amenities.length > 0 ? amenities : fallback.amenities,
  };
}

/** `SiteCopy` is only strings, string lists and nested objects. */
export function normalizeCopy(
  raw: unknown,
  locale: Locale,
  fallback: SiteCopy,
): SiteCopy {
  return mergeLocalized(fallback, raw, locale);
}

export function normalizeGallery(
  raw: unknown,
  locale: Locale,
): MediaImage[] | undefined {
  const images = records(raw)
    .map((item) => normalizeImage(item, locale, undefined))
    .filter((item): item is MediaImage => Boolean(item?.src && item.alt));

  return images.length > 0 ? images : undefined;
}

export function normalizeRates(
  raw: unknown,
  locale: Locale,
): Rate[] | undefined {
  const rates = records(raw)
    .map((item): Rate | undefined => {
      const id = plainText(item.id);
      const title = localizedText(item.title, locale);
      const price = plainText(item.price);
      if (!id || !title || !price) return undefined;

      return {
        id,
        title,
        price,
        unit: localizedText(item.unit, locale) ?? "",
        note: localizedText(item.note, locale),
        featured: typeof item.featured === "boolean" ? item.featured : false,
      };
    })
    .filter((item): item is Rate => item !== undefined);

  return rates.length > 0 ? rates : undefined;
}

/**
 * Texty výletů ze Studia, klíčované podle `tripId`.
 *
 * Geometrie zůstává v kódu, takže dokument s neznámým id nemá kam patřit -
 * mapa ho tiše přeskočí a normalizace na to upozorní v serverovém logu.
 *
 * `note` je jediné pole, které Studio přebíjí i prázdnou hodnotou: po
 * znovuotevření stezky musí jít upozornění na uzavírku smazat.
 */
export function normalizeTripTexts(
  raw: unknown,
  locale: Locale,
): TripTextOverrides {
  const entries = records(raw)
    .map((item): [string, TripTextOverride] | undefined => {
      const tripId = plainText(item.tripId);
      if (!tripId) return undefined;

      if (!knownTripIds.has(tripId)) {
        console.warn(
          `Výlet "${tripId}" ze Studia nemá v mapě žádný bod, texty se nepoužijí.`,
        );
        return undefined;
      }

      const override: TripTextOverride = {
        title: localizedText(item.title, locale),
        startName: localizedText(item.startName, locale),
        summary: localizedText(item.summary, locale),
        note: localizedText(item.note, locale) ?? null,
      };

      return [tripId, override];
    })
    .filter((entry): entry is [string, TripTextOverride] => entry !== undefined);

  return Object.fromEntries(entries);
}
