"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { ConsentGate } from "../ConsentGate";
import { PriceSummary } from "../PriceSummary";
import { CouponField } from "../CouponField";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { usePricePreview, endOfShift } from "@/lib/api/pricing";
import type { ApiBooking } from "@/lib/api/types";
import { BOOKING_PURPOSES, isBookingPurpose } from "@/lib/booking-data";
import { CANCELLATION_SUMMARY, NOTHING_CHARGED_YET, REFUND_DESTINATION } from "@/lib/cancellation-policy";

export default function ConfirmStep() {
  const { draft, update } = useBooking();
  const router = useRouter();

  const purpose = BOOKING_PURPOSES.find((p) => p.id === draft.purposeId);
  const { data: price, loading, error } = usePricePreview(draft);
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
          ...(couponCode ? { couponCode } : {}),
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
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3.5">
            <p role="alert" className="text-[14px] leading-relaxed text-red-300">
              {submitError}
            </p>
            {providerRejected ? (
              <>
                <p className="mt-2 text-[13px] leading-relaxed text-red-300/80">
                  This provider can&apos;t take the booking. Your other details are kept —
                  choose a different provider and come straight back.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/book/provider")}
                  className="mt-3 rounded-full border border-app-gold px-5 py-2 text-[13.5px] font-bold text-app-gold transition-colors hover:bg-app-gold/10"
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
          body: `${NOTHING_CHARGED_YET} Once paid, what you get back depends on how close to the start time you cancel. ${CANCELLATION_SUMMARY} ${REFUND_DESTINATION}`,
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
      <div className="mt-6 rounded-xl border border-white/8 bg-black/25 p-5">
        <h2 className="mb-4 font-display text-[15px] font-bold text-slate-100">
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

        <div className="mt-4 border-t border-white/8 pt-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
            Service address
          </p>
          <p className="text-[14px] leading-relaxed text-slate-300">
            {draft.address || "—"}
          </p>
        </div>

        {draft.purposeNote.trim() ? (
          <div className="mt-4 border-t border-white/8 pt-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
              Notes for provider
            </p>
            <p className="text-[14px] leading-relaxed text-slate-300">
              {draft.purposeNote}
            </p>
          </div>
        ) : null}

        {/* The server's figure. This is the number the user is agreeing to, so
            it must be the same one the payment step charges. */}
        <div className="mt-4 border-t border-white/8 pt-4">
          <PriceSummary price={price} loading={loading} error={error} />
        </div>

        <div className="mt-4 border-t border-white/8 pt-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
            Coupon
          </p>
          <CouponField
            totalPaise={price?.totalAmount ?? 0}
            serviceCategory={draft.serviceCategory}
            platformRevenuePaise={price?.platformFee ?? 0}
            value={couponCode}
            onChange={(code) => setCouponCode(code)}
          />
        </div>
      </div>
    </ConsentGate>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
        {label}
      </dt>
      <dd className="mt-0.5 text-[14px] text-slate-200">{value}</dd>
    </div>
  );
}
