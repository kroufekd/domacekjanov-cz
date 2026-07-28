import { defineField, defineType } from "sanity";

export const rateType = defineType({
  name: "rate",
  title: "Cena",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Název období",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Cena",
      type: "string",
      description:
        "Stejná ve všech jazycích, aby se částky nikdy nerozešly. Například „55 000 Kč“.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "unit", title: "Jednotka", type: "localeString" }),
    defineField({ name: "dateRange", title: "Termín", type: "localeString" }),
    defineField({ name: "note", title: "Poznámka", type: "localeText" }),
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
    select: { title: "title.cs", subtitle: "price" },
  },
});
