import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getAllPosts, getPost } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";
import { CalendarIcon } from "@/components/icons";
import { CopyPostButton } from "@/components/copy-post-button";
import { SharePost } from "@/components/share-post";
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
      // Every post previews as a rendered card (title, hero, byline), so a
      // shared link never falls back to the avatar thumbnail.
      image: `${post.url}/og.png`,
      imageAlt: post.image?.alt ?? post.title,
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
        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="article-hero"
            src={post.image.src}
            alt={post.image.alt}
            width={1396}
            height={556}
            fetchPriority="high"
          />
        )}
        {post.video && (
          <video
            className="article-video"
            src={post.video.src}
            poster={post.video.poster}
            controls
            playsInline
            preload="metadata"
            aria-label={`${post.title}, video`}
          />
        )}
        <div
          className="article-body"
          // Rendered from this repo's own markdown, not from user input.
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
        <SharePost
          xHandle={site.xHandle}
          title={post.title}
          description={post.description}
          url={absoluteUrl(post.url)}
          storyImage={absoluteUrl(`${post.url}/story.png`)}
          slug={post.slug}
        />
        <div
          id="tilt-root"
          style={{ marginTop: "2rem" }}
          {...(post.tiltDebateId ? { "data-debate-id": post.tiltDebateId } : {})}
        />
        <Script
          src="https://data.tilt.vote/tilt-embed.js"
          strategy="lazyOnload"
          data-api-key="tilt_QAYumCHxHlNOlpYio6Gec1Sh6JzdP2L_uOJOONKkbtg"
          // The embed treats any `localhost` page as a Tilt dev host and
          // points its API at the page's own origin, which 404s here. Pin it.
          data-api-base="https://data.tilt.vote/api/v1"
          data-theme="midnight"
        />
      </article>
    </section>
  );
}
