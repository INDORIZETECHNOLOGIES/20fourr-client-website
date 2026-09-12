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
          <div key={i} className="border-b border-hairline px-5 py-4 last:border-b-0">
            <div className="h-[38px] animate-pulse rounded-lg bg-panel-raised" />
          </div>
        ))}
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="px-6 py-12 text-center">
        <p role="alert" className="text-body text-fault">
          {error}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="mt-4 rounded-sm border border-edge px-6 py-2.5 text-body-sm font-medium text-fg"
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
        <p className="text-body text-fg-faint">No tickets yet.</p>
        <Link
          href="/dashboard/support/new"
          className="mt-4 inline-block rounded-sm border border-edge px-6 py-2.5 text-body-sm font-medium text-fg"
        >
          Raise a ticket
        </Link>
      </Card>
    );
  }

  /** Chip colours are Tailwind classes, but the rail needs a raw colour. */
  const RAIL: Record<string, string> = {
    open: "bg-fg-mid",
    in_review: "bg-fg-mid",
    waiting_on_customer: "bg-attention",
    waiting_on_provider: "bg-attention",
    resolved: "bg-live",
    closed: "bg-hairline",
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
            railClass={RAIL[t.status] ?? "bg-hairline"}
            muted={closed}
            icon={<ChatIcon size={18} />}
            iconClass="bg-panel-raised text-fg-mid"
            title={t.subject}
            badge={
              <>
                <span className={`rounded-full px-2.5 py-[3px] text-eyebrow font-semibold ${status.cls}`}>
                  {status.label}
                </span>
                {t.priority === "high" || t.priority === "urgent" ? (
                  <span className={`rounded-full px-2.5 py-[3px] text-eyebrow font-semibold ${priority.cls}`}>
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
