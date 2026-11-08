"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, InstagramIcon, LinkIcon, LinkedInIcon, ShareIcon, XIcon } from "./icons";

export type SharePostProps = {
  title: string;
  description: string;
  /** Absolute URL of the post. */
  url: string;
  /** Absolute URL of the 1080x1920 story frame for this post. */
  storyImage: string;
  /** Slug, used to name the downloaded story file. */
  slug: string;
};

type Notice = "copied" | "saved" | "shared" | null;

/**
 * The share row under every post.
 *
 * - Story: on a phone, hands the post's story frame (a PNG) to the native
 *   share sheet, so Instagram / TikTok / Snapchat receive a finished story
 *   with the link on it. Where files cannot be shared (most desktops), the
 *   frame downloads instead, ready to post from the phone.
 * - X and LinkedIn: plain intent links, no third-party scripts.
 * - Share: the native sheet with title + URL, where one exists.
 * - Copy link.
 */
export function SharePost({ title, description, url, storyImage, slug }: SharePostProps) {
  const [notice, setNotice] = useState<Notice>(null);
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function flash(next: Notice) {
    setNotice(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 2200);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      flash("copied");
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  async function shareNative() {
    try {
      await navigator.share({ title, text: description, url });
      flash("shared");
    } catch (error) {
      // AbortError = the user closed the sheet. Anything else: fall back to copying.
      if ((error as { name?: string })?.name !== "AbortError") await copyLink();
    }
  }

  async function shareStory() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(storyImage);
      if (!response.ok) throw new Error(`story image ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], `${slug}-story.png`, { type: "image/png" });

      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title, url });
          flash("shared");
          return;
        } catch (error) {
          if ((error as { name?: string })?.name === "AbortError") return;
        }
      }

      // No file sharing here: save the frame so it can be posted from a phone.
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${slug}-story.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      flash("saved");
    } catch {
      // The image route failed; the link is still worth something.
      await copyLink();
    } finally {
      setBusy(false);
    }
  }

  const xIntent = `https://x.com/intent/post?${new URLSearchParams({
    text: title,
    url,
    via: "virsanghavi13",
  }).toString()}`;
  const linkedInIntent = `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({
    url,
  }).toString()}`;

  return (
    <div className="share-row" aria-label="Share this post">
      <span className="share-label">Share</span>
      <div className="share-buttons">
        <button type="button" className="share-btn" onClick={shareStory} disabled={busy} aria-label="Share to Instagram story">
          <InstagramIcon />
          <span>Story</span>
        </button>
        <a className="share-btn" href={xIntent} target="_blank" rel="noopener noreferrer" aria-label="Post on X">
          <XIcon />
          <span>X</span>
        </a>
        <a className="share-btn" href={linkedInIntent} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
          <LinkedInIcon />
          <span>LinkedIn</span>
        </a>
        {canShare ? (
          <button type="button" className="share-btn" onClick={shareNative} aria-label="Share">
            <ShareIcon />
            <span>More</span>
          </button>
        ) : null}
        <button
          type="button"
          className={`share-btn${notice === "copied" ? " done" : ""}`}
          onClick={copyLink}
          aria-label="Copy link"
        >
          {notice === "copied" ? <CheckIcon /> : <LinkIcon />}
          <span>{notice === "copied" ? "Copied" : "Copy link"}</span>
        </button>
      </div>
      <span className="share-notice" role="status" aria-live="polite">
        {notice === "saved"
          ? "Story image saved. Post it from your phone."
          : notice === "shared"
            ? "Shared."
            : ""}
      </span>
    </div>
  );
}
