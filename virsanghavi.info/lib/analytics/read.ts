import "server-only";
import { googleConfig, readTab } from "./google";
import { monthTabsBetween, type Row } from "./policy";
import { overview, type Overview, type Range } from "./aggregate";

/**
 * Rows for a range, read from the month tabs it spans. Each tab is cached
 * per instance for a minute so a reload of the admin page does not re-read
 * the sheet, and past months (which never change) for an hour.
 */

const cache = new Map<string, { rows: Row[]; at: number }>();

function ttlFor(tab: string, now: Date): number {
  return tab === now.toISOString().slice(0, 7) ? 60_000 : 3_600_000;
}

export type Loaded = { overview: Overview; configured: boolean; tabs: string[] };

export async function loadOverview(range: Range, now = new Date()): Promise<Loaded> {
  const cfg = googleConfig();
  const tabs = monthTabsBetween(range.from, range.to);
  if (!cfg) return { overview: overview([], range, now), configured: false, tabs };
  const rows: Row[] = [];
  for (const tab of tabs) {
    const hit = cache.get(tab);
    if (hit && now.getTime() - hit.at < ttlFor(tab, now)) {
      rows.push(...hit.rows);
      continue;
    }
    const fresh = await readTab(cfg, tab);
    cache.set(tab, { rows: fresh, at: now.getTime() });
    rows.push(...fresh);
  }
  return { overview: overview(rows, range, now), configured: true, tabs };
}
