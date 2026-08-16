import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

/**
 * The store keeps translatable fields as `{ cs, de, en }` objects.
 *
 * Resolution is deliberately strict: a field is only ever read from the
 * language that was asked for. A missing translation resolves to `undefined`
 * so the caller can drop back to the built-in wording for that language -
 * showing the Czech sentence on the German page would be worse than showing
 * the translation that ships with the site.
 *
 * A bare string is how documents published before the site went multilingual
 * look. It counts as Czech, and only as Czech.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonEmpty = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

/** Reads a translatable string. */
export function localizedText(
  value: unknown,
  locale: Locale,
): string | undefined {
  const legacy = nonEmpty(value);
  if (legacy) return locale === defaultLocale ? legacy : undefined;
  if (!isRecord(value)) return undefined;

  return nonEmpty(value[locale]);
}

const stringList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
  return items.length > 0 ? items : undefined;
};

/**
 * Reads a translatable list of strings. Accepts an array of translatable
 * values (`[{cs, de, en}, …]`, which is how the Studio lists them so every row
 * shows all three languages), a plain array of strings, or one translatable
 * object holding a whole array per language.
 */
export function localizedList(
  value: unknown,
  locale: Locale,
): string[] | undefined {
  const legacy = stringList(value);
  if (legacy) return locale === defaultLocale ? legacy : undefined;

  if (Array.isArray(value)) {
    const items = value
      .map((item) => localizedText(item, locale))
      .filter((item): item is string => item !== undefined);
    return items.length > 0 ? items : undefined;
  }

  if (!isRecord(value)) return undefined;
  return stringList(value[locale]);
}

/**
 * Overlays stored data onto a fallback object of the same shape. Strings and
 * string arrays are resolved for the locale, nested objects are merged
 * recursively, and anything missing keeps the local value.
 */
export function mergeLocalized<T>(fallback: T, raw: unknown, locale: Locale): T {
  if (!isRecord(raw) || !isRecord(fallback)) return fallback;

  const merged: Record<string, unknown> = { ...fallback };

  for (const [key, defaultValue] of Object.entries(fallback)) {
    const rawValue = raw[key];
    if (rawValue == null) continue;

    if (typeof defaultValue === "string") {
      merged[key] = localizedText(rawValue, locale) ?? defaultValue;
      continue;
    }

    if (Array.isArray(defaultValue)) {
      merged[key] = localizedList(rawValue, locale) ?? defaultValue;
      continue;
    }

    if (isRecord(defaultValue)) {
      merged[key] = mergeLocalized(defaultValue, rawValue, locale);
    }
  }

  return merged as T;
}
