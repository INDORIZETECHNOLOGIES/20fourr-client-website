import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/primitives";
import Link from "next/link";
import { BookingsList } from "./BookingsList";

export const metadata: Metadata = { title: "Bookings" };

export default function BookingsPage() {
  return (
    <>
      <PageHeading
        title="Bookings"
        subtitle="Active and past shifts."
      />
      <div className="mb-4">
        <Link
          href="/dashboard/bookings/recurring"
          className="inline-flex items-center gap-2 rounded-sm border border-hairline px-4 py-2 text-body-sm font-medium text-fg-mid transition-colors hover:border-edge hover:text-fg"
        >
          Recurring schedules
        </Link>
      </div>

      <BookingsList />
    </>
  );
}
