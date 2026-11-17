import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "@/lib/crawlers";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Every AI crawler is named explicitly so the allowance is unambiguous
      // even to parsers that do not fall through to the wildcard group.
      { userAgent: [...AI_CRAWLERS], allow: "/", disallow: "/admin" },
      { userAgent: "*", allow: "/", disallow: "/admin" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
