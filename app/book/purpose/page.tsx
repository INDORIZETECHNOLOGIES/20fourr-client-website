"use client";

import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { StepFooter, StepHeading } from "../BookingShell";
import { BOOKING_PURPOSES } from "@/lib/booking-data";

export default function PurposeStep() {
  const { draft, update } = useBooking();
  const router = useRouter();

  return (
    <>
      <StepHeading
        title="What's the purpose?"
        subtitle="This helps us brief the provider. You can skip it."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {BOOKING_PURPOSES.map((p) => {
          const selected = draft.purposeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ purposeId: p.id })}
              aria-pressed={selected}
              className={[
                "rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-brand bg-panel-raised"
                  : "border-hairline bg-panel hover:border-edge",
              ].join(" ")}
            >
              <span className="block text-body font-semibold text-fg">{p.label}</span>
              <span className="mt-1 block text-body-sm leading-relaxed text-fg-faint">
                {p.desc}
              </span>
            </button>
          );
        })}
      </div>

      {draft.purposeId ? (
        <div className="mt-6">
          <label
            htmlFor="purpose-note"
            className="mb-2 block text-body-sm font-semibold text-fg-mid"
          >
            Anything the provider should know? <span className="text-fg-faint">(optional)</span>
          </label>
          <textarea
            id="purpose-note"
            rows={3}
            value={draft.purposeNote}
            onChange={(e) => update({ purposeNote: e.target.value })}
            placeholder="e.g. Two entry gates, night shift, formal dress code"
            className="w-full rounded-lg border border-hairline bg-panel-raised px-4 py-3.5 text-body text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-edge"
          />
        </div>
      ) : null}

      <StepFooter
        disabled={!draft.purposeId}
        continueLabel="Continue to Booking"
        hint={draft.purposeId ? undefined : "Pick a purpose, or choose Other to skip."}
        onContinue={() => router.push("/book/schedule")}
      />
    </>
  );
}
