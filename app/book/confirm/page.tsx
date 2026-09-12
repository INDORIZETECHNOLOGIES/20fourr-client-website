"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { ConsentGate } from "../ConsentGate";
import { PriceSummary } from "../PriceSummary";
import { CouponField } from "../CouponField";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { usePricePreview } from "@/hooks/usePricePreview";
import { useV6Enabled } from "@/hooks/useV6Enabled";
import { endOfShift, quoteTotalPaise, quotePlatformFeePaise } from "@/lib/api/pricing";
import type { ApiBooking } from "@/lib/api/types";
import { BOOKING_PURPOSES, isBookingPurpose } from "@/lib/booking-data";
import { CANCELLATION_SUMMARY, NOTHING_CHARGED_YET, refundDestination } from "@/lib/cancellation-policy";

export default function ConfirmStep() {
  const { draft, update } = useBooking();
  const router = useRouter();

  const purpose = BOOKING_PURPOSES.find((p) => p.id === draft.purposeId);
  const { data: price, loading, error } = usePricePreview(draft);
  const v6Enabled = useV6Enabled();
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /**
   * True when the failure is about *this provider* rather than the request.
   *
   * Provider search returns anyone verified, available and not PSARA-blocked,
   * but booking creation applies stricter rules the search never checks: the
   * PSARA licence must still be valid on the service date (SC_610), gunman and
   * PSO need a current arms licence (SC_611), the provider must not be
   * suspended (SC_603) or already booked (SC_406). In practice a large share of
   * listed providers fail one of these. Retrying is pointless — the fix is to
   * pick someone else — so say that and offer the way back.
   */
  const [providerRejected, setProviderRejected] = useState(false);

  /**
   * Creates the booking. It lands as `pending` — nothing is charged here, and
   * no payment order can even be opened until the provider accepts.
   */
  async function createBooking() {
    const end = endOfShift(draft.date, draft.startTime, draft.hours);
    if (!draft.providerId || !draft.serviceCategory || !end) {
      setSubmitError("Some booking details are missing. Go back and complete them.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setProviderRejected(false);
    try {
      const { booking } = await api<{ booking: ApiBooking }>("bookings", {
        method: "POST",
        body: {
          providerId: draft.providerId,
          serviceCategory: draft.serviceCategory,
          startDate: draft.date,
          endDate: end.endDate,
          startTime: draft.startTime,
          endTime: end.endTime,
          vehicleOption: draft.vehicleOption,
          address: draft.address.trim() || undefined,
          deployment: {
            addressLine: (draft.deployment.addressLine || draft.address).trim(),
            city: (draft.deployment.city || draft.city || "").trim(),
            stateName: draft.deployment.stateName,
            pincode: draft.deployment.pincode || undefined,
            latitude: null,
            longitude: null,
          },
          // Only send a purpose the API's enum actually accepts. A draft saved
          // in sessionStorage before the purpose list was corrected would
          // otherwise still carry a dead id and fail the whole submission.
          ...(draft.purposeId && isBookingPurpose(draft.purposeId)
            ? { bookingPurpose: draft.purposeId }
            : {}),
          // The free text belongs to the purpose, not to general notes — the
          // API has a dedicated field for it (max 500 chars).
          bookingPurposeDetail: draft.purposeNote.trim().slice(0, 500) || undefined,
          // Applied and re-validated server-side while the booking is priced.
          ...(v6Enabled || !couponCode ? {} : { couponCode }),
          // All four are mandatory — the API returns SC_209 if any is missing.
          // They are sent from the draft, so each reflects a gate the user
          // actually passed rather than a hardcoded `true`.
          clientRiskAcknowledged: draft.riskAccepted,
          safetyDisclaimerAccepted: draft.safetyAccepted,
          providerAbsencePolicyAcknowledged: draft.absencePolicyAccepted,
          // Ticking the box on this screen is the confirmation waiver itself.
          bookingConfirmationWaiverAccepted: true,
        },
      });

      update({ waiverAccepted: true });
      // Navigate first, clear the draft on the success screen — dropping
      // furthestStep to 0 while still on a gated route lets the shell's guard
      // win the race and bounce back to step 1.
      router.push(`/book/success?id=${booking._id}`);
    } catch (cause) {
      const providerCodes = ["SC_610", "SC_611", "SC_603", "SC_406", "SC_412", "SC_601"];
      if (isApiError(cause) && providerCodes.includes(cause.code)) {
        setProviderRejected(true);
      }
      setSubmitError(errorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <ConsentGate
      title="Booking Confirmation"
      subtitle="Check the details, then confirm."
      confirmLabel={submitting ? "Sending request…" : "Confirm & Send Request"}
      confirmDisabled={submitting || loading || !price}
      error={
        submitError ? (
          <div className="rounded-lg border border-fault bg-transparent px-4 py-3.5">
            <p role="alert" className="text-body leading-relaxed text-fault">
              {submitError}
            </p>
            {providerRejected ? (
              <>
                <p className="mt-2 text-body-sm leading-relaxed text-fault/80">
                  This provider can&apos;t take the booking. Your other details are kept —
                  choose a different provider and come straight back.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/book/provider")}
                  className="mt-3 rounded-sm border border-edge px-5 py-2 text-body-sm font-medium text-fg transition-colors hover:bg-panel-raised"
                >
                  Choose another provider
                </button>
              </>
            ) : null}
          </div>
        ) : null
      }
      acknowledgement="I confirm this booking and accept the terms of service and cancellation policy."
      onAccept={createBooking}
      points={[
        {
          heading: "Cancellation refunds are tiered",
          body: `${NOTHING_CHARGED_YET} Once paid, what you get back depends on how close to the start time you cancel. ${CANCELLATION_SUMMARY} ${refundDestination(v6Enabled ? "v6" : "v1")}`,
        },
        {
          heading: "Nothing is charged yet",
          body: "This sends a request to the provider. You pay only once they accept — the booking will move to \u201cPay Now\u201d and you can settle it from Bookings. If nobody accepts, nothing is captured.",
        },
        {
          heading: "This booking is a contract",
          body: "Confirming creates a service agreement between you and the provider, with 20fourr acting as the platform.",
        },
      ]}
    >
      <div className="mt-6 rounded-lg border border-hairline bg-black/25 p-5">
        <h2 className="mb-4 font-sans text-body font-semibold text-fg">
          Booking Summary
        </h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Row label="Service" value={draft.serviceName ?? "—"} />
          <Row label="Provider" value={draft.providerName ?? "—"} />
          <Row label="Date" value={draft.date || "—"} />
          <Row label="Start time" value={draft.startTime || "—"} />
          <Row label="Duration" value={`${draft.hours} hours`} />
          <Row
            label="Vehicle"
            value={
              draft.vehicleOption === "none"
                ? "None"
                : draft.vehicleOption === "vehicle"
                  ? "Vehicle"
                  : "Vehicle with driver"
            }
          />
          <Row label="Purpose" value={purpose?.label ?? "—"} />
          <Row label="City" value={draft.city ?? "—"} />
        </dl>

        <div className="mt-4 border-t border-hairline pt-4">
          <p className="mb-1 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
            Service address
          </p>
          <p className="text-body leading-relaxed text-fg-mid">
            {draft.address || "—"}
          </p>
        </div>

        {draft.purposeNote.trim() ? (
          <div className="mt-4 border-t border-hairline pt-4">
            <p className="mb-1 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
              Notes for provider
            </p>
            <p className="text-body leading-relaxed text-fg-mid">
              {draft.purposeNote}
            </p>
          </div>
        ) : null}

        {/* The server's figure. This is the number the user is agreeing to, so
            it must be the same one the payment step charges. */}
        <div className="mt-4 border-t border-hairline pt-4">
          <PriceSummary price={price} loading={loading} error={error} />
        </div>

        {!v6Enabled ? (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="mb-2.5 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
            Coupon
          </p>
          <CouponField
            totalPaise={price ? quoteTotalPaise(price) : 0}
            serviceCategory={draft.serviceCategory}
            platformRevenuePaise={price ? quotePlatformFeePaise(price) : 0}
            value={couponCode}
            onChange={(code) => setCouponCode(code)}
          />
        </div>
        ) : null}
      </div>
    </ConsentGate>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
        {label}
      </dt>
      <dd className="mt-0.5 text-body text-fg">{value}</dd>
    </div>
  );
}
