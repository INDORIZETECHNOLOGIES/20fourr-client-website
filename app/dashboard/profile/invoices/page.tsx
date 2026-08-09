import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { InvoiceList } from "./InvoiceList";

export const metadata: Metadata = { title: "My Invoices" };

export default function InvoicesPage() {
  return (
    <SubPage title="My Invoices" subtitle="GST invoices for every completed booking.">
      <InvoiceList />
    </SubPage>
  );
}
