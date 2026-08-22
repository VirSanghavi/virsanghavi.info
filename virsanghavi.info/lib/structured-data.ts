import { absoluteUrl, site } from "./site";
import type { Post } from "./posts";

/**
 * JSON-LD graph for the site.
 *
 * One `@graph` per page keeps every node cross-referenced by `@id`, so an
 * agent can resolve "who is this", "how do I contact them", and "what is this
 * page" from a single parse.
 *
 * Every fact here is verifiable from the résumé at {@link site.resumePath} or
 * from the linked profiles. No street address is published on purpose; the
 * `PostalAddress` is intentionally locality-level.
 */

const PERSON_ID = `${site.url}/#person`;
const ORGANIZATION_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

export const postalAddress = {
  "@type": "PostalAddress",
  addressLocality: site.locality,
  addressRegion: site.region,
  addressCountry: site.country,
} as const;

export const contactPoints = [
  {
    "@type": "ContactPoint",
    contactType: "personal",
    email: site.email,
    telephone: site.phone,
    availableLanguage: ["English", "Hindi", "Gujarati", "Spanish"],
    areaServed: "Worldwide",
  },
  {
    "@type": "ContactPoint",
    contactType: "technical support",
    email: site.email,
    url: absoluteUrl("/contact"),
    availableLanguage: ["English"],
  },
] as const;

export function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.name,
    alternateName: `@${site.handle}`,
    url: absoluteUrl("/"),
    mainEntityOfPage: absoluteUrl("/about"),
    image: absoluteUrl(site.photo),
    description: site.description,
    jobTitle: site.jobTitle,
    email: `mailto:${site.email}`,
    telephone: site.phone,
    address: postalAddress,
    contactPoint: contactPoints,
    knowsLanguage: ["en", "hi", "gu", "es"],
    knowsAbout: [
      "Prediction markets",
      "Mechanism design",
      "Multi-agent AI orchestration",
      "Model Context Protocol",
      "Full-stack engineering",
      "Startup fundraising",
      "STEM education access",
    ],
    worksFor: {
      "@type": "Organization",
      name: "Ravioli",
      url: "https://ravioli.live",
      description: "A free-to-play prediction market with real prizes.",
    },
    sameAs: [...site.sameAs],
  };
}

/**
 * The publishing entity behind this site. It is Vir's own practice rather than
 * a separate legal company — name, contact details, and locality all resolve
 * to the same person described by {@link personNode}.
 */
export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    legalName: site.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(site.avatar),
    image: absoluteUrl(site.avatar),
    description: site.description,
    email: site.email,
    telephone: site.phone,
    address: postalAddress,
    contactPoint: contactPoints,
    founder: { "@id": PERSON_ID },
    employee: { "@id": PERSON_ID },
    sameAs: [...site.sameAs],
    knowsLanguage: ["en", "hi", "gu", "es"],
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: site.name,
    description: site.description,
    inLanguage: site.language,
    publisher: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
    copyrightHolder: { "@id": PERSON_ID },
    license: "https://creativecommons.org/licenses/by/4.0/",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageNode(options: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "ProfilePage" | "CollectionPage" | "ContactPage";
}) {
  return {
    "@type": options.type ?? "WebPage",
    "@id": `${absoluteUrl(options.path)}#webpage`,
    url: absoluteUrl(options.path),
    name: options.name,
    description: options.description,
    inLanguage: site.language,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    primaryImageOfPage: absoluteUrl(site.avatar),
  };
}

export function blogPostingNode(post: Post) {
  return {
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(post.url)}#post`,
    headline: post.title,
    description: post.description,
    url: absoluteUrl(post.url),
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: site.language,
    wordCount: post.markdown.split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${post.readingTime}M`,
    author: { "@id": PERSON_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: absoluteUrl(post.url),
    image: absoluteUrl(site.avatar),
  };
}

export function breadcrumbNode(trail: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function graph(nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
