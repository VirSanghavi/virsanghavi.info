import { markdownForPath, notFoundMarkdown } from "@/lib/markdown-pages";
import { absoluteUrl } from "@/lib/site";

/**
 * Serves the `text/markdown` representation of any page.
 *
 * Reached two ways, both set up in `proxy.ts`:
 *  - a request for the canonical URL with `Accept: text/markdown`
 *  - a request for the same URL with `.md` appended
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await params;
  const pathname = `/${slug.join("/")}`.replace(/\/+$/, "") || "/";

  const body = markdownForPath(pathname);

  const headers = new Headers({
    "Content-Type": "text/markdown; charset=utf-8",
    Vary: "Accept",
    Link: `<${absoluteUrl("/llms.txt")}>; rel="describedby"; type="text/plain"`,
  });

  if (body === null) {
    headers.set("Cache-Control", "no-store");
    return new Response(notFoundMarkdown(pathname), { status: 404, headers });
  }

  headers.set(
    "Link",
    `<${absoluteUrl(pathname)}>; rel="canonical", <${absoluteUrl("/llms.txt")}>; rel="describedby"; type="text/plain"`,
  );
  headers.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  return new Response(body, { status: 200, headers });
}
