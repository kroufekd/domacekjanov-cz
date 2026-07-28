import { defineField, defineType } from "sanity";

/**
 * Field level translations. Every translatable field is an object holding one
 * value per language, and the three variants are laid out next to each other so
 * an editor always sees Czech, German and English of the same sentence at once.
 */

export const studioLocales = [
  { id: "cs", title: "Čeština", flag: "🇨🇿" },
  { id: "de", title: "Deutsch", flag: "🇩🇪" },
  { id: "en", title: "English", flag: "🇬🇧" },
] as const;

export type StudioLocaleId = (typeof studioLocales)[number]["id"];

/** Czech is what the site falls back to, so it is the one field we require. */
const TRANSLATION_FIELDSET = "translations";

const localeFields = (type: "string" | "text", rows?: number) =>
  studioLocales.map((locale) =>
    defineField({
      name: locale.id,
      title: `${locale.flag} ${locale.title}`,
      type,
      fieldset: TRANSLATION_FIELDSET,
      ...(type === "text" && rows ? { rows } : {}),
    }),
  );

export const localeStringType = defineType({
  name: "localeString",
  title: "Text",
  type: "object",
  fieldsets: [
    {
      name: TRANSLATION_FIELDSET,
      options: { columns: 3 },
    },
  ],
  fields: localeFields("string"),
  preview: {
    select: { title: "cs", subtitle: "en" },
  },
});

export const localeTextType = defineType({
  name: "localeText",
  title: "Delší text",
  type: "object",
  fieldsets: [
    {
      name: TRANSLATION_FIELDSET,
      options: { columns: 3 },
    },
  ],
  fields: localeFields("text", 4),
  preview: {
    select: { title: "cs", subtitle: "en" },
  },
});

/** Headings that carry the italic second line use this hint. */
export const headingHint =
  "Text za svislítkem | se zalomí na druhý řádek a vysází se kurzívou.";

export const localeTypes = [localeStringType, localeTextType];
