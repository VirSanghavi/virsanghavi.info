import "server-only";
import { appendRows, googleConfig } from "./google";
import { monthTab, type Row } from "./policy";

/**
 * Micro-batching for the collector. Vercel reuses function instances, so
 * rows arriving within a short window are written with one Sheets call
 * instead of one each. The Sheets API allows 300 writes a minute; a post
 * that takes off would blow through that one-row-at-a-time.
 *
 * The flush is handed to `after()` by the route, which keeps the instance
 * alive until it is done. Nothing here is durable: if an instance dies
 * mid-window those rows are lost, which is acceptable for page counts.
 */

const WINDOW_MS = 1500;
const MAX_ROWS = 400;

type Pending = { rows: Row[]; timer: ReturnType<typeof setTimeout> | null; flushing: Promise<void> | null };
const pending = new Map<string, Pending>();

export function enqueue(row: Row, at: Date): Promise<void> {
  const tab = monthTab(at);
  const p = pending.get(tab) ?? { rows: [], timer: null, flushing: null };
  pending.set(tab, p);
  p.rows.push(row);
  if (p.rows.length >= MAX_ROWS) return flush(tab);
  if (!p.timer) {
    return new Promise((resolve) => {
      p.timer = setTimeout(() => {
        p.timer = null;
        void flush(tab).finally(resolve);
      }, WINDOW_MS);
    });
  }
  return p.flushing ?? Promise.resolve();
}

export async function flush(tab: string): Promise<void> {
  const p = pending.get(tab);
  if (!p || !p.rows.length) return;
  if (p.timer) {
    clearTimeout(p.timer);
    p.timer = null;
  }
  const rows = p.rows.splice(0);
  const cfg = googleConfig();
  if (!cfg) return;
  p.flushing = appendRows(cfg, tab, rows).catch((err) => {
    console.error("[analytics] append failed:", err instanceof Error ? err.message : err);
  });
  await p.flushing;
  p.flushing = null;
}
