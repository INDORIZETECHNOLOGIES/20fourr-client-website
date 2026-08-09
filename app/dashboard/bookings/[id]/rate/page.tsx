import type { Metadata } from "next";
import { RatePageClient } from "./RatePageClient";

export const metadata: Metadata = { title: "Rate Provider" };

export default async function RatePage({
  params,
}: PageProps<"/dashboard/bookings/[id]/rate">) {
  const { id } = await params;
  return <RatePageClient id={id} />;
}
