# How to Create a New Blog Post

Adding a post is one file. No code, no build step to remember.

### Step 1: Write the post
1. Go to `content/blog/`.
2. Create a file named after the URL you want, e.g. `my-new-post.md`.
   The file name becomes the URL: `/posts/my-new-post`.
3. Start the file with the frontmatter block:

```markdown
---
title: "My New Post"
pubDatetime: 2026-09-01
description: "One sentence that shows up on the home page and in search."
readingTime: 4
---

Write the post here in normal Markdown.

## A section heading

- bullets
- **bold**, *italics*, [links](https://example.com), `code`
```

- **title** — shown as the page's H1 and in the browser tab.
- **pubDatetime** — `YYYY-MM-DD`. This exact day is what the site displays.
- **description** — the summary on the home page, in the RSS feed, and in link previews.
- **readingTime** — minutes, a whole number.

Do not add a `# Heading` for the title; the title comes from the frontmatter.
Any `#` heading inside the body is rendered as an H2 so the page keeps one H1.

### Step 2: Look at it
```bash
npm run dev
```
Open http://localhost:3000. The post appears on the home page, in `/posts`,
in search, in `/feed.xml`, in `/sitemap.xml`, and in `/llms.txt` automatically —
all of those read from `content/blog/` directly, so nothing needs regenerating.

### Step 3: Publish
```bash
npm test          # unit tests
git add content/blog/my-new-post.md
git commit -m "Add post: my new post"
git push
```

Pushing to `main` deploys to https://www.virsanghavi.com via Vercel.
After the deploy finishes, you can sanity-check the whole site with:

```bash
BASE_URL=https://www.virsanghavi.com node tests/e2e/run.mjs
```

### Removing a post
Delete its `.md` file and push. Nothing else references it.
