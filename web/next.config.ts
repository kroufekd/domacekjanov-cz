import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";

const pageExtensions = ["tsx", "ts", "jsx", "js"];

/**
 * Editační API (`route.node.ts`) potřebuje běžící server - čte cookie a
 * zapisuje do Sanity. Statický export takovou routu neumí a spadl by na ní
 * build, takže se do něj vůbec nezahrne: Next hledá stránky podle přípon
 * uvedených tady, a `node.ts` mezi nimi při exportu není.
 */
const serverPageExtensions = ["node.tsx", "node.ts"];

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  pageExtensions: isStaticExport
    ? pageExtensions
    : [...serverPageExtensions, ...pageExtensions],
  basePath,
  trailingSlash: isStaticExport,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 88],
    unoptimized: isStaticExport,
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  ...(isStaticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=()",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
