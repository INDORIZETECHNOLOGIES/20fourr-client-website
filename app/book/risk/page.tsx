"use client";

import { ConsentGate, useGate } from "../ConsentGate";

export default function RiskStep() {
  const accept = useGate("/book/safety");

  return (
    <ConsentGate
      title="Risk Acknowledgement"
      subtitle="Security work carries inherent risk. Please acknowledge the following."
      tone="danger"
      confirmLabel="I Acknowledge"
      acknowledgement="I have read and understood the risks described above, and I accept them for this booking."
      onAccept={() => accept({ riskAccepted: true })}
      points={[
        {
          heading: "Security personnel are not law enforcement",
          body: "Providers have no powers of arrest, search or seizure. In an emergency, contact the police on 100 or 112 first.",
        },
        {
          heading: "Deterrence, not a guarantee",
          body: "A guard reduces risk but cannot guarantee prevention of theft, injury, damage or loss at the premises.",
        },
        {
          heading: "Armed services carry additional risk",
          body: "Where an armed provider is booked, weapons are carried under the provider's own licence and are used only in lawful self-defence.",
        },
        {
          heading: "You remain responsible for the site",
          body: "Safe access, working lighting, and disclosure of known hazards at the location remain your responsibility as the client.",
        },
      ]}
    />
  );
}
