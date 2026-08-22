import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { SocialRow } from "@/components/social-links";
import { ArrowRightIcon, CalendarIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { graph, personNode, webPageNode } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/",
  title: site.name,
  description: site.tagline,
  ogType: "profile",
});

export const HOME_POST_COUNT = 6;

export default function HomePage() {
  const posts = getAllPosts().slice(0, HOME_POST_COUNT);

  return (
    <main>
      <JsonLd
        data={graph([
          webPageNode({
            path: "/",
            name: site.name,
            description: site.description,
            type: "ProfilePage",
          }),
          personNode(),
        ])}
      />

      <section>
        <div className="hero">
          <Link href="/about">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hero-avatar" src={site.avatar} alt={site.name} width={112} height={112} />
          </Link>
          <div className="hero-right">
            <h1>
              <a href="/feed.xml" className="hi-link">
                Hi
              </a>
              , I&apos;m @{site.handle}.
            </h1>
            <p>
              CEO @ <a href="https://ravioli.live">Ravioli</a>, building a free-to-play prediction
              market, with real prizes
            </p>
            <SocialRow className="hero-socials" />
          </div>
        </div>
      </section>

      <div className="content-wrap">
        <hr className="border" />
      </div>

      <section>
        <div className="posts-section">
          <h2>Recent posts</h2>
          <ul className="posts-list">
            {posts.map((post) => (
              <li className="post-card" key={post.slug}>
                <h3 className="post-card-title">
                  <Link href={post.url}>{post.title}</Link>
                </h3>
                <div className="post-card-meta">
                  <CalendarIcon className="meta-icon" />
                  <time dateTime={post.date}>{post.displayDate}</time>
                  <span className="meta-dot">{post.readingTime} min read</span>
                </div>
                <p className="post-card-desc">{post.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="all-posts-btn">
        <Link href="/posts">
          All Posts <ArrowRightIcon />
        </Link>
      </div>
    </main>
  );
}
