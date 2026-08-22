/**
 * Single source of truth for site-wide identity.
 *
 * Everything that needs to name, link to, or describe this site — metadata,
 * JSON-LD, llms.txt, the sitemap, the RSS feed — reads from here so the
 * machine-readable surfaces can never drift from each other.
 */

/**
 * Canonical origin. Overridable so preview deployments and tests can point at
 * themselves without hardcoding production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.virsanghavi.com"
).replace(/\/$/, "");

export const site = {
  url: SITE_URL,
  name: "Vir Sanghavi",
  handle: "virsanghavi",
  jobTitle: "Co-Founder & CEO, Ravioli",
  tagline: "CEO @ Ravioli, building a free-to-play prediction market, with real prizes.",
  description:
    "Personal site of Vir Sanghavi — co-founder and CEO of Ravioli, a free-to-play prediction market with real prizes. Essays on building startups young, prediction-market design, multi-agent AI orchestration, and shipping fast.",
  email: "Virrsanghavi@gmail.com",
  phone: "+1-832-907-4410",
  locality: "Houston",
  region: "TX",
  country: "US",
  resumePath: "/Vir-Sanghavi-Resume.pdf",
  avatar: "/vir2.png",
  photo: "/IMG_2235.jpeg",
  github: "VirSanghavi",
  language: "en",
  /** Profiles used for JSON-LD `sameAs` and the social rows in the UI. */
  sameAs: [
    "https://github.com/VirSanghavi",
    "https://linkedin.com/in/vir-sanghavi",
    "https://x.com/virsanghavi13",
    "https://instagram.com/vir.sanghavi13",
  ],
} as const;

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
