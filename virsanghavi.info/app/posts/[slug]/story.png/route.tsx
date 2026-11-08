import { getAllPosts, getPost } from "@/lib/posts";
import { shareImage } from "@/lib/share-image";

/**
 * A 1080x1920 story frame for a post. The share button on the post fetches
 * this and hands it to the native share sheet, so it opens in Instagram,
 * TikTok, or Snapchat as a ready-made story with the link on it.
 */

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  return shareImage(post, "story");
}
