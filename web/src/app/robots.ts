import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/**
 * Roboti jazykových modelů. Výchozí stav je stejně „smí“, ale vypsané jméno je
 * doklad úmyslu - bez něj se u `Google-Extended` a `Applebot-Extended` nedá
 * poznat, jestli je povolení záměr, nebo jen nikdo nic nenastavil.
 */
const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.domecekjanov.cz"
  ).replace(/\/$/, "");

  return {
    rules: [
      // `/api/` je jen health check pro Coolify, v indexu nemá co dělat.
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      { userAgent: aiCrawlers, allow: "/", disallow: ["/api/"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
