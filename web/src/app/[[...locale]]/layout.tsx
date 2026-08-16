import { Inter, Playfair_Display } from "next/font/google";
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

const display = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-display",
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
  /**
   * `max-image-preview: large` je u ubytování to hlavní - bez něj Google
   * v našeptávači i v obrázkových výsledcích ukáže jen miniaturu.
   */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#195d36",
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
      className={`${display.variable} ${inter.variable}`}
    >
      <head>
        {/* Fotky jedou z Sanity CDN, včetně té úvodní - spojení se otevírá dřív,
            než prohlížeč dojde k <img>, aby LCP nečekalo na handshake. */}
        <link
          rel="preconnect"
          href="https://cdn.sanity.io"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
      </head>
      <body>
        <a className="skip-link" href="#hlavni-obsah">
          {dictionary.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
