import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { ProvidersManager } from "./ProvidersManager";

export const metadata: Metadata = { title: "Preferred & Blocked" };

export default function ProvidersPage() {
  return (
    <SubPage
      title="Preferred & Blocked"
      subtitle="Preferred providers are matched first. Blocked providers never are."
    >
      <ProvidersManager />
    </SubPage>
  );
}
