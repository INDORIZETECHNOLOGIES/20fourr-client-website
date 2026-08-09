"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { MailIcon } from "@/components/icons";
import { requestPasswordReset } from "@/lib/auth";
import { emailError } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = emailError(email);
    setError(found);
    if (found) return;

    setSubmitting(true);
    await requestPasswordReset(email.trim());
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <Notice>
          If an account exists for {email.trim()}, a reset link is on its way. The link
          expires in 30 minutes.
        </Notice>
        <Link
          href="/login"
          className="text-center text-[15px] font-bold text-gold hover:underline"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="w-full rounded-card border border-border-soft bg-surface px-6 pb-8 pt-7 sm:px-9"
    >
      <Field
        id="reset-email"
        label="EMAIL ADDRESS"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="your@email.com"
        icon={<MailIcon />}
        value={email}
        error={error}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(undefined);
        }}
      />

      <Button
        type="submit"
        loading={submitting}
        loadingLabel="Sending link…"
        className="mt-6"
      >
        Send Reset Link
      </Button>
    </form>
  );
}
