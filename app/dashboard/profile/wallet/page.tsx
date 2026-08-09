import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { WalletClient } from "./WalletClient";

export const metadata: Metadata = { title: "My Wallet" };

export default function WalletPage() {
  return (
    <SubPage
      title="My Wallet"
      subtitle="SecureCoins are your refunded money. SecurePoints are platform rewards."
    >
      <WalletClient />
    </SubPage>
  );
}
