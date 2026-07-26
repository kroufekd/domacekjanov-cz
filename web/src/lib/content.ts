import type {
  Accommodation,
  MediaImage,
  Rate,
  SiteContent,
  SiteSettings,
  TripTip,
} from "@/types/content";
import { hasSanityConfig } from "@/sanity/env";
import { sanityClient } from "@/sanity/client";
import {
  accommodationQuery,
  galleryQuery,
  ratesQuery,
  siteSettingsQuery,
  tripTipsQuery,
} from "@/sanity/queries";
import { localAsset } from "@/lib/paths";

const calendarUrl =
  "https://obsazenost.e-chalupy.cz/kalendar.php?id=17320&pocetMesicu=12&velikost=3&legenda=ano&naStred=ano&ctvrtleti=ne&stin=ne&jazyk=cz&jednotky=ano&pozadi=f6f1e7&kalendarText=1f332c&kalendarPozadi=f6f1e7&ramecek=d8d0c1&mesicText=ffffff&mesicPozadi=315e50&dnyText=315e50&dnyPozadia=ffffff&obsazenoText=ffffff&obsazenoPozadi=c45d4a&volnoText=173d31&volnoPozadi=a9c5ac&neaktivniDnyText=999999&neaktivniDnyPozadi=eee9df&legendaText=1f332c&fontFamily=Arial";

const listingUrl = "https://www.e-chalupy.cz/domecek-janov-ubytovani-o17320";

const image = (
  id: string,
  src: string,
  alt: string,
  width: number,
  height: number,
  category?: MediaImage["category"],
  caption?: string,
  featured?: boolean,
): MediaImage => ({
  id,
  src: src.startsWith("/") ? localAsset(src) : src,
  alt,
  width,
  height,
  category,
  caption,
  featured,
});

const fallbackSettings: SiteSettings = {
  title: "Domeček Janov",
  description:
    "Celý dům pro až 17 hostů, velká oplocená zahrada a České Švýcarsko hned za dveřmi.",
  phone: "+420777181920",
  phoneDisplay: "777 181 920",
  email: "majitel@akcenaseveru.cz",
  address: "Janov 167, 405 02 Janov",
  heroEyebrow: "Českosaské Švýcarsko · Janov u Hřenska",
  heroTitle: "Celý dům jen pro vaši partu.",
  heroDescription:
    "Šest ložnic pro až 17 hostů, 4 000 m² oplocené zahrady a vířivý sud. Soutěsky ve Hřensku jsou dva kilometry od domu.",
  heroImage: image(
    "hero-aerial",
    "/images/hero-aerial.jpg",
    "Letecký pohled na Domeček Janov a podzimní krajinu",
    1159,
    913,
    "exterier",
    "Domeček Janov v srdci Českého Švýcarska",
    true,
  ),
  matterportUrl: "https://my.matterport.com/show/?m=QgBtFa22zu6",
  calendarUrl,
  listingUrl,
  mapUrl: "https://mapy.com/cs/?q=50.85606N%2C%2014.26754E&z=16",
};

const fallbackAccommodation: Accommodation = {
  introTitle: "Jeden velký dům pro tři až čtyři rodiny.",
  introText: [
    "Domeček stojí v klidné části Janova, pár minut nad Hřenskem. Pronajímá se vždy celý - šest ložnic, velká kuchyň s jídelnou i zahrada jsou jen pro vaši skupinu.",
    "Nejčastěji sem jezdí rodiny s dětmi, party přátel, sportovní týmy nebo menší firmy na teambuilding. Dům je v provozu po celý rok.",
  ],
  capacity: 17,
  bedrooms: 6,
  gardenArea: 4000,
  facts: [
    { value: "17", label: "hostů" },
    { value: "6", label: "ložnic" },
    { value: "4 000 m²", label: "oplocené zahrady" },
    { value: "celý rok", label: "v provozu" },
  ],
  rooms: [
    {
      title: "Pokoj s palandami",
      description: "Dvě patrové postele pro čtyři. Horní lůžka unesou do 80 kg.",
    },
    {
      title: "Třílůžkový pokoj",
      description: "Tři samostatná jednolůžka.",
    },
    {
      title: "Tři dvoulůžkové pokoje",
      description: "Manželská postel v každém z nich, všechny v patře.",
    },
    {
      title: "Přízemní dvoulůžkový pokoj",
      description:
        "Manželská postel v přízemí a bezbariérový přístup dveřmi širokými 80 cm.",
    },
    {
      title: "Obývací pokoj",
      description: "Dvě rozkládací pohovky doplňují kapacitu na 17 míst.",
    },
  ],
  amenities: [
    {
      title: "Uvnitř",
      items: [
        "velká vybavená kuchyň",
        "dvě lednice s mrazákem",
        "myčka, mikrovlnka, kávovar na kapsle i překapávač",
        "krbová kamna, v přízemí podlahové topení",
        "Wi‑Fi a televize se sportovními programy",
      ],
    },
    {
      title: "Venku",
      items: [
        "vyhřívaný vířivý sud",
        "jižní terasa s plynovým grilem",
        "trampolína, houpačka a dětský domeček",
        "oplocená travnatá zahrada",
        "parkování přímo u domu",
      ],
    },
    {
      title: "Prakticky",
      items: [
        "povlečení a malé ručníky v ceně",
        "dvě koupelny v přízemí",
        "další WC s umyvadlem v patře",
        "bezbariérový pokoj v přízemí",
        "nekuřácký objekt bez domácích mazlíčků",
      ],
    },
  ],
};

const fallbackGallery: MediaImage[] = [
  fallbackSettings.heroImage,
  image(
    "exterior-garden",
    "/images/exterior-garden.jpg",
    "Domeček Janov ze zahrady",
    1280,
    960,
    "exterier",
    "Celý dům a zahrada jen pro vás",
    true,
  ),
  image(
    "exterior-wide",
    "/images/exterior-wide.jpg",
    "Domeček a rozlehlá travnatá zahrada",
    1280,
    960,
    "exterier",
    "4 000 m² oplocené zahrady",
  ),
  image(
    "terrace-hot-tub",
    "/images/terrace-hot-tub.jpg",
    "Jižní terasa s vířivým sudem a posezením",
    1600,
    1066,
    "zahrada",
    "Terasa, gril a vyhřívaný sud",
    true,
  ),
  image(
    "terrace-table",
    "/images/terrace-table.jpg",
    "Velký jídelní stůl na terase",
    1600,
    1200,
    "zahrada",
    "Jídelní stůl na terase",
  ),
  image(
    "hot-tub",
    "/images/hot-tub.jpg",
    "Hosté ve vyhřívaném vířivém sudu",
    1280,
    960,
    "zahrada",
    "Vyhřívaný koupací sud",
  ),
  image(
    "kitchen-dining",
    "/images/kitchen-dining.jpg",
    "Prostorná kuchyň s jídelnou a kamny",
    1600,
    1200,
    "spolecne",
    "Kuchyň s jídelnou a kamny",
    true,
  ),
  image(
    "living-room",
    "/images/living-room.jpg",
    "Obývací pokoj s velkou rohovou pohovkou",
    1280,
    965,
    "spolecne",
    "Obývací pokoj s rozkládacími pohovkami",
  ),
  image(
    "kitchen",
    "/images/kitchen.jpg",
    "Plně vybavená šedá kuchyň",
    1600,
    1200,
    "spolecne",
    "Plně vybavená kuchyň",
  ),
  image(
    "kitchen-island",
    "/images/kitchen-island.jpg",
    "Kuchyň s velkým pracovním ostrůvkem",
    1600,
    1066,
    "spolecne",
    "Kuchyňský ostrůvek",
  ),
  image(
    "kitchen-detail",
    "/images/kitchen-detail.jpg",
    "Kuchyňské vybavení v Domečku Janov",
    1600,
    1066,
    "spolecne",
    "Vybavení kuchyně",
  ),
  image(
    "bedroom-double",
    "/images/bedroom-double.jpg",
    "Ložnice s manželskou postelí",
    1600,
    1200,
    "pokoje",
    "Čtyři pokoje s manželskou postelí",
    true,
  ),
  image(
    "bedroom-double-window",
    "/images/bedroom-double-window.jpg",
    "Světlá ložnice s manželskou postelí",
    1600,
    1067,
    "pokoje",
    "Ložnice v patře",
  ),
  image(
    "bedroom-bunk-red",
    "/images/bedroom-bunk-red.jpg",
    "Pokoj s palandou a červenými detaily",
    1600,
    1600,
    "pokoje",
    "Pokoj s palandami",
  ),
  image(
    "bedroom-bunk",
    "/images/bedroom-bunk.jpg",
    "Prostorný pokoj s palandou",
    1600,
    1200,
    "pokoje",
    "Palandy až pro čtyři",
  ),
  image(
    "bedroom-twin",
    "/images/bedroom-twin.jpg",
    "Podkrovní pokoj se dvěma lůžky",
    1600,
    1200,
    "pokoje",
    "Pokoj v podkroví",
  ),
  image(
    "bathroom",
    "/images/bathroom.jpg",
    "Světlá koupelna se sprchovým koutem",
    1280,
    756,
    "pokoje",
    "Dvě koupelny v přízemí",
  ),
  image(
    "bedroom-single",
    "/images/bedroom-single.jpg",
    "Pokoj s jednolůžkem",
    1600,
    1200,
    "pokoje",
    "Šest samostatných ložnic",
  ),
  image(
    "stairs",
    "/images/stairs.jpg",
    "Schodiště do patra Domečku Janov",
    1200,
    1600,
    "pokoje",
    "Dům má dvě podlaží",
  ),
];

const fallbackRates: Rate[] = [
  {
    id: "summer",
    title: "Léto",
    price: "55 000 Kč",
    unit: "celý dům / týden",
    note: "V létě pobyty od soboty do soboty.",
    featured: true,
  },
  {
    id: "week",
    title: "Mimo léto",
    price: "49 000 Kč",
    unit: "celý dům / týden",
    note: "Platí pro zimní sezonu i mimosezonu.",
  },
  {
    id: "weekend",
    title: "Víkend",
    price: "25 000 Kč",
    unit: "celý dům / víkend",
    note: "Mimo letní sezonu minimálně dvě noci.",
  },
];

const fallbackTripTips: TripTip[] = [
  {
    id: "janov",
    title: "Janovská rozhledna",
    distance: "pěšky z domu",
    description:
      "Rozhledna stojí přímo v obci. Krátká procházka s výhledem na Labské pískovce.",
    href: "https://mapy.com/cs/?q=Janovsk%C3%A1%20rozhledna",
  },
  {
    id: "hrensko",
    title: "Soutěsky Hřensko",
    distance: "2 km",
    description:
      "Plavba na pramicích kaňonem říčky Kamenice. V sezoně vyrazte brzy ráno, odpoledne bývá plno.",
    href: "https://www.hrensko.cz/inpage/soutesky/",
  },
  {
    id: "pravcicka",
    title: "Pravčická brána",
    distance: "krátký přejezd",
    description:
      "Největší pískovcová skalní brána v Evropě. Autem do Hřenska nebo na Mezní Louku, dál pěšky.",
    href: "https://www.pbrana.cz/",
  },
  {
    id: "jetrichovice",
    title: "Jetřichovické vyhlídky",
    distance: "na celý den",
    description:
      "Okruh přes Mariinu, Vilemíninu a Rudolfovu vyhlídku. Počítejte se třemi až čtyřmi hodinami chůze.",
    href: "https://mapy.com/cs/?q=Jet%C5%99ichovick%C3%A9%20vyhl%C3%ADdky",
  },
];

export const fallbackContent: SiteContent = {
  settings: fallbackSettings,
  accommodation: fallbackAccommodation,
  gallery: fallbackGallery,
  rates: fallbackRates,
  tripTips: fallbackTripTips,
};

const isPopulatedArray = <T>(value: T[] | null | undefined): value is T[] =>
  Array.isArray(value) && value.length > 0;

export async function getSiteContent(): Promise<SiteContent> {
  if (process.env.STATIC_EXPORT === "true" || !hasSanityConfig) {
    return fallbackContent;
  }

  try {
    const [settings, accommodation, gallery, rates, tripTips] =
      await Promise.all([
        sanityClient.fetch<SiteSettings | null>(
          siteSettingsQuery,
          {},
          { next: { revalidate: 60 } },
        ),
        sanityClient.fetch<Accommodation | null>(
          accommodationQuery,
          {},
          { next: { revalidate: 60 } },
        ),
        sanityClient.fetch<MediaImage[]>(
          galleryQuery,
          {},
          { next: { revalidate: 60 } },
        ),
        sanityClient.fetch<Rate[]>(
          ratesQuery,
          {},
          { next: { revalidate: 60 } },
        ),
        sanityClient.fetch<TripTip[]>(
          tripTipsQuery,
          {},
          { next: { revalidate: 60 } },
        ),
      ]);

    const safeSettings = settings
      ? {
          ...fallbackSettings,
          ...Object.fromEntries(
            Object.entries(settings).filter(([, value]) => value != null),
          ),
          heroImage: settings.heroImage?.src
            ? settings.heroImage
            : fallbackSettings.heroImage,
          seoImage: settings.seoImage?.src ? settings.seoImage : undefined,
        }
      : fallbackSettings;

    const safeAccommodation = accommodation
      ? {
          ...fallbackAccommodation,
          ...Object.fromEntries(
            Object.entries(accommodation).filter(([, value]) => value != null),
          ),
          introText: isPopulatedArray(accommodation.introText)
            ? accommodation.introText
            : fallbackAccommodation.introText,
          facts: isPopulatedArray(accommodation.facts)
            ? accommodation.facts.filter((item) => item?.value && item?.label)
            : fallbackAccommodation.facts,
          rooms: isPopulatedArray(accommodation.rooms)
            ? accommodation.rooms.filter(
                (item) => item?.title && item?.description,
              )
            : fallbackAccommodation.rooms,
          amenities: isPopulatedArray(accommodation.amenities)
            ? accommodation.amenities.filter(
                (item) => item?.title && isPopulatedArray(item?.items),
              )
            : fallbackAccommodation.amenities,
        }
      : fallbackAccommodation;

    const safeGallery = gallery?.filter(
      (item) => item?.id && item?.src && item?.alt,
    );
    const safeRates = rates?.filter(
      (item) => item?.id && item?.title && item?.price,
    );
    const safeTripTips = tripTips?.filter(
      (item) => item?.id && item?.title && item?.description,
    );

    return {
      settings: safeSettings,
      accommodation: safeAccommodation,
      gallery: isPopulatedArray(safeGallery) ? safeGallery : fallbackGallery,
      rates: isPopulatedArray(safeRates) ? safeRates : fallbackRates,
      tripTips: isPopulatedArray(safeTripTips)
        ? safeTripTips
        : fallbackTripTips,
    };
  } catch {
    return fallbackContent;
  }
}
