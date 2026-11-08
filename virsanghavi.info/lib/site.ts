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

/**
 * The X handle changes on this day (UTC). The site is prerendered, so the
 * value is fixed at build time; `/api/cron/rebuild-if-stale` runs daily and
 * triggers a redeploy once the live build no longer matches today's answer.
 */
export const X_HANDLE_SWITCH_DATE = "2026-11-13";
const X_HANDLE_BEFORE = "virsanghavi13";
const X_HANDLE_AFTER = "VirSanghavi";

/** The X handle that is correct on a given day. */
export function xHandleOn(date: Date): string {
  return date.toISOString().slice(0, 10) >= X_HANDLE_SWITCH_DATE ? X_HANDLE_AFTER : X_HANDLE_BEFORE;
}

const xHandle = xHandleOn(new Date());

export const site = {
  url: SITE_URL,
  name: "Vir Sanghavi",
  handle: "virsanghavi",
  jobTitle: "Co-Founder & CEO, Ravioli",
  tagline: "Prev. CTO, Tilt (5k+ users) | 2x YC hackathon winner",
  description:
    "Personal site of Vir Sanghavi — co-founder and CEO of Ravioli, a free-to-play prediction market with real prizes. Essays on building startups young, prediction-market design, multi-agent AI orchestration, and shipping fast.",
  email: "vir@virsanghavi.com",
  phone: "+1-832-907-4410",
  locality: "Houston",
  region: "TX",
  country: "US",
  resumePath: "/Vir-Sanghavi-Resume.pdf",
  avatar: "/vir3.png",
  photo: "/IMG_2235.jpeg",
  github: "VirSanghavi",
  /** Current X handle, without the `@`. See `X_HANDLE_SWITCH_DATE`. */
  xHandle,
  xUrl: `https://x.com/${xHandle}`,
  language: "en",
  /** Profiles used for JSON-LD `sameAs` and the social rows in the UI. */
  sameAs: [
    "https://github.com/VirSanghavi",
    "https://linkedin.com/in/vir-sanghavi",
    `https://x.com/${xHandle}`,
    "https://instagram.com/vir.sanghavi13",
  ],
} as const;

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
