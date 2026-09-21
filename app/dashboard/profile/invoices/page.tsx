import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { InvoiceList } from "./InvoiceList";

export const metadata: Metadata = { title: "Documents" };

export default function InvoicesPage() {
  return (
    <SubPage
      title="Documents and invoices"
      subtitle="20fourr's platform fee invoices, issued at payment. Each provider's own invoice is on its booking's Invoices page."
    >
      <InvoiceList />
    </SubPage>
  );
}
