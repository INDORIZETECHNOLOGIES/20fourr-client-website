import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeading } from "@/components/dashboard/primitives";
import {
  ChevronRightIcon,
  HelpCircleIcon,
  PlusIcon,
} from "@/components/dashboard/icons";
import { TicketList } from "./TicketList";
import { FAQS } from "@/lib/support-data";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Support" subtitle="Tickets for bookings, payments and documents." />
        <Link
          href="/dashboard/support/new"
          className="flex items-center gap-2 rounded-sm bg-brand px-5 py-2.5 text-body font-medium text-brand-ink"
        >
          <PlusIcon size={16} />
          New ticket
        </Link>
      </div>

      <h3 className="mb-3 mt-8 text-eyebrow text-fg-faint">Tickets</h3>
      <TicketList />

      <h3 className="mb-3 mt-8 text-eyebrow text-fg-faint">Questions</h3>
      <Card className="overflow-hidden">
        {FAQS.map((faq, i) => (
          <details
            key={faq.q}
            className={i < FAQS.length - 1 ? "border-b border-hairline" : ""}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-body text-fg-mid transition-colors marker:content-none hover:bg-panel-raised">
              <span className="flex items-center gap-3">
                <span className="shrink-0 text-fg-faint">
                  <HelpCircleIcon size={17} />
                </span>
                {faq.q}
              </span>
              <span className="shrink-0 text-fg-faint">
                <ChevronRightIcon size={15} />
              </span>
            </summary>
            <p className="px-5 pb-5 pl-[52px] text-body-sm leading-relaxed text-fg-mid">
              {faq.a}
            </p>
          </details>
        ))}
      </Card>
    </>
  );
}
