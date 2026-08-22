import { buildLlmsTxt } from "@/lib/llms";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      // The spec calls the file markdown; text/plain keeps it viewable in a
      // browser, and the charset is explicit for the em dashes and accents.
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'inline; filename="llms.txt"',
    },
  });
}
