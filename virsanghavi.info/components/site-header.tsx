"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon, SearchIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { GAME_TOGGLE_EVENT } from "./game-overlay";
import { site } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // The mobile menu is a checkbox-driven CSS panel; close it whenever the
  // route changes so it does not stay open across client-side navigations.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isPosts = pathname === "/" || pathname === "/posts" || pathname.startsWith("/posts/");
  const isAbout = pathname === "/about";
  const isSearch = pathname === "/search";

  return (
    <header>
      <div className="header-inner">
        <div className="site-title">
          <Link href="/">{site.name}</Link>
        </div>
        <input
          type="checkbox"
          id="nav-check"
          className="nav-check"
          aria-hidden="true"
          checked={menuOpen}
          onChange={(event) => setMenuOpen(event.target.checked)}
        />
        <label htmlFor="nav-check" className="nav-toggle" aria-label="Toggle menu">
          <span className="icon-menu">
            <MenuIcon />
          </span>
          <span className="icon-close">
            <CloseIcon />
          </span>
        </label>
        <nav className="nav-links">
          <Link href="/" className={isPosts ? "active-nav" : undefined}>
            Posts
          </Link>
          <Link href="/about" className={isAbout ? "active-nav" : undefined}>
            About
          </Link>
          <button
            id="game-toggle"
            className="nav-game-btn"
            type="button"
            aria-label="Play game"
            title="Play game"
            onClick={() => window.dispatchEvent(new Event(GAME_TOGGLE_EVENT))}
          >
            Play
          </button>
          <div className="nav-utils">
            <Link href="/search" aria-label="Search" className={isSearch ? "active-nav" : undefined}>
              <SearchIcon className="nav-icon" />
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </div>
      <div className="content-wrap">
        <hr className="border" />
      </div>
    </header>
  );
}
