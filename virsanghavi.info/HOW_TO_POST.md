# How to Create a New Blog Post

Adding a new post to your website is now very easy and doesn't require any coding!

### Step 1: Create your post
1. Go to the `content/blog/` folder.
2. Find the file named `boilerplate.md`.
3. Make a copy of it and name it something like `my-new-post.md`.
4. Open the file in any text editor.

### Step 2: Edit the details (Frontmatter)
At the very top of the file, you'll see a section between `---` lines. This is where you set the "behind the scenes" details:
- **title**: The title of your post.
- **pubDatetime**: Date in `YYYY-MM-DD` format (e.g., `2026-02-18`).
- **description**: A short summary that shows up on the home page.
- **readingTime**: How many minutes it takes to read.

### Step 3: Write your content
Below the second `---`, just start typing! You can use standard Markdown:
- Use `#` for the main title.
- Use `##` or `###` for subheadings.
- Use `**bold**` or `*italics*`.
- Use `-` for bullets.

### Step 4: Publish your post
Once you are done writing, save the file. Then, run this command in your terminal:
```bash
npm run build
```
This will automatically:
- Create the new page for your post.
- Add it to the list of posts on the **Home page**.
- Add it to the **All Posts** page.
- Update your RSS feed.

That's it! No code required.
