import type { GalleryCategory } from "@/types/content";

/**
 * Everything about the house that does not change with the language: links,
 * phone numbers, prices and the photo files with their intrinsic dimensions.
 * The translated labels live in `@/lib/content/text/*`.
 */

export const calendarUrl =
  "https://obsazenost.e-chalupy.cz/kalendar.php?id=17320&pocetMesicu=12&velikost=3&legenda=ano&naStred=ano&ctvrtleti=ne&stin=ne&jazyk=cz&jednotky=ano&pozadi=f6f1e7&kalendarText=1f332c&kalendarPozadi=f6f1e7&ramecek=d8d0c1&mesicText=ffffff&mesicPozadi=315e50&dnyText=315e50&dnyPozadia=ffffff&obsazenoText=ffffff&obsazenoPozadi=c45d4a&volnoText=173d31&volnoPozadi=a9c5ac&neaktivniDnyText=999999&neaktivniDnyPozadi=eee9df&legendaText=1f332c&fontFamily=Arial";

export const listingUrl =
  "https://www.e-chalupy.cz/domecek-janov-ubytovani-o17320";

export const sharedSettings = {
  phone: "+420777181920",
  phoneDisplay: "777 181 920",
  email: "majitel@akcenaseveru.cz",
  matterportUrl: "https://my.matterport.com/show/?m=QgBtFa22zu6",
  calendarUrl,
  listingUrl,
  mapUrl: "https://mapy.com/cs/?q=50.85606N%2C%2014.26754E&z=16",
} as const;

export const sharedAccommodation = {
  capacity: 17,
  bedrooms: 6,
  gardenArea: 4000,
} as const;

export type GalleryImageId =
  | "aerial-house-garden"
  | "exterior-golden-hour"
  | "aerial-terrace"
  | "aerial-top-down"
  | "exterior-summer-meadow"
  | "exterior-back-lawn"
  | "hero-aerial"
  | "exterior-garden"
  | "exterior-wide"
  | "hot-tub-terrace"
  | "terrace-awning"
  | "garden-playground"
  | "terrace-dining-long"
  | "hot-tub-bubbles"
  | "hot-tub-sun"
  | "terrace-awning-table"
  | "terrace-grill-orchard"
  | "terrace-lounge"
  | "terrace-garden-table"
  | "terrace-hot-tub"
  | "terrace-table"
  | "hot-tub"
  | "kitchen-dining"
  | "living-room"
  | "kitchen"
  | "kitchen-island"
  | "kitchen-detail"
  | "bedroom-double"
  | "bedroom-double-window"
  | "bedroom-bunk-red"
  | "bedroom-bunk"
  | "bedroom-twin"
  | "bathroom"
  | "bedroom-single"
  | "stairs";

export type GalleryImageDefinition = {
  id: GalleryImageId;
  file: string;
  width: number;
  height: number;
  category: GalleryCategory;
  featured?: boolean;
};

/**
 * Order matters: the first entry doubles as the hero photo (see `fallback.ts`)
 * and the first eight feed the JSON-LD `image` list. The opening block is
 * deliberately mixed across categories so the default "vše" view shows the
 * house, the garden and the interior before the visitor has to click anything.
 */
export const galleryImageDefinitions: GalleryImageDefinition[] = [
  {
    id: "aerial-house-garden",
    file: "aerial-house-garden.jpg",
    width: 1600,
    height: 1200,
    category: "exterier",
    featured: true,
  },
  {
    id: "exterior-golden-hour",
    file: "exterior-golden-hour.jpg",
    width: 1600,
    height: 1200,
    category: "exterier",
    featured: true,
  },
  {
    id: "aerial-terrace",
    file: "aerial-terrace.jpg",
    width: 1600,
    height: 1200,
    category: "exterier",
  },
  {
    id: "hot-tub-terrace",
    file: "hot-tub-terrace.jpg",
    width: 1600,
    height: 1200,
    category: "zahrada",
    featured: true,
  },
  {
    id: "terrace-awning",
    file: "terrace-awning.jpg",
    width: 1600,
    height: 1356,
    category: "zahrada",
  },
  {
    id: "garden-playground",
    file: "garden-playground.jpg",
    width: 1600,
    height: 1200,
    category: "zahrada",
  },
  {
    id: "kitchen-dining",
    file: "kitchen-dining.jpg",
    width: 1600,
    height: 1200,
    category: "spolecne",
    featured: true,
  },
  {
    id: "living-room",
    file: "living-room.jpg",
    width: 1280,
    height: 965,
    category: "spolecne",
  },
  {
    id: "kitchen",
    file: "kitchen.jpg",
    width: 1600,
    height: 1200,
    category: "spolecne",
  },
  {
    id: "kitchen-island",
    file: "kitchen-island.jpg",
    width: 1600,
    height: 1066,
    category: "spolecne",
  },
  {
    id: "aerial-top-down",
    file: "aerial-top-down.jpg",
    width: 1600,
    height: 1200,
    category: "exterier",
  },
  {
    id: "exterior-summer-meadow",
    file: "exterior-summer-meadow.jpg",
    width: 1600,
    height: 1200,
    category: "exterier",
  },
  {
    id: "exterior-back-lawn",
    file: "exterior-back-lawn.jpg",
    width: 1600,
    height: 1200,
    category: "exterier",
  },
  {
    id: "hero-aerial",
    file: "hero-aerial-summer.jpg",
    width: 1024,
    height: 765,
    category: "exterier",
  },
  {
    id: "exterior-garden",
    file: "exterior-garden.jpg",
    width: 1280,
    height: 960,
    category: "exterier",
  },
  {
    id: "exterior-wide",
    file: "exterior-wide.jpg",
    width: 1280,
    height: 960,
    category: "exterier",
  },
  {
    id: "terrace-dining-long",
    file: "terrace-dining-long.jpg",
    width: 1600,
    height: 1200,
    category: "zahrada",
  },
  {
    id: "hot-tub-bubbles",
    file: "hot-tub-bubbles.jpg",
    width: 1600,
    height: 1200,
    category: "zahrada",
  },
  {
    id: "terrace-awning-table",
    file: "terrace-awning-table.jpg",
    width: 1600,
    height: 1201,
    category: "zahrada",
  },
  // Portrait shot: keep it off the wide slots of the grid, they crop it to sky.
  {
    id: "hot-tub-sun",
    file: "hot-tub-sun.jpg",
    width: 1201,
    height: 1600,
    category: "zahrada",
  },
  {
    id: "terrace-grill-orchard",
    file: "terrace-grill-orchard.jpg",
    width: 1600,
    height: 1200,
    category: "zahrada",
  },
  {
    id: "terrace-lounge",
    file: "terrace-lounge.jpg",
    width: 1600,
    height: 1200,
    category: "zahrada",
  },
  {
    id: "terrace-garden-table",
    file: "terrace-garden-table.jpg",
    width: 1600,
    height: 1200,
    category: "zahrada",
  },
  {
    id: "terrace-hot-tub",
    file: "terrace-hot-tub.jpg",
    width: 1600,
    height: 1066,
    category: "zahrada",
  },
  {
    id: "terrace-table",
    file: "terrace-table.jpg",
    width: 1600,
    height: 1200,
    category: "zahrada",
  },
  {
    id: "hot-tub",
    file: "hot-tub.jpg",
    width: 1280,
    height: 960,
    category: "zahrada",
  },
  {
    id: "kitchen-detail",
    file: "kitchen-detail.jpg",
    width: 1600,
    height: 1066,
    category: "spolecne",
  },
  {
    id: "bedroom-double",
    file: "bedroom-double.jpg",
    width: 1600,
    height: 1200,
    category: "pokoje",
    featured: true,
  },
  {
    id: "bedroom-double-window",
    file: "bedroom-double-window.jpg",
    width: 1600,
    height: 1067,
    category: "pokoje",
  },
  {
    id: "bedroom-bunk-red",
    file: "bedroom-bunk-red.jpg",
    width: 1600,
    height: 1600,
    category: "pokoje",
  },
  {
    id: "bedroom-bunk",
    file: "bedroom-bunk.jpg",
    width: 1600,
    height: 1200,
    category: "pokoje",
  },
  {
    id: "bedroom-twin",
    file: "bedroom-twin.jpg",
    width: 1600,
    height: 1200,
    category: "pokoje",
  },
  {
    id: "bathroom",
    file: "bathroom.jpg",
    width: 1280,
    height: 756,
    category: "pokoje",
  },
  {
    id: "bedroom-single",
    file: "bedroom-single.jpg",
    width: 1600,
    height: 1200,
    category: "pokoje",
  },
  {
    id: "stairs",
    file: "stairs.jpg",
    width: 1200,
    height: 1600,
    category: "pokoje",
  },
];

export type RateId = "summer" | "week" | "weekend";

export const rateDefinitions: Array<{
  id: RateId;
  price: string;
  featured?: boolean;
}> = [
  { id: "summer", price: "55 000 Kč", featured: true },
  { id: "week", price: "49 000 Kč" },
  { id: "weekend", price: "25 000 Kč" },
];

