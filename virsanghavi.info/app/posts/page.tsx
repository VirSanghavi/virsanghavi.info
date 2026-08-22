import type { Metadata } from "next";
import Link from "next/link";
import { getPostsByYear } from "@/lib/posts";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbNode, graph, webPageNode } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";

const POSTS_DESCRIPTION =
  "Every essay by Vir Sanghavi, newest first — prediction markets, multi-agent AI orchestration, YC hackathons, and building a startup while in high school.";

export const metadata: Metadata = pageMetadata({
  path: "/posts",
  title: "All Posts",
  description: POSTS_DESCRIPTION,
});

export default function PostsPage() {
  const years = getPostsByYear();

  return (
    <main>
      <JsonLd
        data={graph([
          webPageNode({
            path: "/posts",
            name: "All Posts",
            description: POSTS_DESCRIPTION,
            type: "CollectionPage",
          }),
          breadcrumbNode([
            { name: site.name, path: "/" },
            { name: "All Posts", path: "/posts" },
          ]),
        ])}
      />
      <section>
        <h1 className="page-title">All Posts</h1>

        <ul className="posts-by-year">
          {years.map((group) => (
            <li className="year-group" key={group.year}>
              <h2>{group.year}</h2>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {group.posts.map((post) => (
                  <li className="post-entry" key={post.slug}>
                    <span className="date">{post.shortDate}</span>
                    <Link href={post.url}>{post.title}</Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
