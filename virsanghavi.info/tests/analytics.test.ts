import { describe, expect, it } from "vitest";
import { overview } from "@/lib/analytics/aggregate";
import { cleanPath, describeAgent, isBot, isCounted, monthTabsBetween, referrerDomain, utmSource, type Row } from "@/lib/analytics/policy";
import { visitorId } from "@/lib/analytics/visitor";

describe("beacon policy", () => {
  it("keeps only the path: no query, no fragment, no trailing slash", () => {
    expect(cleanPath("/posts/x?utm_source=a#b")).toBe("/posts/x");
    expect(cleanPath("https://www.virsanghavi.com/posts/x/")).toBe("/posts/x");
    expect(cleanPath("/")).toBe("/");
    expect(cleanPath("posts/x")).toBeNull();
    expect(cleanPath("javascript:alert(1)")).toBeNull();
    expect(cleanPath(42)).toBeNull();
  });

  it("never yields a path that could leave the site when rendered as a link", () => {
    expect(cleanPath("//evil.example/x")).toBeNull();
    expect(cleanPath("/\\evil.example")).toBeNull();
    expect(cleanPath("/%2F%2Fevil.example")).toBe("/%2F%2Fevil.example");
    expect(cleanPath("/posts/x\u0000")).toBeNull();
    expect(cleanPath("https://evil.example/posts/x")).toBe("/posts/x");
  });

  it("never counts the admin or non-pages", () => {
    expect(isCounted("/admin")).toBe(false);
    expect(isCounted("/admin/anything")).toBe(false);
    expect(isCounted("/api/t")).toBe(false);
    expect(isCounted("/posts/x")).toBe(true);
  });

  it("reduces a referrer to a foreign domain, and drops our own", () => {
    expect(referrerDomain("https://t.co/abc?x=1", "www.virsanghavi.com")).toBe("t.co");
    expect(referrerDomain("https://www.google.com/search?q=secret", "www.virsanghavi.com")).toBe("google.com");
    expect(referrerDomain("https://www.virsanghavi.com/posts/a", "www.virsanghavi.com")).toBe("");
    expect(referrerDomain("", "www.virsanghavi.com")).toBe("");
    expect(referrerDomain("not a url", "www.virsanghavi.com")).toBe("");
  });

  it("keeps a utm_source or ref and nothing else from the query", () => {
    expect(utmSource("https://x.test/?utm_source=Newsletter&token=secret")).toBe("newsletter");
    expect(utmSource("https://x.test/?ref=hn")).toBe("hn");
    expect(utmSource("https://x.test/?token=secret")).toBe("");
  });

  it("recognises machines, including this site's own e2e client", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("virsanghavi-e2e/1.0")).toBe(true);
    expect(isBot("curl/8.4")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")).toBe(false);
  });

  it("reduces a user agent to device, browser and OS families", () => {
    expect(describeAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")).toEqual({ device: "phone", browser: "Safari", os: "iOS" });
    expect(describeAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")).toEqual({ device: "desktop", browser: "Chrome", os: "macOS" });
    expect(describeAgent("Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")).toEqual({ device: "tablet", browser: "Chrome", os: "Android" });
    expect(describeAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0")).toEqual({ device: "desktop", browser: "Firefox", os: "Windows" });
  });

  it("lists every month tab a range touches", () => {
    expect(monthTabsBetween(new Date("2026-11-10T00:00:00Z"), new Date("2026-11-17T00:00:00Z"))).toEqual(["2026-11"]);
    expect(monthTabsBetween(new Date("2026-09-20T00:00:00Z"), new Date("2026-11-17T00:00:00Z"))).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(monthTabsBetween(new Date("2026-12-31T23:00:00Z"), new Date("2027-01-01T01:00:00Z"))).toEqual(["2026-12", "2027-01"]);
  });
});

describe("visitor id", () => {
  it("is stable within a day, different across days and across people, and never the inputs", () => {
    const a = visitorId("k", "1.2.3.4", "UA", new Date("2026-11-17T10:00:00Z"));
    expect(visitorId("k", "1.2.3.4", "UA", new Date("2026-11-17T23:00:00Z"))).toBe(a);
    expect(visitorId("k", "1.2.3.4", "UA", new Date("2026-11-18T00:00:00Z"))).not.toBe(a);
    expect(visitorId("k", "1.2.3.5", "UA", new Date("2026-11-17T10:00:00Z"))).not.toBe(a);
    expect(visitorId("other", "1.2.3.4", "UA", new Date("2026-11-17T10:00:00Z"))).not.toBe(a);
    expect(a).toHaveLength(16);
    expect(a).not.toContain("1.2.3.4");
  });
});

const row = (over: Partial<Row>): Row => ({
  ts: "2026-11-17T10:00:00.000Z",
  visitor: "v1",
  session: "s1",
  event: "view",
  path: "/",
  referrer: "",
  country: "US",
  device: "desktop",
  browser: "Chrome",
  os: "macOS",
  duration_ms: "",
  utm_source: "",
  ...over,
});

describe("overview", () => {
  const range = { from: new Date("2026-11-10T00:00:00Z"), to: new Date("2026-11-17T12:00:00Z") };
  const rows: Row[] = [
    row({ ts: "2026-11-17T10:00:00Z", visitor: "a", session: "s1", path: "/", referrer: "t.co" }),
    row({ ts: "2026-11-17T10:00:40Z", visitor: "a", session: "s1", path: "/", event: "leave", duration_ms: "40000" }),
    row({ ts: "2026-11-17T10:01:00Z", visitor: "a", session: "s1", path: "/posts/x" }),
    row({ ts: "2026-11-16T09:00:00Z", visitor: "b", session: "s2", path: "/posts/x", country: "GB", device: "phone", browser: "Safari" }),
    row({ ts: "2026-11-16T09:02:00Z", visitor: "b", session: "s2", path: "/posts/x", event: "leave", duration_ms: "120000" }),
    row({ ts: "2026-11-01T09:00:00Z", visitor: "old", session: "s0", path: "/" }), // outside the range
    row({ ts: "garbage", visitor: "bad", session: "s9", path: "/" }), // never breaks the rest
  ];
  const o = overview(rows, range, new Date("2026-11-17T10:03:00Z"));

  it("counts visitors, views and sessions inside the range only", () => {
    expect(o.totals).toMatchObject({ visitors: 2, pageviews: 3, sessions: 2, liveVisitors: 1 });
    expect(o.totals.bounceRate).toBe(0.5);
    expect(o.totals.medianMs).toBe(80000);
  });

  it("ranks pages with their own median time, and breakdowns by views", () => {
    expect(o.pages).toEqual([
      { path: "/posts/x", views: 2, visitors: 2, medianMs: 120000 },
      { path: "/", views: 1, visitors: 1, medianMs: 40000 },
    ]);
    expect(o.referrers).toEqual([{ label: "t.co", count: 1, visitors: 1 }]);
    expect(o.countries.map((c) => c.label)).toEqual(["US", "GB"]);
    expect(o.devices.map((d) => [d.label, d.count])).toEqual([
      ["desktop", 2],
      ["phone", 1],
    ]);
  });

  it("uses daily buckets beyond two days and fills empty days", () => {
    expect(o.unit).toBe("day");
    expect(o.series).toHaveLength(8);
    expect(o.series.find((b) => b.at.startsWith("2026-11-16"))).toMatchObject({ visitors: 1, pageviews: 1 });
    expect(o.series.find((b) => b.at.startsWith("2026-11-12"))).toMatchObject({ visitors: 0, pageviews: 0 });
  });

  it("uses hourly buckets for a day", () => {
    const day = overview(rows, { from: new Date("2026-11-16T12:00:00Z"), to: new Date("2026-11-17T12:00:00Z") });
    expect(day.unit).toBe("hour");
    expect(day.series).toHaveLength(24);
    expect(day.totals.pageviews).toBe(2);
  });

  it("is empty, not broken, with no rows", () => {
    const e = overview([], range);
    expect(e.totals).toMatchObject({ visitors: 0, pageviews: 0, sessions: 0, bounceRate: null, medianMs: null });
    expect(e.pages).toEqual([]);
  });
});
