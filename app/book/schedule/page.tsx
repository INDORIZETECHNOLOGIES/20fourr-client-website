"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { StepFooter, StepHeading } from "../BookingShell";
import { PriceSummary } from "../PriceSummary";
import { PinFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePricePreview, endOfShift } from "@/lib/api/pricing";
import { adaptAddress } from "@/lib/api/adapters";
import type { ApiSavedAddress } from "@/lib/api/types";
import { DURATION_PRESETS, REPEAT_PATTERNS } from "@/lib/booking-data";
import { formatAddress } from "@/lib/dashboard-data";

export default function ScheduleStep() {
  const { draft, update } = useBooking();
  const router = useRouter();
  const [touched, setTouched] = useState(false);

  // The client's saved addresses, so the common case is one tap.
  const { data: addressData } = useApiQuery<{ addresses: ApiSavedAddress[] }>(
    "client/saved-addresses",
  );
  const addresses = (addressData?.addresses ?? []).map(adaptAddress);

  // Priced by the server against this provider's own rates.
  const { data: price, loading: priceLoading, error: priceError } = usePricePreview(draft);
  const end = endOfShift(draft.date, draft.startTime, draft.hours);

  // Can't book in the past.
  const today = new Date().toISOString().slice(0, 10);
  const errors = {
    date: !draft.date ? "Pick a date." : draft.date < today ? "Date is in the past." : "",
    startTime: !draft.startTime ? "Pick a start time." : "",
    address: !draft.address.trim() ? "Service address is required." : "",
  };
  const valid = !errors.date && !errors.startTime && !errors.address;

  return (
    <>
      <StepHeading title="Booking Request" subtitle="When and where do you need cover?" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <section>
            <SectionLabel>Date &amp; time</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="date" label="Start date" error={touched ? errors.date : ""}>
                <input
                  id="date"
                  type="date"
                  min={today}
                  value={draft.date}
                  onChange={(e) => update({ date: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field
                id="start-time"
                label="Start time"
                error={touched ? errors.startTime : ""}
              >
                <input
                  id="start-time"
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => update({ startTime: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          <section>
            <SectionLabel>Duration</SectionLabel>
            <div className="flex flex-wrap gap-2.5">
              {DURATION_PRESETS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => update({ hours: h })}
                  aria-pressed={draft.hours === h}
                  className={[
                    "rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-colors",
                    draft.hours === h
                      ? "border-app-gold bg-app-gold/12 text-app-gold"
                      : "border-app-border text-slate-300 hover:border-app-gold/40",
                  ].join(" ")}
                >
                  {h}h
                </button>
              ))}
              <label className="flex items-center gap-2 rounded-full border border-app-border px-4 py-2.5">
                <span className="text-[13px] text-slate-500">Custom</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={draft.hours}
                  onChange={(e) =>
                    update({ hours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })
                  }
                  aria-label="Custom duration in hours"
                  className="w-14 bg-transparent text-[14px] font-semibold text-slate-100 outline-none"
                />
              </label>
            </div>
          </section>

          <section>
            <SectionLabel>Service address</SectionLabel>
            {addresses.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => update({ address: `${a.label} — ${formatAddress(a)}` })}
                    className="flex items-center gap-2 rounded-full border border-app-border px-4 py-2 text-[13px] text-slate-300 transition-colors hover:border-app-gold/40"
                  >
                    <span className="text-app-gold">
                      <PinFill size={13} />
                    </span>
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}
            <Field id="address" label="Address" error={touched ? errors.address : ""}>
              <textarea
                id="address"
                rows={2}
                value={draft.address}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="Building, street, area, city, pincode"
                className={inputCls}
              />
            </Field>
          </section>

          <section>
            <SectionLabel>Vehicle</SectionLabel>
            <div className="flex flex-wrap gap-2.5">
              {(
                [
                  { id: "none", label: "No vehicle" },
                  { id: "vehicle", label: "Vehicle" },
                  { id: "vehicleWithDriver", label: "Vehicle with driver" },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => update({ vehicleOption: v.id })}
                  aria-pressed={draft.vehicleOption === v.id}
                  className={[
                    "rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-colors",
                    draft.vehicleOption === v.id
                      ? "border-app-gold bg-app-gold/12 text-app-gold"
                      : "border-app-border text-slate-300 hover:border-app-gold/40",
                  ].join(" ")}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[13px] text-slate-500">
              Adds the provider&apos;s vehicle charge to the total. Only offered by
              providers who run one.
            </p>
          </section>

          <section>
            <SectionLabel>Repeat pattern</SectionLabel>
            <div className="flex flex-wrap gap-2.5">
              {REPEAT_PATTERNS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => update({ repeat: r.id })}
                  aria-pressed={draft.repeat === r.id}
                  className={[
                    "rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-colors",
                    draft.repeat === r.id
                      ? "border-app-gold bg-app-gold/12 text-app-gold"
                      : "border-app-border text-slate-300 hover:border-app-gold/40",
                  ].join(" ")}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {draft.repeat !== "none" ? (
              <p className="mt-2.5 text-[13px] text-slate-500">
                Creates this booking on a regular schedule. Manage it later under
                Bookings → Recurring.
              </p>
            ) : null}
          </section>
        </div>

        {/* Live price — from the server, never computed here */}
        <aside className="h-fit rounded-2xl border border-app-border bg-app-card p-5 lg:sticky lg:top-[130px]">
          <h2 className="mb-4 font-display text-[15px] font-bold text-slate-100">
            Price Breakdown
          </h2>
          <PriceSummary price={price} loading={priceLoading} error={priceError} />
          {end ? (
            <p className="mt-3 text-[12px] text-slate-500">
              Ends {end.endDate === draft.date ? "" : `${end.endDate} at `}
              {end.endTime}
            </p>
          ) : null}
          <p className="mt-3 text-[12px] leading-relaxed text-slate-600">
            Charged after the provider accepts. Cancellation charges may apply.
          </p>
        </aside>
      </div>

      <StepFooter
        disabled={false}
        hint={!valid && touched ? "Fix the highlighted fields." : undefined}
        onContinue={() => {
          setTouched(true);
          if (valid) router.push("/book/risk");
        }}
      />
    </>
  );
}

const inputCls =
  "w-full rounded-2xl border border-app-border bg-white/4 px-4 py-3 text-[14.5px] text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-app-gold/60 [color-scheme:dark]";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
      {children}
    </h2>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-slate-400">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[12.5px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

