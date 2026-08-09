import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { ReferralClient } from "./ReferralClient";

export const metadata: Metadata = { title: "Referral Program" };

export default function ReferralPage() {
  return (
    <SubPage
      title="Referral Program"
      subtitle="Refer friends and earn rewards. Both sides win."
    >
      <ReferralClient />
    </SubPage>
  );
}
