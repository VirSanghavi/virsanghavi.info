import { describe, expect, it } from "vitest";
import {
  markdownForPath,
  normalizeMarkdownPath,
  notFoundMarkdown,
} from "@/lib/markdown-pages";
import { getAllPosts } from "@/lib/posts";
import { prosePages } from "@/lib/pages";

describe("normalizeMarkdownPath", () => {
  it("strips the .md suffix", () => {
    expect(normalizeMarkdownPath("/about.md")).toBe("/about");
    expect(normalizeMarkdownPath("/posts/shipping-fast.md")).toBe("/posts/shipping-fast");
  });

  it("maps /index and bare slashes to the home path", () => {
    expect(normalizeMarkdownPath("/index.md")).toBe("/");
    expect(normalizeMarkdownPath("/")).toBe("/");
    expect(normalizeMarkdownPath("")).toBe("/");
  });

  it("drops trailing slashes", () => {
    expect(normalizeMarkdownPath("/about/")).toBe("/about");
  });
});

describe("markdownForPath", () => {
  it("renders the home page with contact details and recent posts", () => {
    const md = markdownForPath("/")!;
    expect(md.startsWith("# Vir Sanghavi")).toBe(true);
    expect(md).toContain("Virrsanghavi@gmail.com");
    expect(md).toContain("## Recent posts");
    expect(md).toContain("/llms.txt");
  });

  it("renders the archive grouped by year", () => {
    const md = markdownForPath("/posts")!;
    expect(md).toContain("# All Posts");
    expect(md).toContain("## 2026");
    expect(md).toContain("## 2024");
  });

  it("serves every prose page", () => {
    for (const page of prosePages) {
      const md = markdownForPath(page.path)!;
      expect(md, page.path).toContain(`# ${page.heading}`);
      expect(md, page.path).toContain(page.markdown.slice(0, 40));
    }
  });

  it("serves every post, by canonical path and by .md path", () => {
    for (const post of getAllPosts()) {
      expect(markdownForPath(post.url), post.slug).toContain(`# ${post.title}`);
      expect(markdownForPath(`${post.url}.md`), post.slug).toContain(`# ${post.title}`);
    }
  });

  it("returns null for paths that are not pages", () => {
    expect(markdownForPath("/nope")).toBeNull();
    expect(markdownForPath("/posts/not-a-post")).toBeNull();
    expect(markdownForPath("/posts/shipping-fast/extra")).toBeNull();
  });

  it("points every representation back at the canonical site and its guide", () => {
    for (const path of ["/", "/posts", "/about", "/search"]) {
      expect(markdownForPath(path), path).toContain("https://www.virsanghavi.com/llms.txt");
    }
  });
});

describe("notFoundMarkdown", () => {
  const body = notFoundMarkdown("/missing");

  it("names the missing path", () => {
    expect(body).toContain("/missing");
  });

  it("gives agents somewhere to go next", () => {
    for (const target of ["/llms.txt", "/llms-full.txt", "/sitemap.xml", "/posts", "/feed.xml"]) {
      expect(body, target).toContain(target);
    }
  });

  it("explains the URL conventions", () => {
    expect(body).toContain("Accept: text/markdown");
    expect(body).toContain("/posts/<slug>");
  });
});
