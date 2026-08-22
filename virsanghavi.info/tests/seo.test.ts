import { describe, expect, it } from "vitest";
import { pageMetadata } from "@/lib/seo";
import { prosePages } from "@/lib/pages";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

/**
 * The audit's "metadata completeness" check wants four signals on every page:
 * canonical, html lang, og:image, og:type. `lang` lives in the root layout;
 * the other three come from here, so they are asserted for every real page.
 */
function metaFor(path: string, title: string, description: string) {
  return pageMetadata({ path, title, description });
}

describe("pageMetadata", () => {
  it("always emits a canonical, og:type, and og:image", () => {
    const meta = metaFor("/about", "About", "About Vir.");
    expect(meta.alternates?.canonical).toBe("/about");
    expect((meta.openGraph as { type?: string }).type).toBe("website");
    expect(meta.openGraph?.images).toEqual([{ url: site.avatar, alt: site.name }]);
  });

  it("advertises both the RSS feed and the markdown twin", () => {
    const types = metaFor("/about", "About", "About Vir.").alternates?.types as Record<
      string,
      Array<{ url: string }>
    >;
    expect(types["application/rss+xml"][0].url).toBe("/feed.xml");
    expect(types["text/markdown"][0].url).toBe("/about.md");
  });

  it("maps the home page to /index.md and keeps its title unsuffixed", () => {
    const meta = pageMetadata({ path: "/", title: site.name, description: site.tagline });
    const types = meta.alternates?.types as Record<string, Array<{ url: string }>>;
    expect(types["text/markdown"][0].url).toBe("/index.md");
    expect(meta.title).toEqual({ absolute: site.name });
  });

  it("suffixes the site name on inner pages", () => {
    expect(metaFor("/contact", "Contact", "Reach Vir.").openGraph?.title).toBe(
      "Contact | Vir Sanghavi",
    );
  });

  it("adds publishedTime only for articles", () => {
    const article = pageMetadata({
      path: "/posts/x",
      title: "X",
      description: "d",
      ogType: "article",
      publishedTime: "2026-01-01",
    });
    expect((article.openGraph as { publishedTime?: string }).publishedTime).toBe("2026-01-01");

    const page = pageMetadata({
      path: "/x",
      title: "X",
      description: "d",
      publishedTime: "2026-01-01",
    });
    expect(page.openGraph).not.toHaveProperty("publishedTime");
  });

  it("marks a page noindex only when asked", () => {
    expect(metaFor("/about", "About", "d").robots).toBeUndefined();
    expect(
      pageMetadata({ path: "/search", title: "Search", description: "d", noIndex: true }).robots,
    ).toEqual({ index: false, follow: true });
  });
});

describe("every real page gets the four metadata signals", () => {
  const paths = [
    { path: "/", title: site.name, description: site.tagline },
    { path: "/posts", title: "All Posts", description: "Archive." },
    ...prosePages.map((p) => ({ path: p.path, title: p.title, description: p.description })),
    ...getAllPosts().map((p) => ({
      path: p.url,
      title: p.title,
      description: p.description,
    })),
  ];

  it.each(paths)("$path", ({ path, title, description }) => {
    const meta = pageMetadata({ path, title, description });
    expect(meta.alternates?.canonical).toBe(path);
    expect((meta.openGraph as { type?: string }).type).toBeTruthy();
    expect((meta.openGraph?.images as Array<{ url: string }>)[0].url).toBeTruthy();
    expect(meta.description).toBe(description);
  });
});
