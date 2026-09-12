import type { Metadata } from "next";
import { MarketingArticle } from "@/components/marketing/MarketingArticle";
import { CoverageDirectory } from "@/components/marketing/CoverageDirectory";
import { getCoverage } from "@/lib/marketing-data";

export const metadata: Metadata = {
  title: "Coverage",
  description:
    "Cities with at least one verified 20fourr provider, counted from the public provider index.",
  alternates: { canonical: "/coverage" },
};

export default async function CoveragePage() {
  const coverage = await getCoverage();

  return (
    <MarketingArticle
      eyebrow="Coverage"
      title="Verified supply, by city"
      lede="Live from the public provider index. A city appears only if at least one verified provider lists it."
    >
      <CoverageDirectory coverage={coverage} />
    </MarketingArticle>
  );
}
