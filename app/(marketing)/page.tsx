import type { Metadata } from "next";
import Link from "next/link";
import { QuoteBreakdown } from "@/components/marketing/QuoteBreakdown";
import { CostCalculator } from "@/components/marketing/CostCalculator";
import { SERVICE_CATALOGUE, EX_SERVICEMAN_FILTER } from "@/lib/services";
import { DEFAULT_QUOTE } from "@/lib/sample-quote";
import { getCoverage } from "@/lib/marketing-data";
import { CoverageDirectory } from "@/components/marketing/CoverageDirectory";
import { CANCELLATION_SUMMARY } from "@/lib/cancellation-policy";

export const metadata: Metadata = {
  title: "Licensed guards. Documented shifts.",
  description:
    "Book PSARA-licensed security guards, bouncers, gunmen and PSOs. Every shift is OTP-gated and issued a GST tax document.",
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    n: "1",
    title: "Search and quote",
    body: "Pick a category and city. The quote lists service, platform fee and GST lines before you commit.",
  },
  {
    n: "2",
    title: "Book, with four waivers recorded",
    body: "Purpose, risk, absence and safety acknowledgements are stored on the booking, not a checkbox you never see again.",
  },
  {
    n: "3",
    title: "Provider accepts, you pay",
    body: "Nothing is charged until a provider accepts. Payment is taken once, in full.",
  },
  {
    n: "4",
    title: "OTP starts the shift, OTP ends it",
    body: "Duty start and end are codes you show the guard in person. Timestamps are recorded, not self-reported.",
  },
  {
    n: "5",
    title: "Documents issued",
    body: "A GST tax invoice for the platform fee and a service document for the shift, with CGST/SGST/IGST by place of supply.",
  },
];

const COMPLIANCE = [
  {
    dt: "PSARA against the shift",
    dd: "Licence validity is checked against the service start date and the deployment state, not a screenshot from last year.",
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

const FAQS = [
  {
    q: "What is PSARA and why does it matter?",
    a: "The Private Security Agencies (Regulation) Act is the licence a private security agency needs to operate in a state. 20fourr checks that licence against the state and start date of the shift you are booking.",
  },
  {
    q: "Will I get a GST invoice?",
    a: "Yes. Each completed shift issues a GST tax invoice for the platform fee and a service document. CGST/SGST versus IGST follows place of supply.",
  },
  {
    q: "What happens if the guard doesn't turn up?",
    a: "Duty cannot start without the start OTP. If the provider does not attend, raise it from the booking. You are not asked to self-certify a no-show in a chat thread.",
  },
  {
    q: "How do refunds work?",
    a: CANCELLATION_SUMMARY,
  },
  {
    q: "Can I book the same guard weekly?",
    a: "Yes, as a recurring series. Cancelling the series stops still-pending occurrences; bookings already generated stay live unless you cancel those too.",
  },
  {
    q: "Is the guard armed?",
    a: "Only gunman and PSO bookings are armed, and only after the arms licence is verified. Guard and bouncer are unarmed categories.",
  },
  {
    q: "Who is liable?",
    a: "The service contract is between you and the provider. 20fourr is the marketplace: discovery, scheduling, payment and documents. Terms of service state the liability cap as the amount paid for that booking.",
  },
  {
    q: "How is my data handled?",
    a: "Under the DPDP Act. You can export, withdraw consent and request erasure from Privacy and data rights in the account. A named grievance officer is listed there.",
  },
];

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

      <section className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-eyebrow text-ink-faint">PSARA-licensed</p>
            <h1 className="text-display mt-4 text-ink">Licensed guards. Documented shifts.</h1>
            <p className="mt-5 max-w-[60ch] text-body text-ink-mid">
              20fourr is a marketplace for security guard, bouncer, gunman and PSO shifts. Every
              booking checks the provider&apos;s licence, starts and ends on an OTP, and issues a
              GST tax document. Built for venues, events, offices, facilities and residential
              associations; an individual PSO booking is the same path.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <QuoteBreakdown quote={DEFAULT_QUOTE} />
          </div>
        </div>
      </section>

      <section id="services" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6">
          <p className="text-eyebrow text-ink-faint">What you can book</p>
          <h2 className="text-h1 mt-3 text-ink">Four categories. Ex-serviceman is a filter.</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-paper-raised">
                <tr>
                  <th className="border-b border-rule px-4 py-3 text-label font-medium text-ink">
                    Category
                  </th>
                  <th className="border-b border-rule px-4 py-3 text-label font-medium text-ink">
                    What it covers
                  </th>
                  <th className="border-b border-rule px-4 py-3 text-label font-medium text-ink">
                    Licence
                  </th>
                </tr>
              </thead>
              <tbody>
                {SERVICE_CATALOGUE.map((s) => (
                  <tr key={s.id} className="border-b border-rule">
                    <td className="px-4 py-4 text-body font-medium text-ink">
                      <Link href={`/services/${s.id}`} className="hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-body text-ink-mid">{s.desc}</td>
                    <td className="px-4 py-4 text-body-sm">
                      {s.licenceRequired ? (
                        <span className="text-attention">Arms licence verified</span>
                      ) : (
                        <span className="text-ink-mid">PSARA agency licence</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-body-sm text-ink-mid">
            {EX_SERVICEMAN_FILTER.name}: {EX_SERVICEMAN_FILTER.desc}
          </p>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6">
          <p className="text-eyebrow text-ink-faint">How it works</p>
          <h2 className="text-h1 mt-3 text-ink">The real lifecycle, not a shortened one</h2>
          <ol className="mt-10 grid grid-cols-1 gap-0 border-t border-rule lg:grid-cols-5">
            {STEPS.map((s) => (
              <li key={s.n} className="border-b border-rule px-0 py-6 lg:border-b-0 lg:border-r lg:px-4 lg:py-8 last:lg:border-r-0">
                <p className="text-mono text-ink-faint">{s.n}</p>
                <h3 className="text-h3 mt-3 text-ink">{s.title}</h3>
                <p className="mt-2 text-body-sm text-ink-mid">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="compliance" className="bg-paper-raised">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6">
          <p className="text-eyebrow text-ink-faint">Compliance</p>
          <h2 className="text-h1 mt-3 text-ink">A deployment you can put through procurement</h2>
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

      <section id="pricing" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6">
          <p className="text-eyebrow text-ink-faint">What a booking actually costs</p>
          <h2 className="text-h1 mt-3 text-ink">Every line, including both GST components</h2>
          <p className="mt-4 max-w-prose text-body text-ink-mid">
            Live quotes are generated in the booking funnel from the provider&apos;s rates. This
            section is a worked example so the structure is visible before you create an account.
          </p>
          <div className="mt-10">
            <CostCalculator />
          </div>
          <p className="mt-6 text-body-sm text-ink-mid">
            <Link href="/pricing" className="hover:underline">
              Cancellation refunds are on the pricing page
            </Link>
            .
          </p>
        </div>
      </section>

      <section id="coverage" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6">
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

      <section id="providers" className="border-t border-rule bg-paper-raised">
        <div className="mx-auto max-w-[1200px] px-4 py-12 lg:px-6">
          <p className="text-eyebrow text-ink-faint">For providers</p>
          <h2 className="text-h1 mt-3 text-ink">Supply is onboarded in the provider app</h2>
          <p className="mt-4 max-w-prose text-body text-ink-mid">
            This page is for clients booking a shift. Provider applications, PSARA documents and
            payouts live in the 20fourr provider app, not on this website.
          </p>
        </div>
      </section>

      <section id="faq" className="border-t border-rule">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6">
          <p className="text-eyebrow text-ink-faint">FAQ</p>
          <h2 className="text-h1 mt-3 text-ink">Straight answers</h2>
          <div className="mt-8 max-w-[680px] divide-y divide-rule border-y border-rule">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer text-h3 text-ink">{f.q}</summary>
                <p className="mt-3 text-body text-ink-mid">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
