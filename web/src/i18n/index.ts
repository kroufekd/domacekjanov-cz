import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { cs } from "@/i18n/dictionaries/cs";
import { de } from "@/i18n/dictionaries/de";
import { en } from "@/i18n/dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = { cs, de, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary } from "@/i18n/dictionary";
export * from "@/i18n/config";
