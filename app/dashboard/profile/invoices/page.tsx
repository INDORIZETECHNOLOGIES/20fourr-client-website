import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { InvoiceList } from "./InvoiceList";

export const metadata: Metadata = { title: "Documents" };

export default function InvoicesPage() {
  return (
    <SubPage
      title="Documents and invoices"
      subtitle="Every invoice, bill of supply and credit note for your bookings, including each provider's own invoice. Filter by year or dates and download them as a CSV register or a ZIP of PDFs."
    >
      <InvoiceList />
    </SubPage>
  );
}
