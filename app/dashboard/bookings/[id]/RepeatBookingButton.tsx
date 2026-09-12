"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { CalendarIcon } from "@/components/dashboard/icons";
import { RECURRING_FREQUENCIES, type ApiBooking } from "@/lib/api/types";

/**
 * Turns an existing booking into a recurring series.
 *
 * Creating from a booking rather than a blank form is deliberate: the provider,
 * service category and times are already settled and agreed, so the only new
 * decisions are how often it repeats and when to stop. A standalone form would
 * make the user re-pick a provider they have already chosen.
 *
 * Posts to `/recurring` — the endpoint the client app uses, and the only one
 * with pause / resume / skip-next behind it.
 */
export function RepeatBookingButton({ booking }: { booking: ApiBooking }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<string>("weekly");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerId =
    typeof booking.providerId === "string" ? booking.providerId : booking.providerId?._id;

  // Without a provider or a start there is nothing to repeat.
  if (!providerId || !booking.startDate || !booking.startTime || !booking.endTime) {
    return null;
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      await api("recurring", {
        method: "POST",
        body: {
          providerId,
          serviceCategory: booking.serviceCategory,
          // The series starts from this booking's own date and times.
          startDate: (booking.startDate ?? "").slice(0, 10),
          startTime: booking.startTime,
          endTime: booking.endTime,
          frequency,
          ...(endDate ? { endDate } : {}),
          ...(booking.vehicleOption ? { vehicleOption: booking.vehicleOption } : {}),
        },
      });
      setOpen(false);
      router.push("/dashboard/bookings/recurring");
    } catch (cause) {
      // POST /recurring sits behind requireClientProfileComplete, so a missing
      // address fails here rather than at booking time — point at the fix.
      if (isApiError(cause) && /profile/i.test(cause.message)) {
        setError(`${cause.message} Add your address under Profile → Edit Profile.`);
      } else {
        setError(errorMessage(cause));
      }
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-lg border border-hairline px-4 py-3 text-body font-semibold text-fg-mid transition-colors hover:bg-panel-raised"
      >
        <CalendarIcon size={16} />
        Repeat this booking
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-hairline bg-panel p-4">
      <p className="text-body font-semibold text-fg">Repeat this booking</p>
      <p className="mt-1 text-body-sm leading-relaxed text-fg-faint">
        Same provider, service and times. Each occurrence is created as its own booking
        and still needs paying.
      </p>

      <p className="mt-3 text-label font-semibold uppercase tracking-[1px] text-fg-faint">
        How often
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {RECURRING_FREQUENCIES.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={frequency === f.id}
            onClick={() => setFrequency(f.id)}
            className={[
              "rounded-sm border px-4 py-1.5 text-body-sm font-semibold transition-colors",
              frequency === f.id
                ? "border-brand bg-panel-raised text-brand"
                : "border-hairline text-fg-mid hover:border-edge",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <label htmlFor="series-end" className="mt-3 block text-label text-fg-faint">
        Stop after (optional)
      </label>
      <input
        id="series-end"
        type="date"
        value={endDate}
        min={(booking.startDate ?? "").slice(0, 10)}
        onChange={(e) => setEndDate(e.target.value)}
        className="mt-1 w-full rounded-lg border border-hairline bg-panel-raised px-3 py-2 text-body-sm text-fg outline-none focus:border-edge [color-scheme:dark]"
      />

      {error ? (
        <p role="alert" className="mt-2 text-body-sm leading-relaxed text-fault">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="rounded-sm bg-brand text-brand-ink px-5 py-2 text-body-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create schedule"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-sm border border-hairline px-5 py-2 text-body-sm font-semibold text-fg-mid"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
