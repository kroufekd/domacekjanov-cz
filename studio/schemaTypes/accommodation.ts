import { defineArrayMember, defineField, defineType } from "sanity";

export const accommodationType = defineType({
  name: "accommodation",
  title: "Domeček a vybavení",
  type: "document",
  fields: [
    defineField({
      name: "introTitle",
      title: "Nadpis úvodu",
      type: "string",
    }),
    defineField({
      name: "introText",
      title: "Úvodní odstavce",
      type: "array",
      of: [defineArrayMember({ type: "text", rows: 3 })],
    }),
    defineField({
      name: "capacity",
      title: "Kapacita",
      type: "number",
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "bedrooms",
      title: "Počet ložnic",
      type: "number",
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "gardenArea",
      title: "Plocha zahrady v m²",
      type: "number",
    }),
    defineField({
      name: "facts",
      title: "Rychlá fakta",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "value", title: "Hodnota", type: "string" }),
            defineField({ name: "label", title: "Popisek", type: "string" }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
    }),
    defineField({
      name: "rooms",
      title: "Pokoje",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "title", title: "Název", type: "string" }),
            defineField({
              name: "description",
              title: "Popis",
              type: "text",
              rows: 2,
            }),
          ],
          preview: { select: { title: "title", subtitle: "description" } },
        }),
      ],
    }),
    defineField({
      name: "amenities",
      title: "Skupiny vybavení",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "title", title: "Název", type: "string" }),
            defineField({
              name: "items",
              title: "Položky",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
            }),
          ],
          preview: { select: { title: "title" } },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Domeček a vybavení" }),
  },
});
