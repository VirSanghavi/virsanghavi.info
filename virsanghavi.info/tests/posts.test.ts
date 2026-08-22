import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatShortDate,
  getAllPosts,
  getPost,
  getPostsByYear,
  postToMarkdown,
  toIsoDate,
} from "@/lib/posts";

describe("toIsoDate", () => {
  it("keeps the authored day for a YAML Date (parsed at UTC midnight)", () => {
    // Regression: reading a UTC-midnight Date with local getters west of UTC
    // rendered every post one day early in the previous static build.
    expect(toIsoDate(new Date("2026-05-31T00:00:00Z"))).toBe("2026-05-31");
  });

  it("passes an ISO string through untouched", () => {
    expect(toIsoDate("2026-02-17")).toBe("2026-02-17");
    expect(toIsoDate("2026-02-17T18:00:00Z")).toBe("2026-02-17");
  });

  it("falls back rather than throwing on junk", () => {
    expect(toIsoDate(undefined)).toBe("1970-01-01");
    expect(toIsoDate("not a date")).toBe("1970-01-01");
  });
});

describe("date formatting", () => {
  it("formats in UTC, independent of the machine's timezone", () => {
    expect(formatDate("2026-05-31")).toBe("31 May, 2026");
    expect(formatShortDate("2026-05-31")).toBe("31 May");
    expect(formatDate("2024-12-15")).toBe("15 Dec, 2024");
  });
});

describe("getAllPosts", () => {
  const posts = getAllPosts();

  it("finds every markdown source", () => {
    expect(posts.length).toBeGreaterThanOrEqual(17);
  });

  it("sorts newest first", () => {
    const dates = posts.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("gives every post the fields the pages and feeds need", () => {
    for (const post of posts) {
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
      expect(post.title.length).toBeGreaterThan(0);
      expect(post.description.length).toBeGreaterThan(0);
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.readingTime).toBeGreaterThan(0);
      expect(post.url).toBe(`/posts/${post.slug}`);
      expect(post.html.length).toBeGreaterThan(0);
    }
  });

  it("renders the authored date, not one day earlier", () => {
    expect(getPost("building-ravioli-in-the-open")?.displayDate).toBe("31 May, 2026");
    expect(getPost("academic-worldquest-2026")?.displayDate).toBe("17 Feb, 2026");
  });

  it("never emits a second <h1> inside a post body", () => {
    for (const post of posts) {
      expect(post.html).not.toMatch(/<h1[\s>]/);
    }
    // The one post with an in-body `#` heading keeps it, demoted to h2.
    expect(getPost("academic-worldquest-2026")?.html).toContain(
      "<h2>Preparation is Culture</h2>",
    );
  });

  it("opens external links in a new tab and keeps internal ones in place", () => {
    const html = getPost("2-yc-hackathons-in-a-row")!.html;
    expect(html).toContain('rel="noopener noreferrer"');
    expect(getPost("just-talk-to-it")!.html).not.toContain("<script");
  });

  it("uses the current CEO branding in the intro post", () => {
    expect(getPost("building-in-public")!.markdown).toContain("I'm also CEO at Ravioli");
    expect(getPost("building-in-public")!.markdown).not.toContain("CTO");
  });
});

describe("getPostsByYear", () => {
  it("groups newest year first with posts newest first inside", () => {
    const groups = getPostsByYear();
    const years = groups.map((g) => Number(g.year));
    expect([...years].sort((a, b) => b - a)).toEqual(years);
    for (const group of groups) {
      for (const post of group.posts) expect(post.date.slice(0, 4)).toBe(group.year);
    }
  });

  it("accounts for every post exactly once", () => {
    const grouped = getPostsByYear().flatMap((g) => g.posts.map((p) => p.slug));
    expect(new Set(grouped).size).toBe(getAllPosts().length);
  });
});

describe("postToMarkdown", () => {
  it("leads with an H1 title and carries the body", () => {
    const post = getPost("axis-and-coordinated-intelligence")!;
    const md = postToMarkdown(post);
    expect(md.startsWith(`# ${post.title}`)).toBe(true);
    expect(md).toContain(post.description);
    expect(md).toContain(post.markdown.slice(0, 40));
  });
});
