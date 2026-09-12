"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { StepFooter, StepHeading } from "../BookingShell";
import { PriceSummary } from "../PriceSummary";
import { PinFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePricePreview } from "@/hooks/usePricePreview";
import { endOfShift } from "@/lib/api/pricing";
import { adaptAddress } from "@/lib/api/adapters";
import type { ApiSavedAddress, ProviderAvailability } from "@/lib/api/types";
import { DURATION_PRESETS } from "@/lib/booking-data";
import { formatAddress } from "@/lib/dashboard-data";
import { matchGstStateName } from "@/lib/gst-states";

export default function ScheduleStep() {
  const { draft, update } = useBooking();
  const router = useRouter();
  const [touched, setTouched] = useState(false);

  // The client's saved addresses, so the common case is one tap.
  const { data: addressData } = useApiQuery<{ addresses: ApiSavedAddress[] }>(
    "client/saved-addresses",
  );
  const addresses = (addressData?.addresses ?? []).map(adaptAddress);

  /**
   * The days this provider has already taken off.
   *
   * Without this the date field happily accepts a day the provider is away —
   * the request goes in, sits at `pending`, and is rejected a day later. The
   * server does not block the date at creation, so this is the only place the
   * client finds out early.
   */
  const { data: availability } = useApiQuery<ProviderAvailability>(
    draft.providerId ? `client/providers/${draft.providerId}/availability` : null,
  );
  const blocked = availability?.blockedDates ?? [];
  // Compared as plain "YYYY-MM-DD" strings, never parsed — see the type note.
  const blockedOn = blocked.find((d) => d.date === draft.date);
  const workingHours = availability?.workingHours;

  // Priced by the server against this provider's own rates.
  const { data: price, loading: priceLoading, error: priceError } = usePricePreview(draft);
  const end = endOfShift(draft.date, draft.startTime, draft.hours);
  const priceMessage = !draft.deployment.stateName
    ? "Go back to Service and pick the deployment state to see the price."
    : priceError;

  // Can't book in the past.
  const today = new Date().toISOString().slice(0, 10);
  const errors = {
    date: !draft.date
      ? "Pick a date."
      : draft.date < today
        ? "Date is in the past."
        : blockedOn
          ? `The provider is unavailable on this date${blockedOn.reason ? ` (${blockedOn.reason})` : ""}. Pick another day.`
          : "",
    startTime: !draft.startTime ? "Pick a start time." : "",
    hours:
      draft.providerMinimumHours && draft.hours < draft.providerMinimumHours
        ? `This provider's shortest shift is ${draft.providerMinimumHours} hours.`
        : "",
    address: !draft.address.trim() ? "Service address is required." : "",
    pincode: draft.deployment.pincode && !/^\d{6}$/.test(draft.deployment.pincode)
      ? "Pincode is six digits."
      : "",
  };
  const valid =
    !errors.date &&
    !errors.startTime &&
    !errors.address &&
    !errors.hours &&
    !errors.pincode;

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
                {blocked.length > 0 && !blockedOn ? (
                  <p className="mt-1.5 text-label text-fg-faint">
                    Unavailable:{" "}
                    {blocked
                      .slice(0, 4)
                      .map((d) => d.date)
                      .join(", ")}
                    {blocked.length > 4 ? ` +${blocked.length - 4} more` : ""}
                  </p>
                ) : null}
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
                {workingHours?.startTime ? (
                  <p className="mt-1.5 text-label text-fg-faint">
                    Usually works {workingHours.startTime}–{workingHours.endTime}. Outside
                    that is still allowed, but likelier to be declined.
                  </p>
                ) : null}
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
                    "rounded-sm border px-5 py-2.5 text-body font-semibold transition-colors",
                    draft.hours === h
                      ? "border-brand bg-panel-raised text-brand"
                      : "border-hairline text-fg-mid hover:border-edge",
                  ].join(" ")}
                >
                  {h}h
                </button>
              ))}
              <label className="flex items-center gap-2 rounded-full border border-hairline px-4 py-2.5">
                <span className="text-body-sm text-fg-faint">Custom</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={draft.hours}
                  onChange={(e) =>
                    update({ hours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })
                  }
                  aria-label="Custom duration in hours"
                  className="w-14 bg-transparent text-body font-semibold text-fg outline-none"
                />
              </label>
            </div>
            {errors.hours ? (
              <p role="alert" className="mt-2 text-body-sm text-fault">
                {errors.hours}
              </p>
            ) : draft.providerMinimumHours ? (
              <p className="mt-2 text-label text-fg-faint">
                Minimum {draft.providerMinimumHours}h with this provider.
              </p>
            ) : null}
          </section>

          <section>
            <SectionLabel>Service address</SectionLabel>
            {addresses.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      update({
                        address: formatAddress(a) || a.label,
                        city: a.city ?? draft.city,
                        deployment: {
                          addressLine: a.street ?? a.label,
                          city: a.city ?? draft.city ?? "",
                          stateName: matchGstStateName(a.state),
                          pincode: a.pincode ?? "",
                        },
                      })
                    }
                    className="flex items-center gap-2 rounded-sm border border-hairline px-4 py-2 text-body-sm text-fg-mid transition-colors hover:border-edge"
                  >
                    <span className="text-fg-faint">
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
                onChange={(e) =>
                  update({
                    address: e.target.value,
                    deployment: { ...draft.deployment, addressLine: e.target.value },
                  })
                }
                placeholder="Building, street, area"
                className={inputCls}
              />
            </Field>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="deploy-city" label="City">
                <input
                  id="deploy-city"
                  value={draft.deployment.city || draft.city || ""}
                  onChange={(e) =>
                    update({
                      deployment: { ...draft.deployment, city: e.target.value },
                    })
                  }
                  className={inputCls}
                />
              </Field>
              <Field id="pincode" label="Pincode" error={touched ? errors.pincode : ""}>
                <input
                  id="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={draft.deployment.pincode}
                  onChange={(e) =>
                    update({
                      deployment: { ...draft.deployment, pincode: e.target.value.replace(/\D/g, "") },
                    })
                  }
                  className={inputCls}
                />
              </Field>
            </div>
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
                    "rounded-sm border px-5 py-2.5 text-body font-semibold transition-colors",
                    draft.vehicleOption === v.id
                      ? "border-brand bg-panel-raised text-brand"
                      : "border-hairline text-fg-mid hover:border-edge",
                  ].join(" ")}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-body-sm text-fg-faint">
              Adds the provider&apos;s vehicle charge to the total. Only offered by
              providers who run one.
            </p>
          </section>

          {/* The repeat control that used to live here collected a pattern and
              then threw it away — POST /bookings creates exactly one booking
              and has no recurrence field. A series is a separate object created
              via /recurring, so it is offered from a real booking instead. */}
          <section>
            <SectionLabel>Repeating this booking</SectionLabel>
            <p className="text-body-sm leading-relaxed text-fg-faint">
              Book this once first. Once it exists you can turn it into a weekly,
              fortnightly or monthly schedule from the booking itself — the provider and
              times carry over.
            </p>
          </section>

        </div>

        {/* Live price — from the server, never computed here */}
        <aside className="h-fit rounded-lg border border-hairline bg-panel p-5 lg:sticky lg:top-[130px]">
          <h2 className="mb-4 font-sans text-body font-semibold text-fg">
            Price Breakdown
          </h2>
          <PriceSummary price={price} loading={priceLoading} error={priceMessage} />
          {end ? (
            <p className="mt-3 text-label text-fg-faint">
              Ends {end.endDate === draft.date ? "" : `${end.endDate} at `}
              {end.endTime}
            </p>
          ) : null}
          <p className="mt-3 text-label leading-relaxed text-fg-faint">
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
  "w-full rounded-lg border border-hairline bg-panel-raised px-4 py-3 text-body text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-edge [color-scheme:dark]";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
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
      <label htmlFor={id} className="mb-2 block text-body-sm font-medium text-fg-mid">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-body-sm text-fault">
          {error}
        </p>
      ) : null}
    </div>
  );
}

