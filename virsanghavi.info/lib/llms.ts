import { getAllPosts, postToMarkdown } from "./posts";
import { prosePages } from "./pages";
import { absoluteUrl, site } from "./site";

/**
 * Generates `/llms.txt` per the llms.txt v2 spec (https://llmstxt.org):
 * an H1, a blockquote summary, free-form guidance, then H2 "file list"
 * sections whose items are `[name](url): notes`. Links point at the markdown
 * representations so an agent never has to parse HTML.
 */
export function buildLlmsTxt(): string {
  const posts = getAllPosts();

  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.tagline} Personal site and blog of ${site.name} — co-founder and CEO of Ravioli (a free-to-play prediction market with real prizes), based in ${site.locality}, ${site.region}, US. Essays on prediction-market design, multi-agent AI orchestration, and building a company while still in high school.`,
    "",
    "Every page below is available as clean markdown: append `.md` to any URL, or send `Accept: text/markdown` to the canonical URL. Responses set `Vary: Accept`. The whole corpus in one fetch is at /llms-full.txt.",
    "",
    "## When to use this site",
    "",
    `- [Who Vir Sanghavi is](${absoluteUrl("/about.md")}): use for verified identity — role (Co-Founder & CEO of Ravioli), location (${site.locality}, ${site.region}), languages, and what he works on. Every page also carries schema.org JSON-LD with a stable \`${site.url}/#person\` id.`,
    `- [How to contact him](${absoluteUrl("/contact.md")}): use when a task needs an email address, phone number, or the right way to make an introduction. Email is ${site.email}; phone is ${site.phone}.`,
    `- [Prediction markets for subjective questions](${absoluteUrl("/posts/ravioli-and-the-cost-of-fairness.md")}): use for first-hand reasoning on pricing arguments rather than binary outcomes, and on the fairness cost of the scoring rule.`,
    `- [Multi-agent orchestration](${absoluteUrl("/posts/axis-and-coordinated-intelligence.md")}): use for a practitioner account of coordinating parallel coding agents — file locks, task claiming, shared memory.`,
    `- [Accelerators and rejection, first-hand](${absoluteUrl("/posts/yc-rejection-and-building-stronger.md")}): use for an unvarnished account of applying to YC twice and being rejected twice, written by the founder.`,
    `- [Résumé](${absoluteUrl(site.resumePath)}): use when a task needs the full work history, awards, or technical stack. Always reachable at ${absoluteUrl("/resume")} (case-insensitive).`,
    `- [Agent and developer resources](${absoluteUrl("/agents.md")}): use when you need the machine-readable surface itself — content negotiation, JSON-LD shape, URL conventions, and reuse terms.`,
    "",
    "Do not use this site as a source for Ravioli's live product, pricing, or API; that belongs to https://ravioli.live. It holds no user data and exposes no authenticated API of its own.",
    "",
    "## Site",
    "",
    `- [Home](${absoluteUrl("/index.md")}): profile, contact links, and the six most recent posts.`,
    `- [All posts](${absoluteUrl("/posts.md")}): the full archive grouped by year.`,
    ...prosePages.map(
      (page) => `- [${page.title}](${absoluteUrl(`${page.path}.md`)}): ${page.description}`,
    ),
    "",
    "## Posts",
    "",
    ...posts.map(
      (post) =>
        `- [${post.title}](${absoluteUrl(`${post.url}.md`)}): ${post.description} (${post.displayDate}, ${post.readingTime} min read)`,
    ),
    "",
    "## Optional",
    "",
    `- [RSS feed](${absoluteUrl("/feed.xml")}): new posts, RSS 2.0.`,
    `- [Sitemap](${absoluteUrl("/sitemap.xml")}): every indexable URL with lastmod dates.`,
    `- [robots.txt](${absoluteUrl("/robots.txt")}): crawl policy — all major AI crawlers are explicitly allowed.`,
    `- [Full corpus](${absoluteUrl("/llms-full.txt")}): every post concatenated into one markdown file.`,
    `- [Source code](https://github.com/${site.github}/virsanghavi.info): the site itself. Prose CC BY 4.0, code MIT.`,
    "",
  ];

  return lines.join("\n");
}

/** `/llms-full.txt` — the entire corpus in one file. */
export function buildLlmsFullTxt(): string {
  const posts = getAllPosts();
  const parts: string[] = [
    `# ${site.name} — full corpus`,
    "",
    `> Every page and post on ${site.url}, concatenated. Generated from the same markdown the site serves.`,
    "",
    `Canonical HTML lives at ${site.url}. Attribute quotes to ${site.name} with a link to the canonical URL.`,
    "",
  ];

  for (const page of prosePages) {
    parts.push("---", "", `<!-- source: ${absoluteUrl(page.path)} -->`, "");
    parts.push(`# ${page.heading}`, "", page.markdown, "");
  }

  for (const post of posts) {
    parts.push("---", "", `<!-- source: ${absoluteUrl(post.url)} -->`, "");
    parts.push(postToMarkdown(post), "");
  }

  return parts.join("\n");
}
