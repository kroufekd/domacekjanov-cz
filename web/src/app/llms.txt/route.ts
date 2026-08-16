import { defaultLocale, localeHref, localeMeta, locales } from "@/i18n/config";
import { getSiteContent } from "@/lib/content";
import { houseAddress, houseGeo } from "@/lib/content/shared";

export const dynamic = "force-static";

/**
 * `llms.txt` - shrnutí objektu ve strojově čitelné podobě pro jazykové modely.
 *
 * Skládá se ze stejného obsahu jako stránka, takže nemůže zastarat: čísla,
 * ceny i vybavení chodí z `getSiteContent`. Web je jednostránkový, takže místo
 * seznamu podstránek nabízí kotvy a jazykové verze.
 */

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.domecekjanov.cz"
).replace(/\/$/, "");

/** Kotvy sekcí tak, jak je vykresluje `page.tsx`. */
const sections = [
  { anchor: "o-domecku", label: "O domečku" },
  { anchor: "vybaveni", label: "Pokoje a vybavení" },
  { anchor: "galerie", label: "Fotogalerie" },
  { anchor: "3d-prohlidka", label: "3D prohlídka" },
  { anchor: "okoli", label: "Výlety po okolí" },
  { anchor: "cenik", label: "Ceník a volné termíny" },
  { anchor: "kontakt", label: "Kontakt na majitele" },
] as const;

export async function GET() {
  const { settings, accommodation, rates } = await getSiteContent(defaultLocale);

  const lines = [
    `# ${settings.title}`,
    "",
    `> ${settings.seoDescription || settings.description}`,
    "",
    "## Základní údaje",
    "",
    `- Typ: celý dům k pronájmu vcelku, bez sdílení s cizími hosty`,
    `- Kapacita: ${accommodation.capacity} hostů v ${accommodation.bedrooms} ložnicích`,
    `- Zahrada: ${accommodation.gardenArea.toLocaleString("cs-CZ")} m², celá oplocená`,
    `- Adresa: ${houseAddress.streetAddress}, ${houseAddress.postalCode} ${houseAddress.addressLocality}, ${houseAddress.addressRegion}, Česko`,
    `- Souřadnice: ${houseGeo.latitude}, ${houseGeo.longitude}`,
    `- Poloha: Janov u Hřenska, okraj národního parku České Švýcarsko, 2 km od soutěsek ve Hřensku`,
    `- Telefon: ${settings.phone}`,
    `- E-mail: ${settings.email}`,
    "",
    "## Ceny",
    "",
    ...rates.map((rate) =>
      [
        `- ${rate.title}: ${rate.price} (${rate.unit})`,
        rate.note ? ` - ${rate.note}` : "",
      ].join(""),
    ),
    "",
    "## Vybavení",
    "",
    ...accommodation.amenities.map(
      (group) => `- ${group.title}: ${group.items.join(", ")}`,
    ),
    "",
    "## Ložnice",
    "",
    ...accommodation.rooms.map((room) => `- ${room.title}: ${room.description}`),
    "",
    "## Stránky",
    "",
    ...sections.map(
      ({ anchor, label }) => `- [${label}](${siteUrl}/#${anchor})`,
    ),
    "",
    "## Jazykové verze",
    "",
    ...locales.map(
      (locale) =>
        `- [${localeMeta[locale].nativeName}](${siteUrl}${localeHref(locale)})`,
    ),
    "",
    "## Rezervace",
    "",
    `Rezervuje se přímo u majitele telefonicky nebo e-mailem, bez agentury.`,
    `Kalendář obsazenosti: ${settings.listingUrl}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
