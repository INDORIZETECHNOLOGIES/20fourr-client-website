import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/primitives";
import { BookingsList } from "./BookingsList";

export const metadata: Metadata = { title: "Bookings" };

export default function BookingsPage() {
  return (
    <>
      <PageHeading
        title="My Bookings"
        subtitle="Track all your active and past security bookings"
      />
      <BookingsList />
    </>
  );
}
