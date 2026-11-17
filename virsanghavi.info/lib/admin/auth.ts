import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

/**
 * The /admin gate: one password, checked in constant time, which sets a
 * signed, HttpOnly cookie for 30 days. No accounts, no database. The cookie
 * is an HMAC of its expiry with ADMIN_SESSION_SECRET, so it cannot be forged
 * and changing the secret signs everyone out.
 *
 * Guesses are rate limited per IP in memory (this instance only; good
 * enough to make brute force pointless against a long password).
 */

export const ADMIN_COOKIE = "vs_admin";
const TTL_SECONDS = 30 * 24 * 3600;
const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 10 * 60_000;

const attempts = new Map<string, { count: number; since: number }>();

function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || null;
}

function sign(exp: number, key: string): string {
  return createHmac("sha256", key).update(`admin.${exp}`).digest("base64url");
}

export function issueToken(nowSeconds = Math.floor(Date.now() / 1000), key = secret()): string | null {
  if (!key) return null;
  const exp = nowSeconds + TTL_SECONDS;
  return `${exp}.${sign(exp, key)}`;
}

export function verifyToken(token: string | undefined, nowSeconds = Math.floor(Date.now() / 1000), key = secret()): boolean {
  if (!token || !key) return false;
  const [expRaw, sig, extra] = token.split(".");
  if (extra !== undefined || !/^\d{1,12}$/.test(expRaw ?? "") || !sig) return false;
  const exp = Number(expRaw);
  if (exp < nowSeconds) return false;
  const want = Buffer.from(sign(exp, key));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Constant-time password check against ADMIN_PASSWORD. */
export function passwordMatches(candidate: string, expected = process.env.ADMIN_PASSWORD): boolean {
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function tooManyAttempts(ip: string, now = Date.now()): boolean {
  const a = attempts.get(ip);
  if (!a || now - a.since > ATTEMPT_WINDOW_MS) return false;
  return a.count >= MAX_ATTEMPTS;
}

export function recordAttempt(ip: string, now = Date.now()): void {
  const a = attempts.get(ip);
  if (!a || now - a.since > ATTEMPT_WINDOW_MS) {
    // Re-insert so the map stays in recency order; evict the oldest, never everyone.
    attempts.delete(ip);
    attempts.set(ip, { count: 1, since: now });
  } else a.count++;
  while (attempts.size > 5_000) {
    const oldest = attempts.keys().next().value;
    if (oldest === undefined) break;
    attempts.delete(oldest);
  }
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(ADMIN_COOKIE)?.value);
}

/**
 * The client address as the platform saw it. Vercel sets `x-real-ip` itself,
 * so a client cannot pick its own bucket by sending a forged
 * `x-forwarded-for`; that header is only a fallback for local runs.
 */
export async function requestIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : "").trim() || "unknown";
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge,
  };
}
