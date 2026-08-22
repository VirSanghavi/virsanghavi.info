import { getAllPosts, getPostsByYear, getPost, postToMarkdown } from "./posts";
import { getProsePage } from "./pages";
import { absoluteUrl, site } from "./site";

/**
 * The `text/markdown` representation of every HTML page.
 *
 * Prose pages and posts are authored in markdown already; index pages are
 * generated from the same data the React pages render, so the two
 * representations of a URL can never disagree.
 */

const FOOTER = [
  "",
  "---",
  "",
  `Canonical HTML: ${site.url}  ·  Site guide for agents: ${absoluteUrl("/llms.txt")}  ·  Sitemap: ${absoluteUrl("/sitemap.xml")}`,
  "",
].join("\n");

function homeMarkdown(): string {
  const posts = getAllPosts().slice(0, 6);
  return [
    `# ${site.name}`,
    "",
    `> ${site.tagline}`,
    "",
    site.description,
    "",
    "## Contact",
    "",
    `- Email: ${site.email}`,
    `- Phone: ${site.phone}`,
    `- Location: ${site.locality}, ${site.region}, ${site.country}`,
    `- Résumé: ${absoluteUrl(site.resumePath)} (also at ${absoluteUrl("/resume")})`,
    ...site.sameAs.map((url) => `- ${url}`),
    "",
    "## Recent posts",
    "",
    ...posts.map(
      (post) =>
        `- [${post.title}](${absoluteUrl(post.url)}): ${post.description} (${post.displayDate}, ${post.readingTime} min read)`,
    ),
    "",
    `Full archive: ${absoluteUrl("/posts")}`,
  ].join("\n");
}

function postsIndexMarkdown(): string {
  const lines: string[] = [
    "# All Posts",
    "",
    `> Every essay by ${site.name}, newest first.`,
    "",
  ];
  for (const group of getPostsByYear()) {
    lines.push(`## ${group.year}`, "");
    for (const post of group.posts) {
      lines.push(`- [${post.title}](${absoluteUrl(post.url)}) — ${post.shortDate}: ${post.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function searchMarkdown(): string {
  return [
    "# Search",
    "",
    "> Client-side search over post titles and descriptions.",
    "",
    "Search needs a browser. Agents should read the full index instead:",
    "",
    `- All posts: ${absoluteUrl("/posts.md")}`,
    `- Site guide: ${absoluteUrl("/llms.txt")}`,
    `- Every post in one file: ${absoluteUrl("/llms-full.txt")}`,
  ].join("\n");
}

/** Normalise `/about/`, `/about.md`, and `/index.md` to a canonical page path. */
export function normalizeMarkdownPath(pathname: string): string {
  let path = pathname.replace(/\.md$/i, "");
  if (path === "/index") path = "/";
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

/** Markdown body for a page path, or `null` when the path is not a page. */
export function markdownForPath(pathname: string): string | null {
  const path = normalizeMarkdownPath(pathname);

  if (path === "/") return homeMarkdown() + FOOTER;
  if (path === "/posts") return postsIndexMarkdown() + FOOTER;
  if (path === "/search") return searchMarkdown() + FOOTER;

  const prose = getProsePage(path.slice(1));
  if (prose && prose.path === path) {
    return [`# ${prose.heading}`, "", `> ${prose.description}`, "", prose.markdown].join("\n") + FOOTER;
  }

  const postMatch = path.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    const post = getPost(postMatch[1]);
    if (post) return postToMarkdown(post) + FOOTER;
  }

  return null;
}

/** Body returned for a path that does not exist, in both markdown and HTML flows. */
export function notFoundMarkdown(pathname: string): string {
  return [
    "# 404 — Not Found",
    "",
    `> No page exists at \`${pathname}\` on ${site.url}.`,
    "",
    "## Where to look next",
    "",
    `- [Site guide for agents](${absoluteUrl("/llms.txt")}) — what this site is and when to use it`,
    `- [Every post in one file](${absoluteUrl("/llms-full.txt")})`,
    `- [Sitemap](${absoluteUrl("/sitemap.xml")}) — every indexable URL`,
    `- [Home](${absoluteUrl("/")}) — profile and recent posts`,
    `- [All posts](${absoluteUrl("/posts")}) — full archive by year`,
    `- [About](${absoluteUrl("/about")}) · [Contact](${absoluteUrl("/contact")}) · [Privacy](${absoluteUrl("/privacy")})`,
    `- [RSS feed](${absoluteUrl("/feed.xml")})`,
    "",
    "Post URLs look like `/posts/<slug>`. Legacy `/posts/<slug>.html` URLs redirect to the same page.",
    "Append `.md` to any page URL, or send `Accept: text/markdown`, to get the markdown representation.",
    "",
  ].join("\n");
}
