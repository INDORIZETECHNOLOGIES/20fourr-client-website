"use client";

import { useState } from "react";
import { Card } from "@/components/dashboard/primitives";
import { StarFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { serviceLabel } from "@/lib/api/adapters";
import type { AssignedPerson, BookingPersonnelResponse } from "@/lib/api/types";

const DOC_LABEL: Record<string, string> = {
  psara_training: "PSARA training",
  police_verification: "Police verification",
  arms_licence: "Arms licence",
};

/**
 * The team an agency assigned to this booking (spec 0003 D, backend 0017).
 *
 * The page decides nothing about visibility. The server's serializer sends only what the
 * client may see at this point in the booking: before payment, a photo, initial, experience
 * and languages; after payment, the name, phone and document validity; after the access
 * window, no photo. This component renders whichever fields arrived.
 */
export function AssignedTeam({ bookingId, completed }: { bookingId: string; completed: boolean }) {
  const { data } = useApiQuery<BookingPersonnelResponse>(`client/bookings/${bookingId}/personnel`);
  const team = data?.team ?? [];
  if (!data || team.length === 0) return null;

  const active = team.filter((p) => p.active);
  const replaced = team.filter((p) => !p.active);

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-sans text-body font-semibold text-fg">
          Assigned team{active.length > 1 ? ` (${active.length})` : ""}
        </h3>
        <p className="text-label text-fg-faint">
          {data.access === "masked"
            ? "Names and phone numbers appear once you've paid."
            : data.access === "expired"
              ? "Contact details were shown until a few days after the booking ended."
              : "Contact details stay available until a few days after the booking ends."}
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-hairline">
        {[...active, ...replaced].map((person) => (
          <Person key={person.personnelId} person={person} bookingId={bookingId} canRate={completed} />
        ))}
      </ul>
    </Card>
  );
}

function Person({ person, bookingId, canRate }: { person: AssignedPerson; bookingId: string; canRate: boolean }) {
  // The photo URL lives five minutes. If it has lapsed by the time it loads, fall back to the
  // initial rather than showing a broken image; a reload fetches a fresh one.
  const [photoFailed, setPhotoFailed] = useState(false);
  const name = person.fullName || (person.initial ? `${person.initial}.` : "Assigned person");

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-4">
        {person.photoUrl && !photoFailed ? (
          // Deliberately not next/image: that would proxy and cache a URL meant to expire.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt={`Photo of ${name}`}
            referrerPolicy="no-referrer"
            onError={() => setPhotoFailed(true)}
            className="h-14 w-14 shrink-0 rounded-sm border border-hairline object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-hairline bg-panel-raised text-h3 text-fg"
          >
            {person.initial ?? "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-fg">
            {name}
            {!person.active ? (
              <span className="rounded-sm border border-hairline px-1.5 py-px text-label font-medium text-fg-mid">
                Replaced
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-body-sm text-fg-mid">
            {serviceLabel(person.category)} · {person.yearsExperience} {person.yearsExperience === 1 ? "year" : "years"}
            {person.languages.length ? ` · ${person.languages.join(", ")}` : ""}
          </p>
          <p className="mt-0.5 text-label text-fg-faint">
            {person.rating.count > 0
              ? `${person.rating.average.toFixed(1)} from ${person.rating.count} ${person.rating.count === 1 ? "rating" : "ratings"}`
              : "No ratings yet"}
          </p>
          {person.phone ? (
            <p className="mt-2 text-body-sm">
              <a href={`tel:${person.phone}`} className="text-fg underline underline-offset-2">
                {person.phone}
              </a>
            </p>
          ) : null}
          {person.documents && person.documents.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {person.documents.map((d) => (
                <li
                  key={d.type}
                  className={`rounded-sm border px-2 py-0.5 text-label ${d.valid ? "border-live text-live" : "border-attention text-attention"}`}
                >
                  {DOC_LABEL[d.type] ?? d.type.replace(/_/g, " ")}
                  {d.valid ? " · valid" : " · expired"}
                  {d.expiresAt ? ` until ${new Date(d.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {canRate ? <RatePerson bookingId={bookingId} personnelId={person.personnelId} name={name} /> : null}
    </li>
  );
}

function RatePerson({ bookingId, personnelId, name }: { bookingId: string; personnelId: string; name: string }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "closed">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!stars) return setError("Choose from one to five stars.");
    setState("saving");
    setError(null);
    try {
      await api(`client/bookings/${bookingId}/personnel/${personnelId}/rating`, {
        method: "POST",
        body: { rating: stars, ...(comment.trim() ? { comment: comment.trim().slice(0, 1000) } : {}) },
      });
      setState("done");
    } catch (cause) {
      if (isApiError(cause) && cause.code === "SC_1586") return setState("done");
      if (isApiError(cause) && cause.code === "SC_1587") return setState("closed");
      setError(isApiError(cause) ? cause.message : "Couldn't save the rating. Try again.");
      setState("idle");
    }
  }

  if (state === "done") return <p className="mt-3 pl-[72px] text-body-sm text-live">Rated. Thank you.</p>;
  if (state === "closed") return <p className="mt-3 pl-[72px] text-body-sm text-fg-faint">The rating window for this booking has closed.</p>;

  return (
    <div className="mt-3 flex flex-col gap-2 pl-[72px]">
      <div className="flex items-center gap-1" role="group" aria-label={`Rate ${name}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={stars === n}
            onClick={() => setStars(n)}
            className={`p-0.5 transition-colors ${stars >= n ? "text-fg" : "text-fg-faint hover:text-fg-mid"}`}
          >
            <StarFill size={20} />
          </button>
        ))}
      </div>
      {stars ? (
        <>
          <input
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything to add? (optional)"
            aria-label={`Comment on ${name}`}
            className="w-full max-w-[420px] rounded-lg border border-hairline bg-panel-raised px-3 py-2 text-body-sm text-fg outline-none focus:border-edge"
          />
          <button
            type="button"
            disabled={state === "saving"}
            onClick={submit}
            className="w-fit rounded-sm border border-edge px-4 py-1.5 text-body-sm font-medium text-fg disabled:opacity-50"
          >
            {state === "saving" ? "Saving…" : `Rate ${name}`}
          </button>
        </>
      ) : null}
      {error ? (
        <p role="alert" className="text-body-sm text-fault">
          {error}
        </p>
      ) : null}
    </div>
  );
}
