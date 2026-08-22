import { describe, expect, it } from "vitest";
import {
  blogPostingNode,
  breadcrumbNode,
  graph,
  organizationNode,
  personNode,
  webPageNode,
  websiteNode,
} from "@/lib/structured-data";
import { getPost } from "@/lib/posts";
import { site } from "@/lib/site";

describe("Person node", () => {
  const person = personNode();

  it("is a schema.org Person with a stable @id", () => {
    expect(person["@type"]).toBe("Person");
    expect(person["@id"]).toBe("https://www.virsanghavi.com/#person");
  });

  it("carries the identity fields an agent needs to resolve the entity", () => {
    expect(person.name).toBe("Vir Sanghavi");
    expect(person.jobTitle).toContain("CEO");
    expect(person.url).toBe("https://www.virsanghavi.com/");
    expect(person.email).toBe(`mailto:${site.email}`);
    expect(person.telephone).toBe(site.phone);
    expect(person.sameAs.length).toBeGreaterThanOrEqual(4);
    for (const url of person.sameAs) expect(url).toMatch(/^https:\/\//);
  });

  it("has a locality-level PostalAddress and no street address", () => {
    expect(person.address["@type"]).toBe("PostalAddress");
    expect(person.address.addressLocality).toBe("Houston");
    expect(person.address.addressRegion).toBe("TX");
    expect(person.address.addressCountry).toBe("US");
    expect(person.address).not.toHaveProperty("streetAddress");
  });
});

describe("Organization node", () => {
  const org = organizationNode();

  it("includes contactPoint with email, phone, and a contactType", () => {
    expect(org["@type"]).toBe("Organization");
    expect(org.contactPoint.length).toBeGreaterThan(0);
    const primary = org.contactPoint[0];
    expect(primary["@type"]).toBe("ContactPoint");
    expect(primary.contactType).toBeTruthy();
    expect(primary.email).toBe(site.email);
    expect(primary.telephone).toBe(site.phone);
    for (const point of org.contactPoint) {
      expect(point["@type"]).toBe("ContactPoint");
      expect(point.contactType).toBeTruthy();
    }
  });

  it("includes a PostalAddress", () => {
    expect(org.address["@type"]).toBe("PostalAddress");
    expect(org.address.addressLocality).toBe("Houston");
  });

  it("resolves back to the same Person", () => {
    expect(org.founder).toEqual({ "@id": "https://www.virsanghavi.com/#person" });
  });
});

describe("WebSite node", () => {
  it("declares the search action and the publisher", () => {
    const website = websiteNode();
    expect(website["@type"]).toBe("WebSite");
    expect(website.publisher).toEqual({ "@id": "https://www.virsanghavi.com/#person" });
    expect(website.potentialAction["@type"]).toBe("SearchAction");
  });
});

describe("BlogPosting node", () => {
  it("describes a post with dates, author, and publisher", () => {
    const post = getPost("shipping-fast")!;
    const node = blogPostingNode(post);
    expect(node["@type"]).toBe("BlogPosting");
    expect(node.headline).toBe(post.title);
    expect(node.datePublished).toBe(post.date);
    expect(node.url).toBe(`https://www.virsanghavi.com${post.url}`);
    expect(node.timeRequired).toBe(`PT${post.readingTime}M`);
    expect(node.wordCount).toBeGreaterThan(50);
    expect(node.author).toEqual({ "@id": "https://www.virsanghavi.com/#person" });
  });
});

describe("breadcrumbs", () => {
  it("numbers positions from 1 and uses absolute URLs", () => {
    const crumbs = breadcrumbNode([
      { name: "Vir Sanghavi", path: "/" },
      { name: "All Posts", path: "/posts" },
    ]);
    expect(crumbs.itemListElement[0].position).toBe(1);
    expect(crumbs.itemListElement[1].item).toBe("https://www.virsanghavi.com/posts");
  });
});

describe("graph", () => {
  it("is valid JSON-LD and survives serialisation", () => {
    const data = graph([
      personNode(),
      organizationNode(),
      websiteNode(),
      webPageNode({ path: "/about", name: "About", description: "About Vir." }),
    ]);
    expect(data["@context"]).toBe("https://schema.org");
    const round = JSON.parse(JSON.stringify(data));
    expect(round["@graph"].map((n: { "@type": string }) => n["@type"])).toEqual([
      "Person",
      "Organization",
      "WebSite",
      "WebPage",
    ]);
  });

  it("contains no raw `<` that could break out of a script element", () => {
    const json = JSON.stringify(graph([personNode(), organizationNode()])).replace(/</g, "\\u003c");
    expect(json).not.toContain("</");
  });
});
