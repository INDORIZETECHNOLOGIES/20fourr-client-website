import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { ThreatForm } from "./ThreatForm";

export const metadata: Metadata = { title: "Threat Assessment" };

export default function ThreatAssessmentPage() {
  return (
    <SubPage
      title="Threat Assessment"
      subtitle="Five questions to help us recommend the right level of cover."
    >
      <ThreatForm />
    </SubPage>
  );
}
