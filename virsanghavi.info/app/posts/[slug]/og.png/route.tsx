import { getAllPosts, getPost } from "@/lib/posts";
import { shareImage } from "@/lib/share-image";

/** `og:image` for a post: 1200x630, rendered from the post's own frontmatter. */

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  return shareImage(post, "og");
}
