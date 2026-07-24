export type GalleryCategory =
  | "exterier"
  | "zahrada"
  | "spolecne"
  | "pokoje";

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

export type TripTip = {
  id: string;
  title: string;
  distance: string;
  description: string;
  href?: string;
};

export type SiteContent = {
  settings: SiteSettings;
  accommodation: Accommodation;
  gallery: MediaImage[];
  rates: Rate[];
  tripTips: TripTip[];
};
