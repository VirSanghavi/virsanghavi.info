import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { AI_CRAWLERS } from "@/lib/crawlers";
import { getAllPosts } from "@/lib/posts";
import { prosePages } from "@/lib/pages";
import { plainTextLength } from "@/lib/markdown";

describe("sitemap.xml", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists the home page, the archive, every prose page, and every post", () => {
    expect(urls).toContain("https://www.virsanghavi.com/");
    expect(urls).toContain("https://www.virsanghavi.com/posts");
    for (const page of prosePages) {
      expect(urls, page.slug).toContain(`https://www.virsanghavi.com${page.path}`);
    }
    for (const post of getAllPosts()) {
      expect(urls, post.slug).toContain(`https://www.virsanghavi.com${post.url}`);
    }
  });

  it("has no duplicates and no relative URLs", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(url).toMatch(/^https:\/\/www\.virsanghavi\.com/);
  });

  it("gives every entry a lastmod date", () => {
    for (const entry of entries) {
      expect(String(entry.lastModified), entry.url).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("omits the noindex search page", () => {
    expect(urls).not.toContain("https://www.virsanghavi.com/search");
  });
});

describe("robots.txt", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];

  it("explicitly allows every AI crawler in the allowlist", () => {
    const agents = rules.flatMap((rule) =>
      Array.isArray(rule.userAgent) ? rule.userAgent : rule.userAgent ? [rule.userAgent] : [],
    );
    for (const crawler of AI_CRAWLERS) expect(agents, crawler).toContain(crawler);
  });

  it("covers the agents the audit reported as blocked", () => {
    const agents = rules
      .flatMap((rule) => (Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]))
      .map(String);
    for (const blocked of [
      "GPTBot",
      "ClaudeBot",
      "ChatGPT-User",
      "PerplexityBot",
      "Google-Extended",
      "Applebot-Extended",
      "DeepSeekBot",
      "ora-agent",
    ]) {
      expect(agents, blocked).toContain(blocked);
    }
  });

  it("disallows nothing", () => {
    for (const rule of rules) expect(rule.disallow).toBeUndefined();
  });

  it("points at the sitemap", () => {
    expect(config.sitemap).toBe("https://www.virsanghavi.com/sitemap.xml");
  });
});

describe("trust anchor pages", () => {
  it.each(["about", "contact", "privacy"])(
    "/%s has at least 500 characters of real content",
    (slug) => {
      const page = prosePages.find((p) => p.slug === slug)!;
      expect(plainTextLength(page.markdown)).toBeGreaterThanOrEqual(500);
    },
  );

  it("contact names an email, a phone number, and a location", () => {
    const contact = prosePages.find((p) => p.slug === "contact")!.markdown;
    expect(contact).toContain("Virrsanghavi@gmail.com");
    expect(contact).toContain("(832) 907-4410");
    expect(contact).toContain("Houston");
  });

  it("privacy states what is and is not collected", () => {
    const privacy = prosePages.find((p) => p.slug === "privacy")!.markdown;
    expect(privacy).toContain("## What I collect");
    expect(privacy).toContain("## Cookies");
    expect(privacy).toContain("Vercel");
    expect(privacy).toContain("Google Fonts");
    expect(privacy).toContain("tilt.vote");
  });

  it("is reachable from the prose pages, not just the sitemap", () => {
    // An orphaned /agents page is discoverable by crawlers but weak for the
    // name-based searches it exists to serve.
    const contact = prosePages.find((p) => p.slug === "contact")!.markdown;
    const privacy = prosePages.find((p) => p.slug === "privacy")!.markdown;
    expect(contact).toContain("(/agents)");
    expect(privacy).toContain("(/agents)");
  });

  it("names the site in its heading so name-based search can surface it", () => {
    expect(prosePages.find((p) => p.slug === "agents")!.heading).toContain("virsanghavi.com");
  });

  it("the agent resources page documents the machine-readable surface", () => {
    const agents = prosePages.find((p) => p.slug === "agents")!.markdown;
    expect(agents).toContain("## When to use this site");
    expect(agents).toContain("/llms.txt");
    expect(agents).toContain("Accept: text/markdown");
    expect(agents).toContain("JSON-LD");
  });
});
