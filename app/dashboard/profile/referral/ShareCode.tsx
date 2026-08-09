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
      <p className="text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
        Share Your Code
      </p>
      <p className="mt-3 select-all font-display text-[30px] font-extrabold tracking-[3px] text-app-gold">
        {code}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-full bg-app-gold-gradient px-7 py-2.5 text-[14px] font-bold text-black transition-transform hover:-translate-y-px"
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
          className="rounded-full border border-app-border px-7 py-2.5 text-[14px] font-semibold text-slate-300 transition-colors hover:bg-white/5"
        >
          Share on WhatsApp
        </a>
      </div>
    </Card>
  );
}
