import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/primitives";
import { ContractsList } from "./ContractsList";

export const metadata: Metadata = { title: "Contracts" };

export default function ContractsPage() {
  return (
    <>
      <PageHeading title="Contracts" subtitle="Cover longer than a month, billed one month at a time." />
      <ContractsList />
    </>
  );
}
