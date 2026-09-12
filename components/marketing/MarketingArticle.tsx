import type { ReactNode } from "react";

export function MarketingArticle({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-20">
      <p className="text-eyebrow text-ink-faint">{eyebrow}</p>
      <h1 className="text-h1 mt-3 max-w-[22ch] text-ink">{title}</h1>
      {lede ? <p className="mt-4 max-w-prose text-body text-ink-mid">{lede}</p> : null}
      <div className="mt-10">{children}</div>
    </article>
  );
}
