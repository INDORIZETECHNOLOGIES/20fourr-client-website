import type { Metadata } from "next";
import { VerifyEmailForm } from "./VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Enter the 6-digit code sent to your email address.",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
