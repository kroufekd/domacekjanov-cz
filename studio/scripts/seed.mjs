import { createClient } from "@sanity/client";
import { createReadStream, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * One-time bootstrap of the Sanity dataset. All wording comes from the very
 * same JSON files the website falls back to, so the Studio starts out with a
 * complete Czech, German and English translation of every field.
 */

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  throw new Error("Chybí SANITY_API_WRITE_TOKEN s právem zápisu.");
}

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "lli7g5ge",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  apiVersion: "2026-07-24",
  token,
  useCdn: false,
});

const TEXT_DIRECTORY = resolve("../web/src/lib/content/text");
const IMAGE_DIRECTORY = resolve("../web/public/images");

const readText = (locale) =>
  JSON.parse(readFileSync(resolve(TEXT_DIRECTORY, `${locale}.json`), "utf8"));

const texts = { cs: readText("cs"), de: readText("de"), en: readText("en") };
const localeIds = Object.keys(texts);
const czech = texts.cs;

/** Builds one `{ cs, de, en }` value out of the same field in each language. */
const localized = (type, pick) =>
  Object.fromEntries([
    ["_type", type],
    ...localeIds.map((locale) => [locale, pick(texts[locale])]),
  ]);

const lstr = (pick) => localized("localeString", pick);
const ltext = (pick) => localized("localeText", pick);

const localizedArray = (type, pick) =>
  pick(czech).map((_, index) => ({
    _key: `item-${index}`,
    ...localized(type, (text) => pick(text)[index]),
  }));

/** Fields of `siteCopy` that are multiline in the schema. */
const MULTILINE_COPY_FIELDS = new Set([
  "garden.description",
  "garden.cardText",
  "rooms.description",
  "gallery.description",
  "tour.description",
  "trips.description",
  "pricing.description",
  "contact.description",
  "footer.tagline",
  "award.viewerCaption",
]);

/** Mirrors the nested shape of `copy` and localizes every leaf string. */
const localizeCopy = (pick, path = "") => {
  const sample = pick(czech);

  if (typeof sample === "string") {
    return MULTILINE_COPY_FIELDS.has(path) ? ltext(pick) : lstr(pick);
  }

  if (Array.isArray(sample)) {
    return localizedArray("localeString", pick);
  }

  return Object.fromEntries(
    Object.keys(sample).map((key) => [
      key,
      localizeCopy((text) => pick(text)[key], path ? `${path}.${key}` : key),
    ]),
  );
};

/** Photo files with their category and whether the layout should feature them. */
const photos = [
  ["aerial-house-garden.jpg", "aerial-house-garden", "exterier", true],
  ["exterior-golden-hour.jpg", "exterior-golden-hour", "exterier", true],
  ["aerial-terrace.jpg", "aerial-terrace", "exterier", false],
  ["hot-tub-terrace.jpg", "hot-tub-terrace", "zahrada", true],
  ["terrace-awning.jpg", "terrace-awning", "zahrada", false],
  ["garden-playground.jpg", "garden-playground", "zahrada", false],
  ["kitchen-dining.jpg", "kitchen-dining", "spolecne", true],
  ["living-room.jpg", "living-room", "spolecne", false],
  ["kitchen.jpg", "kitchen", "spolecne", false],
  ["kitchen-island.jpg", "kitchen-island", "spolecne", false],
  ["aerial-top-down.jpg", "aerial-top-down", "exterier", false],
  ["exterior-summer-meadow.jpg", "exterior-summer-meadow", "exterier", false],
  ["exterior-back-lawn.jpg", "exterior-back-lawn", "exterier", false],
  ["hero-aerial-summer.jpg", "hero-aerial", "exterier", false],
  ["exterior-garden.jpg", "exterior-garden", "exterier", false],
  ["exterior-wide.jpg", "exterior-wide", "exterier", false],
  ["terrace-dining-long.jpg", "terrace-dining-long", "zahrada", false],
  ["hot-tub-bubbles.jpg", "hot-tub-bubbles", "zahrada", false],
  ["terrace-awning-table.jpg", "terrace-awning-table", "zahrada", false],
  ["hot-tub-sun.jpg", "hot-tub-sun", "zahrada", false],
  ["terrace-grill-orchard.jpg", "terrace-grill-orchard", "zahrada", false],
  ["terrace-lounge.jpg", "terrace-lounge", "zahrada", false],
  ["terrace-garden-table.jpg", "terrace-garden-table", "zahrada", false],
  ["terrace-hot-tub.jpg", "terrace-hot-tub", "zahrada", false],
  ["terrace-table.jpg", "terrace-table", "zahrada", false],
  ["hot-tub.jpg", "hot-tub", "zahrada", false],
  ["kitchen-detail.jpg", "kitchen-detail", "spolecne", false],
  ["bedroom-double.jpg", "bedroom-double", "pokoje", true],
  ["bedroom-double-window.jpg", "bedroom-double-window", "pokoje", false],
  ["bedroom-bunk-red.jpg", "bedroom-bunk-red", "pokoje", false],
  ["bedroom-bunk.jpg", "bedroom-bunk", "pokoje", false],
  ["bedroom-twin.jpg", "bedroom-twin", "pokoje", false],
  ["bathroom.jpg", "bathroom", "pokoje", false],
  ["bedroom-single.jpg", "bedroom-single", "pokoje", false],
  ["stairs.jpg", "stairs", "pokoje", false],
];

/** Prices and links stay identical across languages. */
const ratePrices = [
  ["summer", "55 000 Kč", true],
  ["week", "49 000 Kč", false],
  ["weekend", "25 000 Kč", false],
];

const tripLinks = [
  ["janov", "https://mapy.com/cs/?q=Janovsk%C3%A1%20rozhledna"],
  ["hrensko", "https://www.hrensko.cz/inpage/soutesky/"],
  ["pravcicka", "https://www.pbrana.cz/"],
  ["jetrichovice", "https://mapy.com/cs/?q=Jet%C5%99ichovick%C3%A9%20vyhl%C3%ADdky"],
];

async function assetFor(filename) {
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`,
    { filename },
  );
  if (existing) return existing;

  const asset = await client.assets.upload(
    "image",
    createReadStream(resolve(IMAGE_DIRECTORY, filename)),
    { filename },
  );
  return asset._id;
}

console.log("Nahrávám kurátorský výběr fotografií…");
const assetIds = new Map();
for (const [filename] of photos) {
  assetIds.set(filename, await assetFor(filename));
}

const imageField = (filename, altPick) => ({
  _type: "image",
  asset: { _type: "reference", _ref: assetIds.get(filename) },
  alt: lstr(altPick),
});

const settings = {
  _id: "siteSettings-main",
  _type: "siteSettings",
  title: czech.settings.title,
  description: ltext((text) => text.settings.description),
  seoTitle: lstr((text) => text.settings.seoTitle),
  seoDescription: ltext((text) => text.settings.seoDescription),
  seoImage: imageField(
    "aerial-house-garden.jpg",
    (text) => text.gallery["aerial-house-garden"].alt,
  ),
  phone: "+420777181920",
  phoneDisplay: "777 181 920",
  email: "majitel@akcenaseveru.cz",
  address: lstr((text) => text.settings.address),
  heroEyebrow: lstr((text) => text.settings.heroEyebrow),
  heroTitle: ltext((text) => text.settings.heroTitle),
  heroDescription: ltext((text) => text.settings.heroDescription),
  heroImage: imageField(
    "aerial-house-garden.jpg",
    (text) => text.gallery["aerial-house-garden"].alt,
  ),
  matterportUrl: "https://my.matterport.com/show/?m=QgBtFa22zu6",
  calendarUrl:
    "https://obsazenost.e-chalupy.cz/kalendar.php?id=17320&pocetMesicu=12&velikost=3&legenda=ano&naStred=ano&jazyk=cz&jednotky=ano",
  listingUrl: "https://www.e-chalupy.cz/domecek-janov-ubytovani-o17320",
  mapUrl: "https://mapy.com/cs/?q=50.85606N%2C%2014.26754E&z=16",
};

const siteCopy = {
  _id: "siteCopy-main",
  _type: "siteCopy",
  ...localizeCopy((text) => text.copy),
};

const accommodation = {
  _id: "accommodation-main",
  _type: "accommodation",
  introTitle: lstr((text) => text.accommodation.introTitle),
  introText: localizedArray(
    "localeText",
    (text) => text.accommodation.introText,
  ),
  capacity: 17,
  bedrooms: 6,
  gardenArea: 4000,
  facts: czech.accommodation.facts.map((_, index) => ({
    _key: `fact-${index}`,
    _type: "fact",
    value: lstr((text) => text.accommodation.facts[index].value),
    label: lstr((text) => text.accommodation.facts[index].label),
  })),
  rooms: czech.accommodation.rooms.map((_, index) => ({
    _key: `room-${index}`,
    _type: "room",
    title: lstr((text) => text.accommodation.rooms[index].title),
    description: ltext(
      (text) => text.accommodation.rooms[index].description,
    ),
  })),
  amenities: czech.accommodation.amenities.map((_, index) => ({
    _key: `amenity-${index}`,
    _type: "amenityGroup",
    title: lstr((text) => text.accommodation.amenities[index].title),
    items: localizedArray(
      "localeString",
      (text) => text.accommodation.amenities[index].items,
    ),
  })),
};

const rates = ratePrices.map(([id, price, featured], order) => ({
  _id: `rate-${id}`,
  _type: "rate",
  title: lstr((text) => text.rates[id].title),
  price,
  unit: lstr((text) => text.rates[id].unit),
  note: ltext((text) => text.rates[id].note),
  featured,
  active: true,
  order,
}));

const tips = tripLinks.map(([id, href], order) => ({
  _id: `trip-${id}`,
  _type: "tripTip",
  title: lstr((text) => text.tripTips[id].title),
  distance: lstr((text) => text.tripTips[id].distance),
  description: ltext((text) => text.tripTips[id].description),
  href,
  order,
}));

const gallery = photos.map(([filename, id, category, featured], order) => ({
  _id: `gallery-${id}`,
  _type: "galleryItem",
  image: {
    _type: "image",
    asset: { _type: "reference", _ref: assetIds.get(filename) },
  },
  alt: lstr((text) => text.gallery[id].alt),
  caption: lstr((text) => text.gallery[id].caption),
  category,
  featured,
  order,
}));

console.log("Zapisuji dokumenty…");
const documents = [
  settings,
  siteCopy,
  accommodation,
  ...rates,
  ...tips,
  ...gallery,
];
for (const document of documents) {
  await client.createOrReplace(document);
}

console.log(`Hotovo. Zapsáno ${documents.length} dokumentů.`);
