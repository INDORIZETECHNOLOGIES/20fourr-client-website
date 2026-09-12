"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpDots, OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Toast } from "@/components/ui/Toast";
import { BackButton } from "@/components/ui/BackButton";
import { PhoneMark } from "@/components/brand/Logo";
import { ClockIcon } from "@/components/icons";
import { useOtp } from "@/hooks/useOtp";
import { useCountdown } from "@/hooks/useCountdown";
import { AuthError, RESEND_SECONDS, fetchSession, sendOtp, verifyOtp } from "@/lib/auth";
import { lastFour, readPendingSignup } from "@/lib/session";

export function VerifyPhoneForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tail, setTail] = useState<string | null>(null);

  const { seconds, expired, restart } = useCountdown(RESEND_SECONDS);

  // The design hardcodes ****0560. Prefer the number on the account — someone
  // who signed in on an unverified account has no signup draft to read — and
  // fall back to the draft while the session request is in flight.
  useEffect(() => {
    let active = true;
    const pending = readPendingSignup();
    if (pending) setTail(lastFour(pending.phone));

    void fetchSession().then((user) => {
      if (active && user?.phone) setTail(lastFour(user.phone));
    });
    return () => {
      active = false;
    };
  }, []);

  const submit = useCallback(
    async (code: string) => {
      setError(null);
      setSubmitting(true);
      try {
        await verifyOtp("phone", code);
        // The email code is not sent automatically — /verify-email needs one
        // waiting when it opens, so request it here. A failure at this point
        // shouldn't block the step that already succeeded; the next screen has
        // its own Resend.
        await sendOtp("email").catch(() => {});
        router.push("/verify-email");
      } catch (err) {
        setError(
          err instanceof AuthError ? err.message : "Verification failed. Try again.",
        );
        setSubmitting(false);
      }
    },
    [router],
  );

  const otp = useOtp();

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      await sendOtp("phone");
      otp.reset();
      restart();
      setToast("New code sent! Check your messages.");
    } catch (err) {
      // Usually the OTP rate limiter. Say so rather than silently doing
      // nothing, which reads as a broken button.
      setError(err instanceof AuthError ? err.message : "Couldn't send a new code.");
    } finally {
      setResending(false);
    }
  }

  return (
    // Padding sits on the outer wrapper and max-width on the inner one, as in the
    // design. Putting both on one element would shrink the content box below 620.
    <div className="flex min-h-screen w-full justify-center px-4 py-14 sm:px-6">
      <div className="flex w-full max-w-[620px] flex-col items-start">
      {/* <BackButton href="/signup" label="Back to sign up" className="mb-10" /> */}

      {/* <div className="self-center lg:self-start">
        <PhoneMark />
      </div> */}

      <h1 className="text-h1 mt-7 text-fg">Verify Phone</h1>
      <p className="mt-4 text-body text-fg-mid">
        Enter the 6-digit code sent to
      </p>
      <p className="mt-1 text-mono-lg text-fg">
        {tail ? `****${tail}` : "your registered mobile number"}
      </p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (otp.complete) void submit(otp.code);
        }}
        className="mt-10 flex w-full flex-col items-center rounded-lg border border-hairline bg-panel px-4 pb-12 pt-11 sm:px-10"
      >
        <p className="text-body font-semibold tracking-[2px] text-fg-faint">
          ENTER 6-DIGIT CODE
        </p>

        <div className="mt-9 w-full">
          <OtpInput
            otp={otp}
            size="md"
            invalid={Boolean(error)}
            disabled={submitting}
            describedBy={error ? "otp-error" : undefined}
          />
        </div>

        <div className="mt-8">
          <OtpDots dots={otp.dots} />
        </div>

        {error ? (
          <p
            id="otp-error"
            role="alert"
            className="mt-6 text-center text-body-sm font-medium text-fault"
          >
            {error}
          </p>
        ) : null}

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

        <div className="mt-8 w-full">
          <Notice>
            Didn&apos;t receive the code? Check spam or request a new OTP above.
          </Notice>
        </div>

        <Button
          type="submit"
          disabled={!otp.complete}
          loading={submitting}
          loadingLabel="Verifying…"
          size="lg"
          className="mt-9 w-full sm:w-[56%]"
        >
          Verify OTP
        </Button>
      </form>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
