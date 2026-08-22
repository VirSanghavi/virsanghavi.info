/**
 * RFC 9110 §12.5.1 `Accept` header negotiation.
 *
 * Implements the acceptmarkdown.com contract: parse (never substring-match)
 * the header, rank by q-value with a most-specific-range-wins tiebreak, honour
 * explicit `q=0` rejections, and report when nothing the server produces is
 * acceptable so the caller can answer `406`.
 *
 * See https://acceptmarkdown.com/start and https://acceptmarkdown.com/guides/returning-406
 */

export const MEDIA_HTML = "text/html";
export const MEDIA_MARKDOWN = "text/markdown";

/** Types this site can serve, most-preferred default first. */
export const PRODUCES: readonly string[] = [MEDIA_HTML, MEDIA_MARKDOWN];

export type AcceptEntry = {
  type: string;
  q: number;
  /** 2 = `type/subtype`, 1 = `type/*`, 0 = `*​/*`. */
  specificity: number;
};

export function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const parts = raw.split(";").map((s) => s.trim());
      const type = parts[0].toLowerCase();
      let q = 1;
      for (const param of parts.slice(1)) {
        const eq = param.indexOf("=");
        if (eq === -1) continue;
        const name = param.slice(0, eq).trim().toLowerCase();
        const value = param.slice(eq + 1).trim();
        if (name !== "q") continue;
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity };
    })
    .filter((entry) => entry.type.includes("/"));
}

function matches(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) return candidate.startsWith(entry.type.slice(0, -1));
  return entry.type === candidate;
}

/**
 * Pick the best representation for an `Accept` header.
 *
 * Returns the default (`text/html`) when the header is absent or empty — a
 * missing `Accept` means "no constraint", never "nothing works". Returns
 * `null` only when the client explicitly rules out everything we produce,
 * which is the one case that warrants a `406`.
 */
export function preferredType(
  header: string | null | undefined,
  produces: readonly string[] = PRODUCES,
): string | null {
  if (!header || !header.trim()) return produces[0];
  const entries = parseAccept(header);
  if (entries.length === 0) return produces[0];

  let bestType: string | null = null;
  let bestQ = -1;
  let bestPosition = Number.POSITIVE_INFINITY;

  for (const candidate of produces) {
    // Most specific matching range wins regardless of q, so
    // `text/html;q=0, */*` correctly rejects HTML instead of letting the
    // wildcard resurrect it.
    let matched: AcceptEntry | null = null;
    let matchedPosition = Number.POSITIVE_INFINITY;
    for (let idx = 0; idx < entries.length; idx++) {
      const entry = entries[idx];
      if (!matches(entry, candidate)) continue;
      if (
        matched === null ||
        entry.specificity > matched.specificity ||
        (entry.specificity === matched.specificity && idx < matchedPosition)
      ) {
        matched = entry;
        matchedPosition = idx;
      }
    }
    if (matched === null) continue;
    if (matched.q <= 0) continue; // explicit rejection

    // Across candidates: highest q wins, ties break on client ordering so
    // `Accept: text/markdown, text/html` picks Markdown.
    if (matched.q > bestQ || (matched.q === bestQ && matchedPosition < bestPosition)) {
      bestQ = matched.q;
      bestPosition = matchedPosition;
      bestType = candidate;
    }
  }

  return bestType;
}

/** Add `Accept` to an existing `Vary` header without duplicating it. */
export function appendVaryAccept(headers: Headers): void {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", "Accept");
    return;
  }
  const tokens = existing.split(",").map((s) => s.trim().toLowerCase());
  if (tokens.includes("*")) return;
  if (!tokens.includes("accept")) headers.set("Vary", `${existing}, Accept`);
}
