import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/primitives";
import Link from "next/link";
import { BookingsList } from "./BookingsList";

export const metadata: Metadata = { title: "Bookings" };

export default function BookingsPage() {
  return (
    <>
      <PageHeading
        title="My Bookings"
        subtitle="Track all your active and past security bookings"
      />
      <div className="mb-4">
        <Link
          href="/dashboard/bookings/recurring"
          className="inline-flex items-center gap-2 rounded-full border border-app-border px-4 py-2 text-[13px] font-semibold text-slate-300 transition-colors hover:border-app-gold/40 hover:text-app-gold"
        >
          Recurring schedules
        </Link>
      </div>

      <BookingsList />
    </>
  );
}
