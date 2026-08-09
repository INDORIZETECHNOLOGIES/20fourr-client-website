import type { Metadata } from "next";
import { InvoiceForBooking } from "./InvoiceForBooking";

export const metadata: Metadata = { title: "Invoice" };

export default async function BookingInvoicePage({
  params,
}: PageProps<"/dashboard/bookings/[id]/invoice">) {
  const { id } = await params;
  return <InvoiceForBooking bookingId={id} />;
}
