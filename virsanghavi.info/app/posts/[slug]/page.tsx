import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getAllPosts, getPost } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";
import { CalendarIcon } from "@/components/icons";
import { CopyPostButton } from "@/components/copy-post-button";
import { JsonLd } from "@/components/json-ld";
import { blogPostingNode, breadcrumbNode, graph } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not Found" };

  return {
    ...pageMetadata({
      path: post.url,
      title: post.title,
      description: post.description,
      ogType: "article",
      publishedTime: post.date,
    }),
    authors: [{ name: site.name, url: absoluteUrl("/about") }],
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <section>
      <JsonLd
        data={graph([
          blogPostingNode(post),
          breadcrumbNode([
            { name: site.name, path: "/" },
            { name: "All Posts", path: "/posts" },
            { name: post.title, path: post.url },
          ]),
        ])}
      />
      <article className="article">
        <h1>{post.title}</h1>
        <div className="article-meta">
          <CalendarIcon className="meta-icon" />
          <time dateTime={post.date}>{post.displayDate}</time>
          <span className="meta-dot">{post.readingTime} min read</span>
          <CopyPostButton text={`${post.title}\n\n${post.markdown}`} />
        </div>
        <div
          className="article-body"
          // Rendered from this repo's own markdown, not from user input.
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
        <div id="tilt-root" style={{ marginTop: "2rem" }} />
        <Script
          src="https://data.tilt.vote/tilt-embed.js"
          strategy="lazyOnload"
          data-api-key="tilt_QAYumCHxHlNOlpYio6Gec1Sh6JzdP2L_uOJOONKkbtg"
          data-theme="midnight"
        />
      </article>
    </section>
  );
}
