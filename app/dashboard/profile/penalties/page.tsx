import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { ComplianceClient } from "./ComplianceClient";

export const metadata: Metadata = { title: "Account Standing" };

export default function CompliancePage() {
  return (
    <SubPage
      title="Account Standing"
      subtitle="Your standing, cancellation history and how charges are applied."
    >
      <ComplianceClient />
    </SubPage>
  );
}
