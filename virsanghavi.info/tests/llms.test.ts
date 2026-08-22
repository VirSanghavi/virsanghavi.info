import { describe, expect, it } from "vitest";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/lib/llms";
import { getAllPosts } from "@/lib/posts";
import { prosePages } from "@/lib/pages";

const llms = buildLlmsTxt();
const lines = llms.split("\n");

describe("llms.txt conforms to the llmstxt.org spec", () => {
  it("opens with an H1 naming the site", () => {
    expect(lines[0]).toBe("# Vir Sanghavi");
  });

  it("follows the H1 with a blockquote summary", () => {
    expect(lines[1]).toBe("");
    expect(lines[2].startsWith("> ")).toBe(true);
    expect(lines[2].length).toBeGreaterThan(120);
  });

  it("has no headings between the blockquote and the first H2", () => {
    const firstH2 = lines.findIndex((line) => line.startsWith("## "));
    expect(firstH2).toBeGreaterThan(2);
    const preamble = lines.slice(3, firstH2);
    expect(preamble.some((line) => /^#{1,6} /.test(line))).toBe(false);
  });

  it("uses only H2 for its sections", () => {
    const headings = lines.filter((line) => /^#{1,6} /.test(line)).slice(1);
    expect(headings.every((line) => line.startsWith("## "))).toBe(true);
  });

  it("makes every file-list item a markdown link with notes", () => {
    const items = lines.filter((line) => line.startsWith("- "));
    expect(items.length).toBeGreaterThan(20);
    for (const item of items) {
      expect(item, item).toMatch(/^- \[[^\]]+\]\(https?:\/\/[^)]+\)/);
    }
  });
});

describe("llms.txt content", () => {
  it("carries a when-to-use section with concrete jobs, not marketing copy", () => {
    expect(llms).toContain("## When to use this site");
    const section = llms.split("## When to use this site")[1].split("\n## ")[0];
    expect(section).toContain("use for verified identity");
    expect(section).toContain("Virrsanghavi@gmail.com");
    expect(section).toContain("Multi-agent orchestration");
  });

  it("says what the site is *not* the right source for", () => {
    expect(llms).toContain("Do not use this site as a source for Ravioli's live product");
  });

  it("explains markdown content negotiation", () => {
    expect(llms).toContain("Accept: text/markdown");
    expect(llms).toContain("Vary: Accept");
  });

  it("links every post and prose page as its markdown twin", () => {
    for (const post of getAllPosts()) {
      expect(llms, post.slug).toContain(`https://www.virsanghavi.com${post.url}.md`);
    }
    for (const page of prosePages) {
      expect(llms, page.slug).toContain(`https://www.virsanghavi.com${page.path}.md`);
    }
  });

  it("lists the other machine-readable resources by name", () => {
    for (const file of ["/feed.xml", "/sitemap.xml", "/robots.txt", "/llms-full.txt"]) {
      expect(llms, file).toContain(file);
    }
  });

  it("uses absolute URLs only, so a copied file still resolves", () => {
    const urls = [...llms.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url, url).toMatch(/^https:\/\//);
  });
});

describe("llms-full.txt", () => {
  const full = buildLlmsFullTxt();

  it("contains every post body", () => {
    for (const post of getAllPosts()) {
      expect(full, post.slug).toContain(`# ${post.title}`);
      expect(full, post.slug).toContain(post.markdown.slice(0, 60));
    }
  });

  it("contains every prose page", () => {
    for (const page of prosePages) expect(full, page.slug).toContain(`# ${page.heading}`);
  });

  it("attributes each section to its canonical URL", () => {
    for (const post of getAllPosts()) {
      expect(full).toContain(`<!-- source: https://www.virsanghavi.com${post.url} -->`);
    }
  });
});
