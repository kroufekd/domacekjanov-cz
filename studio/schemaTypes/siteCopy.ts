import { defineArrayMember, defineField, defineType } from "sanity";

import { headingHint } from "./locale";

/**
 * Every visible label of the website in one document. The fields mirror the
 * `SiteCopy` type in the web app one to one - anything left empty here simply
 * keeps the built-in wording.
 */

const str = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: "localeString", description });

const txt = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: "localeText", description });

const strList = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: "array",
    description,
    of: [defineArrayMember({ type: "localeString" })],
  });

type SectionOptions = {
  extra?: ReturnType<typeof defineField>[];
  /** The story section borrows its title from "Domeček a vybavení". */
  heading?: boolean;
};

const section = (
  name: string,
  title: string,
  group: string,
  { extra = [], heading = true }: SectionOptions = {},
) =>
  defineField({
    name,
    title,
    type: "object",
    group,
    options: { collapsible: true, collapsed: false },
    fields: [
      str("eyebrow", "Malý nadpis nad titulkem"),
      ...(heading
        ? [
            str("title", "Titulek sekce", headingHint),
            txt("description", "Popis sekce"),
          ]
        : []),
      ...extra,
    ],
  });

export const siteCopyType = defineType({
  name: "siteCopy",
  title: "Texty webu",
  type: "document",
  groups: [
    { name: "chrome", title: "Menu a tlačítka", default: true },
    { name: "hero", title: "Úvodní obrazovka" },
    { name: "sections", title: "Sekce" },
    { name: "pricing", title: "Ceník" },
    { name: "contact", title: "Kontakt a patička" },
  ],
  fields: [
    defineField({
      name: "nav",
      title: "Položky menu",
      type: "object",
      group: "chrome",
      options: { collapsible: true, collapsed: false },
      fields: [
        str("about", "O domečku"),
        str("amenities", "Vybavení"),
        str("gallery", "Galerie"),
        str("tour", "3D prohlídka"),
        str("pricing", "Ceník"),
        str("contact", "Kontakt"),
      ],
    }),
    defineField({
      name: "actions",
      title: "Tlačítka a odkazy",
      type: "object",
      group: "chrome",
      options: { collapsible: true, collapsed: false },
      fields: [
        str("call", "Zavolat"),
        str("callOwner", "Zavolat majiteli"),
        str("datesAndPrices", "Termíny a ceny"),
        str("lookInside", "Podívat se dovnitř"),
        str("showOnMap", "Ukázat na mapě"),
        str("startTour", "Spustit 3D prohlídku"),
        str("openSeparately", "Otevřít prohlídku samostatně"),
        str("tourIssue", "Nouzový odkaz při potížích s prohlídkou"),
        str("checkAvailability", "Zkontrolovat obsazenost"),
        str("exploreHouse", "Odkaz pod úvodní fotkou"),
        str(
          "showAll",
          "Zobrazit všechny fotky",
          "Zápis {count} se nahradí počtem fotografií.",
        ),
        str("showLess", "Zobrazit méně"),
      ],
    }),

    defineField({
      name: "hero",
      title: "Úvodní obrazovka",
      type: "object",
      group: "hero",
      options: { collapsible: true, collapsed: false },
      fields: [
        str("metaPlace", "Místo v pozadí"),
        str("metaCoords", "Souřadnice v pozadí"),
        str("badgePrefix", "Text před počtem hostů"),
        str("badgeSuffix", "Text za počtem hostů"),
      ],
    }),

    section("story", "Sekce O domečku", "sections", {
      heading: false,
      extra: [
        str("noteAccent", "Ručně psaná poznámka - zvýrazněná část"),
        str("noteRest", "Ručně psaná poznámka - zbytek"),
      ],
    }),
    section("garden", "Sekce Zahrada a terasa", "sections", {
      extra: [
        str("stampNote", "Text v razítku"),
        str("cardTitle", "Nadpis kartičky"),
        txt("cardText", "Text kartičky"),
        str("cardPrice", "Cena na kartičce"),
      ],
    }),
    section("rooms", "Sekce Spaní a vybavení", "sections", {
      extra: [strList("comfort", "Pruh s ikonami pod vybavením")],
    }),
    section("gallery", "Sekce Galerie", "sections", {
      extra: [
        str("filterLabel", "Popisek filtru"),
        defineField({
          name: "categories",
          title: "Názvy kategorií",
          type: "object",
          options: { collapsible: true, collapsed: false },
          fields: [
            str("vse", "Vše"),
            str("exterier", "Exteriér"),
            str("zahrada", "Zahrada a wellness"),
            str("spolecne", "Společné prostory"),
            str("pokoje", "Pokoje"),
          ],
        }),
        str("swipeHint", "Nápověda v prohlížeči fotek"),
      ],
    }),
    section("tour", "Sekce 3D prohlídka", "sections", {
      extra: [str("teaser", "Text přes náhledovou fotku")],
    }),
    section("trips", "Sekce Výlety po okolí", "sections"),

    section("pricing", "Sekce Ceník", "pricing", {
      extra: [
        str("featuredTag", "Štítek zvýrazněné ceny"),
        strList("notes", "Příplatky pod ceníkem"),
        str("calendarNote", "Poznámka u kalendáře"),
      ],
    }),

    section("contact", "Sekce Kontakt", "contact", {
      extra: [
        str("phoneLabel", "Popisek telefonu"),
        str("emailLabel", "Popisek e-mailu"),
        str("addressLabel", "Popisek adresy"),
      ],
    }),
    defineField({
      name: "footer",
      title: "Patička",
      type: "object",
      group: "contact",
      options: { collapsible: true, collapsed: false },
      fields: [
        txt("tagline", "Věta pod logem"),
        str("pricingLink", "Odkaz na ceník"),
        str("mapLink", "Odkaz na mapu"),
        str("instagramLink", "Odkaz na Instagram"),
        str("facebookLink", "Odkaz na Facebook"),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Texty webu" }),
  },
});
