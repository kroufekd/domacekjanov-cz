import { defineField, defineType } from "sanity";

export const tripTipType = defineType({
  name: "tripTip",
  title: "Tip na výlet",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Název",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "distance",
      title: "Vzdálenost",
      type: "localeString",
    }),
    defineField({
      name: "description",
      title: "Popis",
      type: "localeText",
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
    select: { title: "title.cs", subtitle: "distance.cs" },
  },
});
