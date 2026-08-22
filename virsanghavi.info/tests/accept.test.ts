import { describe, expect, it } from "vitest";
import {
  appendVaryAccept,
  MEDIA_HTML,
  MEDIA_MARKDOWN,
  parseAccept,
  preferredType,
} from "@/lib/accept";

describe("parseAccept", () => {
  it("reads q-values and specificity", () => {
    expect(parseAccept("text/markdown;q=0.8, text/*;q=0.5, */*;q=0.1")).toEqual([
      { type: "text/markdown", q: 0.8, specificity: 2 },
      { type: "text/*", q: 0.5, specificity: 1 },
      { type: "*/*", q: 0.1, specificity: 0 },
    ]);
  });

  it("defaults q to 1 and lowercases the type", () => {
    expect(parseAccept("TEXT/Markdown")).toEqual([
      { type: "text/markdown", q: 1, specificity: 2 },
    ]);
  });

  it("clamps out-of-range and non-numeric q values", () => {
    expect(parseAccept("text/html;q=9")[0].q).toBe(1);
    expect(parseAccept("text/html;q=-3")[0].q).toBe(0);
    expect(parseAccept("text/html;q=nope")[0].q).toBe(1);
  });

  it("drops entries that are not media ranges", () => {
    expect(parseAccept("garbage, text/html")).toEqual([
      { type: "text/html", q: 1, specificity: 2 },
    ]);
  });
});

describe("preferredType", () => {
  it("serves HTML when Accept is absent or empty", () => {
    expect(preferredType(null)).toBe(MEDIA_HTML);
    expect(preferredType(undefined)).toBe(MEDIA_HTML);
    expect(preferredType("   ")).toBe(MEDIA_HTML);
  });

  it("serves HTML for a wildcard-only Accept", () => {
    expect(preferredType("*/*")).toBe(MEDIA_HTML);
  });

  it("serves markdown when it is asked for explicitly", () => {
    expect(preferredType("text/markdown")).toBe(MEDIA_MARKDOWN);
  });

  it("ranks by q-value before client order", () => {
    expect(preferredType("text/markdown;q=0.5, text/html;q=0.9")).toBe(MEDIA_HTML);
    expect(preferredType("text/html;q=0.9, text/markdown;q=1.0")).toBe(MEDIA_MARKDOWN);
  });

  it("breaks q-value ties on client order", () => {
    expect(preferredType("text/markdown, text/html")).toBe(MEDIA_MARKDOWN);
    expect(preferredType("text/html, text/markdown")).toBe(MEDIA_HTML);
  });

  it("lets a specific range override a wildcard regardless of q (RFC 9110 §12.5.1)", () => {
    // The wildcard must not resurrect a type the client explicitly rejected.
    expect(preferredType("text/html;q=0, */*;q=1")).toBe(MEDIA_MARKDOWN);
    expect(preferredType("text/markdown;q=0, */*;q=1")).toBe(MEDIA_HTML);
  });

  it("matches a type/* range", () => {
    expect(preferredType("text/*")).toBe(MEDIA_HTML);
    expect(preferredType("application/*")).toBeNull();
  });

  it("returns null only when nothing we produce is acceptable", () => {
    expect(preferredType("application/pdf")).toBeNull();
    expect(preferredType("text/html;q=0, text/markdown;q=0")).toBeNull();
    expect(preferredType("*/*;q=0")).toBeNull();
  });
});

describe("appendVaryAccept", () => {
  it("sets Accept when Vary is absent", () => {
    const headers = new Headers();
    appendVaryAccept(headers);
    expect(headers.get("Vary")).toBe("Accept");
  });

  it("appends without clobbering existing tokens", () => {
    const headers = new Headers({ Vary: "Accept-Encoding" });
    appendVaryAccept(headers);
    expect(headers.get("Vary")).toBe("Accept-Encoding, Accept");
  });

  it("does not duplicate Accept", () => {
    const headers = new Headers({ Vary: "accept, Accept-Encoding" });
    appendVaryAccept(headers);
    expect(headers.get("Vary")).toBe("accept, Accept-Encoding");
  });

  it("leaves Vary: * alone", () => {
    const headers = new Headers({ Vary: "*" });
    appendVaryAccept(headers);
    expect(headers.get("Vary")).toBe("*");
  });
});
