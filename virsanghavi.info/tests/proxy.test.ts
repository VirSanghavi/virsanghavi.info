import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "https://www.virsanghavi.com"), { headers });
}

const rewritten = (response: Response) => response.headers.get("x-middleware-rewrite");

describe("/resume", () => {
  it.each(["/resume", "/Resume", "/RESUME", "/ReSuMe", "/resume/"])(
    "%s redirects to the résumé PDF",
    (path) => {
      const response = proxy(request(path));
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(
        "https://www.virsanghavi.com/Vir-Sanghavi-Resume.pdf",
      );
    },
  );

  it("does not hijack paths that merely start with resume", () => {
    expect(proxy(request("/resumes")).status).not.toBe(308);
    expect(proxy(request("/posts/resume-tips")).status).not.toBe(308);
  });
});

describe(".md URLs", () => {
  it("serve markdown regardless of the Accept header", () => {
    const response = proxy(request("/about.md", { accept: "text/html" }));
    expect(rewritten(response)).toContain("/api/markdown/about");
    expect(response.headers.get("Vary")).toContain("Accept");
  });

  it("map /index.md to the home representation", () => {
    expect(rewritten(proxy(request("/index.md")))).toMatch(/\/api\/markdown$/);
  });

  it("work for nested post paths", () => {
    expect(rewritten(proxy(request("/posts/shipping-fast.md")))).toContain(
      "/api/markdown/posts/shipping-fast",
    );
  });
});

describe("Accept negotiation", () => {
  it("rewrites to the markdown route when markdown is preferred", () => {
    const response = proxy(request("/about", { accept: "text/markdown" }));
    expect(rewritten(response)).toContain("/api/markdown/about");
    expect(response.headers.get("Vary")).toContain("Accept");
  });

  it("rewrites the home page to the bare markdown route", () => {
    expect(rewritten(proxy(request("/", { accept: "text/markdown" })))).toMatch(
      /\/api\/markdown$/,
    );
  });

  it("serves HTML for a browser Accept header", () => {
    const response = proxy(
      request("/about", { accept: "text/html,application/xhtml+xml,*/*;q=0.8" }),
    );
    expect(rewritten(response)).toBeNull();
    expect(response.status).toBe(200);
  });

  it("serves HTML when Accept is absent", () => {
    expect(rewritten(proxy(request("/about")))).toBeNull();
  });

  it("answers 406 when nothing we produce is acceptable", () => {
    const response = proxy(request("/about", { accept: "application/pdf" }));
    expect(response.status).toBe(406);
    expect(response.headers.get("Vary")).toBe("Accept");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("lists the available representations in the 406 body", async () => {
    const body = await proxy(request("/about", { accept: "application/pdf" })).text();
    expect(body).toContain("text/html");
    expect(body).toContain("text/markdown");
  });
});

describe("static assets", () => {
  it.each([
    "/vir2.png",
    "/favicon.ico",
    "/Vir-Sanghavi-Resume.pdf",
    "/robots.txt",
    "/sitemap.xml",
    "/feed.xml",
    "/llms.txt",
  ])("%s is never negotiated", (path) => {
    const response = proxy(request(path, { accept: "text/markdown" }));
    expect(rewritten(response)).toBeNull();
  });
});
