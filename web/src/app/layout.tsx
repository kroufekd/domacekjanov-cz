import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";

import { localAsset } from "@/lib/paths";

import "./globals.css";

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
  title: {
    default: "Domeček Janov | Celá chalupa v Českém Švýcarsku",
    template: "%s | Domeček Janov",
  },
  description:
    "Celý dům až pro 17 hostů, 6 ložnic, oplocená zahrada 4 000 m² a vířivý sud. Ubytování v Janově u Hřenska pro rodiny, přátele i týmy.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: "/",
    siteName: "Domeček Janov",
    title: "Všichni spolu. A přesto s místem pro sebe.",
    description:
      "Velký dům v Českém Švýcarsku pro rodiny, přátele a všechny, kteří chtějí být chvíli spolu.",
    images: [
      {
        url: localAsset("/images/hero-aerial.jpg"),
        width: 1159,
        height: 913,
        alt: "Letecký pohled na Domeček Janov",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Domeček Janov",
    description: "Celý dům až pro 17 hostů v Českém Švýcarsku.",
    images: [localAsset("/images/hero-aerial.jpg")],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173d31",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <a className="skip-link" href="#hlavni-obsah">
          Přeskočit na obsah
        </a>
        {children}
      </body>
    </html>
  );
}
