import { Marked, type Tokens } from "marked";

/**
 * Markdown renderer shared by blog posts and the static prose pages.
 *
 * Two deliberate differences from stock `marked`:
 *  - `h1` is demoted to `h2`. Every page already renders its title as the sole
 *    `h1`, so an in-body `h1` would produce a second one and flatten the
 *    document outline. (The previous hand-rolled renderer dropped these
 *    headings entirely, silently losing authored content.)
 *  - External links get `target="_blank" rel="noopener noreferrer"`, matching
 *    how links behaved in the hand-written HTML.
 */
const marked = new Marked({ gfm: true, breaks: false });

marked.use({
  renderer: {
    heading({ tokens, depth }: Tokens.Heading) {
      const level = Math.min(depth + (depth === 1 ? 1 : 0), 6);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      const isExternal = /^https?:\/\//i.test(href);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      const relAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHtml(href)}"${titleAttr}${relAttr}>${text}</a>`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false }) as string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

/**
 * Rough plain-text length of rendered markdown. Used by tests that assert the
 * trust-anchor pages carry enough substance for agents to verify the site.
 */
export function plainTextLength(source: string): number {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>`|-]/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
}
