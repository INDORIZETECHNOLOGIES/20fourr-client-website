import type { Metadata } from "next";
import { DutyOtp } from "./DutyOtp";

export const metadata: Metadata = { title: "Duty Verification" };

export default async function DutyPage({
  params,
}: PageProps<"/dashboard/bookings/[id]/duty">) {
  const { id } = await params;
  return <DutyOtp bookingId={id} />;
}
