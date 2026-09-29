import type { Metadata } from "next";
import { ContractDetail } from "./ContractDetail";

export const metadata: Metadata = { title: "Contract" };

/** Thin shell; the contract is fetched client-side through /api/bff, like a booking. */
export default async function ContractDetailPage({ params }: PageProps<"/dashboard/contracts/[id]">) {
  const { id } = await params;
  return <ContractDetail id={id} />;
}
