import { Fraunces, Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import {
  defaultLocale,
  getDictionary,
  localeFromSegments,
  localeMeta,
  locales,
  localeSegments,
} from "@/i18n";

import "../globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.domecekjanov.cz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173d31",
};

/** Czech renders at `/`, the other languages at `/de` and `/en`. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale: localeSegments(locale) }));
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale?: string[] }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: segments } = await params;
  const locale = localeFromSegments(segments) ?? defaultLocale;
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={localeMeta[locale].htmlLang}
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body>
        <a className="skip-link" href="#hlavni-obsah">
          {dictionary.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
