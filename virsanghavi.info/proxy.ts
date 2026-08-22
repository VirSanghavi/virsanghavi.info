import { NextResponse, type NextRequest } from "next/server";
import { appendVaryAccept, MEDIA_MARKDOWN, PRODUCES, preferredType } from "@/lib/accept";

/**
 * Request-time routing that cannot live in the app router:
 *
 *  1. `/resume` (any casing) resolves to the résumé PDF.
 *  2. `Accept: text/markdown` and `.md` URLs get the markdown representation
 *     of the same page, per https://acceptmarkdown.com.
 *  3. Every negotiable response carries `Vary: Accept` so a CDN cannot hand an
 *     agent the cached HTML variant.
 */

const RESUME_PDF = "/Vir-Sanghavi-Resume.pdf";
const MARKDOWN_ROUTE = "/api/markdown";

/** Paths that are already a concrete file format and must not be negotiated. */
const NON_NEGOTIABLE = /\.(?!md$)[a-z0-9]+$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();

  // 1. /resume, /Resume, /RESUME/ … → the current résumé PDF.
  if (lower === "/resume" || lower === "/resume/") {
    // Built from `request.url`, not a `nextUrl` clone: NextURL re-applies the
    // request's trailing slash, which would point at "…Resume.pdf/".
    return NextResponse.redirect(new URL(RESUME_PDF, request.url), 308);
  }

  // 2a. Explicit `.md` URL: always markdown, whatever the Accept header says.
  // This is what `rel="alternate"` points at, and crawlers following it may
  // send no Accept header at all.
  if (lower.endsWith(".md")) {
    const url = request.nextUrl.clone();
    const base = pathname.slice(0, -3);
    url.pathname = `${MARKDOWN_ROUTE}${base === "/index" ? "" : base}`;
    const response = NextResponse.rewrite(url);
    appendVaryAccept(response.headers);
    return response;
  }

  // Static assets and already-machine-readable files pass straight through.
  if (NON_NEGOTIABLE.test(pathname)) return NextResponse.next();

  const accept = request.headers.get("accept");
  const chosen = preferredType(accept, PRODUCES);

  // 2b. Negotiated markdown for the canonical URL.
  if (chosen === MEDIA_MARKDOWN) {
    const url = request.nextUrl.clone();
    url.pathname = `${MARKDOWN_ROUTE}${pathname === "/" ? "" : pathname.replace(/\/+$/, "")}`;
    const response = NextResponse.rewrite(url);
    appendVaryAccept(response.headers);
    return response;
  }

  // The client ruled out everything we can produce.
  if (chosen === null) {
    return new NextResponse(
      "406 Not Acceptable\n\nThis resource is available in:\n- text/html\n- text/markdown\n",
      {
        status: 406,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          Vary: "Accept",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  // 3. HTML, with Vary so caches key on Accept.
  const response = NextResponse.next();
  appendVaryAccept(response.headers);
  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/|_vercel/).*)"],
};
