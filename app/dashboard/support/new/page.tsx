import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { CreateTicketForm } from "./CreateTicketForm";

export const metadata: Metadata = { title: "Create Ticket" };

export default function CreateTicketPage() {
  return (
    <SubPage
      title="Create Support Ticket"
      subtitle="Tell us what happened and we'll pick it up."
      backHref="/dashboard/support"
      backLabel="Support"
      width={640}
    >
      <CreateTicketForm />
    </SubPage>
  );
}
