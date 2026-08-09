import type { Metadata } from "next";
import { VerifyPhoneForm } from "./VerifyPhoneForm";

export const metadata: Metadata = {
  title: "Verify phone",
  description: "Enter the 6-digit code sent to your mobile number.",
};

export default function VerifyPhonePage() {
  return <VerifyPhoneForm />;
}
