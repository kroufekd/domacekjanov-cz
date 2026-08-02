import type { TripTextOverrides } from "@/types/trips";

export type GalleryCategory = "exterier" | "spolecne" | "pokoje";

export type MediaImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  category?: GalleryCategory;
  caption?: string;
  featured?: boolean;
};

export type SiteSettings = {
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: MediaImage;
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: MediaImage;
  matterportUrl: string;
  calendarUrl: string;
  listingUrl: string;
  mapUrl: string;
  facebookUrl?: string;
  instagramUrl?: string;
};

export type Accommodation = {
  introTitle: string;
  introText: string[];
  capacity: number;
  bedrooms: number;
  gardenArea: number;
  facts: Array<{ value: string; label: string }>;
  rooms: Array<{ title: string; description: string }>;
  amenities: Array<{ title: string; items: string[] }>;
};

export type Rate = {
  id: string;
  title: string;
  price: string;
  unit: string;
  note?: string;
  featured?: boolean;
};

/**
 * Section headings support one hard break: everything after the first `|` is
 * rendered on its own line in italics. `SectionHeading` does the splitting, so
 * editors only ever type plain text.
 */
export type SectionCopy = {
  eyebrow: string;
  title: string;
  description?: string;
};

/**
 * Every visible interface string that is worth editing per language. Sanity
 * holds the localized values; `fallbackCopy` covers the case where the Studio
 * has nothing published yet.
 */
export type SiteCopy = {
  nav: {
    about: string;
    amenities: string;
    gallery: string;
    tour: string;
    pricing: string;
    contact: string;
  };
  actions: {
    call: string;
    callOwner: string;
    datesAndPrices: string;
    lookInside: string;
    showOnMap: string;
    startTour: string;
    openSeparately: string;
    tourIssue: string;
    checkAvailability: string;
    exploreHouse: string;
    showAll: string;
    showLess: string;
  };
  hero: {
    metaPlace: string;
    metaCoords: string;
    badgePrefix: string;
    badgeSuffix: string;
  };
  /** The story heading reuses `accommodation.introTitle`, so it has no title. */
  story: {
    eyebrow: string;
    noteAccent: string;
    noteRest: string;
  };
  garden: SectionCopy & {
    stampTitle: string;
    stampNote: string;
    cardTitle: string;
    cardText: string;
    cardPrice: string;
  };
  rooms: SectionCopy & {
    comfort: string[];
  };
  gallery: SectionCopy & {
    filterLabel: string;
    categories: Record<"vse" | GalleryCategory, string>;
    swipeHint: string;
  };
  tour: SectionCopy & {
    teaser: string;
  };
  trips: SectionCopy;
  pricing: SectionCopy & {
    notes: string[];
    calendarNote: string;
  };
  contact: SectionCopy & {
    phoneLabel: string;
    emailLabel: string;
    addressLabel: string;
  };
  footer: {
    tagline: string;
    pricingLink: string;
    mapLink: string;
    instagramLink: string;
    facebookLink: string;
  };
  /** Booking.com guest award. `{year}` and `{score}` are filled per certificate. */
  award: {
    /** Sits above the score on the hero plate. */
    source: string;
    /** Reads under the score, e.g. "ocenění 2025". */
    plateLabel: string;
    /** Headline of the footer card, e.g. "Traveller Review Awards 2025". */
    cardTitle: string;
    cardSource: string;
    scoreSuffix: string;
    viewerTop: string;
    viewerCaption: string;
    viewerHint: string;
  };
};

export type SiteContent = {
  settings: SiteSettings;
  accommodation: Accommodation;
  copy: SiteCopy;
  gallery: MediaImage[];
  rates: Rate[];
  /** Texty výletů ze Studia; geometrii mapy drží `@/data/trips`. */
  tripTexts: TripTextOverrides;
};
