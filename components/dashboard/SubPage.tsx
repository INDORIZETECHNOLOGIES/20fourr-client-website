import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/dashboard/icons";

/**
 * Shared frame for every Profile sub-page: back arrow, breadcrumb, title and a
 * centred column. Keeps the ten settings destinations visually consistent.
 */
export function SubPage({
  title,
  subtitle,
  backHref = "/dashboard/profile",
  backLabel = "Profile",
  action,
  width = 720,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  width?: number;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: width }}>
      <nav className="mb-4 flex items-center gap-1.5 text-body-sm text-fg-faint">
        <Link href={backHref} className="hover:text-fg-mid">
          {backLabel}
        </Link>
        <ChevronRightIcon size={13} />
        <span className="text-fg-mid">{title}</span>
      </nav>

      <div className="mb-6 flex items-start gap-3">
        <Link
          href={backHref}
          aria-label={`Back to ${backLabel}`}
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel-raised text-fg transition-colors hover:bg-panel-raised"
        >
          <ArrowLeftIcon size={18} />
        </Link>

        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-mono-lg font-semibold tracking-[-0.4px] text-fg">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-body-sm text-fg-faint">{subtitle}</p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 mt-8 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint first:mt-0">
      {children}
    </h3>
  );
}
