import type { Metadata } from "next";
import { InvoiceDetail } from "./InvoiceDetail";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({
  params,
}: PageProps<"/dashboard/profile/invoices/[id]">) {
  const { id } = await params;
  return <InvoiceDetail id={id} />;
}
