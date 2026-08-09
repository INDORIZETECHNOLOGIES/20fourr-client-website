"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useSession } from "@/components/session/SessionProvider";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { BookingListResponse } from "@/lib/api/types";
import { ONGOING_STATUSES, type BookingStatus } from "@/lib/dashboard-data";
import { formatRupees } from "@/lib/money";
import {
  CalendarIcon,
  CardIcon,
  ChatIcon,
  DotsIcon,
  GridIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/dashboard/icons";

/**
 * The design drives navigation from client state (`this.state.page`). Here each
 * destination is a real route, so the active item comes from the pathname and
 * every page is linkable, refreshable and back-button friendly.
 */
const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: GridIcon },
  { href: "/dashboard/services", label: "Services", Icon: ShieldIcon },
  { href: "/dashboard/bookings", label: "Bookings", Icon: CalendarIcon, badge: true },
  { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
  { href: "/dashboard/support", label: "Support", Icon: ChatIcon },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile } = useSession();
  // SecureCoins + SecurePoints. Both are whole rupees (1 coin = ₹1), not
  // paise — see lib/money.ts. They stay separate everywhere except this
  // one-line summary; the wallet screen breaks them out.
  const { data: wallet } = useApiQuery<{ coinBalance: number; pointBalance: number }>("wallet");
  // Everything in flight, matching what the nav badge means in the app.
  // Was a mock constant, so the badge showed "4" on an account with none.
  const { data: bookingData } = useApiQuery<BookingListResponse>("client/bookings", {
    query: { limit: 100 },
  });
  const ongoingCount = (bookingData?.bookings ?? []).filter((b) =>
    ONGOING_STATUSES.includes(b.status as BookingStatus),
  ).length;

  return (
    <div className="flex h-full flex-col bg-app-sidebar">
      {/* Logo — the real wordmark rather than a generic shield glyph. It needs
          room to read, so it takes the full header width instead of sitting in
          a 38px tile, with the descriptor beneath it. */}
      <div className="border-b border-white/5 px-5 pb-5 pt-6">
        <Link
          href="/dashboard"
          className="flex flex-col items-start gap-2"
          onClick={onNavigate}
          aria-label="20fourr — Dashboard"
        >
          <Logo width={104} priority />
          <span className="text-[11px] uppercase tracking-[1px] text-slate-500">
            Security Platform
          </span>
        </Link>
      </div>

      <div className="px-5 pb-2.5 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-500">
          Main Menu
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5">
        {NAV.map(({ href, label, Icon, ...rest }) => {
          // `/dashboard` would otherwise match every child route.
          const active =
            href === "/dashboard" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-[9px] border-l-2 px-3 py-3 text-[15px] transition-colors",
                active
                  ? "border-l-app-gold bg-app-gold/9 font-semibold text-app-gold"
                  : "border-l-transparent font-normal text-slate-400 hover:bg-white/4 hover:text-slate-200",
              ].join(" ")}
            >
              <Icon size={18} />
              {label}
              {"badge" in rest && ongoingCount > 0 ? (
                <span className="ml-auto rounded-full bg-app-gold/15 px-2 py-0.5 text-[12px] font-bold text-app-gold">
                  {ongoingCount}
                </span>
              ) : null}
            </Link>
          );
        })}

        <div className="mx-0.5 mb-2 mt-3 border-t border-white/4" />
        <div className="px-3 pb-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-500">
            Wallet
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-3 rounded-[9px] border-l-2 border-l-transparent px-3 py-3 text-left text-[15px] font-normal text-slate-400 transition-colors hover:bg-white/4 hover:text-slate-200"
        >
          <CardIcon size={18} />
          Wallet
          <span className="ml-auto text-[14px] font-bold text-app-gold">
            {wallet ? formatRupees(wallet.coinBalance + wallet.pointBalance) : "—"}
          </span>
        </button>
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-[10px] border border-white/5 bg-white/3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-gold-gradient text-[14px] font-extrabold text-black">
            {profile?.initial ?? "·"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-semibold text-slate-100">
              {profile?.name ?? "Loading…"}
            </span>
            <span className="block text-[12.5px] text-slate-500">{profile?.role ?? "Client Account"}</span>
          </span>
          <span className="text-slate-500">
            <DotsIcon size={15} />
          </span>
        </button>
      </div>
    </div>
  );
}
