import { createHmac } from "node:crypto";

/**
 * Who a visitor is, without knowing who they are. The id is an HMAC of the
 * UTC day, the IP and the user agent with a server secret: the same person
 * on the same day counts once, and nothing stored can be turned back into an
 * address. Tomorrow they are someone new. This is the Plausible/Fathom model
 * and is why the site needs no cookie and no consent banner for counting.
 */
export function visitorId(secret: string, ip: string, userAgent: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  return createHmac("sha256", secret).update(`${day}\n${ip}\n${userAgent}`).digest("base64url").slice(0, 16);
}

/** The caller's IP as the platform saw it (`x-real-ip` on Vercel). Used only for the hash, never stored. */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const fwd = headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : "").trim() || "unknown";
}

/** Vercel's geolocation header; only a two-letter country is kept. */
export function clientCountry(headers: Headers): string {
  const c = (headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : "";
}
