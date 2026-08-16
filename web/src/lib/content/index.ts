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
import { contentSource } from "@/lib/content/source";
import { readStore } from "@/lib/store/content-store";
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

/** Syrová data z libovolného zdroje - tvar je u obou stejný. */
type RawContent = {
  readonly siteSettings: unknown;
  readonly siteCopy: unknown;
  readonly accommodation: unknown;
  readonly gallery: unknown;
  readonly rates: unknown;
  readonly trips: unknown;
};

/**
 * Poskládá stránce obsah a chybějící kousky doplní vestavěným zněním. Sanity i
 * soubor na disku vrací stejný tvar, takže tenhle krok je pro oba společný.
 */
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

export async function getSiteContent(
  locale: Locale,
  options: ContentOptions = {},
): Promise<SiteContent> {
  const fallback = fallbackContent[locale];

  const source = contentSource(process.env, hasSanityConfig);
  if (source === "fallback") {
    return fallback;
  }

  if (source === "store") {
    return compose(await readStore(), locale, fallback);
  }

  try {
    const [siteSettings, siteCopy, accommodation, gallery, rates, trips] =
      await Promise.all([
        fetchDocument(siteSettingsQuery, options),
        fetchDocument(siteCopyQuery, options),
        fetchDocument(accommodationQuery, options),
        fetchDocument(galleryQuery, options),
        fetchDocument(ratesQuery, options),
        fetchDocument(tripTextsQuery, options),
      ]);

    return compose(
      { siteSettings, siteCopy, accommodation, gallery, rates, trips },
      locale,
      fallback,
    );
  } catch {
    return fallback;
  }
}
