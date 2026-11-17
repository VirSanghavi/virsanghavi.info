/**
 * First-party, cookieless analytics for this site. Shared by the browser
 * beacon, the collector and the admin page so all three agree on the rules.
 *
 * What is kept per page view: a timestamp, a visitor id that cannot be
 * reversed and changes every day, a per-tab session id, the path, the
 * referrer's domain, the country from the edge header, device class,
 * browser and OS family, and how long the page was open. No IP address, no
 * cookie, no user agent string, no query strings, nothing about the person.
 *
 * Everything lives in one Google Sheet, a tab per month, which the admin
 * page reads and summarises. See /privacy for the public description.
 */

/** Same-origin collector. `proxy.ts` leaves /api alone so beacons are never negotiated. */
export const COLLECTOR_PATH = "/api/t";

/** Event kinds. `leave` carries how long the page was open. */
export const EVENTS = ["view", "leave"] as const;
export type EventName = (typeof EVENTS)[number];

/** Columns of every month tab, in order. Changing this changes the sheet schema. */
export const COLUMNS = [
  "ts",
  "visitor",
  "session",
  "event",
  "path",
  "referrer",
  "country",
  "device",
  "browser",
  "os",
  "duration_ms",
  "utm_source",
] as const;
export type Column = (typeof COLUMNS)[number];
export type Row = Record<Column, string>;

/** A beacon with any of these in its user agent is a machine, not a reader. */
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|preview|fetch|python|curl|wget|java\/|go-http|okhttp|axios|node|virsanghavi-e2e/i;

export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT.test(userAgent);
}

/** Pages that are never counted: the admin itself, and anything that is not a page. */
export function isCounted(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) return false;
  return true;
}

/**
 * Path only: no query, no fragment, no trailing slash, length capped. Parsed
 * through the URL parser against a fixed origin, so a value like
 * `//evil.example` or `/\\evil.example` can never become a link that leaves
 * the site when the admin page renders it.
 */
export function cleanPath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw || raw.length > 2_048) return null;
  if (!/^(https?:\/\/|\/)/i.test(raw) || raw.startsWith("//") || raw.includes("\\")) return null;
  // Control characters never belong in a URL; the parser would quietly percent-encode them.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  let path: string;
  try {
    path = new URL(raw, "https://placeholder.invalid").pathname;
  } catch {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//") || /[^\x21-\x7e]/.test(path)) return null;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path.slice(0, 200);
}

/** Only the referring site's host, lower-cased, without a `www.`; our own host is "direct". */
export function referrerDomain(raw: unknown, ownHost: string): string {
  if (typeof raw !== "string" || !raw) return "";
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === ownHost.replace(/^www\./, "")) return "";
    return host.slice(0, 100);
  } catch {
    return "";
  }
}

/** Keep a UTM source if there is one; nothing else from the query string survives. */
export function utmSource(raw: unknown): string {
  if (typeof raw !== "string") return "";
  try {
    const u = new URL(raw);
    return (u.searchParams.get("utm_source") ?? u.searchParams.get("ref") ?? "").slice(0, 60).toLowerCase();
  } catch {
    return "";
  }
}

export type Device = "phone" | "tablet" | "desktop";

/** Coarse device, browser and OS families from the user agent; the string itself is dropped. */
export function describeAgent(userAgent: string): { device: Device; browser: string; os: string } {
  const ua = userAgent;
  const device: Device = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? "tablet" : /Mobi|iPhone|Android/i.test(ua) ? "phone" : "desktop";
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "Other";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\/|CriOS/.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  return { device, browser, os };
}

/** `YYYY-MM` tab name for a moment, in UTC. */
export function monthTab(at: Date): string {
  return at.toISOString().slice(0, 7);
}

/** Every month tab that intersects [from, to], oldest first. */
export function monthTabsBetween(from: Date, to: Date): string[] {
  const tabs: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  while (cursor <= to) {
    tabs.push(monthTab(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return tabs;
}
