import type { Locale } from "@/i18n/config";
import { fallbackContent } from "@/lib/content/fallback";
import {
  normalizeAccommodation,
  normalizeCopy,
  normalizeGallery,
  normalizeRates,
  normalizeSettings,
  normalizeTripTexts,
} from "@/lib/content/from-documents";
import { contentSource } from "@/lib/content/source";
import { readStore } from "@/lib/store/content-store";
import type { SiteContent } from "@/types/content";

export { fallbackContent } from "@/lib/content/fallback";

/** Syrová data z úložiště, ještě bez vybraného jazyka. */
type RawContent = {
  readonly siteSettings: unknown;
  readonly siteCopy: unknown;
  readonly accommodation: unknown;
  readonly gallery: unknown;
  readonly rates: unknown;
  readonly trips: unknown;
};

/** Poskládá stránce obsah a chybějící kousky doplní vestavěným zněním. */
function compose(
  raw: RawContent,
  locale: Locale,
  fallback: SiteContent,
): SiteContent {
  return {
    settings: normalizeSettings(raw.siteSettings, locale, fallback.settings),
    copy: normalizeCopy(raw.siteCopy, locale, fallback.copy),
    accommodation: normalizeAccommodation(
      raw.accommodation,
      locale,
      fallback.accommodation,
    ),
    gallery: normalizeGallery(raw.gallery, locale) ?? fallback.gallery,
    rates: normalizeRates(raw.rates, locale) ?? fallback.rates,
    tripTexts: normalizeTripTexts(raw.trips, locale),
  };
}

/**
 * Obsah pro jednu jazykovou verzi.
 *
 * Zdroj rozhoduje `CONTENT_SOURCE`: `store` je soubor na připojeném svazku,
 * který spravuje editační panel, `fallback` je znění v repu. Statický export a
 * CI čtou vždycky z repa.
 */
export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  const fallback = fallbackContent[locale];

  return contentSource(process.env) === "store"
    ? compose(await readStore(), locale, fallback)
    : fallback;
}
