import type { Metadata } from "next";
import Link from "next/link";
import { MarketingArticle } from "@/components/marketing/MarketingArticle";

export const metadata: Metadata = {
  title: "For business",
  description:
    "Book PSARA-licensed guards for venues, events, offices, facilities and residential associations. OTP-gated duty and a GST document per shift.",
  alternates: { canonical: "/for-business" },
};

const BUYERS = [
  {
    dt: "Venues and events",
    dd: "Bouncers and guards for access and crowd control, with the same OTP start and end as a site shift.",
  },
  {
    dt: "Offices and facilities",
    dd: "Recurring guard series against a named address. Documents sit on the booking, not in a WhatsApp thread.",
  },
  {
    dt: "Residential associations",
    dd: "PSARA checked against the deployment state and the service date. A GST invoice for the platform fee on every completed shift.",
  },
];

const PROCUREMENT = [
  {
    dt: "One vendor of record for discovery and payment",
    dd: "You still contract the provider for the service. 20fourr is the marketplace: quote, booking, OTP timestamps, tax documents.",
  },
  {
    dt: "Itemized quotes before you pay",
    dd: "Service, platform fee, and GST lines. CGST/SGST or IGST follows place of supply.",
  },
  {
    dt: "Cancellation is published",
    dd: "90% more than 24 hours before start, 50% between 12 and 24 hours, nothing under 12 hours. Refunds as SecureCoins.",
  },
];

export default function ForBusinessPage() {
  return (
    <MarketingArticle
      eyebrow="For business"
      title="Security a procurement team can audit"
      lede="Built for venues, events, offices, facilities and residential associations. An individual PSO booking uses the same path. The product is the record: licence checks, OTP-gated duty, GST documents."
    >
      <dl className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {BUYERS.map((row) => (
          <div key={row.dt} className="border-t border-rule pt-4">
            <dt className="text-h3 text-ink">{row.dt}</dt>
            <dd className="mt-2 text-body text-ink-mid">{row.dd}</dd>
          </div>
        ))}
      </dl>

      <h2 className="text-h3 mt-16 text-ink">What finance actually gets</h2>
      <dl className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
        {PROCUREMENT.map((row) => (
          <div key={row.dt} className="border-t border-rule pt-4">
            <dt className="text-body font-medium text-ink">{row.dt}</dt>
            <dd className="mt-2 text-body-sm text-ink-mid">{row.dd}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/book"
          className="inline-flex h-12 items-center justify-center rounded-sm bg-ink px-5 text-body font-medium text-paper"
        >
          Book a guard
        </Link>
        <Link
          href="/pricing"
          className="inline-flex h-12 items-center justify-center rounded-sm border border-edge px-5 text-body font-medium text-ink"
        >
          See a sample quote
        </Link>
      </div>
    </MarketingArticle>
  );
}
