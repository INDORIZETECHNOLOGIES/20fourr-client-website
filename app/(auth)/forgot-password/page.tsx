import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { BackButton } from "@/components/ui/BackButton";
import { TrustLine } from "@/components/brand/TrustLine";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a password reset link for your 20fourr account.",
};

/**
 * Not one of the four imported screens — the Login design links to
 * "Forgot Password?" but no such screen exists in the project. This is a minimal
 * stop built from the same components so the link is not a dead end.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[504px] flex-col justify-center px-6 py-14">
      <BackButton href="/login" label="Back to sign in" className="mb-10" />

      <h1 className="text-display-sm text-text">Reset Password</h1>
      <p className="mt-4 text-lg text-text-muted">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <TrustLine className="mt-10" />
    </div>
  );
}
