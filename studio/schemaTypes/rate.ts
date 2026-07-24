import { defineField, defineType } from "sanity";

export const rateType = defineType({
  name: "rate",
  title: "Cena",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Název období",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Cena",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "unit", title: "Jednotka", type: "string" }),
    defineField({ name: "dateRange", title: "Termín", type: "string" }),
    defineField({
      name: "note",
      title: "Poznámka",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "featured",
      title: "Zvýraznit",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "active",
      title: "Aktivní",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "order",
      title: "Pořadí",
      type: "number",
      initialValue: 100,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "price" },
  },
});
