import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Nastavení webu",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Název",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Krátký popis webu",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "seoTitle",
      title: "SEO titulek",
      type: "string",
      description: "Pokud zůstane prázdný, použije se hlavní název webu.",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO popis",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "seoImage",
      title: "Fotografie pro sdílení",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternativní popis",
          type: "string",
        }),
      ],
    }),
    defineField({ name: "phone", title: "Telefon pro odkaz", type: "string" }),
    defineField({
      name: "phoneDisplay",
      title: "Telefon pro zobrazení",
      type: "string",
    }),
    defineField({ name: "email", title: "E-mail", type: "string" }),
    defineField({ name: "address", title: "Adresa", type: "string" }),
    defineField({
      name: "heroEyebrow",
      title: "Malý text nad nadpisem",
      type: "string",
    }),
    defineField({
      name: "heroTitle",
      title: "Hlavní nadpis",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "heroDescription",
      title: "Úvodní text",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroImage",
      title: "Hlavní fotografie",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternativní popis",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "matterportUrl",
      title: "Matterport odkaz",
      type: "url",
    }),
    defineField({
      name: "calendarUrl",
      title: "Kalendář obsazenosti",
      type: "url",
    }),
    defineField({ name: "mapUrl", title: "Odkaz na mapu", type: "url" }),
    defineField({ name: "facebookUrl", title: "Facebook", type: "url" }),
    defineField({ name: "instagramUrl", title: "Instagram", type: "url" }),
  ],
  preview: {
    prepare: () => ({ title: "Nastavení webu" }),
  },
});
