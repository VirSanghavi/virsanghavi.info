/**
 * AI crawlers and agent user agents that are explicitly welcome here.
 *
 * The site was previously behind Vercel's `ai_bots` managed firewall rule,
 * which denied all of these with a 403. Listing them in robots.txt states the
 * intent in the one place crawlers actually read, and keeps the allowlist under
 * version control rather than only in a dashboard toggle.
 */
export const AI_CRAWLERS: readonly string[] = [
  // OpenAI
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  // Anthropic
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Claude-Web",
  "anthropic-ai",
  // Google
  "Google-Extended",
  "GoogleOther",
  // Apple
  "Applebot",
  "Applebot-Extended",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Meta
  "FacebookBot",
  "meta-externalagent",
  "meta-externalfetcher",
  // Microsoft / Bing
  "bingbot",
  // Others
  "DeepSeekBot",
  "MistralAI-User",
  "cohere-ai",
  "cohere-training-data-crawler",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "Diffbot",
  "DuckAssistBot",
  "YouBot",
  "PanguBot",
  "Ai2Bot",
  "Ai2Bot-Dolma",
  "Timpibot",
  "ImagesiftBot",
  "omgili",
  "omgilibot",
  "Kangaroo Bot",
  "SemrushBot-OCOB",
  "Webzio-Extended",
  "ora-agent",
] as const;
