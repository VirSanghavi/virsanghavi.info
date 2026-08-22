import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { prosePages } from "@/lib/pages";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const newestPost = posts[0]?.date ?? "2026-01-01";

  return [
    {
      url: absoluteUrl("/"),
      lastModified: newestPost,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/posts"),
      lastModified: newestPost,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...prosePages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: page.updated,
      changeFrequency: "monthly" as const,
      priority: page.slug === "about" ? 0.9 : 0.6,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(post.url),
      lastModified: post.date,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
