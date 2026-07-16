const fs = require('fs');
const path = require('path');

// Configuration
const BLOG_DIR = path.join(__dirname, 'content/blog');
const POSTS_DIR = path.join(__dirname, 'posts');
const TEMPLATE_PATH = path.join(__dirname, 'posts/yc-rejection-and-building-stronger.html');

function build() {
  console.log('Building blog posts...');
  
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`Error: Blog directory not found at ${BLOG_DIR}`);
    return;
  }

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const allPosts = [];

  files.forEach(file => {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    const post = parseMarkdown(content, file);
    allPosts.push(post);
    generatePostHtml(post);
  });

  // Safe Cleanup: Protect the template file explicitly
  const generatedSlugs = allPosts.map(p => p.slug);
  if (fs.existsSync(POSTS_DIR)) {
    const existingHtmlFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html'));
    existingHtmlFiles.forEach(htmlFile => {
      const slug = htmlFile.replace('.html', '');
      const isTemplate = path.resolve(path.join(POSTS_DIR, htmlFile)) === path.resolve(TEMPLATE_PATH);
      
      if (!generatedSlugs.includes(slug) && !isTemplate) {
        console.log(`Removing stale post: ${htmlFile}`);
        fs.unlinkSync(path.join(POSTS_DIR, htmlFile));
      }
    });
  }

  allPosts.sort((a, b) => new Date(b.pubDatetime) - new Date(a.pubDatetime));

  updateIndex(allPosts);
  updateAllPosts(allPosts);
  updateFeed(allPosts);
  updateSearch(allPosts);

  console.log(`Successfully built ${allPosts.length} posts!`);
}

function parseMarkdown(content, filename) {
  // Normalize line endings
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const frontmatter = {};
  let bodyStart = 0;

  if (lines[0] === '---') {
    let i = 1;
    while (i < lines.length && lines[i] !== '---') {
      const firstColon = lines[i].indexOf(':');
      if (firstColon !== -1) {
        const key = lines[i].slice(0, firstColon).trim();
        const value = lines[i].slice(firstColon + 1).trim();
        frontmatter[key] = value.replace(/^['"](.*)['"]$/, '$1');
      }
      i++;
    }
    bodyStart = i + 1;
  }

  const body = lines.slice(bodyStart).join('\n').trim();
  const slug = filename.replace('.md', '');
  return {
    title: 'Untitled Post',
    description: '',
    pubDatetime: new Date().toISOString(),
    readingTime: '5',
    ...frontmatter,
    body,
    slug,
    filename: slug + '.html'
  };
}

function generatePostHtml(post) {
  let htmlBody = post.body
    .replace(/^# (.*$)/gm, '') 
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Multi-line code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code blocks
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    // Unordered lists
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');

  // Strict structural block joining
  htmlBody = htmlBody.replace(/(<li>.*<\/li>\n*)+/g, (match) => `<ul>\n${match}</ul>\n`);

  // Paragraph compilation
  htmlBody = htmlBody.split(/\n{2,}/)
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      // Safe layout block protection
      if (/^<(h\d|ul|li|pre|article|p|div|ol)/i.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join('\n');

  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Critical template error missing: ${TEMPLATE_PATH}`);
    return;
  }
  
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const output = template
    .replace(/<title>.*?<\/title>/, `<title>${post.title} | Vir Sanghavi</title>`)
    .replace(/<meta name="description" content=".*?"\s*\/?>/, `<meta name="description" content="${post.description}" />`)
    .replace(/<article class="article">[\s\S]*?<\/article>/, `
      <article class="article">
        <h1>${post.title}</h1>
        <div class="article-meta">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <time>${formatDate(post.pubDatetime)}</time>
          <span class="meta-dot">${post.readingTime} min read</span>
        </div>
        <div class="article-body">
          ${htmlBody}
        </div>
        <div id="tilt-root" style="margin-top: 2rem;"></div>
        <script async src="https://data.tilt.vote/tilt-embed.js" data-api-key="tilt_QAYumCHxHlNOlpYio6Gec1Sh6JzdP2L_uOJOONKkbtg" data-theme="midnight"></script>
      </article>
    `);

  fs.writeFileSync(path.join(POSTS_DIR, post.filename), output);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Date Unknown';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function updateIndex(posts) {
  const indexPath = path.join(__dirname, 'index.html');
  if (!fs.existsSync(indexPath)) return;
  let content = fs.readFileSync(indexPath, 'utf8');
  const postsHtml = posts.slice(0, 6).map(post => `
    <li class="post-card">
      <h3 class="post-card-title"><a href="/posts/${post.filename}">${post.title}</a></h3>
      <div class="post-card-meta">
        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <time>${formatDate(post.pubDatetime)}</time>
        <span class="meta-dot">${post.readingTime} min read</span>
      </div>
      <p class="post-card-desc">${post.description}</p>
    </li>`).join('\n');
  const newContent = content.replace(/<!-- posts-start -->[\s\S]*?<!-- posts-end -->/, `<!-- posts-start -->\n${postsHtml}\n<!-- posts-end -->`);
  fs.writeFileSync(indexPath, newContent);
}

function updateAllPosts(posts) {
  const postsPath = path.join(__dirname, 'posts.html');
  if (!fs.existsSync(postsPath)) return;
  let content = fs.readFileSync(postsPath, 'utf8');
  const groups = {};
  posts.forEach(post => {
    const year = new Date(post.pubDatetime).getFullYear() || new Date().getFullYear();
    if (!groups[year]) groups[year] = [];
    groups[year].push(post);
  });
  const years = Object.keys(groups).sort((a, b) => b - a);
  const htmlGroups = years.map(year => `
    <li class="year-group">
      <h3>${year}</h3>
      <ul style="list-style:none;padding:0;">
        ${groups[year].map(post => `
        <li class="post-entry">
          <span class="date">${formatDate(post.pubDatetime).split(',')[0]}</span>
          <a href="/posts/${post.filename}">${post.title}</a>
        </li>`).join('\n')}
      </ul>
    </li>`).join('\n');
  const newContent = content.replace(/<!-- posts-start -->[\s\S]*?<!-- posts-end -->/, `<!-- posts-start -->\n${htmlGroups}\n<!-- posts-end -->`);
  fs.writeFileSync(postsPath, newContent);
}

function updateFeed(posts) {
  const feedPath = path.join(__dirname, 'feed.xml');
  if (!fs.existsSync(feedPath)) return;
  const items = posts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>https://virsanghavi.info/posts/${post.filename}</link>
      <guid>https://virsanghavi.info/posts/${post.filename}</guid>
      <pubDate>${new Date(post.pubDatetime).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`).join('');
  const feedContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vir Sanghavi</title>
    <link>https://virsanghavi.info/</link>
    <description>CEO @ Ravioli, building a free-to-play prediction market, with real prizes.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://virsanghavi.info/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
  fs.writeFileSync(feedPath, feedContent);
}

function updateSearch(posts) {
  const searchPath = path.join(__dirname, 'components/search.js');
  if (!fs.existsSync(searchPath)) return;
  const postsJson = posts.map(post => ({
    title: post.title,
    url: `/posts/${post.filename}`,
    desc: post.description,
    date: formatDate(post.pubDatetime)
  }));
  let content = fs.readFileSync(searchPath, 'utf8');
  const newContent = content.replace(/var posts = \[[\s\S]*?\];/, `var posts = ${JSON.stringify(postsJson, null, 2)};`);
  fs.writeFileSync(searchPath, newContent);
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

build();
