"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CloseIcon } from "@/components/dashboard/icons";

/**
 * The design's sidebar is `position:fixed; width:248px` with no mobile treatment
 * at all — below ~900px it would sit on top of the content. Here it stays fixed
 * at lg and above, and becomes an off-canvas drawer below that.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation, and on Escape.
  useEffect(() => setNavOpen(false), [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="min-h-screen bg-page font-sans text-fg">
      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-[248px] border-r border-hairline lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-50 lg:hidden",
          navOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!navOpen}
      >
        <div
          onClick={() => setNavOpen(false)}
          className={[
            "absolute inset-0 bg-black/60 transition-opacity duration-200",
            navOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={[
            "absolute bottom-0 left-0 top-0 w-[248px] border-r border-hairline transition-opacity duration-200",
            navOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
            className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-fg-faint hover:bg-panel-raised hover:text-fg-mid"
          >
            <CloseIcon />
          </button>
          <Sidebar onNavigate={() => setNavOpen(false)} />
        </div>
      </div>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:ml-[248px]">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main key={pathname} className="flex-1 px-4 py-7 lg:px-8">
          {/* Capped so list rows don't stretch edge-to-edge on a wide monitor,
              leaving the middle of every card empty. */}
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
