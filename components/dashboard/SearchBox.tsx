"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, ServiceGlyph } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adaptBooking } from "@/lib/api/adapters";
import type { BookingListResponse } from "@/lib/api/types";
import { statusStyle } from "@/lib/dashboard-data";
import { SERVICE_CATALOGUE } from "@/lib/services";
import { formatPaiseRounded } from "@/lib/money";

/**
 * The topbar search, which until now was an input with no handler — it looked
 * live, took focus, accepted typing, and did nothing.
 *
 * Deliberately scoped to what the client already has or can book: the four
 * service categories, their own bookings (by reference, service or location),
 * and the dashboard's own destinations. There is no server-side search
 * endpoint, so this searches the booking list the dashboard already loads
 * rather than inventing an API that doesn't exist.
 */

type Result = {
  id: string;
  group: "Services" | "Bookings" | "Go to";
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  accent?: string;
};

const PAGES: { title: string; subtitle: string; href: string; keywords: string }[] = [
  { title: "Book a service", subtitle: "Start a new booking", href: "/book", keywords: "book new booking hire guard" },
  { title: "My Bookings", subtitle: "Ongoing, completed and cancelled", href: "/dashboard/bookings", keywords: "bookings orders history" },
  { title: "My Wallet", subtitle: "SecureCoins and SecurePoints", href: "/dashboard/profile/wallet", keywords: "wallet coins points balance money refund" },
  { title: "My Invoices", subtitle: "GST invoices", href: "/dashboard/profile/invoices", keywords: "invoice invoices gst bill billing receipt tax" },
  { title: "Saved Addresses", subtitle: "Where your guards are sent", href: "/dashboard/profile/addresses", keywords: "address addresses location site" },
  { title: "Support", subtitle: "Tickets and help", href: "/dashboard/support", keywords: "support help ticket complaint issue problem" },
  { title: "Notifications", subtitle: "Booking and payment alerts", href: "/dashboard/notifications", keywords: "notifications alerts updates" },
  { title: "Edit Profile", subtitle: "Details, GST and preferences", href: "/dashboard/profile/edit", keywords: "profile account details gstin gst business preferences" },
  { title: "Change Password", subtitle: "Update your password", href: "/dashboard/profile/change-password", keywords: "password security change login" },
];

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only fetched once the user actually types, so the search box costs nothing
  // on pages that never use it.
  const { data } = useApiQuery<BookingListResponse>("client/bookings", {
    query: { limit: 100 },
    enabled: query.trim().length > 0,
  });

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out: Result[] = [];

    for (const s of SERVICE_CATALOGUE) {
      if (`${s.name} ${s.desc} ${s.id}`.toLowerCase().includes(q)) {
        out.push({
          id: `svc-${s.id}`,
          group: "Services",
          title: s.name,
          subtitle: "Book this service",
          href: `/book/service?category=${s.id}`,
          icon: <ServiceGlyph icon={s.icon} size={16} />,
          iconClass: `${s.iconBg} ${s.color}`,
        });
      }
    }

    for (const b of (data?.bookings ?? []).map(adaptBooking)) {
      const haystack = `${b.ref ?? ""} ${b.service} ${b.location} ${b.guard}`.toLowerCase();
      if (!haystack.includes(q)) continue;
      const style = statusStyle(b.status);
      const svc = SERVICE_CATALOGUE.find((s) => s.id === b.category);
      out.push({
        id: `bk-${b.id}`,
        group: "Bookings",
        title: `${b.service} · ${formatPaiseRounded(b.amountPaise)}`,
        subtitle: `${b.ref ?? ""} · ${b.date} · ${style.label}`,
        href: `/dashboard/bookings/${b.id}`,
        icon: <ServiceGlyph icon={svc?.icon ?? "shield"} size={16} />,
        iconClass: svc ? `${svc.iconBg} ${svc.color}` : "bg-app-gold/12 text-app-gold",
        accent: style.color,
      });
      if (out.length > 12) break;
    }

    for (const p of PAGES) {
      if (`${p.title} ${p.subtitle} ${p.keywords}`.toLowerCase().includes(q)) {
        out.push({
          id: `pg-${p.href}`,
          group: "Go to",
          title: p.title,
          subtitle: p.subtitle,
          href: p.href,
          icon: <SearchIcon size={15} />,
          iconClass: "bg-white/6 text-slate-400",
        });
      }
    }

    return out.slice(0, 14);
  }, [query, data]);

  useEffect(() => setActive(0), [query]);

  // Close on outside click.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // "/" focuses the field, the way most dashboards behave — but never while the
  // user is typing into another input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(result: Result) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  let lastGroup = "";

  return (
    <div ref={boxRef} className="relative hidden md:block">
      <div className="flex w-64 items-center gap-2.5 rounded-[10px] border border-white/7 bg-white/4 px-3.5 py-2.5 focus-within:border-app-gold/40">
        <span className="shrink-0 text-slate-500">
          <SearchIcon size={15} />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Find services, bookings…"
          aria-label="Search services, bookings and pages"
          aria-expanded={open && query.trim().length > 0}
          role="combobox"
          aria-controls="topbar-search-results"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full min-w-0 border-none bg-transparent text-[14px] text-slate-300 outline-none placeholder:text-slate-500 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {!query ? (
          <kbd className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-600">
            /
          </kbd>
        ) : null}
      </div>

      {open && query.trim() ? (
        <div
          id="topbar-search-results"
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,460px)] w-[380px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1a2c] p-1.5 shadow-2xl"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13.5px] text-slate-500">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            results.map((r, i) => {
              const newGroup = r.group !== lastGroup;
              lastGroup = r.group;
              return (
                <div key={r.id}>
                  {newGroup ? (
                    <p className="px-3 pb-1 pt-2.5 text-[10.5px] font-semibold uppercase tracking-[1px] text-slate-600">
                      {r.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={[
                      "relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left transition-colors",
                      i === active ? "bg-white/8" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    {r.accent ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 left-0 w-[2px] rounded-r"
                        style={{ background: r.accent }}
                      />
                    ) : null}
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.iconClass}`}
                    >
                      {r.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-slate-100">
                        {r.title}
                      </span>
                      {r.subtitle ? (
                        <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                          {r.subtitle}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
