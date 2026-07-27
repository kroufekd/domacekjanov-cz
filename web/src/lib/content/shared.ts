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
  | "hero-aerial"
  | "exterior-garden"
  | "exterior-wide"
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

export const galleryImageDefinitions: GalleryImageDefinition[] = [
  {
    id: "hero-aerial",
    file: "hero-aerial.jpg",
    width: 1159,
    height: 913,
    category: "exterier",
    featured: true,
  },
  {
    id: "exterior-garden",
    file: "exterior-garden.jpg",
    width: 1280,
    height: 960,
    category: "exterier",
    featured: true,
  },
  {
    id: "exterior-wide",
    file: "exterior-wide.jpg",
    width: 1280,
    height: 960,
    category: "exterier",
  },
  {
    id: "terrace-hot-tub",
    file: "terrace-hot-tub.jpg",
    width: 1600,
    height: 1066,
    category: "zahrada",
    featured: true,
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

export type TripTipId = "janov" | "hrensko" | "pravcicka" | "jetrichovice";

export const tripTipDefinitions: Array<{ id: TripTipId; href: string }> = [
  {
    id: "janov",
    href: "https://mapy.com/cs/?q=Janovsk%C3%A1%20rozhledna",
  },
  { id: "hrensko", href: "https://www.hrensko.cz/inpage/soutesky/" },
  { id: "pravcicka", href: "https://www.pbrana.cz/" },
  {
    id: "jetrichovice",
    href: "https://mapy.com/cs/?q=Jet%C5%99ichovick%C3%A9%20vyhl%C3%ADdky",
  },
];
