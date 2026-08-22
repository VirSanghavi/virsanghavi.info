import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "404 — Not Found",
  description:
    "No page exists at this URL. Links to the sitemap, llms.txt, the post archive, and the RSS feed.",
  robots: { index: false, follow: true },
};

/**
 * Real 404 for both people and agents.
 *
 * Next returns a genuine HTTP 404 for this route, never a 200 app shell. The
 * body names every recovery entry point, and `/llms.txt` plus `/sitemap.xml`
 * are listed first because those are what an agent needs.
 */
export default function NotFound() {
  return (
    <main>
      <section>
        <article className="article">
          <h1>404 — Not Found</h1>
          <div className="article-body">
            <p>
              There is no page at that URL on {site.url.replace(/^https?:\/\//, "")}. Nothing was
              deleted; the address is simply not one this site serves.
            </p>

            <h2>Where to look next</h2>
            <ul>
              <li>
                <a href="/llms.txt">/llms.txt</a> — site guide for agents: what this site is, when
                to use it, and a linked index of every page
              </li>
              <li>
                <a href="/llms-full.txt">/llms-full.txt</a> — every post concatenated into one
                markdown file
              </li>
              <li>
                <a href="/sitemap.xml">/sitemap.xml</a> — every indexable URL with lastmod dates
              </li>
              <li>
                <Link href="/">/</Link> — profile and recent posts
              </li>
              <li>
                <Link href="/posts">/posts</Link> — the full archive by year
              </li>
              <li>
                <Link href="/about">/about</Link> · <Link href="/contact">/contact</Link> ·{" "}
                <Link href="/privacy">/privacy</Link> · <Link href="/agents">/agents</Link>
              </li>
              <li>
                <a href="/feed.xml">/feed.xml</a> — RSS
              </li>
            </ul>

            <h2>URL shapes</h2>
            <ul>
              <li>
                Posts live at <code>/posts/&lt;slug&gt;</code>. Legacy{" "}
                <code>/posts/&lt;slug&gt;.html</code> URLs redirect to the same page.
              </li>
              <li>
                Append <code>.md</code> to any page URL, or send{" "}
                <code>Accept: text/markdown</code>, for the markdown representation.
              </li>
              <li>
                <Link href="/resume">/resume</Link> (any casing) resolves to the current résumé PDF.
              </li>
            </ul>
          </div>
        </article>
      </section>
    </main>
  );
}
