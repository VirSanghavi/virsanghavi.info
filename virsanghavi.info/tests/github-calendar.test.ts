import { describe, expect, it } from "vitest";
import { buildCalendar, CELL, GAP, isoDate, parseContributions } from "@/lib/github-calendar";

function days(from: string, count: number, counts: number[] = []) {
  const start = new Date(`${from}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return { date: isoDate(d), count: counts[i] ?? 0 };
  });
}

describe("isoDate", () => {
  it("formats in UTC so the grid does not shift by timezone", () => {
    expect(isoDate(new Date("2026-05-06T23:30:00Z"))).toBe("2026-05-06");
    expect(isoDate(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
  });
});

describe("buildCalendar", () => {
  it("returns null when there is nothing in range", () => {
    expect(buildCalendar([], "2026-05-01")).toBeNull();
    expect(buildCalendar(days("2026-06-01", 3), "2026-05-01")).toBeNull();
  });

  it("ignores days in the future", () => {
    const calendar = buildCalendar(days("2026-05-01", 10, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), "2026-05-05")!;
    expect(calendar.cells).toHaveLength(5);
    expect(calendar.total).toBe(5);
  });

  it("places cells on a 7-row weekly grid", () => {
    const calendar = buildCalendar(days("2026-05-01", 30), "2026-05-30")!;
    const ys = new Set(calendar.cells.map((c) => c.y));
    expect(ys.size).toBeLessThanOrEqual(7);
    for (const cell of calendar.cells) {
      expect((cell.y - 1) % (CELL + GAP)).toBe(0);
      expect((cell.x - 1) % (CELL + GAP)).toBe(0);
    }
    expect(calendar.height).toBe(7 * (CELL + GAP) + 1);
  });

  it("buckets counts into five levels by quartile", () => {
    const counts = Array.from({ length: 40 }, (_, i) => i);
    const calendar = buildCalendar(days("2026-01-01", 40, counts), "2026-02-09")!;
    const levels = new Set(calendar.cells.map((c) => c.level));
    expect(levels.has(0)).toBe(true);
    expect(levels.has(4)).toBe(true);
    const highest = calendar.cells.find((c) => c.date === "2026-02-09");
    expect(highest?.level).toBe(4);
  });

  it("never shows the two pinned days as empty", () => {
    const calendar = buildCalendar(days("2026-05-01", 31, [5]), "2026-05-31")!;
    expect(calendar.cells.find((c) => c.date === "2026-05-06")?.level).toBe(1);
    expect(calendar.cells.find((c) => c.date === "2026-05-21")?.level).toBe(1);
    expect(calendar.cells.find((c) => c.date === "2026-05-07")?.level).toBe(0);
  });

  it("labels each cell for its tooltip", () => {
    const calendar = buildCalendar(days("2026-05-01", 2, [1, 3]), "2026-05-02")!;
    expect(calendar.cells[0].label).toBe("1 contribution on 2026-05-01");
    expect(calendar.cells[1].label).toBe("3 contributions on 2026-05-02");
  });

  it("has one cell per in-range day, with no duplicates", () => {
    const calendar = buildCalendar(days("2026-03-01", 60), "2026-04-29")!;
    expect(calendar.cells).toHaveLength(60);
    expect(new Set(calendar.cells.map((c) => c.date)).size).toBe(60);
  });
});

describe("parseContributions", () => {
  it("reads the API payload shape", () => {
    expect(
      parseContributions({ contributions: [{ date: "2026-01-01", count: 4 }] }),
    ).toEqual([{ date: "2026-01-01", count: 4 }]);
  });

  it("tolerates junk without discarding the good rows", () => {
    // One malformed element must never blank the whole graph.
    expect(
      parseContributions({
        contributions: [null, { count: 3 }, { date: "2026-01-02" }, { date: "2026-01-03", count: "7" }],
      }),
    ).toEqual([
      { date: "2026-01-02", count: 0 },
      { date: "2026-01-03", count: 7 },
    ]);
  });

  it("returns an empty list for an unusable payload", () => {
    expect(parseContributions(null)).toEqual([]);
    expect(parseContributions({})).toEqual([]);
    expect(parseContributions({ contributions: "nope" })).toEqual([]);
  });
});
