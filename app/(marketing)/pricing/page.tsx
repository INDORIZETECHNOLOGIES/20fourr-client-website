import type { Metadata } from "next";
import { MarketingArticle } from "@/components/marketing/MarketingArticle";
import { CostCalculator } from "@/components/marketing/CostCalculator";
import { REFUND_TIERS, refundDestination } from "@/lib/cancellation-policy";
import { getV6Enabled } from "@/lib/api/billing-flags";

export const metadata: Metadata = {
  title: "What a booking costs",
  description:
    "Itemized sample quotes for guard, bouncer, gunman and PSO shifts, including GST. Cancellation: 90% over 24 hours, 50% between 12 and 24, nothing under 12.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const v6 = await getV6Enabled();
  return (
    <MarketingArticle
      eyebrow="Pricing"
      title="Every line, including both GST components"
      lede="Live quotes are generated in the booking funnel from the provider's rates. This page is a worked example so the structure is visible before you create an account."
    >
      <CostCalculator />

      <h2 className="text-h3 mt-14 text-ink">Cancellation refunds</h2>
      <p className="mt-2 max-w-prose text-body text-ink-mid">
        {refundDestination(v6 ? "v6" : "v1")}
      </p>
      <dl className="mt-6 max-w-[680px] divide-y divide-rule border-y border-rule">
        {REFUND_TIERS.map((tier) => (
          <div key={tier.label} className="grid grid-cols-[1fr_auto] gap-4 py-4">
            <div>
              <dt className="text-body font-medium text-ink">{tier.label}</dt>
              <dd className="mt-1 text-body-sm text-ink-mid">{tier.detail}</dd>
            </div>
            <p className="text-mono text-ink">{tier.percent}%</p>
          </div>
        ))}
      </dl>
    </MarketingArticle>
  );
}
