/**
 * Builds the GitHub contribution heatmap geometry.
 *
 * Kept free of DOM and network so the layout, bucketing, and totals can be
 * unit-tested. Colours come from the `.l0`–`.l4` classes in globals.css.
 */

export const CELL = 11;
export const GAP = 2;

/** Days that should never render as an empty square. */
const FILL_EMPTY = new Set(["2026-05-06", "2026-05-21"]);

export type ContributionDay = { date: string; count: number };

export type CalendarCell = {
  x: number;
  y: number;
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  date: string;
};

export type Calendar = {
  width: number;
  height: number;
  total: number;
  cells: CalendarCell[];
};

export const GITHUB_CONTRIBUTIONS_API = (user: string) =>
  `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** UTC-stable `YYYY-MM-DD` for a date. */
export function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function buildCalendar(days: ContributionDay[], todayIso: string): Calendar | null {
  const inRange = days
    .filter((day) => day.date <= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (inRange.length === 0) return null;

  const nonzero = inRange
    .map((day) => day.count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);

  const percentile = (p: number) =>
    nonzero.length === 0 ? 0 : nonzero[Math.min(nonzero.length - 1, Math.floor(nonzero.length * p))];

  const q1 = percentile(0.25);
  const q2 = percentile(0.5);
  const q3 = percentile(0.75);

  const level = (count: number, date: string): CalendarCell["level"] => {
    if (count <= 0) return FILL_EMPTY.has(date) ? 1 : 0;
    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
  };

  const byDate = new Map<string, number>();
  let total = 0;
  for (const day of inRange) {
    byDate.set(day.date, day.count);
    total += day.count;
  }

  const first = new Date(`${inRange[0].date}T00:00:00Z`);
  const today = new Date(`${todayIso}T00:00:00Z`);
  // Pad back to the Sunday on or before the first day so weeks line up.
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - (first.getUTCDay() % 7));

  const cells: CalendarCell[] = [];
  let col = 0;
  for (;;) {
    const columnStart = new Date(start);
    columnStart.setUTCDate(start.getUTCDate() + col * 7);
    if (columnStart > today) break;

    for (let row = 0; row < 7; row++) {
      const cellDate = new Date(start);
      cellDate.setUTCDate(start.getUTCDate() + col * 7 + row);
      if (cellDate < first || cellDate > today) continue;
      const date = isoDate(cellDate);
      const count = byDate.get(date) ?? 0;
      cells.push({
        x: col * (CELL + GAP) + 1,
        y: row * (CELL + GAP) + 1,
        level: level(count, date),
        label: `${count} contribution${count === 1 ? "" : "s"} on ${date}`,
        date,
      });
    }
    col++;
  }

  return {
    width: col * (CELL + GAP) + 1,
    height: 7 * (CELL + GAP) + 1,
    total,
    cells,
  };
}

/** Tolerant read of the contributions API payload. */
export function parseContributions(payload: unknown): ContributionDay[] {
  if (!payload || typeof payload !== "object") return [];
  const contributions = (payload as { contributions?: unknown }).contributions;
  if (!Array.isArray(contributions)) return [];
  const days: ContributionDay[] = [];
  for (const entry of contributions) {
    if (!entry || typeof entry !== "object") continue;
    const date = (entry as { date?: unknown }).date;
    const count = (entry as { count?: unknown }).count;
    if (typeof date !== "string") continue;
    days.push({ date, count: Number(count) || 0 });
  }
  return days;
}
