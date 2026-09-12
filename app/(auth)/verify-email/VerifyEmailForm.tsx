"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Toast } from "@/components/ui/Toast";
import { BackButton } from "@/components/ui/BackButton";
import { ClockIcon, MailCheckIcon } from "@/components/icons";
import { useOtp } from "@/hooks/useOtp";
import { useCountdown } from "@/hooks/useCountdown";
import { AuthError, RESEND_SECONDS, fetchSession, sendOtp, verifyOtp } from "@/lib/auth";
import { clearPendingSignup, maskEmail, readPendingSignup } from "@/lib/session";

export function VerifyEmailForm() {
  const router = useRouter();
  const otp = useOtp();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  // The design pins this toast permanently on. Here it fires on arrival, since
  // that is the moment the code was actually sent, then dismisses itself.
  const [toast, setToast] = useState<string | null>(
    "Verification code sent! Check your email.",
  );

  const { seconds, expired, restart } = useCountdown(RESEND_SECONDS);

  // Prefer the address on the account; the signup draft only exists in the tab
  // that created it. See VerifyPhoneForm for the same fallback.
  useEffect(() => {
    let active = true;
    const pending = readPendingSignup();
    if (pending) setEmail(maskEmail(pending.email));

    void fetchSession().then((user) => {
      if (active && user?.email) setEmail(maskEmail(user.email));
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp("email", otp.code);
      clearPendingSignup();
      // Both identifiers are verified now, so the API will serve feature routes.
      // A full navigation rather than a push: the dashboard's SessionProvider
      // must re-read /auth/me or it keeps the stale unverified user and bounces
      // straight back here.
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Verification failed. Try again.");
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      await sendOtp("email");
      otp.reset();
      restart();
      setToast("Verification code sent! Check your email.");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Couldn't send a new code.");
    } finally {
      setResending(false);
    }
  }

  return (
    // Padding on the outer wrapper, max-width on the inner one — see VerifyPhone.
    <div className="flex min-h-screen w-full justify-center px-4 py-14 sm:px-6">
      <div className="flex w-full max-w-[620px] flex-col items-center">
      {/* <BackButton
        href="/verify-phone"
        label="Back to phone verification"
        variant="bare"
        className="mb-7 self-start"
      /> */}

      <div className="mt-2 flex h-[132px] w-[132px] items-center justify-center rounded-full border border-edge bg-panel-raised text-fg">
        <MailCheckIcon size={52} />
      </div>

      <h1 className="text-h2 mt-7 text-center text-fg">Verify your email</h1>
      <p className="mt-4 max-w-[520px] text-center text-body leading-relaxed text-fg-mid">
        We sent a 6-digit code to{" "}
        {email ? (
          <span className="font-semibold text-fg-mid">{email}</span>
        ) : (
          "your email address"
        )}
        . Enter it below to confirm your account.
      </p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (otp.complete) void handleSubmit();
        }}
        className="flex w-full flex-col items-center"
      >
        <div className="mt-11 w-full">
          <OtpInput
            otp={otp}
            size="lg"
            invalid={Boolean(error)}
            disabled={submitting}
            describedBy={error ? "email-otp-error" : undefined}
          />
        </div>

        {error ? (
          <p
            id="email-otp-error"
            role="alert"
            className="mt-5 text-center text-body-sm font-medium text-fault"
          >
            {error}
          </p>
        ) : null}

        {/* The design has no resend on this screen, only on VerifyPhone.
            Added for parity — a code that can expire needs a way to reissue. */}
        <button
          type="button"
          onClick={handleResend}
          disabled={!expired || resending}
          className={[
            "mt-8 flex items-center gap-2.5 rounded-lg border border-edge bg-panel-raised px-7 py-3.5",
            "text-h3 font-medium text-fg transition-opacity",
            expired && !resending
              ? "cursor-pointer hover:opacity-80"
              : "cursor-not-allowed opacity-60",
          ].join(" ")}
        >
          <ClockIcon />
          <span aria-live="polite">
            {resending ? "Sending…" : expired ? "Resend code" : `Resend in ${seconds}s`}
          </span>
        </button>

        <div className="mt-10 w-full">
          <Notice>
            Check your spam or junk folder if you don&apos;t see it. The code expires in
            10 minutes.
          </Notice>
        </div>

        <Button
          type="submit"
          disabled={!otp.complete}
          loading={submitting}
          loadingLabel="Verifying…"
          size="lg"
          className="mt-14 w-full sm:w-[52%]"
        >
          Verify Email
        </Button>
      </form>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
