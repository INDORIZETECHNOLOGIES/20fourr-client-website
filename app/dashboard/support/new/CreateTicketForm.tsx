"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/dashboard/primitives";
import { Notice } from "@/components/ui/Notice";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { adaptBooking } from "@/lib/api/adapters";
import type { ApiTicket, BookingListResponse } from "@/lib/api/types";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketPriority,
  type TicketType,
} from "@/lib/support-data";

/** The API's own limits, enforced here so a long description isn't lost to a 400. */
const SUBJECT_MIN = 5;
const SUBJECT_MAX = 100;
const BODY_MIN = 10;
const BODY_MAX = 1000;
const MAX_FILES = 5;

export function CreateTicketForm() {
  const router = useRouter();
  const { data: bookingData } = useApiQuery<BookingListResponse>("client/bookings", {
    query: { limit: 100 },
  });

  const [type, setType] = useState<TicketType | "">("");
  const [bookingId, setBookingId] = useState("");
  // The API's enum has no "normal" — medium is the middle value.
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ id: string; ref: string } | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  const bookings = (bookingData?.bookings ?? []).map(adaptBooking);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = {
      type: type ? undefined : "Pick a category.",
      subject:
        subject.trim().length < SUBJECT_MIN
          ? `At least ${SUBJECT_MIN} characters.`
          : subject.trim().length > SUBJECT_MAX
            ? `No more than ${SUBJECT_MAX} characters.`
            : undefined,
      body:
        body.trim().length < BODY_MIN
          ? `Describe the issue in at least ${BODY_MIN} characters.`
          : body.trim().length > BODY_MAX
            ? `No more than ${BODY_MAX} characters.`
            : undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    try {
      const { ticket } = await api<{ ticket: ApiTicket }>("tickets", {
        method: "POST",
        body: {
          type,
          subject: subject.trim(),
          description: body.trim(),
          priority,
          ...(bookingId ? { bookingId } : {}),
        },
      });

      // Attachments are a separate multipart call per file — the API's upload
      // route takes one at a time, and it needs a ticket to attach to, so this
      // can only happen after creation.
      const failed: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        try {
          await api(`tickets/${ticket._id}/upload`, { method: "POST", body: form });
        } catch {
          failed.push(file.name);
        }
      }
      if (failed.length > 0) {
        // The ticket exists either way — say what didn't make it rather than
        // implying the whole submission failed.
        setUploadWarning(
          `The ticket was created, but ${failed.length === 1 ? "this file" : "these files"} couldn't be attached: ${failed.join(", ")}. You can add them as a reply.`,
        );
      }

      setCreated({ id: ticket._id, ref: ticket.ticketId || ticket._id });
      router.refresh();
    } catch (cause) {
      if (isApiError(cause) && cause.fields) {
        const mapped: Record<string, string | undefined> = {};
        for (const [key, message] of Object.entries(cause.fields)) {
          mapped[key === "description" ? "body" : key] = message;
        }
        setErrors((prev) => ({ ...prev, ...mapped }));
      } else {
        setFormError(errorMessage(cause));
      }
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <Card className="p-6">
        <Notice>
          Ticket {created.ref} created. Our team replies within 4 hours during business
          hours, and within 24 hours otherwise. You&apos;ll be notified when there&apos;s
          a reply.
        </Notice>
        {uploadWarning ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-app-warning/40 bg-app-warning/10 px-4 py-3 text-[13.5px] text-app-warning"
          >
            {uploadWarning}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/support/${created.id}`}
            className="rounded-full bg-app-gold-gradient px-7 py-2.5 text-[14px] font-bold text-black"
          >
            View ticket
          </Link>
          <Link
            href="/dashboard/support"
            className="rounded-full border border-app-border px-7 py-2.5 text-[14px] font-semibold text-slate-300 hover:bg-white/5"
          >
            Back to Support
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {formError ? (
          <p
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300"
          >
            {formError}
          </p>
        ) : null}

        <div>
          <FieldLabel htmlFor="category">Category</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {TICKET_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={type === c.id}
                title={c.hint}
                onClick={() => {
                  setType(c.id);
                  setErrors((e) => ({ ...e, type: undefined }));
                }}
                className={[
                  "rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors",
                  type === c.id
                    ? "border-app-gold bg-app-gold/12 text-app-gold"
                    : "border-app-border text-slate-300 hover:border-app-gold/40",
                ].join(" ")}
              >
                {c.label}
              </button>
            ))}
          </div>
          {type ? (
            <p className="mt-2 text-[12.5px] text-slate-600">
              {TICKET_CATEGORIES.find((c) => c.id === type)?.hint}
            </p>
          ) : null}
          <ErrorText id="type" msg={errors.type} />
        </div>

        <div>
          <FieldLabel htmlFor="priority">Priority</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {TICKET_PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={priority === p.id}
                onClick={() => setPriority(p.id)}
                className={[
                  "rounded-full px-4 py-2 text-[13px] font-bold transition-opacity",
                  p.cls,
                  priority === p.id ? "ring-2 ring-app-gold/60" : "opacity-60 hover:opacity-100",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="booking">Related booking (optional)</FieldLabel>
          <select
            id="booking"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="w-full rounded-xl border border-app-border bg-white/4 px-4 py-3 text-[14.5px] text-slate-100 outline-none focus:border-app-gold/60"
          >
            <option value="">Not about a specific booking</option>
            {bookings.map((b) => (
              // The value is the Mongo id the API validates as a bookingId; the
              // label is the human reference the client recognises.
              <option key={b.id} value={b.id}>
                {b.ref} — {b.service}, {b.date}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="subject">Subject</FieldLabel>
          <input
            id="subject"
            value={subject}
            maxLength={SUBJECT_MAX}
            onChange={(e) => {
              setSubject(e.target.value);
              setErrors((x) => ({ ...x, subject: undefined }));
            }}
            placeholder="One line — what's this about?"
            className={inputCls(errors.subject)}
          />
          <ErrorText id="subject" msg={errors.subject} />
        </div>

        <div>
          <FieldLabel htmlFor="body">Description</FieldLabel>
          <textarea
            id="body"
            rows={5}
            value={body}
            maxLength={BODY_MAX}
            onChange={(e) => {
              setBody(e.target.value);
              setErrors((x) => ({ ...x, body: undefined }));
            }}
            placeholder="What happened, when, and what outcome are you looking for?"
            className={inputCls(errors.body)}
          />
          <div className="mt-1.5 flex justify-between gap-3">
            <ErrorText id="body" msg={errors.body} />
            <span className="shrink-0 text-[12px] text-slate-600">
              {body.length}/{BODY_MAX}
            </span>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="attachments">Photos / videos / documents</FieldLabel>
          <input
            id="attachments"
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_FILES))}
            className="w-full rounded-xl border border-dashed border-app-border bg-white/2 px-4 py-3 text-[13.5px] text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-app-gold/15 file:px-4 file:py-1.5 file:text-[13px] file:font-bold file:text-app-gold"
          />
          {files.length > 0 ? (
            <p className="mt-2 text-[12.5px] text-slate-500">
              {files.length} file{files.length > 1 ? "s" : ""} selected:{" "}
              {files.map((f) => f.name).join(", ")}
            </p>
          ) : (
            <p className="mt-2 text-[12px] text-slate-600">
              Up to {MAX_FILES} files. Uploaded after the ticket is created.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-1 self-start rounded-full bg-app-gold-gradient px-8 py-3 text-[14.5px] font-bold text-black transition-transform hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60"
        >
          {saving ? "Submitting…" : "Submit ticket"}
        </button>
      </form>
    </Card>
  );
}

const inputCls = (err?: string) =>
  [
    "w-full rounded-xl border bg-white/4 px-4 py-3 text-[14.5px] text-slate-100 outline-none transition-colors placeholder:text-slate-600",
    err ? "border-red-500" : "border-app-border focus:border-app-gold/60",
  ].join(" ");

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-medium text-slate-400">
      {children}
    </label>
  );
}

function ErrorText({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12.5px] text-red-400">
      {msg}
    </p>
  );
}
