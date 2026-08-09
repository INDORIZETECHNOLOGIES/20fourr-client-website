"use client";

import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
import { ListRow } from "@/components/dashboard/ListRow";
import { ChatIcon, ClockIcon } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adaptTicket } from "@/lib/api/adapters";
import type { TicketListResponse } from "@/lib/api/types";
import { CLOSED_TICKET_STATUSES, ticketPriorityMeta, ticketStatusMeta, type TicketStatus } from "@/lib/support-data";

export function TicketList() {
  const { data, loading, error, refetch } = useApiQuery<TicketListResponse>("tickets", {
    query: { limit: 50 },
  });

  if (loading) {
    return (
      <Card className="overflow-hidden">
        {[0, 1].map((i) => (
          <div key={i} className="border-b border-white/6 px-5 py-4 last:border-b-0">
            <div className="h-[38px] animate-pulse rounded-lg bg-white/4" />
          </div>
        ))}
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="px-6 py-12 text-center">
        <p role="alert" className="text-[14px] text-red-300">
          {error}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="mt-4 rounded-full border border-app-gold px-6 py-2.5 text-[13px] font-bold text-app-gold"
        >
          Try again
        </button>
      </Card>
    );
  }

  const tickets = (data?.tickets ?? []).map(adaptTicket);

  if (tickets.length === 0) {
    return (
      <Card className="px-6 py-12 text-center">
        <p className="text-[14px] text-slate-500">No tickets yet.</p>
        <Link
          href="/dashboard/support/new"
          className="mt-4 inline-block rounded-full border border-app-gold px-6 py-2.5 text-[13px] font-bold text-app-gold"
        >
          Raise a ticket
        </Link>
      </Card>
    );
  }

  /** Chip colours are Tailwind classes, but the rail needs a raw colour. */
  const RAIL: Record<string, string> = {
    open: "#3b82f6",
    in_review: "#3b82f6",
    waiting_on_customer: "#f59e0b",
    waiting_on_provider: "#f59e0b",
    resolved: "#22c55e",
    closed: "#94a3b8",
  };

  // Same reasoning as the bookings list: only recede against live rows.
  const hasOpen = tickets.some(
    (t) => !CLOSED_TICKET_STATUSES.includes(t.status as TicketStatus),
  );

  return (
    <div className="flex flex-col gap-2.5">
      {tickets.map((t) => {
        const status = ticketStatusMeta(t.status);
        const priority = ticketPriorityMeta(t.priority);
        const closed =
          hasOpen && CLOSED_TICKET_STATUSES.includes(t.status as TicketStatus);

        return (
          <ListRow
            key={t.id}
            href={`/dashboard/support/${t.id}`}
            accent={RAIL[t.status] ?? "#94a3b8"}
            muted={closed}
            icon={<ChatIcon size={18} />}
            iconClass="bg-app-info/12 text-app-info"
            title={t.subject}
            badge={
              <>
                <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold ${status.cls}`}>
                  {status.label}
                </span>
                {t.priority === "high" || t.priority === "urgent" ? (
                  <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold ${priority.cls}`}>
                    {priority.label}
                  </span>
                ) : null}
              </>
            }
            primaryMeta={[{ text: t.category }]}
            secondaryMeta={[
              { icon: <ClockIcon size={12} />, text: `updated ${t.updated}` },
            ]}
            reference={t.ref}
          />
        );
      })}
    </div>
  );
}
