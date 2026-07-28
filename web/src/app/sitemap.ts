import type { MetadataRoute } from "next";

import { defaultLocale, localeHref, localeMeta, locales } from "@/i18n/config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.domecekjanov.cz"
  ).replace(/\/$/, "");

  const absolute = (locale: (typeof locales)[number]) =>
    `${siteUrl}${localeHref(locale)}`.replace(/\/$/, "") || siteUrl;

  const languages = Object.fromEntries(
    locales.map((locale) => [localeMeta[locale].htmlLang, absolute(locale)]),
  );

  return locales.map((locale) => ({
    url: absolute(locale),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));
}
