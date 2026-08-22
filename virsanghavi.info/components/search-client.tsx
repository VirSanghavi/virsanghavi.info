"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { SearchIcon } from "./icons";

export type SearchablePost = {
  title: string;
  url: string;
  desc: string;
  date: string;
};

/** Wrap the matched substring in a <mark>, leaving the rest as plain text. */
function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="search-mark">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function SearchClient({ posts }: { posts: SearchablePost[] }) {
  const [value, setValue] = useState("");
  const query = value.toLowerCase().trim();

  const results = useMemo(() => {
    if (!query) return [];
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) || post.desc.toLowerCase().includes(query),
    );
  }, [posts, query]);

  return (
    <>
      <div className="search-box">
        <SearchIcon />
        <input
          type="text"
          id="search-input"
          placeholder="Search posts, e.g. 'YC rejection'"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Search posts"
        />
      </div>
      <ul id="search-results" className="search-results">
        {query && results.length === 0 ? (
          <li className="sr-empty">No posts found.</li>
        ) : (
          results.map((post) => (
            <li key={post.url}>
              <Link href={post.url}>
                <div className="sr-title">{highlight(post.title, query)}</div>
                <div className="sr-meta">{post.date}</div>
                <div className="sr-desc">{highlight(post.desc, query)}</div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
