import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { PrivacyClient } from "./PrivacyClient";

export const metadata: Metadata = { title: "Privacy & Data Rights" };

export default function PrivacyPage() {
  return (
    <SubPage
      title="Privacy & Data Rights"
      subtitle="Your rights over the data 20fourr holds about you."
    >
      <PrivacyClient />
    </SubPage>
  );
}
