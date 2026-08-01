import type { GalleryImageId, RateId } from "@/lib/content/shared";
import type { SiteCopy } from "@/types/content";

/**
 * All translatable text for one language. Numbers, links and photo dimensions
 * stay in `@/lib/content/shared` so a price can never drift between languages.
 */
export type LocaleContentText = {
  settings: {
    title: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    address: string;
    heroEyebrow: string;
    heroTitle: string;
    heroDescription: string;
  };
  accommodation: {
    introTitle: string;
    introText: string[];
    facts: Array<{ value: string; label: string }>;
    rooms: Array<{ title: string; description: string }>;
    amenities: Array<{ title: string; items: string[] }>;
  };
  gallery: Record<GalleryImageId, { alt: string; caption: string }>;
  rates: Record<RateId, { title: string; unit: string; note: string }>;
  copy: SiteCopy;
};
