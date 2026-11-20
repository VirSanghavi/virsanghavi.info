import { after } from "next/server";
import { cleanPath, describeAgent, EVENTS, isBot, isCounted, isExcluded, referrerDomain, utmSource, type EventName, type Row } from "@/lib/analytics/policy";
import { enqueue } from "@/lib/analytics/queue";
import { clientCountry, clientIp, visitorId } from "@/lib/analytics/visitor";
import { site } from "@/lib/site";

/**
 * The beacon endpoint. One small JSON body per page view or page leave,
 * sent with `navigator.sendBeacon`. Everything identifying is reduced here
 * and the row goes to the month's tab of the analytics sheet.
 *
 * Always answers 204 quickly: analytics must never slow a reader down, and
 * a dropped beacon is not worth a retry.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Beacon = { e?: unknown; p?: unknown; r?: unknown; s?: unknown; d?: unknown; u?: unknown };

const SESSION = /^[0-9a-z]{6,32}$/i;
const NO_CONTENT = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const secret = process.env.ANALYTICS_SECRET;
  if (!secret) return NO_CONTENT();
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return NO_CONTENT();
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return NO_CONTENT();
  if (isExcluded(request.headers.get("cookie"))) return NO_CONTENT();

  let body: Beacon;
  try {
    const text = await request.text();
    if (text.length > 2_000) return NO_CONTENT();
    body = JSON.parse(text) as Beacon;
  } catch {
    return NO_CONTENT();
  }
  const event = typeof body.e === "string" && (EVENTS as readonly string[]).includes(body.e) ? (body.e as EventName) : null;
  const path = cleanPath(body.p);
  const session = typeof body.s === "string" && SESSION.test(body.s) ? body.s : null;
  if (!event || !path || !session || !isCounted(path)) return NO_CONTENT();

  const duration = event === "leave" && typeof body.d === "number" && Number.isFinite(body.d) ? Math.max(0, Math.min(Math.round(body.d), 6 * 3_600_000)) : null;
  if (event === "leave" && (duration === null || duration < 1_000)) return NO_CONTENT();

  const now = new Date();
  const agent = describeAgent(ua);
  const row: Row = {
    ts: now.toISOString(),
    visitor: visitorId(secret, clientIp(request.headers), ua, now),
    session,
    event,
    path,
    referrer: event === "view" ? referrerDomain(body.r, new URL(site.url).host) : "",
    country: clientCountry(request.headers),
    device: agent.device,
    browser: agent.browser,
    os: agent.os,
    duration_ms: duration === null ? "" : String(duration),
    utm_source: event === "view" ? utmSource(body.u) : "",
  };
  after(() => enqueue(row, now));
  return NO_CONTENT();
}
