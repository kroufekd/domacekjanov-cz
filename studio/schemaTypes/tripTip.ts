import { defineField, defineType } from "sanity";

export const tripTipType = defineType({
  name: "tripTip",
  title: "Tip na výlet",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Název",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "distance", title: "Vzdálenost", type: "string" }),
    defineField({
      name: "description",
      title: "Popis",
      type: "text",
      rows: 3,
    }),
    defineField({ name: "href", title: "Odkaz", type: "url" }),
    defineField({
      name: "order",
      title: "Pořadí",
      type: "number",
      initialValue: 100,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "distance" },
  },
});
