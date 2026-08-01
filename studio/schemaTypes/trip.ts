import { defineField, defineType } from "sanity";

import { studioLocales } from "./locale";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Texty jednoho cíle na mapě výletů.
 *
 * Geometrie - souřadnice, výchozí bod, barva značky i předpočítaná trasa -
 * zůstává v kódu webu (`web/src/data/trips.ts`). Studio řídí jen wording, takže
 * úprava popisu nebo upozornění na uzavírku nevyžaduje nový build tras.
 *
 * Spojovacím klíčem je `tripId`: dokument se propíše do mapy jen tehdy, když
 * se shoduje s id výletu v kódu. Prázdné pole si web dotáhne z vestavěných
 * textů, takže rozdělaný překlad nikdy nevymaže hotovou češtinu.
 */
export const tripType = defineType({
  name: "trip",
  title: "Výlet na mapě",
  type: "document",
  fields: [
    defineField({
      name: "tripId",
      title: "Id výletu",
      type: "string",
      description:
        "Musí odpovídat id v kódu mapy, například „pravcicka-brana“. Po uložení se zamkne, ať se dokument neodpojí od svého bodu na mapě.",
      readOnly: ({ value }) => Boolean(value),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Název cíle",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startName",
      title: "Výchozí bod",
      type: "localeString",
      description:
        "Jméno místa tak, jak ho host najde na rozcestníku nebo v navigaci.",
    }),
    defineField({
      name: "summary",
      title: "Popis",
      type: "localeText",
      description: "Jedna až dvě věty do karty výletu i do bublinky na mapě.",
    }),
    defineField({
      name: "note",
      title: "Upozornění",
      type: "localeText",
      description:
        "Uzavírka nebo omezení, které mění reálnou podobu trasy. Prázdné pole upozornění z karty odstraní - tohle jediné pole si Studio řídí samo, aby po znovuotevření stezky šlo varování smazat.",
      validation: (rule) =>
        rule.custom((value) => {
          if (!isRecord(value)) return true;

          const filled = studioLocales.filter((locale) =>
            Boolean(String(value[locale.id] ?? "").trim()),
          );
          if (filled.length === 0 || filled.length === studioLocales.length) {
            return true;
          }

          const missing = studioLocales
            .filter((locale) => !filled.includes(locale))
            .map((locale) => locale.title)
            .join(", ");
          return `Upozornění vyplňte ve všech jazycích (chybí: ${missing}), jinak host v jednom z nich vyrazí na uzavřenou trasu bez varování.`;
        }),
    }),
  ],
  preview: {
    select: { title: "title.cs", subtitle: "tripId" },
  },
});
