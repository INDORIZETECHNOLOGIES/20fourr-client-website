import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { MembershipClient } from "./MembershipClient";

export const metadata: Metadata = { title: "20fourr Pass" };

export default function MembershipPage() {
  return (
    <SubPage title="20fourr Pass" subtitle="Premium client membership.">
      <MembershipClient />
    </SubPage>
  );
}
