import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { Post } from "./posts";
import { site } from "./site";

/**
 * Server-rendered share cards for every post.
 *
 * Two sizes, same design language as the site (Atkinson Hyperlegible, the
 * site's light palette, the accent blue):
 *
 *  - `og`: 1200x630, the `og:image` and Twitter card. What X, LinkedIn,
 *    iMessage, Slack, and the Instagram link sticker show for a post URL.
 *  - `story`: 1080x1920, a full Instagram / TikTok / Snapchat story frame.
 *    The share button on each post hands this file to the native share
 *    sheet, so it lands in Instagram Stories as a picture, not a bare link.
 *
 * Posts with a hero image get it as the top of the card; the rest get a
 * typographic card with the avatar, so no post ever previews as a blank.
 */

export const SHARE_SIZES = {
  og: { width: 1200, height: 630 },
  story: { width: 1080, height: 1920 },
} as const;

export type ShareVariant = keyof typeof SHARE_SIZES;

const COLORS = {
  background: "#fdfdfd",
  foreground: "#282728",
  accent: "#006cac",
  muted: "#6b6a6b",
  border: "#ece9e9",
};

let fontCache: Array<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }> | null =
  null;

function fonts() {
  if (fontCache) return fontCache;
  const dir = path.join(process.cwd(), "lib", "fonts");
  const load = (file: string) => {
    const buf = fs.readFileSync(path.join(dir, file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  };
  fontCache = [
    { name: "Atkinson Hyperlegible", data: load("AtkinsonHyperlegible-Regular.ttf"), weight: 400, style: "normal" },
    { name: "Atkinson Hyperlegible", data: load("AtkinsonHyperlegible-Bold.ttf"), weight: 700, style: "normal" },
  ];
  return fontCache;
}

/** Title size that keeps long titles on the card without ever clipping. */
function titleSize(title: string, base: number): number {
  if (title.length > 90) return Math.round(base * 0.7);
  if (title.length > 60) return Math.round(base * 0.82);
  return base;
}

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const dataUrlCache = new Map<string, string>();

/**
 * A `public/` file as a data URL. The cards are prerendered at build time,
 * before the deployment that carries a new post's picture is live, so they
 * must read the file from disk rather than fetch it from the site.
 */
function publicFileAsDataUrl(sitePath: string): string {
  const cached = dataUrlCache.get(sitePath);
  if (cached) return cached;
  const file = path.join(process.cwd(), "public", sitePath);
  const mime = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const url = `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
  dataUrlCache.set(sitePath, url);
  return url;
}

function pictureSrc(post: Post): string | undefined {
  const src = post.image?.src ?? post.video?.poster;
  return src ? publicFileAsDataUrl(src) : undefined;
}

export function shareImage(post: Post, variant: ShareVariant): ImageResponse {
  const { width, height } = SHARE_SIZES[variant];
  const picture = pictureSrc(post);
  const host = site.url.replace(/^https?:\/\//, "");

  const card =
    variant === "og" ? (
      <OgCard post={post} picture={picture} host={host} />
    ) : (
      <StoryCard post={post} picture={picture} host={host} />
    );

  return new ImageResponse(card, {
    width,
    height,
    fonts: fonts(),
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

type CardProps = { post: Post; picture?: string; host: string };

function OgCard({ post, picture, host }: CardProps) {
  const size = titleSize(post.title, picture ? 50 : 64);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: COLORS.background,
        color: COLORS.foreground,
        fontFamily: "Atkinson Hyperlegible",
      }}
    >
      {picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picture}
          alt=""
          width={1200}
          height={380}
          style={{ width: 1200, height: 380, objectFit: "cover", objectPosition: "center" }}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          padding: picture ? "28px 64px 36px" : "56px 64px 52px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: size,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
              textWrap: "balance",
              lineClamp: picture ? 2 : 3,
            }}
          >
            {post.title}
          </div>
          {picture ? null : (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.4,
                color: COLORS.muted,
                lineClamp: 3,
              }}
            >
              {post.description}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: COLORS.muted,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicFileAsDataUrl(site.avatar)}
              alt=""
              width={56}
              height={56}
              style={{ width: 56, height: 56, borderRadius: 999, border: `2px solid ${COLORS.border}` }}
            />
            <span style={{ color: COLORS.foreground, fontWeight: 700 }}>{site.name}</span>
            <span>{post.displayDate}</span>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <span style={{ color: COLORS.accent }}>{host}</span>
        </div>
      </div>
    </div>
  );
}

function StoryCard({ post, picture, host }: CardProps) {
  const size = titleSize(post.title, 84);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: COLORS.background,
        color: COLORS.foreground,
        fontFamily: "Atkinson Hyperlegible",
      }}
    >
      {/* Instagram overlays its own chrome on the top and bottom ~250px, so the
          card hugs its content and sits in the middle of the frame. */}
      <div style={{ display: "flex", flex: 1 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          margin: "0 72px",
          maxHeight: 1400,
          borderRadius: 28,
          border: `3px solid ${COLORS.border}`,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={picture}
            alt=""
            width={930}
            height={520}
            style={{ width: 930, height: 520, objectFit: "cover", objectPosition: "center" }}
          />
        ) : (
          <div style={{ display: "flex", height: 28, background: COLORS.accent }} />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 44,
            padding: "52px 60px 60px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div
              style={{
                display: "flex",
                fontSize: size,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                textWrap: "balance",
                lineClamp: 4,
              }}
            >
              {post.title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                lineHeight: 1.4,
                color: COLORS.muted,
                lineClamp: 5,
              }}
            >
              {post.description}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicFileAsDataUrl(site.avatar)}
                alt=""
                width={88}
                height={88}
                style={{ width: 88, height: 88, borderRadius: 999, border: `3px solid ${COLORS.border}` }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 700 }}>{site.name}</span>
                <span style={{ fontSize: 28, color: COLORS.muted }}>
                  {post.displayDate} · {post.readingTime} min read
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "26px 32px",
                borderRadius: 18,
                background: COLORS.accent,
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Read at {host.replace(/^www\./, "")}{post.url}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1 }} />
    </div>
  );
}
