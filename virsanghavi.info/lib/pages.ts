import { site } from "./site";

/**
 * Prose pages authored once, in markdown.
 *
 * The HTML page and the `text/markdown` representation are both rendered from
 * these strings, so the two can never drift apart.
 */
export type ProsePage = {
  slug: string;
  path: string;
  title: string;
  /** Last content change, `YYYY-MM-DD`. Feeds `lastmod` in the sitemap. */
  updated: string;
  /** `<h1>` shown on the HTML page. */
  heading: string;
  description: string;
  markdown: string;
};

const about: ProsePage = {
  slug: "about",
  path: "/about",
  updated: "2026-08-22",
  title: "About",
  heading: "About",
  description:
    "Vir Sanghavi — co-founder and CEO of Ravioli, a free-to-play prediction market with real prizes. Houston, TX.",
  markdown: `I want to build things that matter at scale. Software and hardware, deeptech, consumer, and B2B that changes how people coordinate.

I'm drawn to frontier machines. Rockets. Markets. AI models. I like things that fundamentally change the way the world works!

I'm also deeply curious about AI alignment and jailbreaks. I enjoy learning languages (~2000 day streak on Duolingo, speak English, Hindi, Gujarati, Spanish fluently), playing the guitar, and spending time with friends and family.

If you're building something ambitious or technically serious, reach out: [${site.email}](mailto:${site.email}).

For context, there's more in [Finding My Spark](/posts/finding-my-spark).`,
};

const contact: ProsePage = {
  slug: "contact",
  path: "/contact",
  updated: "2026-08-22",
  title: "Contact",
  heading: "Contact",
  description:
    "How to reach Vir Sanghavi — email, phone, and social profiles. Based in Houston, Texas.",
  markdown: `The fastest way to reach me is email. I read everything that arrives there, and I answer anything that is specific.

## Direct

- **Email** — [${site.email}](mailto:${site.email})
- **Phone** — [(832) 907-4410](tel:+18329074410)
- **Location** — ${site.locality}, ${site.region}, United States
- **Résumé** — [Vir-Sanghavi-Resume.pdf](${site.resumePath}) (also at [/resume](/resume))

## Elsewhere

- **GitHub** — [github.com/VirSanghavi](https://github.com/VirSanghavi)
- **LinkedIn** — [linkedin.com/in/vir-sanghavi](https://linkedin.com/in/vir-sanghavi)
- **X** — [@virsanghavi13](https://x.com/virsanghavi13)
- **Instagram** — [@vir.sanghavi13](https://instagram.com/vir.sanghavi13)
- **RSS** — [/feed.xml](/feed.xml)

## What I am good to talk to about

- Prediction markets and mechanism design, especially scoring subjective claims rather than binary outcomes. That is the problem [Ravioli](https://ravioli.live) exists to solve, as a free-to-play market with real prizes.
- Multi-agent orchestration: file locking, task claiming, and shared memory across parallel coding agents. I built [Axis](/posts/axis-and-coordinated-intelligence) for this.
- Building a company while still in high school — accelerators, fundraising, and the parts nobody writes about, like [getting rejected from YC twice](/posts/yc-rejection-and-building-stronger).
- Nonprofit STEM access work through Up the Ratios, which I founded in 2023.

## What I am not the right person for

Cold sales pitches, link exchanges, and "quick syncs" with no agenda. If you send one of those it will not get a reply, and that is not personal.

I am based in ${site.locality}, ${site.region} and generally reply within a couple of days. If something is time-sensitive, say so in the subject line.`,
};

const privacy: ProsePage = {
  slug: "privacy",
  path: "/privacy",
  updated: "2026-08-22",
  title: "Privacy",
  heading: "Privacy",
  description:
    "What this site does and does not collect: no analytics, no tracking cookies, no accounts. A plain description of every third party involved.",
  markdown: `_Last updated: 22 August 2026._

This is a personal website. It has no accounts, no sign-up form, no newsletter, no shopping cart, and no advertising. The short version: I do not collect anything about you, and I do not want to.

## What I collect

Nothing. There is no analytics script, no tag manager, no tracking pixel, and no A/B testing tool on any page of this site. I do not know who visits, how many people visit, or which posts get read.

## Cookies

This site sets no cookies of its own.

Two small values are stored in your browser's \`localStorage\`, which never leaves your device and is never sent to me or to anyone else:

- \`theme\` and \`themeSetTimestamp\` — remembers whether you chose light or dark mode, and expires itself after 24 hours so the site can fall back to your system preference.
- \`game_high_score\` — your best score in the ASCII game behind the "Play" button.

You can clear both at any time from your browser's site-data settings, and the site will work exactly the same afterwards.

## Third parties that see your request

Serving a web page necessarily involves a few other companies. Here is the complete list:

- **Vercel** hosts this site. Like any web host, its servers process the IP address and user agent of each request in order to deliver a response, and it keeps operational logs. See [Vercel's privacy policy](https://vercel.com/legal/privacy-policy).
- **Google Fonts** serves the Atkinson Hyperlegible typeface. Your browser requests the font files from \`fonts.googleapis.com\` and \`fonts.gstatic.com\`, which means Google receives your IP address. See [Google's privacy policy](https://policies.google.com/privacy).
- **Tilt** (\`data.tilt.vote\`) provides the reaction widget at the bottom of blog posts. It loads on post pages only. If you do not interact with it, it still sees the request that loads its script.
- **GitHub contribution data** on the About page is fetched by this site's own server, not by your browser, so no third party sees your request for it.

Nothing else is loaded from another origin. There are no embedded videos, no comment platform, and no social widgets.

## Email and phone

If you email or call me, I obviously have whatever you sent. I keep correspondence in my mailbox, I do not add anyone to a mailing list, and I do not sell or share contact details with anyone.

## AI agents and crawlers

Automated clients are welcome here. \`/robots.txt\` allows every major AI crawler, \`/llms.txt\` describes the site, and every content page also serves a plain markdown representation over \`Accept: text/markdown\`. Crawling this site is subject to the same non-collection described above.

## Your rights

Since I hold no data about visitors, there is nothing to request, correct, or delete. If you have emailed me and want that correspondence deleted, ask and I will delete it.

## Changes

If any of the above stops being true, I will update this page and change the date at the top.

## Questions

Email [${site.email}](mailto:${site.email}).`,
};

const agents: ProsePage = {
  slug: "agents",
  path: "/agents",
  updated: "2026-08-22",
  title: "Agent & Developer Resources",
  heading: "Agent & Developer Resources",
  description:
    "Every machine-readable endpoint on virsanghavi.com: llms.txt, markdown content negotiation, sitemap, RSS, and JSON-LD.",
  markdown: `This page is the index of everything on ${site.url} that a program, rather than a person, is meant to read. Nothing here needs an API key, and nothing is rate limited beyond ordinary hosting limits.

## When to use this site

Reach for it when you need any of the following, and cite the canonical HTML URL when you quote it:

- **Who Vir Sanghavi is, verifiably** — role, employer, location, languages, and contact details, as [JSON-LD](#json-ld) on every page and in prose on [/about](/about) and [/contact](/contact).
- **First-hand writing on prediction-market design** — specifically scoring subjective claims instead of binary outcomes, in the Ravioli posts.
- **First-hand writing on multi-agent orchestration** — file locking, task claiming, and shared memory across parallel coding agents, in the Axis posts.
- **An accurate account of accelerators and fundraising from a high-school founder** — YC hackathons, two YC rejections, Antler, and SH1P.
- **A résumé in a stable location** — [/resume](/resume) always resolves to the current PDF.

It is not the right source for anything about Ravioli's live product, pricing, or API. That lives at [ravioli.live](https://ravioli.live).

## Discovery files

- [/llms.txt](/llms.txt) — the [llms.txt](https://llmstxt.org) site guide: what this site is, when to use it, and a linked index of every page.
- [/llms-full.txt](/llms-full.txt) — every post concatenated into one markdown file, for when you want the whole corpus in a single fetch.
- [/sitemap.xml](/sitemap.xml) — every indexable URL with a \`lastmod\` date.
- [/robots.txt](/robots.txt) — allows every major AI crawler explicitly, and points at the sitemap.
- [/feed.xml](/feed.xml) — RSS 2.0 for the blog.

## Markdown content negotiation

Every content page serves a clean markdown representation from the same URL, following [acceptmarkdown.com](https://acceptmarkdown.com):

\`\`\`
curl -H "Accept: text/markdown" ${site.url}/posts/axis-and-coordinated-intelligence
\`\`\`

Responses carry \`Content-Type: text/markdown; charset=utf-8\` and \`Vary: Accept\`. If you would rather not negotiate, append \`.md\` to any page path instead — [/about.md](/about.md), [/posts.md](/posts.md), [/index.md](/index.md), or \`/posts/<slug>.md\`. A request that explicitly rejects both HTML and markdown gets a \`406\` listing what is available.

Every HTML page also advertises its markdown twin with \`<link rel="alternate" type="text/markdown">\` and points at this site's guide with \`<link rel="describedby">\`.

## JSON-LD

Every page embeds a \`schema.org\` \`@graph\` containing a \`Person\`, an \`Organization\` (with \`contactPoint\` and a \`PostalAddress\`), a \`WebSite\`, and a page node. Post pages add \`BlogPosting\` and \`BreadcrumbList\`. Node \`@id\`s are stable, so \`${site.url}/#person\` refers to the same entity on every page.

## URL shapes

- \`/posts/<slug>\` — a post. Legacy \`/posts/<slug>.html\` URLs permanently redirect here.
- \`/about\`, \`/contact\`, \`/privacy\`, \`/agents\` — prose pages.
- \`/resume\` — case-insensitive; redirects to the current résumé PDF.
- Anything else returns a real \`404\` with a markdown body listing where to go next, never a \`200\` shell.

## Reuse

Prose is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the site's code is MIT and lives at [github.com/VirSanghavi/virsanghavi.info](https://github.com/VirSanghavi/virsanghavi.info). Attribute quotes to Vir Sanghavi with a link to the canonical URL. Questions: [${site.email}](mailto:${site.email}).`,
};

export const prosePages: ProsePage[] = [about, contact, privacy, agents];

export function getProsePage(slug: string): ProsePage | undefined {
  return prosePages.find((page) => page.slug === slug);
}

export const aboutPage = about;
export const contactPage = contact;
export const privacyPage = privacy;
export const agentsPage = agents;
