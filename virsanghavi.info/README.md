# virsanghavi.com

Personal site and blog of Vir Sanghavi. Next.js (App Router) + React, deployed on Vercel.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npm test           # unit tests (vitest)
npm run typecheck  # tsc --noEmit
```

End-to-end verification of every public endpoint against a running server:

```bash
BASE_URL=http://localhost:3000 npm run test:e2e
BASE_URL=https://www.virsanghavi.com npm run test:e2e
```

## Where things live

| Path | What it is |
| --- | --- |
| `content/blog/*.md` | The posts. One file per post, frontmatter + markdown. See `HOW_TO_POST.md`. |
| `app/` | Routes. Pages, plus `robots.ts`, `sitemap.ts`, `llms.txt`, `llms-full.txt`, `feed.xml`, and the markdown route handler. |
| `components/` | React components. Client components are marked `"use client"`. |
| `lib/` | The logic everything else reads from — content loading, markdown, metadata, structured data, `Accept` negotiation. |
| `proxy.ts` | Request-time routing: `/resume`, markdown negotiation, `Vary`. |
| `app/globals.css` | The whole stylesheet. Design tokens at the top. |
| `tests/` | Unit tests plus the end-to-end endpoint harness. |

Single sources of truth worth knowing about, because duplicating them is how
these things drift:

- `lib/site.ts` — name, role, contact details, canonical URL. Every page,
  feed, and structured-data node reads from it.
- `lib/pages.ts` — the prose pages (`/about`, `/contact`, `/privacy`,
  `/agents`), authored in markdown. The HTML page and the `text/markdown`
  representation both render from the same string.
- `lib/seo.ts` — page metadata. Next.js *replaces* rather than merges
  `openGraph` and `alternates`, so every page composes the full set here.
- `lib/crawlers.ts` — the AI crawler allowlist that `robots.txt` is built from.

## Built for agents as well as people

- **Server-rendered.** Every page's content is in the HTML with no JavaScript.
- **`/llms.txt`** — an [llmstxt.org](https://llmstxt.org) guide: what the site
  is, when an agent should use it, and a linked index of every page.
  `/llms-full.txt` is the whole corpus in one file.
- **Markdown content negotiation** — every content page serves clean markdown
  from the same URL for `Accept: text/markdown`, per
  [acceptmarkdown.com](https://acceptmarkdown.com), with `Vary: Accept` and a
  spec-correct `406`. Appending `.md` to any page path works too.

  One caveat, and it is a framework constraint rather than a choice: the HTML
  representation does *not* carry `Vary: Accept`. Next.js overwrites `Vary` on
  every App Router page response with its own RSC routing tokens, after
  middleware headers are merged, so no middleware, `next.config`, or
  `vercel.json` header survives. Nothing depends on it here — a request that
  prefers Markdown is rewritten to `/api/markdown/...` before the CDN cache
  lookup, so the two representations never share a cache key. See the comment
  in `proxy.ts`.
- **JSON-LD** on every page: `Person`, `Organization` (with `contactPoint` and
  a `PostalAddress`), `WebSite`, a page node, and `BlogPosting` on posts.
  Node `@id`s are stable across pages.
- **Real 404s** with a markdown body that points at the sitemap, `llms.txt`,
  and the archive — never a 200 app shell.
- **`robots.txt`** names every major AI crawler and allows all of them. The
  Vercel firewall's `ai_bots` managed ruleset is deliberately off; turning it
  back on would 403 the crawlers this site is written for.

## Deploying

Push to `main`. Vercel builds and deploys to https://www.virsanghavi.com.
Legacy `.html` URLs from the previous hand-written version permanently
redirect to their clean equivalents.

## Licence

Prose is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Code is MIT.
