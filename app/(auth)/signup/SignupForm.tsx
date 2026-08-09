"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import {
  GiftIcon,
  LockCheckIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  SignInIcon,
  UserIcon,
} from "@/components/icons";
import { AuthError, signUp } from "@/lib/auth";
import { savePendingSignup } from "@/lib/session";
import {
  confirmPasswordError,
  emailError,
  normalizePhone,
  normalizeReferralCode,
  passwordError,
  phoneError,
  referralCodeError,
  signupNameError,
} from "@/lib/validation";

type FieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "referralCode";

type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName | "termsAccepted", string>>;

/**
 * A pair of fields side by side on desktop, stacked below `sm`. Pairing keeps the
 * card short enough to read without scrolling.
 */
function Row({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[22px] flex flex-col gap-[22px] sm:flex-row sm:gap-5">
      {children}
    </div>
  );
}

const EMPTY: Values = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  referralCode: "",
};

export function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): Errors {
    return {
      firstName: signupNameError(values.firstName, "First name"),
      lastName: signupNameError(values.lastName, "Last name"),
      email: emailError(values.email),
      phone: phoneError(values.phone),
      password: passwordError(values.password),
      confirmPassword: confirmPasswordError(values.confirmPassword, values.password),
      referralCode: referralCodeError(values.referralCode),
      termsAccepted: termsAccepted ? undefined : "Please accept the terms to continue.",
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSubmitting(true);
    try {
      await signUp({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone,
        password: values.password,
        confirmPassword: values.confirmPassword,
        referralCode: values.referralCode.trim() || undefined,
        termsAccepted,
      });

      // Carry identity to the verify screens so they can show the masked
      // address and number without a round trip.
      savePendingSignup({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone,
      });

      // No sendOtp here: /auth/register dispatches the phone OTP itself. Asking
      // for another would send a second SMS and spend one of the OTP rate
      // limiter's few attempts before the user has typed anything.
      router.push("/verify-phone");
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
        className="w-full rounded-card border border-border-soft bg-surface px-6 pb-9 pt-8 sm:px-9"
      >
        {formError ? (
          <div className="mb-5">
            <FormError message={formError} />
          </div>
        ) : null}

        <Row>
          <Field
            id="signup-first-name"
            label="FIRST NAME"
            name="firstName"
            autoComplete="given-name"
            placeholder="John"
            icon={<UserIcon />}
            dense
            className="flex-1"
            value={values.firstName}
            error={errors.firstName}
            onChange={(e) => set("firstName", e.target.value)}
          />
          <Field
            id="signup-last-name"
            label="LAST NAME"
            name="lastName"
            autoComplete="family-name"
            placeholder="Smith"
            icon={<UserIcon />}
            dense
            className="flex-1"
            value={values.lastName}
            error={errors.lastName}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </Row>

        <Row>
          <Field
            id="signup-email"
            label="EMAIL ADDRESS"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@email.com"
            icon={<MailIcon />}
            dense
            className="flex-1"
            value={values.email}
            error={errors.email}
            onChange={(e) => set("email", e.target.value)}
          />
          <Field
            id="signup-phone"
            label="PHONE NUMBER"
            type="tel"
            name="phone"
            autoComplete="tel-national"
            inputMode="numeric"
            placeholder="98765 43210"
            icon={<PhoneIcon />}
            dense
            className="flex-1"
            value={values.phone}
            error={errors.phone}
            onChange={(e) => set("phone", normalizePhone(e.target.value))}
          />
        </Row>

        <Row>
          <PasswordField
            id="signup-password"
            label="PASSWORD"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            icon={<LockIcon />}
            dense
            className="flex-1"
            value={values.password}
            error={errors.password}
            onChange={(e) => set("password", e.target.value)}
          />
          <PasswordField
            id="signup-confirm-password"
            label="CONFIRM PASSWORD"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            icon={<LockCheckIcon />}
            dense
            className="flex-1"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
          />
        </Row>

        <div className="mb-[22px]">
          <PasswordStrength value={values.password} />
        </div>

        <Field
          id="signup-referral"
          label="REFERRAL CODE (OPTIONAL)"
          name="referralCode"
          placeholder="e.g. SC2024"
          icon={<GiftIcon />}
          dense
          value={values.referralCode}
          error={errors.referralCode}
          onChange={(e) => set("referralCode", normalizeReferralCode(e.target.value))}
        />

        {/* Consent is recorded server-side with a timestamp, so this checkbox is
            the evidence of acceptance rather than decoration — it starts
            unticked and blocks submission. */}
        <div className="mt-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={termsAccepted}
              aria-invalid={errors.termsAccepted ? true : undefined}
              aria-describedby={errors.termsAccepted ? "signup-terms-error" : undefined}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (errors.termsAccepted) {
                  setErrors((prev) => ({ ...prev, termsAccepted: undefined }));
                }
              }}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-gold"
            />
            <span className="text-[14px] leading-relaxed text-text-secondary">
              I agree to the{" "}
              <Link href="/terms" className="font-semibold text-gold hover:underline">
                Terms of Service
              </Link>{" "}
              and consent to 20fourr processing my personal data as described there.
            </span>
          </label>
          {errors.termsAccepted ? (
            <p id="signup-terms-error" role="alert" className="mt-2 text-[13px] text-danger">
              {errors.termsAccepted}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          loading={submitting}
          loadingLabel="Creating account…"
          className="mt-7"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-7 flex items-center justify-center gap-2.5 text-center">
        <span className="shrink-0 text-gold">
          <SignInIcon />
        </span>
        <span className="text-[15px] text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-gold hover:underline">
            Sign In
          </Link>
        </span>
      </div>
    </>
  );
}
