import { defineField, defineType } from "sanity";

export const galleryItemType = defineType({
  name: "galleryItem",
  title: "Fotografie",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Fotografie",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alternativní popis",
      type: "localeString",
      description: "Popis pro čtečky a vyhledávače, ve všech třech jazycích.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Popisek",
      type: "localeString",
    }),
    defineField({
      name: "category",
      title: "Kategorie",
      type: "string",
      options: {
        list: [
          { title: "Exteriér", value: "exterier" },
          { title: "Společné prostory", value: "spolecne" },
          { title: "Pokoje", value: "pokoje" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Zvýrazněná fotografie",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Pořadí",
      type: "number",
      initialValue: 100,
    }),
  ],
  preview: {
    select: {
      title: "caption.cs",
      subtitle: "category",
      media: "image",
    },
  },
});
