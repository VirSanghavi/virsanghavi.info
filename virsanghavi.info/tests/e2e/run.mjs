#!/usr/bin/env node
/**
 * End-to-end verification of every public endpoint.
 *
 * Checks the things that only exist at the HTTP layer — status codes,
 * redirects, content types, `Vary`, content negotiation, and the machine
 * readable files — against a running server.
 *
 *   BASE_URL=http://localhost:3000 node tests/e2e/run.mjs
 *   BASE_URL=https://www.virsanghavi.com node tests/e2e/run.mjs
 */

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const UA = process.env.USER_AGENT ?? "virsanghavi-e2e/1.0";

let passed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    return true;
  }
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  return false;
}

async function get(path, { accept, redirect = "manual" } = {}) {
  const headers = { "user-agent": UA };
  if (accept !== undefined) headers.accept = accept;
  const response = await fetch(`${BASE}${path}`, { headers, redirect });
  const body = await response.text();
  return { response, body, status: response.status };
}

const POSTS = [
  "building-ravioli-in-the-open",
  "2-yc-hackathons-in-a-row",
  "academic-worldquest-2026",
  "being-fifteen-and-building-anyway",
  "yc-rejection-and-building-stronger",
  "axis-and-coordinated-intelligence",
  "just-talk-to-it",
  "tilt-and-the-discipline-of-incentives",
  "ravioli-and-the-cost-of-fairness",
  "building-in-public",
  "finding-my-spark",
  "yc-agent-jam-and-ai",
  "why-realtime-debate-matters",
  "antler-zero-to-one",
  "what-were-building-at-ravioli",
  "shipping-fast",
  "up-the-ratios-and-leverage",
];

const HTML_PAGES = [
  "/",
  "/about",
  "/posts",
  "/contact",
  "/privacy",
  "/agents",
  "/search",
  ...POSTS.map((slug) => `/posts/${slug}`),
];

async function run() {
  console.log(`Verifying ${BASE}\n`);

  // --- HTML pages -----------------------------------------------------------
  for (const path of HTML_PAGES) {
    const { response, status, body } = await get(path, { accept: "text/html" });
    check(`GET ${path} → 200`, status === 200, `got ${status}`);
    check(
      `GET ${path} content-type`,
      (response.headers.get("content-type") ?? "").startsWith("text/html"),
      response.headers.get("content-type") ?? "none",
    );
    check(`GET ${path} has <html lang>`, /<html[^>]+lang="en"/.test(body));
    check(`GET ${path} has exactly one <h1>`, (body.match(/<h1[\s>]/g) ?? []).length === 1);
    check(`GET ${path} has a canonical link`, /rel="canonical"/.test(body));
    check(`GET ${path} has og:type`, /property="og:type"/.test(body));
    check(`GET ${path} has og:image`, /property="og:image"/.test(body));
    check(`GET ${path} has JSON-LD`, /application\/ld\+json/.test(body));
    check(
      `GET ${path} advertises its markdown twin`,
      /rel="alternate"[^>]+type="text\/markdown"/.test(body),
    );
  }

  // --- Content without JavaScript ------------------------------------------
  {
    const { body } = await get("/", { accept: "text/html" });
    const text = body
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    check("home renders 500+ chars without JS", text.length >= 500, `${text.length} chars`);
    const levels = [...body.matchAll(/<h([1-3])[\s>]/g)].map((m) => Number(m[1]));
    check("home heading structure is h1 → h2 → h3", levels[0] === 1 && levels.includes(2) && levels.includes(3));
  }

  // --- Markdown content negotiation ----------------------------------------
  for (const path of ["/", "/about", "/posts", "/contact", "/privacy", "/agents", "/posts/shipping-fast"]) {
    const { response, status, body } = await get(path, { accept: "text/markdown" });
    check(`Accept: text/markdown ${path} → 200`, status === 200, `got ${status}`);
    check(
      `Accept: text/markdown ${path} → text/markdown`,
      (response.headers.get("content-type") ?? "").startsWith("text/markdown"),
      response.headers.get("content-type") ?? "none",
    );
    check(
      `Accept: text/markdown ${path} sets Vary: Accept`,
      /\baccept\b/i.test(response.headers.get("vary") ?? ""),
      response.headers.get("vary") ?? "none",
    );
    check(`Accept: text/markdown ${path} body starts with a heading`, body.trimStart().startsWith("#"));
  }

  // --- .md URLs -------------------------------------------------------------
  for (const path of ["/index.md", "/about.md", "/posts.md", "/agents.md", "/posts/shipping-fast.md"]) {
    const { response, status } = await get(path, { accept: "text/html" });
    check(`GET ${path} → 200 markdown`, status === 200, `got ${status}`);
    check(
      `GET ${path} content-type`,
      (response.headers.get("content-type") ?? "").startsWith("text/markdown"),
      response.headers.get("content-type") ?? "none",
    );
  }

  // --- q-values and 406 -----------------------------------------------------
  {
    const html = await get("/about", { accept: "text/markdown;q=0.5, text/html;q=0.9" });
    check(
      "lower-q markdown loses to higher-q html",
      (html.response.headers.get("content-type") ?? "").startsWith("text/html"),
    );

    const md = await get("/about", { accept: "text/html;q=0, */*" });
    check(
      "explicit html rejection falls through to markdown",
      (md.response.headers.get("content-type") ?? "").startsWith("text/markdown"),
    );

    const wildcard = await get("/about", { accept: "*/*" });
    check(
      "*/* gets the HTML default",
      (wildcard.response.headers.get("content-type") ?? "").startsWith("text/html"),
    );

    const unacceptable = await get("/about", { accept: "application/pdf" });
    check("unsatisfiable Accept → 406", unacceptable.status === 406, `got ${unacceptable.status}`);
    check(
      "406 lists the available representations",
      unacceptable.body.includes("text/html") && unacceptable.body.includes("text/markdown"),
    );
    check(
      "406 sets Vary: Accept",
      /\baccept\b/i.test(unacceptable.response.headers.get("vary") ?? ""),
    );
  }

  // --- 404 ------------------------------------------------------------------
  {
    const html = await get("/this-path-does-not-exist", { accept: "text/html" });
    check("nonexistent path → real 404", html.status === 404, `got ${html.status}`);
    check("404 is not the app shell", !/Recent posts/.test(html.body));
    for (const link of ["/llms.txt", "/sitemap.xml", "/posts", "/feed.xml"]) {
      check(`404 body points at ${link}`, html.body.includes(link));
    }

    const md = await get("/this-path-does-not-exist", { accept: "text/markdown" });
    check("markdown 404 → 404", md.status === 404, `got ${md.status}`);
    check(
      "markdown 404 is markdown",
      (md.response.headers.get("content-type") ?? "").startsWith("text/markdown"),
    );
    check("markdown 404 has a markdown body with recovery links", md.body.includes("## Where to look next"));
  }

  // --- /resume --------------------------------------------------------------
  for (const path of ["/resume", "/Resume", "/RESUME", "/ReSuMe"]) {
    const { response, status } = await get(path);
    check(`${path} → 308`, status === 308, `got ${status}`);
    check(
      `${path} → the résumé PDF`,
      (response.headers.get("location") ?? "").endsWith("/Vir-Sanghavi-Resume.pdf"),
      response.headers.get("location") ?? "none",
    );
  }
  {
    const { response, status } = await get("/Vir-Sanghavi-Resume.pdf", { redirect: "follow" });
    check("résumé PDF → 200", status === 200, `got ${status}`);
    check(
      "résumé PDF content-type",
      (response.headers.get("content-type") ?? "").includes("pdf"),
      response.headers.get("content-type") ?? "none",
    );
  }

  // --- Legacy .html URLs ----------------------------------------------------
  const legacy = [
    ["/about.html", "/about"],
    ["/posts.html", "/posts"],
    ["/search.html", "/search"],
    ["/index.html", "/"],
    ...POSTS.map((slug) => [`/posts/${slug}.html`, `/posts/${slug}`]),
  ];
  for (const [from, to] of legacy) {
    const { response, status } = await get(from);
    check(`${from} → 308`, status === 308, `got ${status}`);
    check(
      `${from} → ${to}`,
      new URL(response.headers.get("location") ?? "", BASE).pathname === to,
      response.headers.get("location") ?? "none",
    );
  }

  // --- Machine-readable files ----------------------------------------------
  {
    const robots = await get("/robots.txt");
    check("robots.txt → 200", robots.status === 200, `got ${robots.status}`);
    for (const agent of [
      "GPTBot",
      "ChatGPT-User",
      "ClaudeBot",
      "PerplexityBot",
      "Google-Extended",
      "Applebot-Extended",
      "DeepSeekBot",
      "ora-agent",
    ]) {
      check(`robots.txt allows ${agent}`, robots.body.includes(agent));
    }
    check("robots.txt disallows nothing", !/^Disallow:\s*\/\s*$/m.test(robots.body));
    check("robots.txt links the sitemap", robots.body.includes("/sitemap.xml"));

    const sitemap = await get("/sitemap.xml");
    check("sitemap.xml → 200", sitemap.status === 200, `got ${sitemap.status}`);
    check("sitemap is XML", (sitemap.response.headers.get("content-type") ?? "").includes("xml"));
    check("sitemap has lastmod dates", sitemap.body.includes("<lastmod>"));
    for (const path of ["/", "/posts", "/about", "/contact", "/privacy", "/agents"]) {
      check(`sitemap lists ${path}`, sitemap.body.includes(`<loc>${BASE_CANONICAL()}${path === "/" ? "/" : path}</loc>`));
    }
    for (const slug of POSTS) {
      check(`sitemap lists /posts/${slug}`, sitemap.body.includes(`/posts/${slug}<`));
    }

    const llms = await get("/llms.txt");
    check("llms.txt → 200", llms.status === 200, `got ${llms.status}`);
    check("llms.txt starts with an H1", llms.body.startsWith("# "));
    check("llms.txt has a blockquote summary", llms.body.split("\n")[2]?.startsWith("> "));
    check("llms.txt has a when-to-use section", llms.body.includes("## When to use this site"));
    for (const slug of POSTS) check(`llms.txt links /posts/${slug}.md`, llms.body.includes(`/posts/${slug}.md`));

    const full = await get("/llms-full.txt");
    check("llms-full.txt → 200", full.status === 200, `got ${full.status}`);
    check("llms-full.txt is substantial", full.body.length > 20_000, `${full.body.length} bytes`);

    const feed = await get("/feed.xml");
    check("feed.xml → 200", feed.status === 200, `got ${feed.status}`);
    check("feed is RSS", feed.body.includes("<rss"));
    check("feed has every post", POSTS.every((slug) => feed.body.includes(`/posts/${slug}<`)));
  }

  // --- Summary --------------------------------------------------------------
  console.log(`\n${passed} checks passed`);
  if (failures.length) {
    console.log(`${failures.length} FAILED:`);
    for (const failure of failures) console.log(`  ✗ ${failure}`);
    process.exit(1);
  }
  console.log("All endpoint checks passed.");
}

/** Sitemap entries are always absolute against the canonical origin. */
function BASE_CANONICAL() {
  return process.env.CANONICAL_URL ?? "https://www.virsanghavi.com";
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
