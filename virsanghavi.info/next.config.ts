import type { NextConfig } from "next";

/**
 * `Vary` for every negotiable page response.
 *
 * Next.js sets its own `Vary` on App Router page responses (the RSC routing
 * headers) and overwrites anything proxy.ts put there, so `Accept` has to be
 * declared alongside those tokens rather than appended to them.
 */
const VARY_VALUE =
  "Accept, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch";

/**
 * Legacy `.html` URLs from the hand-written version of this site are kept
 * working with permanent redirects so links and search results that predate
 * the Next.js rewrite still resolve.
 */
const LEGACY_PAGES: Array<[string, string]> = [
  ["/index.html", "/"],
  ["/about.html", "/about"],
  ["/posts.html", "/posts"],
  ["/search.html", "/search"],
];

const nextConfig: NextConfig = {
  // The repo root sits one level above this app directory; pin it so the
  // bundler does not walk up past the git root looking for a lockfile.
  turbopack: { root: import.meta.dirname },
  outputFileTracingIncludes: {
    "/**": ["./content/blog/**/*.md"],
  },
  async redirects() {
    return [
      ...LEGACY_PAGES.map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      {
        source: "/posts/:slug.html",
        destination: "/posts/:slug",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // acceptmarkdown.com requires `Vary: Accept` on every negotiable
        // response. Middleware cannot reliably add it to statically
        // prerendered pages, so it is declared here for all page routes.
        source: "/((?!_next/static|_next/image).*)",
        headers: [{ key: "Vary", value: VARY_VALUE }],
      },
      {
        // Machine-readable discovery files should never be stale for long and
        // are safe to share cross-origin so agents can fetch them directly.
        source: "/:path(llms.txt|llms-full.txt|robots.txt|sitemap.xml|feed.xml)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
