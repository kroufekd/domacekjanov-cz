import type { Locale } from "@/i18n/config";
import { fallbackContent } from "@/lib/content/fallback";
import {
  normalizeAccommodation,
  normalizeCopy,
  normalizeGallery,
  normalizeRates,
  normalizeSettings,
  normalizeTripTexts,
} from "@/lib/content/from-sanity";
import { usesFallbackOnly } from "@/lib/content/source";
import { sanityClient } from "@/sanity/client";
import { hasSanityConfig } from "@/sanity/env";
import {
  accommodationQuery,
  galleryQuery,
  ratesQuery,
  siteCopyQuery,
  siteSettingsQuery,
  tripTextsQuery,
} from "@/sanity/queries";
import type { SiteContent } from "@/types/content";

export { fallbackContent } from "@/lib/content/fallback";

const revalidate = { next: { revalidate: 60 } } as const;

/**
 * Editační panel potřebuje vidět, co v CMS opravdu leží. Minutu stará kopie by
 * mu ukázala překonané znění a klient by cizí úpravu přepsal, aniž by o ní
 * věděl - proto si umí říct o čerstvý dotaz mimo cache.
 */
const noStore = { cache: "no-store" } as const;

export type ContentOptions = {
  readonly fresh?: boolean;
};

const fetchDocument = (query: string, options: ContentOptions) =>
  sanityClient.fetch<unknown>(
    query,
    {},
    options.fresh ? noStore : revalidate,
  );

export async function getSiteContent(
  locale: Locale,
  options: ContentOptions = {},
): Promise<SiteContent> {
  const fallback = fallbackContent[locale];

  if (usesFallbackOnly(process.env, hasSanityConfig)) {
    return fallback;
  }

  try {
    const [settings, copy, accommodation, gallery, rates, tripTexts] =
      await Promise.all([
        fetchDocument(siteSettingsQuery, options),
        fetchDocument(siteCopyQuery, options),
        fetchDocument(accommodationQuery, options),
        fetchDocument(galleryQuery, options),
        fetchDocument(ratesQuery, options),
        fetchDocument(tripTextsQuery, options),
      ]);

    return {
      settings: normalizeSettings(settings, locale, fallback.settings),
      copy: normalizeCopy(copy, locale, fallback.copy),
      accommodation: normalizeAccommodation(
        accommodation,
        locale,
        fallback.accommodation,
      ),
      gallery: normalizeGallery(gallery, locale) ?? fallback.gallery,
      rates: normalizeRates(rates, locale) ?? fallback.rates,
      tripTexts: normalizeTripTexts(tripTexts, locale),
    };
  } catch {
    return fallback;
  }
}
