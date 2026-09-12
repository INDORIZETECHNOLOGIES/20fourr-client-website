import type { Metadata } from "next";
import { InvoiceDetail } from "./InvoiceDetail";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/profile/invoices/[id]">) {
  const { id } = await params;
  const q = await searchParams;
  return <InvoiceDetail id={id} source={q.source === "document" ? "document" : "invoice"} />;
}
