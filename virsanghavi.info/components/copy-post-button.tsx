"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

/**
 * Copies a post as plain text — handy for quoting, sharing, or pasting into an
 * LLM. Sits in the article meta row next to the date and reading time.
 */
export function CopyPostButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        ok = legacyCopy(text);
      }
    } catch {
      ok = legacyCopy(text);
    }
    setCopied(ok);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className={`copy-post-btn${copied ? " copied" : ""}`}
      aria-label="Copy post text"
      onClick={copy}
    >
      {copied ? <CopyIconChecked /> : <CopyIcon width={15} height={15} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}

function CopyIconChecked() {
  return <CheckIcon width={15} height={15} />;
}

function legacyCopy(text: string): boolean {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
