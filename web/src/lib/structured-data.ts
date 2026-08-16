import type { Locale } from "@/i18n/config";
import { localeHref, localeMeta, locales } from "@/i18n/config";
import {
  houseAddress,
  houseGeo,
  housePolicies,
} from "@/lib/content/shared";
import type { MediaImage, Rate, SiteContent } from "@/types/content";

/**
 * JSON-LD pro celou stránku.
 *
 * Vše je v jednom `@graph`, aby vyhledávač viděl jeden objekt ubytování
 * (`LodgingBusiness`), jeden web (`WebSite`) a jazykovou verzi stránky
 * (`WebPage`) provázané přes `@id` - místo tří nespojených ostrůvků.
 *
 * Zásadně se tu nic nevymýšlí: každé pole vychází z obsahu, který web zároveň
 * zobrazuje. Proto tu není `aggregateRating` - hodnocení 9,5 z Booking.com sice
 * na stránce visí, ale neznáme počet recenzí, který Google k hodnocení vyžaduje.
 */

const CURRENCY = "CZK";

/** Počet fotek, které se posílají do `image`; víc jich vyhledávač stejně nečte. */
const IMAGE_LIMIT = 8;

/**
 * Galerie začíná devíti exteriéry, aby seděla s inzeráty na portálech. Pro
 * vyhledávač je ale užitečnější přehlídka celého domu, takže se dopředu berou
 * fotky označené jako `featured` - exteriér, vířivka, kuchyň i ložnice.
 */
function coverImages(gallery: MediaImage[]): MediaImage[] {
  const featured = gallery.filter((item) => item.featured);
  const rest = gallery.filter((item) => !item.featured);
  return [...featured, ...rest].slice(0, IMAGE_LIMIT);
}

const absolute = (base: string, path: string) =>
  path.startsWith("http") ? path : `${base}${path}`;

/**
 * "55 000 Kč" → 55000. Ceny chodí i ze Studia, takže se počítá s libovolnou
 * mezerou mezi řády - `\s` v JS pokrývá i nezlomitelnou a úzkou mezeru.
 */
export function parsePrice(value: string): number | undefined {
  const digits = value.replace(/\s/g, "").match(/\d+/);
  if (!digits) return undefined;
  const amount = Number(digits[0]);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

function imageObject(base: string, image: MediaImage) {
  return {
    "@type": "ImageObject",
    url: absolute(base, image.src),
    width: image.width,
    height: image.height,
    caption: image.caption || image.alt,
  };
}

/** Ceny za celý dům; jednotka („celý dům / týden“) jde do `unitText`. */
function offers(rates: Rate[], listingUrl: string) {
  return rates.flatMap((rate) => {
    const amount = parsePrice(rate.price);
    if (amount === undefined) return [];

    return [
      {
        "@type": "Offer",
        name: rate.title,
        ...(rate.note ? { description: rate.note } : {}),
        price: amount,
        priceCurrency: CURRENCY,
        url: listingUrl,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: amount,
          priceCurrency: CURRENCY,
          unitText: rate.unit,
        },
      },
    ];
  });
}

function priceRange(rates: Rate[]): string | undefined {
  const amounts = rates
    .map((rate) => parsePrice(rate.price))
    .filter((amount): amount is number => amount !== undefined);
  if (amounts.length === 0) return undefined;

  const format = (amount: number) => amount.toLocaleString("cs-CZ");
  const lowest = Math.min(...amounts);
  const highest = Math.max(...amounts);
  return lowest === highest
    ? `${format(lowest)} Kč`
    : `${format(lowest)}-${format(highest)} Kč`;
}

export function buildStructuredData(
  content: SiteContent,
  locale: Locale,
  siteUrl: string,
) {
  const { settings, accommodation, gallery, rates } = content;
  const base = siteUrl.replace(/\/$/, "");
  const pageUrl = absolute(base, localeHref(locale));
  const inLanguage = localeMeta[locale].htmlLang;

  const lodgingId = `${base}/#ubytovani`;
  const websiteId = `${base}/#web`;
  const images = coverImages(gallery).map((item) => imageObject(base, item));
  const socialImage = settings.seoImage || settings.heroImage;
  const range = priceRange(rates);

  const profiles = [
    settings.instagramUrl,
    settings.facebookUrl,
    settings.listingUrl,
  ].filter((url): url is string => Boolean(url));

  const lodging = {
    "@type": ["LodgingBusiness", "VacationRental"],
    "@id": lodgingId,
    name: settings.title,
    description: settings.description,
    url: pageUrl,
    inLanguage,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      ...houseAddress,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: houseGeo.latitude,
      longitude: houseGeo.longitude,
    },
    hasMap: settings.mapUrl,
    sameAs: profiles,
    image: images,
    numberOfRooms: accommodation.bedrooms,
    numberOfBedrooms: accommodation.bedrooms,
    occupancy: {
      "@type": "QuantitativeValue",
      unitCode: "C62",
      maxValue: accommodation.capacity,
    },
    petsAllowed: housePolicies.petsAllowed,
    smokingAllowed: housePolicies.smokingAllowed,
    knowsLanguage: locales.map((item) => localeMeta[item].htmlLang),
    currenciesAccepted: CURRENCY,
    ...(range ? { priceRange: range } : {}),
    tourBookingPage: settings.listingUrl,
    // Dům se pronajímá vcelku, pokoje jsou jeho části. `Room` a ne
    // `Accommodation`, protože v seznamu je i obývák - ten se nepronajímá sám.
    containsPlace: accommodation.rooms.map((room) => ({
      "@type": "Room",
      name: room.title,
      description: room.description,
    })),
    amenityFeature: accommodation.amenities.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "LocationFeatureSpecification",
        name: item,
        value: true,
      })),
    ),
    makesOffer: offers(rates, settings.listingUrl),
  };

  const website = {
    "@type": "WebSite",
    "@id": websiteId,
    url: `${base}/`,
    name: settings.title,
    description: settings.description,
    inLanguage: locales.map((item) => localeMeta[item].htmlLang),
    publisher: { "@id": lodgingId },
  };

  const webPage = {
    "@type": "WebPage",
    "@id": `${pageUrl}#stranka`,
    url: pageUrl,
    name: settings.seoTitle || settings.title,
    description: settings.seoDescription || settings.description,
    inLanguage,
    isPartOf: { "@id": websiteId },
    about: { "@id": lodgingId },
    primaryImageOfPage: imageObject(base, socialImage),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [lodging, website, webPage],
  };
}
