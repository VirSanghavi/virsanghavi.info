import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { SearchClient, type SearchablePost } from "@/components/search-client";

export const metadata: Metadata = pageMetadata({
  path: "/search",
  title: "Search",
  description: "Search every post by Vir Sanghavi by title or description.",
  noIndex: true,
});

export default function SearchPage() {
  const posts: SearchablePost[] = getAllPosts().map((post) => ({
    title: post.title,
    url: post.url,
    desc: post.description,
    date: post.displayDate,
  }));

  return (
    <main>
      <section>
        <div className="search-section">
          <h1>Search</h1>
          <p className="search-sub">Search any article ...</p>
          <SearchClient posts={posts} />
        </div>
      </section>
    </main>
  );
}
