import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingArticle } from "@/components/marketing/MarketingArticle";
import { QuoteBreakdown } from "@/components/marketing/QuoteBreakdown";
import {
  SERVICE_CATALOGUE,
  isServiceCategory,
  serviceById,
  type ServiceCategory,
} from "@/lib/services";
import { workedQuote } from "@/lib/sample-quote";

export function generateStaticParams() {
  return SERVICE_CATALOGUE.map((s) => ({ category: s.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[category]">): Promise<Metadata> {
  const { category } = await params;
  const svc = serviceById(category);
  if (!svc) return { title: "Service" };
  return {
    title: svc.name,
    description: svc.desc,
    alternates: { canonical: `/services/${svc.id}` },
  };
}

const DETAIL: Record<
  ServiceCategory,
  { lede: string; facts: { dt: string; dd: string }[] }
> = {
  guard: {
    lede: "Unarmed premises and perimeter duty. The provider's PSARA licence is checked against the deployment state and the service start date.",
    facts: [
      { dt: "Arms", dd: "Unarmed. Gunman and PSO are the armed categories." },
      { dt: "Licence", dd: "PSARA of the agency. Not an arms licence." },
      { dt: "Typical use", dd: "Offices, facilities, residential associations, site gates." },
    ],
  },
  bouncer: {
    lede: "Crowd control and access for events, clubs and venues. Same OTP start and end as a site shift.",
    facts: [
      { dt: "Arms", dd: "Unarmed." },
      { dt: "Licence", dd: "PSARA of the agency." },
      { dt: "Typical use", dd: "Venues, events, door and floor control." },
    ],
  },
  gunman: {
    lede: "Armed personnel for a named site. The booking is not accepted until the arms licence is verified (SC_611).",
    facts: [
      { dt: "Arms", dd: "Armed. Licence verified before accept." },
      { dt: "Licence", dd: "PSARA of the agency plus a verified arms licence." },
      { dt: "Typical use", dd: "Sites booked as armed duty, not as a guard or bouncer shift." },
    ],
  },
  pso: {
    lede: "Close protection for a named individual. The booking is not accepted until the arms licence is verified (SC_611).",
    facts: [
      { dt: "Arms", dd: "Armed. Licence verified before accept." },
      { dt: "Licence", dd: "PSARA of the agency plus a verified arms licence." },
      { dt: "Typical use", dd: "Personal close protection. The booking path is the same as a site shift." },
    ],
  },
};

export default async function ServiceCategoryPage({
  params,
}: PageProps<"/services/[category]">) {
  const { category } = await params;
  if (!isServiceCategory(category)) notFound();
  const svc = serviceById(category);
  if (!svc) notFound();
  const detail = DETAIL[svc.id];
  const quote = workedQuote(svc.id, 8);

  return (
    <MarketingArticle eyebrow="Service" title={svc.name} lede={detail.lede}>
      <dl className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {detail.facts.map((row) => (
          <div key={row.dt} className="border-t border-rule pt-4">
            <dt className="text-label text-ink-faint">{row.dt}</dt>
            <dd className="mt-2 text-body text-ink">{row.dd}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 max-w-[640px]">
        <p className="text-label text-ink-faint">Worked example · 8 hours</p>
        <div className="mt-4">
          <QuoteBreakdown quote={quote} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/book/service?category=${svc.id}`}
          className="inline-flex h-12 items-center justify-center rounded-sm bg-ink px-5 text-body font-medium text-paper"
        >
          Book {svc.name}
        </Link>
        <Link
          href="/pricing"
          className="inline-flex h-12 items-center justify-center rounded-sm border border-edge px-5 text-body font-medium text-ink"
        >
          Compare durations
        </Link>
      </div>

      <nav className="mt-16 border-t border-rule pt-6" aria-label="Other categories">
        <p className="text-label text-ink-faint">Other categories</p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {SERVICE_CATALOGUE.filter((s) => s.id !== svc.id).map((s) => (
            <li key={s.id}>
              <Link href={`/services/${s.id}`} className="text-body text-ink-mid hover:text-ink">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </MarketingArticle>
  );
}
