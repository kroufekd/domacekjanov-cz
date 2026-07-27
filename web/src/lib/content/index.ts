import type { Locale } from "@/i18n/config";
import { fallbackContent } from "@/lib/content/fallback";
import {
  normalizeAccommodation,
  normalizeCopy,
  normalizeGallery,
  normalizeRates,
  normalizeSettings,
  normalizeTripTips,
} from "@/lib/content/from-sanity";
import { sanityClient } from "@/sanity/client";
import { hasSanityConfig } from "@/sanity/env";
import {
  accommodationQuery,
  galleryQuery,
  ratesQuery,
  siteCopyQuery,
  siteSettingsQuery,
  tripTipsQuery,
} from "@/sanity/queries";
import type { SiteContent } from "@/types/content";

export { fallbackContent } from "@/lib/content/fallback";

const revalidate = { next: { revalidate: 60 } } as const;

const fetchDocument = (query: string) =>
  sanityClient.fetch<unknown>(query, {}, revalidate);

export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  const fallback = fallbackContent[locale];

  if (process.env.STATIC_EXPORT === "true" || !hasSanityConfig) {
    return fallback;
  }

  try {
    const [settings, copy, accommodation, gallery, rates, tripTips] =
      await Promise.all([
        fetchDocument(siteSettingsQuery),
        fetchDocument(siteCopyQuery),
        fetchDocument(accommodationQuery),
        fetchDocument(galleryQuery),
        fetchDocument(ratesQuery),
        fetchDocument(tripTipsQuery),
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
      tripTips: normalizeTripTips(tripTips, locale) ?? fallback.tripTips,
    };
  } catch {
    return fallback;
  }
}
