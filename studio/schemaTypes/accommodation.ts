import { defineArrayMember, defineField, defineType } from "sanity";

export const accommodationType = defineType({
  name: "accommodation",
  title: "Domeček a vybavení",
  type: "document",
  groups: [
    { name: "intro", title: "Úvod", default: true },
    { name: "numbers", title: "Čísla a fakta" },
    { name: "rooms", title: "Pokoje" },
    { name: "amenities", title: "Vybavení" },
  ],
  fields: [
    defineField({
      name: "introTitle",
      title: "Nadpis úvodu",
      type: "localeString",
      group: "intro",
    }),
    defineField({
      name: "introText",
      title: "Úvodní odstavce",
      type: "array",
      group: "intro",
      of: [defineArrayMember({ type: "localeText" })],
    }),

    defineField({
      name: "capacity",
      title: "Kapacita",
      type: "number",
      group: "numbers",
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "bedrooms",
      title: "Počet ložnic",
      type: "number",
      group: "numbers",
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "gardenArea",
      title: "Plocha zahrady v m²",
      type: "number",
      group: "numbers",
    }),
    defineField({
      name: "facts",
      title: "Rychlá fakta",
      type: "array",
      group: "numbers",
      of: [
        defineArrayMember({
          type: "object",
          name: "fact",
          fields: [
            defineField({
              name: "value",
              title: "Hodnota",
              type: "localeString",
            }),
            defineField({
              name: "label",
              title: "Popisek",
              type: "localeString",
            }),
          ],
          preview: {
            select: { title: "value.cs", subtitle: "label.cs" },
          },
        }),
      ],
    }),

    defineField({
      name: "rooms",
      title: "Pokoje",
      type: "array",
      group: "rooms",
      of: [
        defineArrayMember({
          type: "object",
          name: "room",
          fields: [
            defineField({
              name: "title",
              title: "Název",
              type: "localeString",
            }),
            defineField({
              name: "description",
              title: "Popis",
              type: "localeText",
            }),
          ],
          preview: {
            select: { title: "title.cs", subtitle: "description.cs" },
          },
        }),
      ],
    }),

    defineField({
      name: "amenities",
      title: "Skupiny vybavení",
      type: "array",
      group: "amenities",
      of: [
        defineArrayMember({
          type: "object",
          name: "amenityGroup",
          fields: [
            defineField({
              name: "title",
              title: "Název skupiny",
              type: "localeString",
            }),
            defineField({
              name: "items",
              title: "Položky",
              type: "array",
              of: [defineArrayMember({ type: "localeString" })],
            }),
          ],
          preview: { select: { title: "title.cs" } },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Domeček a vybavení" }),
  },
});
