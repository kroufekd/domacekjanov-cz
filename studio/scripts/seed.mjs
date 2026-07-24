import { createClient } from "@sanity/client";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";

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

const photos = [
  ["hero-aerial.jpg", "exterier", "Domeček Janov v srdci Českého Švýcarska", true],
  ["exterior-garden.jpg", "exterier", "Celý dům a zahrada jen pro vás", true],
  ["exterior-wide.jpg", "exterier", "4 000 m² oplocené zahrady", false],
  ["terrace-hot-tub.jpg", "zahrada", "Terasa, gril a vyhřívaný sud", true],
  ["terrace-table.jpg", "zahrada", "Místo pro dlouhé letní večeře", false],
  ["hot-tub.jpg", "zahrada", "Teplá voda i chladné večery", false],
  ["kitchen-dining.jpg", "spolecne", "Společný stůl pro celou partu", true],
  ["living-room.jpg", "spolecne", "Obývák, kde se vejdete všichni", false],
  ["kitchen.jpg", "spolecne", "Plně vybavená kuchyň", false],
  ["kitchen-island.jpg", "spolecne", "Prostor na společné vaření", false],
  ["kitchen-detail.jpg", "spolecne", "Všechno důležité je po ruce", false],
  ["bedroom-double.jpg", "pokoje", "Klidné ložnice pro rodiče", true],
  ["bedroom-double-window.jpg", "pokoje", "Světlé pokoje v patře", false],
  ["bedroom-bunk-red.jpg", "pokoje", "Dětský pokoj pro společné večery", false],
  ["bedroom-bunk.jpg", "pokoje", "Pohodlné spaní až pro čtyři", false],
  ["bedroom-twin.jpg", "pokoje", "Každý má svůj kousek klidu", false],
  ["bathroom.jpg", "pokoje", "Dvě koupelny v přízemí", false],
  ["bedroom-single.jpg", "pokoje", "Šest různých ložnic", false],
  ["stairs.jpg", "pokoje", "Dům má dvě podlaží", false],
];

async function assetFor(filename) {
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`,
    { filename },
  );
  if (existing) return existing;

  const path = resolve("../web/public/images", filename);
  const asset = await client.assets.upload("image", createReadStream(path), {
    filename,
  });
  return asset._id;
}

console.log("Nahrávám kurátorský výběr fotografií…");
const assetIds = new Map();
for (const [filename] of photos) {
  assetIds.set(filename, await assetFor(filename));
}

const key = (value) => ({
  _key: value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
});

const settings = {
  _id: "siteSettings-main",
  _type: "siteSettings",
  title: "Domeček Janov",
  description:
    "Celý dům pro až 17 hostů, velká oplocená zahrada a České Švýcarsko hned za dveřmi.",
  seoTitle: "Domeček Janov | Celá chalupa v Českém Švýcarsku",
  seoDescription:
    "Celý dům až pro 17 hostů, 6 ložnic, oplocená zahrada 4 000 m² a vířivý sud v Janově u Hřenska.",
  seoImage: {
    _type: "image",
    asset: { _type: "reference", _ref: assetIds.get("hero-aerial.jpg") },
    alt: "Letecký pohled na Domeček Janov",
  },
  phone: "+420777181920",
  phoneDisplay: "777 181 920",
  email: "majitel@akcenaseveru.cz",
  address: "Janov 167, 405 02 Janov",
  heroEyebrow: "Českosaské Švýcarsko · Janov u Hřenska",
  heroTitle: "Všichni spolu. A přesto s místem pro sebe.",
  heroDescription:
    "Celý domeček až pro 17 hostů, s velikou zahradou, vířivým sudem a výlety začínajícími hned za brankou.",
  heroImage: {
    _type: "image",
    asset: { _type: "reference", _ref: assetIds.get("hero-aerial.jpg") },
    alt: "Letecký pohled na Domeček Janov a krajinu",
  },
  matterportUrl: "https://my.matterport.com/show/?m=QgBtFa22zu6",
  calendarUrl:
    "https://obsazenost.e-chalupy.cz/kalendar.php?id=17320&pocetMesicu=12&velikost=3&legenda=ano&naStred=ano&jazyk=cz&jednotky=ano",
  mapUrl: "https://mapy.com/cs/?q=50.85606N%2C%2014.26754E&z=16",
};

const accommodation = {
  _id: "accommodation-main",
  _type: "accommodation",
  introTitle: "Dům, který počítá s tím, že přijedete všichni.",
  introText: [
    "Domeček stojí v klidné části Janova nad Hřenskem. Když zavřete branku, máte pro sebe celý dům, rozlehlou oplocenou zahradu a dost prostoru na společnou snídani i večer u kamen.",
    "Nejlépe se u nás cítí tři až čtyři rodiny, parta přátel, sportovní tým nebo kolegové na neformálním teambuildingu.",
  ],
  capacity: 17,
  bedrooms: 6,
  gardenArea: 4000,
  facts: [
    { ...key("hostu"), _type: "object", value: "17", label: "hostů" },
    { ...key("loznic"), _type: "object", value: "6", label: "ložnic" },
    { ...key("zahrada"), _type: "object", value: "4 000 m²", label: "oplocené zahrady" },
    { ...key("rok"), _type: "object", value: "celý rok", label: "pro vás otevřeno" },
  ],
  rooms: [
    ["Pokoj 1", "Dvě palandy pro čtyři. Dětská základna pro společné večery."],
    ["Pokoj 2", "Tři samostatná lůžka, ideální pro děti nebo kamarády."],
    ["Pokoje 3–5", "Tři klidné ložnice s manželskou postelí."],
    ["Pokoj 6", "Manželská postel v přízemí a bezbariérový přístup."],
    ["Obývací pokoj", "Dvě kvalitní rozkládací pohovky jako další lůžka."],
  ].map(([title, description]) => ({
    ...key(title),
    _type: "object",
    title,
    description,
  })),
  amenities: [
    ["Uvnitř", ["velká vybavená kuchyň", "dvě lednice s mrazákem", "myčka, mikrovlnka a kávovary", "krbová kamna a podlahové topení", "Wi‑Fi a televize"]],
    ["Venku", ["vyhřívaný vířivý sud", "jižní terasa s plynovým grilem", "trampolína, houpačka a dětský domeček", "oplocená travnatá zahrada", "parkování u domu"]],
    ["Prakticky", ["povlečení a malé ručníky v ceně", "dvě koupelny v přízemí", "další WC v patře", "bezbariérový pokoj", "nekuřácký objekt bez zvířat"]],
  ].map(([title, items]) => ({
    ...key(title),
    _type: "object",
    title,
    items,
  })),
};

const rates = [
  ["summer", "Léto", "55 000 Kč", "celý dům / týden", "V létě pobyty od soboty do soboty.", true],
  ["week", "Mimo léto", "49 000 Kč", "celý dům / týden", "Zimní sezona i mimosezona.", false],
  ["weekend", "Víkend", "25 000 Kč", "celý dům / víkend", "Mimo léto minimálně dvě noci.", false],
].map(([id, title, price, unit, note, featured], order) => ({
  _id: `rate-${id}`,
  _type: "rate",
  title,
  price,
  unit,
  note,
  featured,
  active: true,
  order,
}));

const tips = [
  ["janov", "Janovská rozhledna", "pěšky z domu", "Rychlý výlet s výhledem na Labské pískovce.", "https://mapy.com/cs/?q=Janovsk%C3%A1%20rozhledna"],
  ["hrensko", "Soutěsky Hřensko", "2 km", "Skalní kaňon, pěší stezky a plavba na pramicích.", "https://www.hrensko.cz/inpage/soutesky/"],
  ["pravcicka", "Pravčická brána", "krátký přejezd", "Nejznámější symbol Českého Švýcarska.", "https://www.pbrana.cz/"],
  ["jetrichovice", "Jetřichovické vyhlídky", "na celý den", "Pískovcové skály, lesní cesty a nádherné výhledy.", "https://mapy.com/cs/?q=Jet%C5%99ichovick%C3%A9%20vyhl%C3%ADdky"],
].map(([id, title, distance, description, href], order) => ({
  _id: `trip-${id}`,
  _type: "tripTip",
  title,
  distance,
  description,
  href,
  order,
}));

const gallery = photos.map(([filename, category, caption, featured], order) => ({
  _id: `gallery-${filename.replace(/\.[^.]+$/, "")}`,
  _type: "galleryItem",
  image: {
    _type: "image",
    asset: { _type: "reference", _ref: assetIds.get(filename) },
  },
  alt: caption,
  caption,
  category,
  featured,
  order,
}));

console.log("Zapisuji dokumenty…");
const documents = [settings, accommodation, ...rates, ...tips, ...gallery];
for (const document of documents) {
  await client.createOrReplace(document);
}

console.log(`Hotovo. Zapsáno ${documents.length} dokumentů.`);
