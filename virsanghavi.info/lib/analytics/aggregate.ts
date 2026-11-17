import type { Row } from "./policy";

/**
 * Summaries the admin page shows, computed from raw rows in memory. Pure, so
 * it is unit tested against hand-written rows; the page only fetches.
 */

export type Range = { from: Date; to: Date };

export type Bucket = { at: string; visitors: number; pageviews: number };
export type Ranked = { label: string; count: number; visitors: number };
export type PageStat = { path: string; views: number; visitors: number; medianMs: number | null };

export type Overview = {
  unit: "hour" | "day";
  series: Bucket[];
  totals: { visitors: number; pageviews: number; sessions: number; bounceRate: number | null; medianMs: number | null; liveVisitors: number };
  pages: PageStat[];
  referrers: Ranked[];
  countries: Ranked[];
  devices: Ranked[];
  browsers: Ranked[];
  sources: Ranked[];
};

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function rank(rows: Row[], key: (r: Row) => string, limit: number): Ranked[] {
  const m = new Map<string, { count: number; visitors: Set<string> }>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    const e = m.get(k) ?? { count: 0, visitors: new Set<string>() };
    e.count++;
    e.visitors.add(r.visitor);
    m.set(k, e);
  }
  return [...m.entries()]
    .map(([label, e]) => ({ label, count: e.count, visitors: e.visitors.size }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function overview(rows: Row[], range: Range, now = range.to): Overview {
  const from = range.from.getTime();
  const to = range.to.getTime();
  const inRange = rows.filter((r) => {
    const t = Date.parse(r.ts);
    return Number.isFinite(t) && t >= from && t < to;
  });
  const views = inRange.filter((r) => r.event === "view");
  const leaves = inRange.filter((r) => r.event === "leave");

  const hourly = to - from <= 2 * 86_400_000;
  const unit = hourly ? "hour" : "day";
  const step = hourly ? 3_600_000 : 86_400_000;
  const start = hourly ? Math.floor(from / step) * step : Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), range.from.getUTCDate());
  const buckets = new Map<number, { visitors: Set<string>; pageviews: number }>();
  for (let t = start; t < to; t += step) buckets.set(t, { visitors: new Set(), pageviews: 0 });
  for (const v of views) {
    const t = Date.parse(v.ts);
    const key = hourly ? Math.floor(t / step) * step : Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate());
    const b = buckets.get(key);
    if (!b) continue;
    b.pageviews++;
    b.visitors.add(v.visitor);
  }
  const series: Bucket[] = [...buckets.entries()].map(([at, b]) => ({ at: new Date(at).toISOString(), visitors: b.visitors.size, pageviews: b.pageviews }));

  const sessions = new Map<string, number>();
  for (const v of views) sessions.set(v.session, (sessions.get(v.session) ?? 0) + 1);
  const bounced = [...sessions.values()].filter((n) => n <= 1).length;

  const durations = leaves.map((l) => num(l.duration_ms)).filter((n): n is number => n !== null && n >= 0);
  const perPage = new Map<string, number[]>();
  for (const l of leaves) {
    const d = num(l.duration_ms);
    if (d === null || d < 0) continue;
    perPage.set(l.path, [...(perPage.get(l.path) ?? []), d]);
  }
  const pages: PageStat[] = rank(views, (r) => r.path, 20).map((p) => ({ path: p.label, views: p.count, visitors: p.visitors, medianMs: median(perPage.get(p.label) ?? []) }));

  const liveSince = now.getTime() - 5 * 60_000;
  const live = new Set(inRange.filter((r) => Date.parse(r.ts) >= liveSince).map((r) => r.visitor));

  return {
    unit,
    series,
    totals: {
      visitors: new Set(views.map((v) => v.visitor)).size,
      pageviews: views.length,
      sessions: sessions.size,
      bounceRate: sessions.size ? bounced / sessions.size : null,
      medianMs: median(durations),
      liveVisitors: live.size,
    },
    pages,
    referrers: rank(views, (r) => r.referrer, 10),
    countries: rank(views, (r) => r.country, 10),
    devices: rank(views, (r) => r.device, 3),
    browsers: rank(views, (r) => r.browser, 6),
    sources: rank(views, (r) => r.utm_source, 10),
  };
}
