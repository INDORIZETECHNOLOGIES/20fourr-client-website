import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/primitives";
import { ServiceCatalogue } from "./ServiceCatalogue";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <>
      <PageHeading
        title="Security Services"
        subtitle="Professional security personnel available 24/7"
      />
      <ServiceCatalogue />
    </>
  );
}
