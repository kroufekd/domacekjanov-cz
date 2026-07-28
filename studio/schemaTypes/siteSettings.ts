import { defineField, defineType } from "sanity";

const localizedImage = (name: string, title: string, group: string) =>
  defineField({
    name,
    title,
    type: "image",
    group,
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alternativní popis",
        type: "localeString",
      }),
    ],
  });

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Nastavení webu",
  type: "document",
  groups: [
    { name: "basic", title: "Základ", default: true },
    { name: "hero", title: "Úvodní obrazovka" },
    { name: "contact", title: "Kontakt" },
    { name: "links", title: "Odkazy" },
    { name: "seo", title: "SEO a sdílení" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Název objektu",
      type: "string",
      group: "basic",
      description: "Stejný ve všech jazycích, jde o vlastní jméno domu.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Krátký popis webu",
      type: "localeText",
      group: "basic",
    }),

    defineField({
      name: "heroEyebrow",
      title: "Malý text nad nadpisem",
      type: "localeString",
      group: "hero",
    }),
    defineField({
      name: "heroTitle",
      title: "Hlavní nadpis",
      type: "localeText",
      group: "hero",
    }),
    defineField({
      name: "heroDescription",
      title: "Úvodní text",
      type: "localeText",
      group: "hero",
    }),
    localizedImage("heroImage", "Hlavní fotografie", "hero"),

    defineField({
      name: "phone",
      title: "Telefon pro odkaz",
      type: "string",
      group: "contact",
    }),
    defineField({
      name: "phoneDisplay",
      title: "Telefon pro zobrazení",
      type: "string",
      group: "contact",
    }),
    defineField({
      name: "email",
      title: "E-mail",
      type: "string",
      group: "contact",
    }),
    defineField({
      name: "address",
      title: "Adresa",
      type: "localeString",
      group: "contact",
      description:
        "V cizojazyčných verzích se hodí doplnit i zemi, například „, Tschechien“.",
    }),

    defineField({
      name: "matterportUrl",
      title: "Matterport odkaz",
      type: "url",
      group: "links",
    }),
    defineField({
      name: "calendarUrl",
      title: "Kalendář obsazenosti",
      type: "url",
      group: "links",
    }),
    defineField({
      name: "listingUrl",
      title: "Karta objektu na e-chalupy.cz",
      type: "url",
      group: "links",
    }),
    defineField({
      name: "mapUrl",
      title: "Odkaz na mapu",
      type: "url",
      group: "links",
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook",
      type: "url",
      group: "links",
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram",
      type: "url",
      group: "links",
    }),

    defineField({
      name: "seoTitle",
      title: "SEO titulek",
      type: "localeString",
      group: "seo",
      description: "Pokud zůstane prázdný, použije se název objektu.",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO popis",
      type: "localeText",
      group: "seo",
    }),
    localizedImage("seoImage", "Fotografie pro sdílení", "seo"),
  ],
  preview: {
    prepare: () => ({ title: "Nastavení webu" }),
  },
});
