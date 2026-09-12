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
import { HomePrompts } from "./HomePrompts";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <OverviewProvider>
      <HomePrompts />

      <div className="mb-6 flex flex-col gap-5 border-b border-hairline pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Greeting />
        </div>
        <Link
          href="/book"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-sm bg-brand px-5 text-body font-medium text-brand-ink"
        >
          Book a guard
        </Link>
      </div>

      <StatTiles />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Card className="p-6" weight="primary">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 text-fg">Services</h3>
            <GhostAction href="/dashboard/services">See all</GhostAction>
          </div>
          <ServiceShortlist />
        </Card>

        <Card className="p-6" weight="primary">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 text-fg">Recent bookings</h3>
            <GhostAction href="/dashboard/bookings">View all</GhostAction>
          </div>
          <div className="-mx-3 overflow-x-auto px-3">
            <div className="min-w-[380px]">
              <div className="mb-1.5 grid grid-cols-[1fr_auto_auto] gap-2 border-b border-hairline px-3 pb-2.5">
                <span className="text-label text-fg-faint">Service</span>
                <span className="min-w-[75px] text-center text-label text-fg-faint">
                  Status
                </span>
                <span className="min-w-[55px] text-right text-label text-fg-faint">
                  Amount
                </span>
              </div>
              <RecentBookings />
            </div>
          </div>
        </Card>
      </div>
    </OverviewProvider>
  );
}
