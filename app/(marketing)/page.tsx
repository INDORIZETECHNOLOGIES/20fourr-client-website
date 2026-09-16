import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { CostCalculator } from "@/components/marketing/CostCalculator";
import { CoverageDirectory } from "@/components/marketing/CoverageDirectory";
import { LandingFooterCta } from "@/components/marketing/LandingFooterCta";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { ProductHero } from "@/components/marketing/ProductHero";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { PublicListings } from "@/components/marketing/PublicListings";
import { SocialProofBand } from "@/components/marketing/SocialProofBand";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { SERVICE_CATALOGUE, EX_SERVICEMAN_FILTER } from "@/lib/services";
import { getCoverage } from "@/lib/marketing-data";
import { CANCELLATION_SUMMARY } from "@/lib/cancellation-policy";

const TRUST_PILLS = ["PSARA Licensed", "OTP Attendance", "GST Invoiced"];

export const metadata: Metadata = {
  title: "Verified security. Documented shifts.",
  description:
    "Find verified security guards, bouncers, gunmen and PSOs with transparent pricing, OTP attendance and GST documents for every shift.",
  alternates: { canonical: "/" },
};

const WHEN: Record<string, string> = {
  guard: "Offices, facilities, residential associations and site gates.",
  bouncer: "Venues, events, door and floor control.",
  gunman: "Named sites that need armed duty.",
  pso: "Close protection for a named individual.",
};

const STEPS = [
  {
    n: "01",
    title: "Search",
    body: "Pick a category and city. The quote lists service, platform fee and GST lines before you commit.",
  },
  {
    n: "02",
    title: "Compare",
    body: "Review verified profiles, rates and availability for the shift you named.",
  },
  {
    n: "03",
    title: "Book",
    body: "Purpose, risk, absence and safety acknowledgements are stored on the booking. Nothing is charged until a provider accepts. Payment is taken once, in full.",
  },
  {
    n: "04",
    title: "Start with OTP",
    body: "Duty start and end are codes you show the guard in person. Timestamps are recorded, not self-reported.",
  },
  {
    n: "05",
    title: "Complete",
    body: "A GST tax invoice for the platform fee and a service document for the shift, with CGST/SGST/IGST by place of supply.",
  },
];

const COMPLIANCE = [
  {
    dt: "Provider verification",
    dd: "Licence validity is checked against the service start date and the deployment state, not a screenshot from last year.",
  },
  {
    dt: "PSARA against the shift",
    dd: "The agency licence is matched to the state of deployment for that booking.",
  },
  {
    dt: "Arms licence before armed duty",
    dd: "A gunman or PSO booking is not accepted until the arms licence is verified (SC_611).",
  },
  {
    dt: "OTP-gated duty",
    dd: "Every shift starts and ends with an OTP. The timestamp is the record.",
  },
  {
    dt: "GST tax documents",
    dd: "A platform-fee invoice and a service document per shift, with CGST/SGST/IGST resolved by place of supply.",
  },
  {
    dt: "TCS and TDS at source",
    dd: "Withholding is handled in the booking, not pushed onto the client as the collecting agent.",
  },
  {
    dt: "DPDP Act data rights",
    dd: "Export, consent withdrawal and erasure, with a named grievance officer published in-product.",
  },
];

const FAQ_CATEGORIES = ["Compliance", "Payments", "Operations"] as const;

const FAQS = [
  {
    q: "What is PSARA and why does it matter?",
    a: "The Private Security Agencies (Regulation) Act is the licence a private security agency needs to operate in a state. 20fourr checks that licence against the state and start date of the shift you are booking.",
    category: "Compliance",
  },
  {
    q: "Will I get a GST invoice?",
    a: "Yes. Each completed shift issues a GST tax invoice for the platform fee and a service document. CGST/SGST versus IGST follows place of supply.",
    category: "Payments",
  },
  {
    q: "What happens if the guard doesn't turn up?",
    a: "Duty cannot start without the start OTP. If the provider does not attend, raise it from the booking. You are not asked to self-certify a no-show in a chat thread.",
    category: "Operations",
  },
  {
    q: "How do refunds work?",
    a: CANCELLATION_SUMMARY,
    category: "Payments",
  },
  {
    q: "Can I book the same guard weekly?",
    a: "Yes, as a recurring series. Cancelling the series stops still-pending occurrences; bookings already generated stay live unless you cancel those too.",
    category: "Operations",
  },
  {
    q: "Is the guard armed?",
    a: "Only gunman and PSO bookings are armed, and only after the arms licence is verified. Guard and bouncer are unarmed categories.",
    category: "Compliance",
  },
  {
    q: "Who is liable?",
    a: "The service contract is between you and the provider. 20fourr is the marketplace: discovery, scheduling, payment and documents. Terms of service state the liability cap as the amount paid for that booking.",
    category: "Compliance",
  },
  {
    q: "How is my data handled?",
    a: "Under the DPDP Act. You can export, withdraw consent and request erasure from Privacy and data rights in the account. A named grievance officer is listed there.",
    category: "Compliance",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "20fourr",
      url: "https://20fourr.com",
      description:
        "Marketplace for PSARA-licensed private security in India, with OTP-gated shifts and GST documents.",
    },
    {
      "@type": "Service",
      name: "Documented private security bookings",
      provider: { "@type": "Organization", name: "20fourr" },
      areaServed: "IN",
      serviceType: "Private security marketplace",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default async function LandingPage() {
  const coverage = await getCoverage();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="hero-shimmer relative overflow-hidden">
        <div className="mx-auto max-w-[1200px] px-4 py-12 lg:px-6 lg:py-20">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <p className="text-eyebrow text-ink-faint">PSARA-licensed marketplace</p>
              <h1 className="text-display mt-4 text-ink">Verified security. Documented shifts.</h1>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <MarketingCta href="/#find" className="w-full sm:w-auto">
                  Book a verified guard
                </MarketingCta>
                <MarketingCta href="/#how-it-works" variant="secondary" className="w-full sm:w-auto">
                  See how it works
                </MarketingCta>
              </div>
              <p className="mt-5 max-w-[60ch] text-body text-ink-mid">
                The only security marketplace where every shift starts on an OTP and closes with a
                GST document. Built for procurement teams.
              </p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {TRUST_PILLS.map((label) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-live bg-paper px-3 py-1.5 text-label font-medium text-live"
                  >
                    <CheckIcon size={14} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <ProductHero provider={coverage.featured} />
            </div>
          </div>
        </div>
      </section>

      <SocialProofBand />

      <TrustStrip />

      <PublicListings listings={coverage.listings} />

      <section id="services" className="border-b border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
          <p className="text-eyebrow text-ink-faint">What you can book</p>
          <h2 className="text-h1 mt-3 text-ink">Four categories. Ex-serviceman is a filter.</h2>
          <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
            {SERVICE_CATALOGUE.map((s) => (
              <li key={s.id} className="flex flex-col bg-paper p-6 transition-colors duration-150 hover:bg-paper-raised">
                <h3 className="text-h3 text-ink">{s.name}</h3>
                <p className="mt-2 text-body text-ink-mid">{s.desc}</p>
                <p className="mt-3 text-body-sm text-ink-mid">{WHEN[s.id]}</p>
                <p className="mt-4 text-label text-ink-faint">
                  {s.licenceRequired ? (
                    <span className="text-attention">Arms licence verified</span>
                  ) : (
                    "PSARA agency licence"
                  )}
                </p>
                <Link
                  href="/#find"
                  className="mt-5 text-body font-medium text-ink hover:underline"
                >
                  Find {s.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-body-sm text-ink-mid">
            {EX_SERVICEMAN_FILTER.name}: {EX_SERVICEMAN_FILTER.desc}
          </p>
        </div>
      </section>

      <section id="how-it-works">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
          <p className="text-eyebrow text-ink-faint">How it works</p>
          <h2 className="text-h1 mt-3 text-ink">From search to a documented shift</h2>
          <ol className="mt-10 border-l border-rule pl-6 xl:grid xl:grid-cols-5 xl:gap-0 xl:border-l-0 xl:border-t xl:pl-0">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="relative py-6 xl:border-r xl:px-4 xl:py-8 last:xl:border-r-0"
              >
                <span
                  aria-hidden
                  className="absolute -left-[25px] top-8 h-2 w-2 rounded-full bg-ink xl:hidden"
                />
                <p className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-rule px-2 text-mono text-ink">
                  {s.n}
                </p>
                <h3 className="text-h3 mt-3 text-ink">{s.title}</h3>
                <p className="mt-2 text-body-sm text-ink-mid">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ProductShowcase provider={coverage.featured} />

      <section id="pricing" className="border-t border-rule bg-paper-raised">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
          <p className="text-eyebrow text-ink-faint">Transparent pricing</p>
          <h2 className="text-h1 mt-3 text-ink">Every line, including both GST components</h2>
          <p className="mt-4 max-w-prose text-body text-ink-mid">
            Live quotes are generated in the booking funnel from the provider&apos;s rates. This
            section is a worked example so the structure is visible before you create an account.
          </p>
          <div className="mt-10">
            <CostCalculator provider={coverage.featured} showLiveRateBadge mutedGst />
          </div>
          <p className="mt-6 text-body-sm text-ink-mid">Platform fee is 15%. No hidden charges.</p>
          <p className="mt-2 text-body-sm text-ink-mid">
            <Link href="/pricing" className="hover:underline">
              Cancellation refunds are on the pricing page
            </Link>
            .
          </p>
        </div>
      </section>

      <section id="compliance" className="border-t border-rule bg-paper">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
          <p className="text-eyebrow text-ink-faint">Trust and compliance</p>
          <h2 className="text-h1 mt-3 text-ink">Built for accountable security operations.</h2>
          <dl className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            {COMPLIANCE.map((c) => (
              <div key={c.dt} className="border-t border-rule pt-4">
                <dt className="text-h3 text-ink">{c.dt}</dt>
                <dd className="mt-2 text-body text-ink-mid">{c.dd}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="coverage" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
          <p className="text-eyebrow text-ink-faint">Coverage</p>
          <h2 className="text-h1 mt-3 max-w-[20ch] text-ink">Verified supply, by city</h2>
          <p className="mt-3 max-w-prose text-body text-ink-mid">
            Live from the public provider index. A city appears only if at least one verified
            provider lists it.
          </p>
          <CoverageDirectory coverage={coverage} />
          <p className="mt-6 text-body-sm text-ink-mid">
            <Link href="/coverage" className="hover:underline">
              Open the coverage page
            </Link>
          </p>
        </div>
      </section>

      <section id="faq" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
          <p className="text-eyebrow text-ink-faint">FAQ</p>
          <h2 className="text-h1 mt-3 text-ink">Straight answers</h2>
          <div className="mt-8 flex max-w-[680px] flex-col gap-8">
            {FAQ_CATEGORIES.map((category) => {
              const items = FAQS.filter((f) => f.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category}>
                  <p className="text-eyebrow text-ink-faint">{category}</p>
                  <div className="mt-3 divide-y divide-rule border-y border-rule">
                    {items.map((f) => (
                      <details
                        key={f.q}
                        className="group border-l-2 border-transparent py-4 pl-4 transition-colors duration-100 ease-in-out open:border-brand"
                      >
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-h3 text-ink [&::-webkit-details-marker]:hidden">
                          <span>{f.q}</span>
                          <span
                            aria-hidden
                            className="mt-0.5 w-4 shrink-0 text-center text-mono text-ink-faint"
                          >
                            <span className="group-open:hidden">+</span>
                            <span className="hidden group-open:inline">-</span>
                          </span>
                        </summary>
                        <p className="mt-3 text-body text-ink-mid">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="providers" className="border-t border-rule bg-paper-raised">
        <div className="mx-auto max-w-[1200px] px-4 py-12 lg:px-6">
          <p className="text-eyebrow text-ink-faint">For providers</p>
          <h2 className="text-h2 mt-3 text-ink">Supply is onboarded in the provider app</h2>
          <p className="mt-4 max-w-prose text-body text-ink-mid">
            This page is for clients booking a shift. Provider applications, PSARA documents and
            payouts live in the 20fourr provider app, not on this website.
          </p>
        </div>
      </section>

      <LandingFooterCta />
    </>
  );
}
