import type { Locale } from "@/i18n/config";
import { localeHref, localeMeta } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

const absolute = (siteUrl: string, path: string) =>
  path.startsWith("http") ? path : `${siteUrl}${path}`;

export function buildStructuredData(
  content: SiteContent,
  locale: Locale,
  siteUrl: string,
) {
  const { settings, accommodation, gallery } = content;
  const base = siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": ["LodgingBusiness", "VacationRental"],
    name: settings.title,
    description: settings.description,
    inLanguage: localeMeta[locale].htmlLang,
    url: absolute(base, localeHref(locale)),
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Janov 167",
      postalCode: "405 02",
      addressLocality: "Janov",
      addressCountry: "CZ",
    },
    image: gallery.slice(0, 8).map((item) => absolute(base, item.src)),
    numberOfBedrooms: accommodation.bedrooms,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: accommodation.capacity,
    },
    amenityFeature: accommodation.amenities.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "LocationFeatureSpecification",
        name: item,
        value: true,
      })),
    ),
  };
}
