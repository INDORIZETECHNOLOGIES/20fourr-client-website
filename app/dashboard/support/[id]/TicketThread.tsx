"use client";

import { useState } from "react";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { adaptTicket } from "@/lib/api/adapters";
import type { ApiTicket } from "@/lib/api/types";
import {
  CLOSED_TICKET_STATUSES,
  ticketPriorityMeta,
  ticketStatusMeta,
  type TicketStatus,
} from "@/lib/support-data";

export function TicketThread({ id }: { id: string }) {
  const { data, loading, error, refetch } = useApiQuery<{ ticket: ApiTicket }>(
    `tickets/${id}`,
  );

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) {
    return (
      <SubPage title="Ticket" backHref="/dashboard/support" backLabel="Support" width={720}>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[110px] animate-pulse rounded-2xl bg-app-card" />
          ))}
        </div>
      </SubPage>
    );
  }

  if (error || !data?.ticket) {
    return (
      <SubPage title="Ticket" backHref="/dashboard/support" backLabel="Support" width={720}>
        <p
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/8 px-6 py-10 text-center text-[15px] text-red-300"
        >
          {error ?? "This ticket could not be found."}
        </p>
      </SubPage>
    );
  }

  const ticket = adaptTicket(data.ticket);
  const status = ticketStatusMeta(ticket.status);
  const priority = ticketPriorityMeta(ticket.priority);
  const closed = CLOSED_TICKET_STATUSES.includes(ticket.status as TicketStatus);

  async function send() {
    const message = draft.trim();
    if (!message) return;

    setSending(true);
    setActionError(null);
    try {
      await api(`tickets/${id}/message`, { method: "POST", body: { message } });
      setDraft("");
      // Re-read rather than appending locally: posting a reply can move the
      // ticket to waiting_on_provider, and the status chip has to follow.
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  async function close() {
    setClosing(true);
    setActionError(null);
    try {
      await api(`tickets/${id}/close`, { method: "PUT" });
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setClosing(false);
    }
  }

  return (
    <SubPage
      title={ticket.subject}
      subtitle={`${ticket.ref} · ${ticket.category}`}
      backHref="/dashboard/support"
      backLabel="Support"
      width={720}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${status.cls}`}>
          {status.label}
        </span>
        <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${priority.cls}`}>
          {priority.label} priority
        </span>
      </div>

      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300"
        >
          {actionError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {/* No separate bubble for `description`: the API seeds messages[0] from
            it when the ticket is created, so rendering both showed the opening
            message twice. Verified against a live ticket. */}
        {ticket.messages.map((m) => (
          <Bubble
            key={m.id}
            mine={m.from === "you"}
            author={m.author}
            body={m.body}
            at={m.at}
          />
        ))}
      </div>

      {closed ? (
        <Card className="mt-5 px-6 py-8 text-center">
          <p className="text-[14px] text-slate-500">
            This ticket is {status.label.toLowerCase()}. Create a new one if you need more
            help.
          </p>
        </Card>
      ) : (
        <Card className="mt-5 p-5">
          <label htmlFor="reply" className="sr-only">
            Reply
          </label>
          <textarea
            id="reply"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a reply…"
            className="w-full rounded-xl border border-app-border bg-white/4 px-4 py-3 text-[14.5px] text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-app-gold/60"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={close}
              disabled={closing}
              className="rounded-full border border-app-border px-5 py-2 text-[13.5px] font-semibold text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              {closing ? "Closing…" : "Close ticket"}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || sending}
              className={[
                "rounded-full px-7 py-2.5 text-[14px] font-bold transition-colors",
                draft.trim() && !sending
                  ? "bg-app-gold-gradient text-black"
                  : "cursor-not-allowed bg-app-disabled text-slate-500",
              ].join(" ")}
            >
              {sending ? "Sending…" : "Send reply"}
            </button>
          </div>
        </Card>
      )}
    </SubPage>
  );
}

function Bubble({
  mine,
  author,
  body,
  at,
}: {
  mine: boolean;
  author: string;
  body: string;
  at: string;
}) {
  return (
    <div className={["flex", mine ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-5 py-4",
          mine
            ? "rounded-br-md bg-app-gold/12 text-slate-100"
            : "rounded-bl-md border border-app-border bg-app-card text-slate-200",
        ].join(" ")}
      >
        <p className="mb-1.5 text-[12px] font-bold text-slate-400">{author}</p>
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{body}</p>
        {at ? <p className="mt-2 text-[11.5px] text-slate-600">{at}</p> : null}
      </div>
    </div>
  );
}
