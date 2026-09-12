"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/session/SessionProvider";
import { useApiQuery } from "@/hooks/useApiQuery";
import { BellIcon, MenuIcon } from "@/components/dashboard/icons";
import { SearchBox } from "@/components/dashboard/SearchBox";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/services": "Services",
  "/dashboard/bookings": "Bookings",
  "/dashboard/profile": "Profile",
  "/dashboard/profile/edit": "Edit Profile",
  "/dashboard/profile/addresses": "Saved Addresses",
  "/dashboard/support": "Support",
  "/dashboard/support/new": "Create Ticket",
  "/dashboard/notifications": "Notifications",
  "/dashboard/bookings/chat": "Chat",
  "/dashboard/profile/wallet": "My Wallet",
  "/dashboard/profile/invoices": "Documents & invoices",
  "/dashboard/profile/penalties": "Account Standing",
  "/dashboard/profile/privacy": "Privacy & Data Rights",
  "/dashboard/profile/change-password": "Change Password",
  "/dashboard/profile/providers": "Preferred & Blocked",
  "/dashboard/profile/membership": "20fourr Pass",
  "/dashboard/profile/referral": "Refer & Earn",
  "/dashboard/profile/threat-assessment": "Threat Assessment",
};

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const pathname = usePathname();
  const { profile } = useSession();
  // Detail routes (/support/TKT-1, /profile/invoices/INV-1) fall back to their
  // section title rather than showing "Dashboard".
  const title =
    TITLES[pathname] ??
    TITLES[pathname.split("/").slice(0, -1).join("/")] ??
    "Dashboard";
  // A dedicated count endpoint — cheaper than pulling the list just to
  // length-filter it, and it is what the bell actually needs.
  const { data: counts } = useApiQuery<{ unreadCount: number }>("notifications/unread-count");
  const unread = counts?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-40 flex h-[62px] items-center gap-3.5 border-b border-hairline bg-page/95 px-4 backdrop-blur-xl lg:px-8">
      {/* Only reachable below lg, where the sidebar is a drawer. */}
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-hairline bg-panel-raised text-fg-mid transition-colors hover:bg-panel-raised lg:hidden"
      >
        <MenuIcon />
      </button>

      <h1 className="flex-1 truncate font-sans text-h3 font-semibold text-fg">
        {title}
      </h1>

      <SearchBox />

      <Link
        href="/dashboard/notifications"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-hairline bg-panel-raised text-fg-mid transition-colors hover:bg-panel-raised"
      >
        <BellIcon size={17} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-page bg-fg px-1 text-eyebrow font-semibold text-page">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>

      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-panel-raised text-body font-semibold text-fg">
        {profile?.initial ?? "·"}
      </span>
    </header>
  );
}
