"use client";

import { useState } from "react";
import { Card } from "@/components/dashboard/primitives";

export function ShareCode({
  code,
  shareLink,
}: {
  code: string;
  /** The API builds this itself — share it rather than composing a URL here. */
  shareLink?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareLink ?? code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context or denied permission) — the code is
      // on screen and selectable, so this fails quietly rather than lying.
      setCopied(false);
    }
  }

  return (
    <Card className="p-6 text-center">
      <p className="text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
        Your code
      </p>
      <p className="mt-3 select-all text-mono-lg font-medium tracking-[3px] text-fg">
        {code}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-sm bg-brand text-brand-ink px-7 py-2.5 text-body font-semibold"
        >
          {copied ? "Copied" : shareLink ? "Copy link" : "Copy code"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            shareLink
              ? `Use my 20fourr code ${code} for a discount on your first security booking: ${shareLink}`
              : `Use my 20fourr code ${code} for a discount on your first security booking.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm border border-hairline px-7 py-2.5 text-body font-semibold text-fg-mid transition-colors hover:bg-panel-raised"
        >
          Share on WhatsApp
        </a>
      </div>
    </Card>
  );
}
