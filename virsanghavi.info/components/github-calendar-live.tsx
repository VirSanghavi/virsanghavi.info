"use client";

import { useEffect, useState } from "react";
import {
  buildCalendar,
  GITHUB_CONTRIBUTIONS_API,
  isoDate,
  parseContributions,
  type Calendar,
} from "@/lib/github-calendar";

export function GithubCalendarLive({
  initial,
  user,
}: {
  initial: Calendar | null;
  user: string;
}) {
  const [calendar, setCalendar] = useState<Calendar | null>(initial);

  useEffect(() => {
    let cancelled = false;
    fetch(GITHUB_CONTRIBUTIONS_API(user), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((payload) => {
        if (cancelled) return;
        const fresh = buildCalendar(parseContributions(payload), isoDate(new Date()));
        if (fresh) setCalendar(fresh);
      })
      .catch(() => {
        /* keep whatever the server rendered */
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!calendar) {
    return <span className="gh-cal-fallback">View contribution activity on GitHub</span>;
  }

  return (
    <svg
      className="gh-cal"
      viewBox={`0 0 ${calendar.width} ${calendar.height}`}
      width="100%"
      role="img"
      aria-label={`${calendar.total} GitHub contributions in the last year`}
      preserveAspectRatio="xMinYMid meet"
    >
      {calendar.cells.map((cell) => (
        <rect
          key={cell.date}
          className={`d l${cell.level}`}
          x={cell.x}
          y={cell.y}
          width={11}
          height={11}
          rx={2}
        >
          <title>{cell.label}</title>
        </rect>
      ))}
    </svg>
  );
}
