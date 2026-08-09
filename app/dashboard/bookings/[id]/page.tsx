import type { Metadata } from "next";
import { BookingDetail } from "./BookingDetail";

export const metadata: Metadata = { title: "Booking" };

/**
 * A thin shell. The booking itself is fetched client-side through /api/bff so
 * the session cookie can be refreshed on a 401 — a Server Component cannot
 * write cookies, so it could not recover from an expired access token.
 *
 * `generateStaticParams` is gone with the mock data: booking ids are per-user
 * Mongo ids, so there is no set of paths to prerender.
 */
export default async function BookingDetailPage({
  params,
}: PageProps<"/dashboard/bookings/[id]">) {
  const { id } = await params;
  return <BookingDetail id={id} />;
}
