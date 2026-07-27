import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import {
  galleryImageDefinitions,
  rateDefinitions,
  sharedAccommodation,
  sharedSettings,
  tripTipDefinitions,
} from "@/lib/content/shared";
import { csText } from "@/lib/content/text/cs";
import { deText } from "@/lib/content/text/de";
import { enText } from "@/lib/content/text/en";
import type { LocaleContentText } from "@/lib/content/text/types";
import { localAsset } from "@/lib/paths";
import type {
  MediaImage,
  Rate,
  SiteContent,
  TripTip,
} from "@/types/content";

export const localeTexts: Record<Locale, LocaleContentText> = {
  cs: csText,
  de: deText,
  en: enText,
};

function buildGallery(text: LocaleContentText): MediaImage[] {
  return galleryImageDefinitions.map((definition) => {
    const labels = text.gallery[definition.id];
    return {
      id: definition.id,
      src: localAsset(`/images/${definition.file}`),
      alt: labels.alt,
      width: definition.width,
      height: definition.height,
      category: definition.category,
      caption: labels.caption,
      featured: definition.featured,
    };
  });
}

function buildRates(text: LocaleContentText): Rate[] {
  return rateDefinitions.map((definition) => ({
    id: definition.id,
    price: definition.price,
    featured: definition.featured,
    ...text.rates[definition.id],
  }));
}

function buildTripTips(text: LocaleContentText): TripTip[] {
  return tripTipDefinitions.map((definition) => ({
    id: definition.id,
    href: definition.href,
    ...text.tripTips[definition.id],
  }));
}

function buildContent(locale: Locale): SiteContent {
  const text = localeTexts[locale];
  const gallery = buildGallery(text);
  const [heroImage] = gallery;

  return {
    settings: {
      ...sharedSettings,
      ...text.settings,
      heroImage,
    },
    accommodation: {
      ...sharedAccommodation,
      ...text.accommodation,
    },
    copy: text.copy,
    gallery,
    rates: buildRates(text),
    tripTips: buildTripTips(text),
  };
}

/**
 * Local content used whenever Sanity has nothing to say - during the static
 * export, without project credentials, or when a fetch fails. Built once per
 * locale at module load so every request reuses the same frozen objects.
 */
export const fallbackContent: Record<Locale, SiteContent> = Object.fromEntries(
  locales.map((locale) => [locale, buildContent(locale)]),
) as Record<Locale, SiteContent>;
