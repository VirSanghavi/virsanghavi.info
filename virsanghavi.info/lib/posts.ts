import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown } from "./markdown";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type Post = {
  slug: string;
  title: string;
  description: string;
  /** ISO `YYYY-MM-DD`, exactly as authored in frontmatter. */
  date: string;
  /** `DD Mon, YYYY` for display. */
  displayDate: string;
  /** `DD Mon` for the year-grouped archive. */
  shortDate: string;
  readingTime: number;
  /** Raw markdown body with frontmatter removed. */
  markdown: string;
  html: string;
  url: string;
};

/**
 * Normalise a frontmatter date to `YYYY-MM-DD`.
 *
 * YAML parses an unquoted `2026-05-31` into a `Date` at UTC midnight. Reading
 * it back with local getters shifts it a day west of UTC, which is why the
 * previous static build (run on a US-Central machine) rendered every post one
 * day earlier than authored. Everything here stays in UTC so the displayed
 * date always equals the authored date, on any machine.
 */
export function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date(0).toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day} ${MONTHS[Number(month) - 1]}, ${year}`;
}

export function formatShortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day} ${MONTHS[Number(month) - 1]}`;
}

let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (cache) return cache;

  const files = fs.existsSync(BLOG_DIR)
    ? fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") && f !== "boilerplate.md")
    : [];

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, "");
    const date = toIsoDate(data.pubDatetime);
    const markdown = content.trim();

    return {
      slug,
      title: String(data.title ?? "Untitled Post"),
      description: String(data.description ?? ""),
      date,
      displayDate: formatDate(date),
      shortDate: formatShortDate(date),
      readingTime: Number(data.readingTime ?? 5),
      markdown,
      html: renderMarkdown(markdown),
      url: `/posts/${slug}`,
    } satisfies Post;
  });

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
  cache = posts;
  return posts;
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

export function getPostsByYear(): Array<{ year: string; posts: Post[] }> {
  const groups = new Map<string, Post[]>();
  for (const post of getAllPosts()) {
    const year = post.date.slice(0, 4);
    const bucket = groups.get(year);
    if (bucket) bucket.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, posts]) => ({ year, posts }));
}

/** The markdown representation served for `Accept: text/markdown` and `/posts/<slug>.md`. */
export function postToMarkdown(post: Post): string {
  return [
    `# ${post.title}`,
    "",
    `*${post.displayDate} · ${post.readingTime} min read*`,
    "",
    post.description,
    "",
    "---",
    "",
    post.markdown,
    "",
  ].join("\n");
}
