import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/primitives";
import { ServiceCatalogue } from "./ServiceCatalogue";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <>
      <PageHeading
        title="Services"
        subtitle="Four categories. Starting rates from live provider search."
      />
      <ServiceCatalogue />
    </>
  );
}
