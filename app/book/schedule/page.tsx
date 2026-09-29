"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { StepFooter, StepHeading } from "../BookingShell";
import { PriceSummary } from "../PriceSummary";
import { PinFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePricePreview } from "@/hooks/usePricePreview";
import { daysInRange, endOfShift, isContractPath, vehicleDailyRates } from "@/lib/api/pricing";
import { useBillingFlags } from "@/hooks/useBillingFlags";
import { adaptAddress } from "@/lib/api/adapters";
import type { ApiClientProfile, ApiSavedAddress, ProviderAvailability, ProviderProfileResponse } from "@/lib/api/types";
import { DURATION_PRESETS } from "@/lib/booking-data";
import { formatAddress } from "@/lib/dashboard-data";
import { formatPaiseRounded } from "@/lib/money";
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
  // Compared as plain "YYYY-MM-DD" strings, never parsed — see the type note. With "For
  // business" on, every day of the range has to be free, not just the first.
  const rangeEnd = draft.forBusiness && draft.endDate ? draft.endDate : draft.date;
  const blockedOn = blocked.find((d) => d.date >= draft.date && d.date <= rangeEnd);
  const rangeDays = draft.forBusiness ? daysInRange(draft.date, draft.endDate) : 1;

  // Only to offer the GSTIN link; never blocks the step.
  const { data: profileData } = useApiQuery<{ profile: ApiClientProfile }>(
    draft.forBusiness ? "client/profile" : null,
  );
  const isRegisteredBusiness = profileData?.profile?.clientType === "registered_business";
  const individualProvider = draft.providerKind === "individual";
  const workingHours = availability?.workingHours;

  // Which vehicle options this provider actually charges for, here. The same request the provider
  // step made for its detail panel.
  const { data: providerData } = useApiQuery<ProviderProfileResponse>(
    draft.providerId ? `client/providers/${draft.providerId}` : null,
  );
  const vehicleRates = vehicleDailyRates(
    providerData?.provider,
    draft.serviceCategory,
    draft.deployment.city || draft.city || "",
  );

  // Priced by the server against this provider's own rates.
  const { data: price, loading: priceLoading, error: priceError } = usePricePreview(draft);
  // Backend spec 0013 rule 7: a booking longer than one payment can cover becomes a contract
  // (spec 0003 B), which goes on to a contract review instead of a booking. Contracts carry no
  // vehicle (0014 build decision 13).
  const { contractsEnabled } = useBillingFlags();
  const contractPath = isContractPath(price);
  const needsContract = contractPath && !contractsEnabled;
  const vehicleOffered = (id: VehicleOption) =>
    id === "none" || (!contractPath && (!providerData || vehicleRates[id] !== null));
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
          ? `The provider is unavailable on ${draft.forBusiness ? blockedOn.date : "this date"}${blockedOn.reason ? ` (${blockedOn.reason})` : ""}. Pick ${draft.forBusiness ? "other dates" : "another day"}.`
          : "",
    endDate: !draft.forBusiness
      ? ""
      : !draft.endDate
        ? "Pick the last day."
        : rangeDays === null
          ? "The last day is before the first."
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
  // The server has the last word on a vehicle: it charges ₹0 for one it doesn't price, and says so
  // in the quote. Never let a booking go through that looks like it includes a vehicle and doesn't.
  const vehicleError =
    draft.vehicleOption === "none"
      ? ""
      : contractPath
        ? "A contract doesn't include a vehicle. Choose No vehicle."
        : !vehicleOffered(draft.vehicleOption) ||
          (price?.engine === "v6" && price.quote.vehicleChargesPaise === 0)
        ? `This provider doesn't offer ${draft.vehicleOption === "vehicle" ? "a vehicle" : "a vehicle with driver"} ${draft.deployment.city || draft.city ? `in ${draft.deployment.city || draft.city}` : "here"}. Choose another option.`
        : "";
  const valid =
    !needsContract &&
    !vehicleError &&
    !errors.endDate &&
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
            <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-hairline bg-panel-raised px-4 py-3">
              <input
                type="checkbox"
                checked={draft.forBusiness}
                onChange={(e) =>
                  update({ forBusiness: e.target.checked, ...(e.target.checked ? {} : { endDate: "", headcount: 1 }) })
                }
                className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
              />
              <span>
                <span className="block text-body font-medium text-fg">For business</span>
                <span className="block text-body-sm text-fg-mid">
                  Book a team, or the same shift for several days. This doesn&apos;t change the price; the dates
                  and number of people do.
                </span>
              </span>
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="date" label={draft.forBusiness ? "First day" : "Start date"} error={touched ? errors.date : ""}>
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
              {draft.forBusiness ? (
                <Field id="end-date" label="Last day" error={touched ? errors.endDate : ""}>
                  <input
                    id="end-date"
                    type="date"
                    min={draft.date || today}
                    value={draft.endDate}
                    onChange={(e) => update({ endDate: e.target.value })}
                    className={inputCls}
                  />
                  {rangeDays ? (
                    <p className="mt-1.5 text-label text-fg-faint">
                      {rangeDays} {rangeDays === 1 ? "day" : "days"}, the same shift each day.
                      {rangeDays >= 30 ? " A month or more can be priced from the provider's package." : ""}
                    </p>
                  ) : null}
                </Field>
              ) : null}
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

          {draft.forBusiness ? (
            <section>
              <SectionLabel>People</SectionLabel>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="One fewer person"
                  disabled={individualProvider || draft.headcount <= 1}
                  onClick={() => update({ headcount: Math.max(1, draft.headcount - 1) })}
                  className="h-11 w-11 rounded-sm border border-hairline text-h3 text-fg transition-colors hover:border-edge disabled:opacity-40"
                >
                  −
                </button>
                <output aria-live="polite" className="min-w-[3ch] text-center text-h3 text-fg">
                  {draft.headcount}
                </output>
                <button
                  type="button"
                  aria-label="One more person"
                  disabled={individualProvider || draft.headcount >= MAX_HEADCOUNT}
                  onClick={() => update({ headcount: Math.min(MAX_HEADCOUNT, draft.headcount + 1) })}
                  className="h-11 w-11 rounded-sm border border-hairline text-h3 text-fg transition-colors hover:border-edge disabled:opacity-40"
                >
                  +
                </button>
                <span className="text-body-sm text-fg-mid">each day</span>
              </div>
              <p className="mt-2.5 text-body-sm text-fg-faint">
                {individualProvider
                  ? "This provider works alone, so it's one person. For a team, go back and choose an agency."
                  : "The agency assigns the team once it accepts. Only agencies with enough people free on every day can accept."}
              </p>
            </section>
          ) : null}

          <section>
            <SectionLabel>{draft.forBusiness ? "Shift length, each day" : "Duration"}</SectionLabel>
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
              {VEHICLE_OPTIONS.map((v) => {
                const offered = vehicleOffered(v.id);
                const rate = v.id === "none" ? null : vehicleRates[v.id];
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!offered}
                    onClick={() => update({ vehicleOption: v.id })}
                    aria-pressed={draft.vehicleOption === v.id}
                    className={[
                      "flex flex-col items-start rounded-sm border px-5 py-2.5 text-left transition-colors disabled:cursor-not-allowed",
                      draft.vehicleOption === v.id
                        ? "border-brand bg-panel-raised text-brand"
                        : "border-hairline text-fg-mid hover:border-edge disabled:border-hairline disabled:text-fg-faint",
                    ].join(" ")}
                  >
                    <span className="text-body font-semibold">{v.label}</span>
                    {v.id !== "none" && providerData ? (
                      <span className="text-label font-normal text-fg-faint">
                        {offered && rate ? `+${formatPaiseRounded(rate)} a day` : "Not offered"}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {vehicleError ? (
              <p role="alert" className="mt-2.5 text-body-sm text-fault">
                {vehicleError}
              </p>
            ) : (
              <p className="mt-2.5 text-body-sm text-fg-faint">
                {contractPath
                  ? "A contract doesn't include a vehicle."
                  : vehicleRates.vehicle || vehicleRates.vehicleWithDriver
                  ? "One vehicle for the booking, charged per day on top of the service."
                  : providerData
                    ? "This provider doesn't offer a vehicle for this service."
                    : "Adds the provider's vehicle charge to the total, where they offer one."}
              </p>
            )}
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
          {needsContract ? (
            <p role="alert" className="mt-3 text-body-sm text-fault">
              A booking this long is billed month by month as a contract, which isn&apos;t available yet. Choose a
              shorter range for now.
            </p>
          ) : contractPath ? (
            <p className="mt-3 rounded-sm border border-hairline bg-panel-raised px-3 py-2.5 text-body-sm leading-relaxed text-fg-mid">
              <strong className="font-semibold text-fg">This is a contract.</strong> A booking this long is billed one
              month at a time. You&apos;ll see each month&apos;s amount before you send the request.
            </p>
          ) : null}
          {draft.forBusiness && profileData && !isRegisteredBusiness ? (
            <p className="mt-3 text-label leading-relaxed text-fg-faint">
              Want the GST invoice in your company&apos;s name?{" "}
              <a href="/dashboard/profile/edit" className="text-fg-mid underline underline-offset-2 hover:text-fg">
                Add your GSTIN
              </a>{" "}
              first. You can still book without it.
            </p>
          ) : null}
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

type VehicleOption = "none" | "vehicle" | "vehicleWithDriver";

const VEHICLE_OPTIONS: { id: VehicleOption; label: string }[] = [
  { id: "none", label: "No vehicle" },
  { id: "vehicle", label: "Vehicle" },
  { id: "vehicleWithDriver", label: "Vehicle with driver" },
];

/**
 * Upper bound for the stepper only. The platform's real limit is PlatformSettings.booking.maxHeadcount
 * (backend spec 0011, default 50), which isn't exposed to clients; the price preview refuses
 * anything above it with SC_1501, and that message is what the client sees.
 */
const MAX_HEADCOUNT = 50;

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

