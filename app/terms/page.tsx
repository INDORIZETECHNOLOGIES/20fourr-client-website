import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the 20fourr security services platform.",
};

const SECTIONS = [
  {
    heading: "1. What 20fourr is",
    body: [
      "20fourr is a marketplace that connects clients with PSARA-licensed private security providers. We are not a security agency and do not employ the providers listed on the platform.",
      "The service contract for any booking is between you and the provider. 20fourr facilitates discovery, scheduling, payment and dispute handling.",
    ],
  },
  {
    heading: "2. Eligibility",
    body: [
      "You must be at least 18 years old and legally able to enter a contract. Business accounts must be operated by someone authorised to bind the organisation.",
      "You agree to give accurate identity and contact details, and to keep them current.",
    ],
  },
  {
    heading: "3. Bookings and payment",
    body: [
      "A booking request becomes binding when a provider accepts it. No payment is taken when you request a booking — once a provider accepts, the booking becomes payable and you complete payment yourself.",
      "Prices shown include a platform convenience fee and applicable GST. A tax invoice is issued for every completed booking.",
      // Mirrors utils/pricing.ts → calculateCancellationRefund. The previous
      // wording ("free until acceptance, then 6 hours / 50% charge") was
      // invented and contradicted the server on every point, which on a terms
      // page is the worst place for it to be wrong.
      "Cancellation before payment costs nothing. Once paid, the refund depends on how long before the duty start time you cancel: more than 24 hours refunds 90%, between 12 and 24 hours refunds 50%, and under 12 hours is non-refundable. Refunds are credited to your wallet as SecureCoins.",
    ],
  },
  {
    heading: "4. Duty verification",
    body: [
      "Duty start and end are confirmed by one-time codes issued to you. Sharing a code before the provider is physically on site, or after duty has genuinely ended, is a breach of these terms.",
      "20fourr will never request a duty OTP by phone, email or chat.",
    ],
  },
  {
    heading: "5. Conduct and safety",
    body: [
      "Security personnel have no powers of arrest, search or seizure. In an emergency, contact the police first.",
      "You are responsible for safe site access, adequate lighting, and disclosing known hazards at the location.",
      "Providers are entitled to rest breaks, drinking water and a lawful working environment. Abusive conduct may result in cancellation without refund.",
    ],
  },
  {
    heading: "6. Liability",
    body: [
      "Engaging a provider reduces risk but does not guarantee prevention of theft, injury, damage or loss.",
      "To the extent permitted by law, 20fourr's aggregate liability for any booking is limited to the amount paid for that booking.",
    ],
  },
  {
    heading: "7. Data and privacy",
    body: [
      "We process personal data in line with India's Digital Personal Data Protection Act. Your rights of access, correction, erasure, portability and consent withdrawal are exercisable from Profile → Privacy & Data Rights.",
      "Duty logs, chat transcripts and booking records are retained where law or dispute resolution requires it.",
    ],
  },
  {
    heading: "8. Changes to these terms",
    body: [
      "We may update these terms. Material changes will be notified in-app at least 14 days before they take effect. Continuing to use the platform after that date constitutes acceptance.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-app-bg font-body text-slate-200">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-6 py-5">
          <Link href="/dashboard" aria-label="20fourr">
            <Logo width={92} />
          </Link>
          <Link
            href="/dashboard"
            className="text-[13.5px] font-semibold text-app-gold hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[760px] px-6 py-12">
        <h1 className="font-display text-[30px] font-extrabold tracking-[-0.5px] text-slate-100">
          Terms of Service
        </h1>
        <p className="mt-2 text-[14px] text-slate-500">Last updated 8 August 2026</p>

        {/* This is placeholder drafting, not reviewed copy. */}
        <p className="mt-6 rounded-xl border border-app-gold/30 bg-app-gold/8 px-5 py-4 text-[13.5px] leading-relaxed text-app-gold">
          Draft copy. These terms carry legal weight and must be reviewed by counsel
          before launch — particularly the liability, cancellation and data
          retention clauses.
        </p>

        <div className="mt-10 flex flex-col gap-9">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-[19px] font-bold text-slate-100">
                {s.heading}
              </h2>
              {s.body.map((p) => (
                <p key={p} className="mt-3 text-[14.5px] leading-relaxed text-slate-400">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
