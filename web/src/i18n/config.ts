/**
 * Language setup for the whole site.
 *
 * Czech is the default locale and stays on the bare `/` so the live URLs never
 * change. Every other locale gets a single path segment (`/de`, `/en`), which
 * keeps the routing static-export friendly - no middleware and no redirects.
 */

export const locales = ["cs", "de", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "cs";

export type LocaleMeta = {
  code: Locale;
  /** Value for the `lang` attribute. */
  htmlLang: string;
  /** Value for `og:locale`. */
  ogLocale: string;
  /** Language name written in that language. */
  nativeName: string;
  /** Two-letter badge shown in the switcher. */
  short: string;
  flag: string;
};

export const localeMeta: Record<Locale, LocaleMeta> = {
  cs: {
    code: "cs",
    htmlLang: "cs",
    ogLocale: "cs_CZ",
    nativeName: "Čeština",
    short: "CS",
    flag: "🇨🇿",
  },
  de: {
    code: "de",
    htmlLang: "de",
    ogLocale: "de_DE",
    nativeName: "Deutsch",
    short: "DE",
    flag: "🇩🇪",
  },
  en: {
    code: "en",
    htmlLang: "en",
    ogLocale: "en_GB",
    nativeName: "English",
    short: "EN",
    flag: "🇬🇧",
  },
};

export const localeList: LocaleMeta[] = locales.map(
  (locale) => localeMeta[locale],
);

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}

/**
 * Route segments for a locale. The default locale renders at the root, so it
 * contributes no segment at all.
 */
export function localeSegments(locale: Locale): string[] {
  return locale === defaultLocale ? [] : [locale];
}

/** Internal href for a locale, optionally pointing at a section anchor. */
export function localeHref(locale: Locale, hash = ""): string {
  const base = locale === defaultLocale ? "/" : `/${locale}`;
  if (!hash) return base;
  const anchor = hash.startsWith("#") ? hash : `#${hash}`;
  return `${base}${anchor}`;
}

/**
 * Resolves the locale from a rendered URL path. Unlike `localeFromSegments`
 * this never fails - anything without a known language prefix is Czech, which
 * is exactly what `/`, `/#kontakt` and friends are.
 */
export function localeFromPathname(pathname: string): Locale {
  const [, first] = pathname.split("/");
  return isLocale(first) ? first : defaultLocale;
}

/**
 * Resolves the locale from an optional catch-all route parameter.
 * Returns `null` for anything that is not a known language prefix so the route
 * can answer with a proper 404 instead of silently rendering Czech.
 */
export function localeFromSegments(
  segments: string[] | undefined,
): Locale | null {
  if (!segments || segments.length === 0) return defaultLocale;
  if (segments.length > 1) return null;
  const [segment] = segments;
  if (segment === defaultLocale) return null; // Czech only lives at `/`.
  return isLocale(segment) ? segment : null;
}
