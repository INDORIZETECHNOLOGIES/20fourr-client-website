"use client";

import { ConsentGate, useGate } from "../ConsentGate";

export default function SafetyStep() {
  const accept = useGate("/book/absence");

  return (
    <ConsentGate
      title="Safety Disclaimer"
      subtitle="How duty works, and what's expected of both sides."
      confirmLabel="I Understand"
      acknowledgement="I understand how duty verification works and agree to the conduct expectations above."
      onAccept={() => accept({ safetyAccepted: true })}
      points={[
        {
          heading: "Duty starts and ends with an OTP",
          body: "You will receive a start OTP and an end OTP. Share the start OTP only when the provider arrives, and the end OTP only when duty is genuinely complete.",
        },
        {
          heading: "Never share an OTP in advance",
          body: "An OTP shared early lets duty be marked started when nobody is on site. 20fourr will never ask you for an OTP over a call.",
        },
        {
          heading: "Report absence immediately",
          body: "If the provider leaves the site during a shift, raise an absence alert from the booking. This is logged and affects provider standing.",
        },
        {
          heading: "Mutual respect",
          body: "Providers are entitled to breaks, drinking water and a lawful working environment. Abusive conduct may result in cancellation without refund.",
        },
      ]}
    />
  );
}
