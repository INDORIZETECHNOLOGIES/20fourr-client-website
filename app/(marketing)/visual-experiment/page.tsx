import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BookingStatusMock } from "@/components/marketing/BookingStatusMock";
import { CostCalculator } from "@/components/marketing/CostCalculator";
import { FinalCta } from "@/components/marketing/FinalCta";
import { ProviderSelectMock } from "@/components/marketing/ProviderSelectMock";
import { QuoteBreakdown } from "@/components/marketing/QuoteBreakdown";
import { getCoverage } from "@/lib/marketing-data";
import { DEFAULT_QUOTE } from "@/lib/sample-quote";

export const metadata: Metadata = {
  title: "Visual experiment",
  robots: { index: false, follow: false },
};

function Pair({
  id,
  title,
  current,
  experiment,
}: {
  id: string;
  title: string;
  current: ReactNode;
  experiment: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-rule">
      <div className="mx-auto max-w-[1200px] px-4 py-12 lg:px-6 lg:py-16">
        <h2 className="text-h2 text-ink">{title}</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <p className="text-label text-ink-faint">Current</p>
            <div className="mt-3">{current}</div>
          </div>
          <div>
            <p className="text-label text-ink-faint">Experiment</p>
            <div className="mt-3">{experiment}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function VisualExperimentPage() {
  const coverage = await getCoverage();

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-4 py-12 lg:px-6 lg:py-16">
        <p className="text-eyebrow text-ink-faint">Visual experiment · not indexed</p>
        <h1 className="text-h1 mt-3 text-ink">Dark product surfaces on a light page</h1>
        <p className="mt-4 max-w-prose text-body text-ink-mid">
          The live Client landing is unchanged. This page places the same provider, quote, booking
          status and final CTA components on signed-in ink surfaces so they can be compared side by
          side. Layout, copy and quote arithmetic are the same.
        </p>
        <p className="mt-4 text-body">
          <Link href="/" className="hover:underline">
            Open the current landing
          </Link>
        </p>
      </section>

      <Pair
        id="exp-provider"
        title="Provider selection"
        current={<ProviderSelectMock provider={coverage.featured} />}
        experiment={<ProviderSelectMock provider={coverage.featured} surface="ink" />}
      />

      <Pair
        id="exp-quote"
        title="Quote"
        current={<QuoteBreakdown quote={DEFAULT_QUOTE} />}
        experiment={<QuoteBreakdown quote={DEFAULT_QUOTE} surface="ink" />}
      />

      <Pair
        id="exp-status"
        title="Booking status"
        current={<BookingStatusMock framed />}
        experiment={<BookingStatusMock framed surface="ink" />}
      />

      <section id="exp-context" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-12 lg:px-6 lg:py-16">
          <h2 className="text-h2 text-ink">Search and quote, in context</h2>
          <p className="mt-3 max-w-prose text-body text-ink-mid">
            Category and duration stay on paper. Only the provider card and quote island use ink.
          </p>
          <div className="mt-8">
            <CostCalculator provider={coverage.featured} surface="ink" />
          </div>
        </div>
      </section>

      <section id="exp-cta" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-12 lg:px-6">
          <h2 className="text-h2 text-ink">Final CTA</h2>
          <p className="mt-2 text-label text-ink-faint">Current</p>
        </div>
        <FinalCta />
        <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-6">
          <p className="text-label text-ink-faint">Experiment</p>
        </div>
        <FinalCta surface="ink" />
      </section>
    </>
  );
}
