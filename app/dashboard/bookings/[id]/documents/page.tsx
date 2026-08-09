import type { Metadata } from "next";
import { ProviderDocuments } from "./ProviderDocuments";

export const metadata: Metadata = { title: "Provider Documents" };

export default async function DocumentsPage({
  params,
}: PageProps<"/dashboard/bookings/[id]/documents">) {
  const { id } = await params;
  return <ProviderDocuments bookingId={id} />;
}
