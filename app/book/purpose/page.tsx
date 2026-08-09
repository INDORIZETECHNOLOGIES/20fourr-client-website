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
                "rounded-2xl border p-4 text-left transition-colors",
                selected
                  ? "border-app-gold bg-app-gold/8"
                  : "border-app-border bg-app-card hover:border-app-gold/30",
              ].join(" ")}
            >
              <span className="block text-[15px] font-bold text-slate-100">{p.label}</span>
              <span className="mt-1 block text-[12.5px] leading-relaxed text-slate-500">
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
            className="mb-2 block text-[13.5px] font-semibold text-slate-300"
          >
            Anything the provider should know? <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            id="purpose-note"
            rows={3}
            value={draft.purposeNote}
            onChange={(e) => update({ purposeNote: e.target.value })}
            placeholder="e.g. Two entry gates, night shift, formal dress code"
            className="w-full rounded-2xl border border-app-border bg-white/4 px-4 py-3.5 text-[14.5px] text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-app-gold/60"
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
