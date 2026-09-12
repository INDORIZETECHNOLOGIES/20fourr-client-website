import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { InvoiceList } from "./InvoiceList";

export const metadata: Metadata = { title: "Documents" };

export default function InvoicesPage() {
  return (
    <SubPage
      title="Documents and invoices"
      subtitle="GST documents for paid bookings. The service document is issued at shift end."
    >
      <InvoiceList />
    </SubPage>
  );
}
