"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
import { Notice } from "@/components/ui/Notice";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { OtpInput } from "@/components/ui/OtpInput";
import { useOtp } from "@/hooks/useOtp";
import { useCountdown } from "@/hooks/useCountdown";
import { authApi } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { RESEND_SECONDS } from "@/lib/auth";
import { confirmPasswordError, passwordError } from "@/lib/validation";

/**
 * Change password — two steps, because that is what the API does.
 *
 * This screen used to ask for the current password and fake an 800ms save.
 * There is no endpoint that accepts a current password: the API emails a
 * 6-digit code and the change carries that code. So the current-password field
 * is gone — it could never have been checked, and asking for a credential the
 * server never sees is worse than not asking.
 */
export function ChangePasswordForm() {
  const [stage, setStage] = useState<"request" | "verify" | "done">("request");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const otp = useOtp();
  const { seconds, expired, restart } = useCountdown(RESEND_SECONDS);

  async function sendCode() {
    setBusy(true);
    setFormError(null);
    try {
      await authApi("change-password", { method: "POST" });
      setStage("verify");
      restart();
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = {
      next: passwordError(next),
      confirm: confirmPasswordError(confirm, next),
      code: otp.code.length === 6 ? undefined : "Enter all 6 digits of the code.",
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setBusy(true);
    try {
      await authApi("change-password", {
        method: "PUT",
        body: { otp: otp.code, newPassword: next, confirmPassword: confirm },
      });
      setStage("done");
    } catch (cause) {
      if (isApiError(cause) && cause.fields) {
        const mapped: Record<string, string | undefined> = {};
        for (const [key, message] of Object.entries(cause.fields)) {
          mapped[key === "newPassword" ? "next" : key === "otp" ? "code" : key] = message;
        }
        setErrors((prev) => ({ ...prev, ...mapped }));
        if (Object.keys(mapped).length === 0) setFormError(cause.message);
      } else {
        setFormError(errorMessage(cause));
      }
      setBusy(false);
    }
  }

  if (stage === "done") {
    return (
      <Card className="p-6">
        <Notice>
          Password changed. Every session has been signed out — including this one — so
          you&apos;ll need to sign in again here and on your other devices.
        </Notice>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-sm bg-brand text-brand-ink px-7 py-2.5 text-body font-semibold"
        >
          Sign in again
        </Link>
      </Card>
    );
  }

  if (stage === "request") {
    return (
      <Card className="p-6">
        <p className="text-body leading-relaxed text-fg-mid">
          To change your password we&apos;ll email a 6-digit code to your registered
          address. You&apos;ll enter it along with your new password.
        </p>
        <p className="mt-2 text-body-sm leading-relaxed text-fg-faint">
          Changing your password signs you out everywhere, including this browser.
        </p>

        {formError ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-fault bg-transparent px-4 py-3 text-body text-fault"
          >
            {formError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={sendCode}
          disabled={busy}
          className="mt-5 rounded-sm bg-brand text-brand-ink px-7 py-3 text-body font-semibold transition-opacity   disabled:opacity-60"
        >
          {busy ? "Sending…" : "Email me a code"}
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div>
          <p className="mb-3 text-body-sm font-medium text-fg-mid">
            Enter the 6-digit code we emailed you
          </p>
          <OtpInput
            otp={otp}
            size="md"
            invalid={Boolean(errors.code)}
            disabled={busy}
            describedBy={errors.code ? "code-error" : undefined}
          />
          {errors.code ? (
            <p id="code-error" role="alert" className="mt-2 text-body-sm text-fault">
              {errors.code}
            </p>
          ) : null}
          <button
            type="button"
            onClick={sendCode}
            disabled={!expired || busy}
            className="mt-3 text-body-sm font-medium text-fg disabled:text-fg-faint"
          >
            <span aria-live="polite">
              {expired ? "Resend code" : `Resend in ${seconds}s`}
            </span>
          </button>
        </div>

        <PwField
          id="new-password"
          label="New password"
          value={next}
          error={errors.next}
          autoComplete="new-password"
          onChange={(v) => {
            setNext(v);
            setErrors((e) => ({ ...e, next: undefined }));
          }}
        />

        <PasswordStrength value={next} />

        <PwField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          error={errors.confirm}
          autoComplete="new-password"
          onChange={(v) => {
            setConfirm(v);
            setErrors((e) => ({ ...e, confirm: undefined }));
          }}
        />

        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-fault bg-transparent px-4 py-3 text-body text-fault"
          >
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 self-start rounded-sm bg-brand text-brand-ink px-7 py-3 text-body font-semibold transition-opacity   disabled:opacity-60"
        >
          {busy ? "Updating…" : "Update Password"}
        </button>
      </form>
    </Card>
  );
}

function PwField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-body-sm font-medium text-fg-mid">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full rounded-lg border bg-panel-raised px-4 py-3 text-body text-fg outline-none transition-colors",
          error ? "border-fault" : "border-hairline focus:border-edge",
        ].join(" ")}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-body-sm text-fault">
          {error}
        </p>
      ) : null}
    </div>
  );
}
