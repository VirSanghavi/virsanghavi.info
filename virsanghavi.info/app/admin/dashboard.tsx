import type { Bucket, Overview, Ranked } from "@/lib/analytics/aggregate";

/**
 * The analytics dashboard, in the site's own voice: the article column,
 * Atkinson, the accent, dashed underlines. Hand-drawn SVG for the trend,
 * plain bars for the breakdowns, no chart library, nothing that moves.
 */

const COUNTRY = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
const nf = new Intl.NumberFormat("en-US");

export function fmtNumber(n: number): string {
  return nf.format(n);
}

export function fmtDuration(ms: number | null): string {
  if (ms === null) return "–";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

export function fmtPct(v: number | null): string {
  return v === null ? "–" : `${Math.round(v * 100)}%`;
}

function countryName(code: string): string {
  try {
    return COUNTRY?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function Dashboard({ data, configured, rangeKey, excluded }: { data: Overview; configured: boolean; rangeKey: string; excluded: boolean }) {
  const t = data.totals;
  const empty = t.pageviews === 0;
  return (
    <div className="admin-dash">
      {!configured ? (
        <p className="admin-notice">Analytics is not connected on this deployment: the sheet id or Google credentials are missing, so beacons are being dropped and there is nothing to show.</p>
      ) : null}

      <dl className="admin-stats">
        <Stat label="Visitors" value={fmtNumber(t.visitors)} sub={t.liveVisitors ? `${fmtNumber(t.liveVisitors)} in the last 5 minutes` : "none right now"} />
        <Stat label="Page views" value={fmtNumber(t.pageviews)} sub={`${fmtNumber(t.sessions)} sessions`} />
        <Stat label="Time on page" value={fmtDuration(t.medianMs)} sub="median" />
        <Stat label="Bounce" value={fmtPct(t.bounceRate)} sub="one page, then gone" />
      </dl>

      <section className="admin-section">
        <h2>{data.unit === "hour" ? "Visitors by hour" : "Visitors by day"}</h2>
        {empty ? <p className="admin-empty">Nothing in the last {label(rangeKey)}. Views appear here within about a minute of happening.</p> : <Trend series={data.series} unit={data.unit} />}
      </section>

      <div className="admin-grid">
        <section className="admin-section">
          <h2>Pages</h2>
          {data.pages.length === 0 ? (
            <p className="admin-empty">No page views yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Page</th>
                  <th scope="col" className="num">Views</th>
                  <th scope="col" className="num">Visitors</th>
                  <th scope="col" className="num">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.pages.map((p) => (
                  <tr key={p.path}>
                    <td className="path" title={p.path}>
                      <a href={p.path}>{p.path}</a>
                    </td>
                    <td className="num">{fmtNumber(p.views)}</td>
                    <td className="num">{fmtNumber(p.visitors)}</td>
                    <td className="num">{fmtDuration(p.medianMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <Breakdown title="Referrers" rows={data.referrers} empty="Only direct visits so far." />
        <Breakdown title="Countries" rows={data.countries.map((c) => ({ ...c, label: countryName(c.label) }))} empty="No country data yet." />
        <Breakdown title="Devices" rows={data.devices} empty="No sessions yet." />
        <Breakdown title="Browsers" rows={data.browsers} empty="No sessions yet." />
        {data.sources.length ? <Breakdown title="Campaign sources" rows={data.sources} empty="" /> : null}
      </div>

      <p className="admin-foot">
        {excluded ? "This browser is yours and is not counted on any page. " : "This browser is being counted; sign in again to exclude it. "}
        Counted by this site's own beacon: no cookies for readers, no IP addresses, visitor ids reset every day. Rows live in a Google Sheet; the page reads it at most once a minute.
      </p>
    </div>
  );
}

function label(rangeKey: string): string {
  return { "24h": "24 hours", "7d": "7 days", "30d": "30 days", "90d": "90 days" }[rangeKey] ?? rangeKey;
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="admin-stat">
      <dt>{label}</dt>
      <dd>
        <span className="admin-stat-value">{value}</span>
        <span className="admin-stat-sub">{sub}</span>
      </dd>
    </div>
  );
}

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const hourFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: "UTC" });

function Trend({ series, unit }: { series: Bucket[]; unit: "hour" | "day" }) {
  const W = 720;
  const H = 160;
  const pad = 6;
  const max = Math.max(1, ...series.map((b) => b.pageviews));
  const slot = W / Math.max(series.length, 1);
  const barW = Math.max(2, slot - Math.min(6, slot * 0.35));
  const first = series[0];
  const last = series[series.length - 1];
  const fmt = unit === "hour" ? (d: string) => `${dayFmt.format(new Date(d))}, ${hourFmt.format(new Date(d))}` : (d: string) => dayFmt.format(new Date(d));
  return (
    <figure className="admin-trend">
      <p className="admin-legend" aria-hidden="true">
        <i className="admin-swatch admin-swatch-visitors" /> visitors <i className="admin-swatch admin-swatch-views" /> page views
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={pad + (H - pad) * f} y2={pad + (H - pad) * f} className="admin-trend-grid" vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((b, i) => {
          const x = i * slot + (slot - barW) / 2;
          const pv = ((H - pad) * b.pageviews) / max;
          const vis = ((H - pad) * b.visitors) / max;
          return (
            <g key={b.at}>
              <rect x={x} y={H - pv} width={barW} height={pv} className="admin-trend-views" />
              <rect x={x} y={H - vis} width={barW} height={vis} className="admin-trend-visitors" />
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span>{first ? fmt(first.at) : ""}</span>
        <span>{last ? fmt(last.at) : ""}</span>
      </figcaption>
      <table className="sr-only">
        <caption>Visitors and page views per {unit}</caption>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Visitors</th>
            <th scope="col">Page views</th>
          </tr>
        </thead>
        <tbody>
          {series.map((b) => (
            <tr key={b.at}>
              <th scope="row">{fmt(b.at)}</th>
              <td>{b.visitors}</td>
              <td>{b.pageviews}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Breakdown({ title, rows, empty }: { title: string; rows: Ranked[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="admin-section">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="admin-empty">{empty}</p>
      ) : (
        <ol className="admin-bars">
          {rows.map((r) => (
            <li key={r.label}>
              <span className="admin-bar-label" title={r.label}>
                {r.label}
              </span>
              <span className="admin-bar-count">{fmtNumber(r.count)}</span>
              <span className="admin-bar-track">
                <span className="admin-bar-fill" style={{ width: `${(r.count / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
