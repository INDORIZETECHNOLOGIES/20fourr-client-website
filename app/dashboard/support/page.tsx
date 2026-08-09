import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeading } from "@/components/dashboard/primitives";
import {
  ChatIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  PhoneIcon,
  PlusIcon,
} from "@/components/dashboard/icons";
import { TicketList } from "./TicketList";
import { FAQS } from "@/lib/support-data";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Support" subtitle="We're here to help, 24 hours a day" />
        <Link
          href="/dashboard/support/new"
          className="flex items-center gap-2 rounded-full bg-app-gold-gradient px-5 py-2.5 text-[14px] font-bold text-black transition-transform hover:-translate-y-px"
        >
          <PlusIcon size={16} />
          New ticket
        </Link>
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <Card className="cursor-pointer p-6 transition-colors hover:border-app-info/25">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-app-info/12 text-app-info">
            <ChatIcon size={20} />
          </span>
          <h3 className="mb-1.5 text-[15px] font-bold text-slate-100">Live Chat</h3>
          <p className="text-[13px] leading-relaxed text-slate-500">
            Chat with our support team in real-time for immediate help.
          </p>
          <p className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-green-500">
            <span className="animate-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            Available now
          </p>
        </Card>

        <Card className="cursor-pointer p-6 transition-colors hover:border-app-gold/25">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-app-gold/12 text-app-gold">
            <PhoneIcon size={20} />
          </span>
          <h3 className="mb-1.5 text-[15px] font-bold text-slate-100">Call Support</h3>
          <p className="text-[13px] leading-relaxed text-slate-500">
            Speak directly with a support agent over the phone.
          </p>
          <p className="mt-3.5 text-xs text-slate-500">Mon–Fri, 9AM–6PM IST</p>
        </Card>
      </div>

      <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
        My Tickets
      </h3>
      <TicketList />

      <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
        Frequently Asked Questions
      </h3>
      <Card className="overflow-hidden">
        {FAQS.map((faq, i) => (
          <details
            key={faq.q}
            className={i < FAQS.length - 1 ? "border-b border-white/6" : ""}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-[14.5px] text-slate-300 transition-colors marker:content-none hover:bg-white/3">
              <span className="flex items-center gap-3">
                <span className="shrink-0 text-app-gold">
                  <HelpCircleIcon size={17} />
                </span>
                {faq.q}
              </span>
              <span className="shrink-0 text-slate-500">
                <ChevronRightIcon size={15} />
              </span>
            </summary>
            <p className="px-5 pb-5 pl-[52px] text-[13.5px] leading-relaxed text-slate-400">
              {faq.a}
            </p>
          </details>
        ))}
      </Card>
    </>
  );
}
