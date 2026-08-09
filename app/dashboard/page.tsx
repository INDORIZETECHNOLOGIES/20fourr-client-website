import type { Metadata } from "next";
import Link from "next/link";
import { Card, GhostAction } from "@/components/dashboard/primitives";
import {
  Greeting,
  OverviewProvider,
  RecentBookings,
  ServiceShortlist,
  StatTiles,
} from "./Overview";
import {
  ActivityIcon,
  CalendarIcon,
  CardIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ServiceGlyph,
  ShieldFill,
  ShieldIcon,
  StarFill,
  UserIcon,
} from "@/components/dashboard/icons";

export const metadata: Metadata = { title: "Dashboard" };


export default function DashboardPage() {
  return (
    <OverviewProvider>
      {/* Hero banner */}
      <div className="relative mb-[22px] overflow-hidden rounded-[18px] border border-white/7 bg-[linear-gradient(120deg,#0b1638_0%,#12266a_55%,#0d1c4e_100%)] px-6 py-7 sm:px-8">
        <span
          className="pointer-events-none absolute -right-[60px] -top-[60px] h-[260px] w-[260px]"
          style={{
            background:
              "radial-gradient(circle,rgba(245,166,35,0.08) 0%,transparent 70%)",
          }}
        />
        <span
          className="pointer-events-none absolute -bottom-20 left-[40%] h-[220px] w-[220px]"
          style={{
            background:
              "radial-gradient(circle,rgba(79,142,247,0.07) 0%,transparent 70%)",
          }}
        />
        <span className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 text-app-gold/6 xl:block">
          <ShieldFill size={80} />
        </span>

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Greeting />
          </div>

          <Link
            href="/book"
            className="flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-app-gold-gradient px-[22px] py-3 text-[13.5px] font-bold text-black shadow-[0_4px_16px_rgba(232,160,32,0.35)] transition-all hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(232,160,32,0.45)]"
          >
            <ShieldFill size={14} />
            Book Security Service
          </Link>
        </div>
      </div>

      <StatTiles />

      {/* Services + recent bookings */}
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1fr_1.2fr]">
        <Card className="p-[22px]">
          <div className="mb-[18px] flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-slate-100">
              Security Services
            </h3>
            <GhostAction href="/dashboard/services">See All</GhostAction>
          </div>

          <ServiceShortlist />
        </Card>

        <Card className="p-[22px]">
          <div className="mb-[18px] flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-slate-100">
              Recent Bookings
            </h3>
            <GhostAction href="/dashboard/bookings">View All</GhostAction>
          </div>

          <div className="-mx-3 overflow-x-auto px-3">
            <div className="min-w-[380px]">
              <div className="mb-1.5 grid grid-cols-[1fr_auto_auto] gap-2 border-b border-white/5 px-3 pb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-700">
                  Service
                </span>
                <span className="min-w-[75px] text-center text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-700">
                  Status
                </span>
                <span className="min-w-[55px] text-right text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-700">
                  Amount
                </span>
              </div>

              <RecentBookings />
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-[18px] border-t border-white/5 pt-[18px]">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.5px] text-slate-700">
              Quick Actions
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
                { href: "/dashboard/bookings", label: "Bookings", Icon: CalendarIcon },
                { href: "/dashboard/profile", label: "Wallet", Icon: CardIcon },
              ].map(({ href, label, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center gap-1.5 rounded-[10px] border border-white/6 bg-white/3 px-2 py-3 transition-colors hover:bg-white/6"
                >
                  <span className="text-app-gold">
                    <Icon size={16} />
                  </span>
                  <span className="text-[11px] text-slate-500">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </OverviewProvider>
  );
}
