"use client";

import { ConsentGate, useGate } from "../ConsentGate";

/**
 * The fourth compliance gate: what happens if the guard doesn't turn up.
 *
 * This existed on the server long before it existed here — `POST /bookings`
 * rejects any request without `providerAbsencePolicyAcknowledged`, alongside
 * the risk, safety and confirmation waivers (SRS §6.2.1 TC-BOOK-005). The
 * website had no gate for it, so every booking would have failed with SC_209.
 *
 * Like the others, it starts unticked on every visit and the button is inert
 * until the box is ticked. Do not merge it into the confirmation waiver: they
 * are separate consents and are recorded separately.
 */
export default function AbsenceStep() {
  const accept = useGate("/book/confirm");

  return (
    <ConsentGate
      title="Provider Absence Policy"
      subtitle="What happens if your guard doesn't arrive."
      confirmLabel="I Understand"
      acknowledgement="I have read and accept the provider absence policy, including the penalty and replacement terms."
      onAccept={() => accept({ absencePolicyAccepted: true })}
      points={[
        {
          heading: "Report an absence immediately",
          body: "If the provider has not arrived by the booking start time, raise an absence alert from the booking screen. The clock for penalties and replacement starts when you report it, not when you notice.",
        },
        {
          heading: "A replacement is attempted first",
          body: "20fourr will try to assign a replacement provider for the remaining duty period. You are not charged twice — the original provider's payout is adjusted.",
        },
        {
          heading: "The provider is penalised, not you",
          // "wallet credit" is the v1 destination and is wrong on v6, where the
          // refund goes back to the payment method. This is a consent gate the
          // client accepts, so it states the part that is true on both engines
          // and leaves the destination to the cancellation copy, which is
          // engine-aware (lib/cancellation-policy.ts refundDestination).
          body: "A confirmed absence carries a penalty against the provider and a refund to you, according to how much of the shift was lost.",
        },
        {
          heading: "False reports carry consequences",
          body: "Absence reports are checked against duty OTP and geofence records. Reporting an absence for a provider who was present may result in penalties on your own account.",
        },
      ]}
    />
  );
}
