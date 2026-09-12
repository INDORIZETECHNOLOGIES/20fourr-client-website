"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { LockIcon, MailIcon, UserPlusIcon } from "@/components/icons";
import { AuthError, signIn } from "@/lib/auth";
import { emailError } from "@/lib/validation";

type Errors = Partial<Record<"email" | "password", string>>;

/** Only same-origin paths are honoured — an absolute URL here is an open redirect. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): Errors {
    return {
      email: emailError(email),
      password: password ? undefined : "Password is required.",
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const found = validate();
    setErrors(found);
    if (found.email || found.password) return;

    setSubmitting(true);
    try {
      const { user, requiresVerification } = await signIn({ email: email.trim(), password });

      // Credentials were fine but the account never finished signing up. The API
      // still hands back a session for exactly this case, so resume at whichever
      // step is outstanding instead of dropping them on a dashboard the server
      // will refuse to populate.
      if (requiresVerification) {
        router.push(!user.phoneVerified ? "/verify-phone" : "/verify-email");
      } else {
        router.push(safeNext(searchParams.get("next")));
      }
      // Deliberately not clearing `submitting` — the button stays busy through
      // the navigation rather than flicking back to "Sign In" mid-transition.
    } catch (error) {
      if (error instanceof AuthError && error.field) {
        setErrors({ [error.field]: error.message });
      } else {
        setFormError(
          error instanceof Error ? error.message : "Something went wrong. Try again.",
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="w-full rounded-lg border border-hairline bg-panel px-6 pb-8 pt-7 sm:px-9"
      >
        {formError ? (
          <div className="mb-5">
            <FormError message={formError} />
          </div>
        ) : null}

        <Field
          id="login-email"
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="your@email.com"
          icon={<MailIcon />}
          value={email}
          error={errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          className="mb-[22px]"
        />

        <PasswordField
          id="login-password"
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={<LockIcon />}
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
        />

        <div className="mt-4 text-right">
          <Link
            href="/forgot-password"
            className="text-body-sm font-semibold text-fg underline-offset-2 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" loading={submitting} loadingLabel="Signing in…" className="mt-6">
          Sign In
        </Button>
      </form>

      <div className="mt-8 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-hairline" />
        <span className="whitespace-nowrap text-body-sm text-fg-mid">
          New to 20fourr?
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <div className="mt-5 flex items-center justify-center gap-2.5 rounded-pill border border-hairline bg-panel px-4 py-4 text-center">
        <span className="shrink-0 text-fg">
          <UserPlusIcon />
        </span>
        <span className="text-body text-fg-mid">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-fg underline-offset-2 hover:underline">
            Sign Up
          </Link>
        </span>
      </div>
    </>
  );
}
