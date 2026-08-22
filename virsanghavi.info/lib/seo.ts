import type { Metadata } from "next";
import { site } from "./site";

/**
 * Builds complete page metadata.
 *
 * Next.js replaces (rather than merges) the `openGraph` and `alternates`
 * objects when a page declares them, so every page must emit the full set:
 * canonical, `og:type`, `og:image`, and both the RSS and markdown alternates.
 * Composing them here is what keeps that from drifting page by page.
 */
export type PageMetaOptions = {
  /** Site-relative canonical path, e.g. `/about`. */
  path: string;
  title: string;
  description: string;
  /** Use the title verbatim instead of appending the site name. */
  absoluteTitle?: boolean;
  ogType?: "website" | "article" | "profile";
  image?: string;
  imageAlt?: string;
  /** Markdown twin. Defaults to `<path>.md` (`/index.md` for the home page). */
  markdownPath?: string;
  publishedTime?: string;
  noIndex?: boolean;
};

export function pageMetadata(options: PageMetaOptions): Metadata {
  const {
    path,
    title,
    description,
    absoluteTitle = false,
    ogType = "website",
    image = site.avatar,
    imageAlt = site.name,
    markdownPath = path === "/" ? "/index.md" : `${path}.md`,
    publishedTime,
    noIndex = false,
  } = options;

  const fullTitle = absoluteTitle || path === "/" ? title : `${title} | ${site.name}`;

  return {
    title: absoluteTitle || path === "/" ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
      types: {
        "application/rss+xml": [{ url: "/feed.xml", title: site.name }],
        "text/markdown": [{ url: markdownPath, title: `${title} (Markdown)` }],
      },
    },
    openGraph: {
      type: ogType,
      url: path,
      siteName: site.name,
      locale: "en_US",
      title: fullTitle,
      description,
      images: [{ url: image, alt: imageAlt }],
      ...(publishedTime && ogType === "article" ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary",
      site: "@virsanghavi13",
      creator: "@virsanghavi13",
      title: fullTitle,
      description,
      images: [image],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
