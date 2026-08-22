import { getAllPosts } from "@/lib/posts";
import { escapeXml } from "@/lib/markdown";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const posts = getAllPosts();
  const lastBuild = posts.length
    ? new Date(`${posts[0].date}T00:00:00Z`).toUTCString()
    : new Date(0).toUTCString();

  const items = posts
    .map((post) =>
      [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${absoluteUrl(post.url)}</link>`,
        `      <guid isPermaLink="true">${absoluteUrl(post.url)}</guid>`,
        `      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        "    </item>",
      ].join("\n"),
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${escapeXml(site.tagline)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
