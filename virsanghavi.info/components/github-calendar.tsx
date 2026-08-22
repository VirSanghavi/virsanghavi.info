import { site } from "@/lib/site";
import {
  buildCalendar,
  GITHUB_CONTRIBUTIONS_API,
  isoDate,
  parseContributions,
  type Calendar,
} from "@/lib/github-calendar";
import { GithubCalendarLive } from "./github-calendar-live";

export const CALENDAR_REVALIDATE_SECONDS = 900;

async function loadCalendar(): Promise<Calendar | null> {
  try {
    const response = await fetch(GITHUB_CONTRIBUTIONS_API(site.github), {
      next: { revalidate: CALENDAR_REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    const days = parseContributions(await response.json());
    return buildCalendar(days, isoDate(new Date()));
  } catch {
    // A heatmap is decorative; never let it break the page.
    return null;
  }
}

/**
 * Server-rendered so the graph is present without JavaScript, then refreshed
 * on the client so a push shows up without waiting for revalidation.
 */
export async function GithubCalendar() {
  const calendar = await loadCalendar();

  return (
    <div className="github-graph">
      <h2>GitHub Activity</h2>
      <a
        href={`https://github.com/${site.github}`}
        target="_blank"
        rel="noopener noreferrer"
        className="gh-cal-link"
      >
        <GithubCalendarLive initial={calendar} user={site.github} />
      </a>
    </div>
  );
}
