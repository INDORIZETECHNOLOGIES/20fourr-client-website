"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/dashboard/primitives";
import { Notice } from "@/components/ui/Notice";
import { useSession } from "@/components/session/SessionProvider";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { adaptProfile } from "@/lib/api/adapters";
import type { ApiClientProfile } from "@/lib/api/types";
import { CATEGORY_OPTIONS, type ClientType, type PreferredCategory } from "@/lib/dashboard-data";
import {
  emailError,
  gstinError,
  nameError,
  normalizeGstin,
  normalizePhone,
  phoneError,
  requiredError,
} from "@/lib/validation";

type Values = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  clientType: ClientType;
  gstin: string;
  preferredServiceCategory: PreferredCategory;
  preferVehicle: boolean;
  preferVehicleWithDriver: boolean;
};

type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  clientType: "individual",
  gstin: "",
  preferredServiceCategory: null,
  preferVehicle: false,
  preferVehicleWithDriver: false,
};

export function EditProfileForm() {
  const router = useRouter();
  const { user, refresh: refreshSession } = useSession();
  // name/email/phone live on the User document, everything else on
  // ClientProfile — two sources for one form, as in the app.
  const { data: profileData, loading: profileLoading, error: profileError } =
    useApiQuery<{ profile: ApiClientProfile }>("client/profile");

  const [v, setV] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Fill in once, when both documents have arrived. Re-running after that would
  // overwrite whatever the user has typed.
  useEffect(() => {
    if (hydrated || !user || profileLoading) return;
    const view = adaptProfile(user, profileData?.profile ?? null);
    setV({
      firstName: view.firstName,
      lastName: view.lastName,
      email: view.email,
      phone: view.phone,
      city: view.city,
      address: view.address,
      clientType: view.clientType,
      gstin: view.gstin,
      preferredServiceCategory: view.preferredServiceCategory,
      preferVehicle: view.preferVehicle,
      preferVehicleWithDriver: view.preferVehicleWithDriver,
    });
    setHydrated(true);
  }, [hydrated, user, profileData, profileLoading]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    setSaved(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found: Errors = {
      firstName: nameError(v.firstName, "First name"),
      lastName: nameError(v.lastName, "Last name"),
      email: emailError(v.email),
      phone: phoneError(v.phone),
      city: requiredError(v.city, "City"),
      address: requiredError(v.address, "Address"),
      gstin: v.clientType === "registered_business" ? gstinError(v.gstin) : undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    try {
      await api("client/profile", {
        method: "PUT",
        body: {
          // The API rebuilds the single `name` from these, and writes name and
          // phone back to the User document.
          name: `${v.firstName.trim()} ${v.lastName.trim()}`.trim(),
          phone: v.phone,
          address: {
            // The API assigns this whole subdocument (`update.address =
            // req.body.address`), so anything omitted is erased. This form only
            // edits city and street, so state and pincode are carried through
            // verbatim — sending just the two fields would silently wipe the
            // rest of the user's address.
            ...(profileData?.profile?.address ?? {}),
            city: v.city.trim(),
            // `street`, not `fullAddress`: the ClientProfile address subschema
            // has no fullAddress field, so Mongoose silently drops it.
            street: v.address.trim(),
          },
          clientType: v.clientType,
          // An empty string clears the stored GSTIN; the API maps "" to null.
          gstin: v.clientType === "registered_business" ? v.gstin.trim().toUpperCase() : "",
          bookingPreferences: {
            preferredServiceCategory: v.preferredServiceCategory,
            preferVehicle: v.preferVehicle,
            preferVehicleWithDriver: v.preferVehicleWithDriver,
          },
        },
      });

      setSaved(true);
      // The name in the sidebar and profile hero comes from the session, so it
      // has to be re-read or it keeps showing the old one.
      await refreshSession();
      router.refresh();
    } catch (cause) {
      if (isApiError(cause) && cause.fields) {
        const mapped: Errors = {};
        for (const [key, message] of Object.entries(cause.fields)) {
          // The API namespaces nested fields as "address.city".
          const field = key.split(".").pop() as keyof Values;
          if (field in v) mapped[field] = message;
        }
        setErrors((prev) => ({ ...prev, ...mapped }));
        if (Object.keys(mapped).length === 0) setFormError(cause.message);
      } else {
        setFormError(errorMessage(cause));
      }
    } finally {
      setSaving(false);
    }
  }

  const isBusiness = v.clientType === "registered_business";

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4">
        {profileError ? (
          <p role="alert" className="rounded-lg border border-fault bg-transparent px-4 py-3 text-body text-fault">
            {profileError}
          </p>
        ) : null}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[190px] animate-pulse rounded-lg border border-hairline bg-panel" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {saved ? <Notice>Profile updated.</Notice> : null}
      {formError ? (
        <p role="alert" className="rounded-lg border border-fault bg-transparent px-4 py-3 text-body text-fault">
          {formError}
        </p>
      ) : null}

      {/* ── Personal ── */}
      <Section title="Personal Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="first-name"
            label="First Name"
            value={v.firstName}
            error={errors.firstName}
            maxLength={50}
            placeholder="Enter first name"
            onChange={(x) => set("firstName", x)}
          />
          <Field
            id="last-name"
            label="Last Name"
            value={v.lastName}
            error={errors.lastName}
            maxLength={50}
            placeholder="Enter last name"
            onChange={(x) => set("lastName", x)}
          />
          {/* Read-only: /client/profile writes name and phone back to the User
              document but has no path for email. Leaving it editable would mean
              a field that accepts a change, reports success, and silently keeps
              the old address — worse than not offering it. */}
          <Field
            id="email"
            label="Email"
            type="email"
            value={v.email}
            readOnly
            hint="Contact support to change the email on your account."
            onChange={() => {}}
          />
          <Field
            id="phone"
            label="Phone Number"
            type="tel"
            inputMode="numeric"
            value={v.phone}
            error={errors.phone}
            placeholder="10-digit phone number"
            onChange={(x) => set("phone", normalizePhone(x))}
          />
        </div>
        <p className="mt-3 text-body-sm text-fg-faint">
          Changing your phone number will require re-verification by OTP.
        </p>
      </Section>

      {/* ── Address ── */}
      <Section title="Address Information">
        <div className="flex flex-col gap-4">
          <Field
            id="city"
            label="City"
            value={v.city}
            error={errors.city}
            maxLength={100}
            placeholder="Enter city"
            onChange={(x) => set("city", x)}
          />
          <Field
            id="address"
            label="Address"
            value={v.address}
            error={errors.address}
            maxLength={500}
            rows={3}
            placeholder="Enter full address"
            onChange={(x) => set("address", x)}
            counter
          />
        </div>
      </Section>

      {/* ── Business & GST ── */}
      <Section title="Business & GST">
        <p className="mb-4 text-body-sm leading-relaxed text-fg-faint">
          Choose &ldquo;Registered Business&rdquo; only if you have a GSTIN. This
          determines GST treatment — reverse charge applies for registered
          businesses.
        </p>

        <div className="flex flex-wrap gap-2.5">
          {(
            [
              { id: "individual", label: "Individual" },
              { id: "registered_business", label: "Registered Business" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={v.clientType === opt.id}
              onClick={() => {
                // Switching back to Individual clears the GSTIN, as the app does —
                // otherwise a stale number would be submitted with the wrong type.
                setV((prev) => ({
                  ...prev,
                  clientType: opt.id,
                  gstin: opt.id === "individual" ? "" : prev.gstin,
                }));
                setErrors((e) => ({ ...e, gstin: undefined }));
                setSaved(false);
              }}
              className={[
                "rounded-sm border px-5 py-2.5 text-body font-semibold transition-colors",
                v.clientType === opt.id
                  ? "border-brand bg-panel-raised text-brand"
                  : "border-hairline text-fg-mid hover:border-edge",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isBusiness ? (
          <div className="mt-4">
            <Field
              id="gstin"
              label="GSTIN"
              value={v.gstin}
              error={errors.gstin}
              maxLength={15}
              placeholder="e.g. 27AAPFU0939F1ZV"
              onChange={(x) => set("gstin", normalizeGstin(x))}
              mono
            />
          </div>
        ) : null}
      </Section>

      {/* ── Booking preferences ── */}
      <Section title="Booking Preferences">
        <p className="mb-4 text-body-sm text-fg-faint">
          Set defaults to speed up future bookings.
        </p>

        <p className="mb-2.5 text-body-sm font-medium text-fg-mid">Preferred service</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              aria-pressed={v.preferredServiceCategory === opt.id}
              onClick={() => set("preferredServiceCategory", opt.id)}
              className={[
                "rounded-sm border px-4 py-2 text-body-sm font-semibold transition-colors",
                v.preferredServiceCategory === opt.id
                  ? "border-brand bg-panel-raised text-brand"
                  : "border-hairline text-fg-mid hover:border-edge",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-1">
          <Toggle
            label="Prefer a vehicle"
            checked={v.preferVehicle}
            onChange={(x) =>
              setV((prev) => ({
                ...prev,
                preferVehicle: x,
                // "with driver" implies a vehicle, so it can't outlive it.
                preferVehicleWithDriver: x ? prev.preferVehicleWithDriver : false,
              }))
            }
          />
          <Toggle
            label="Prefer vehicle with driver"
            checked={v.preferVehicleWithDriver}
            disabled={!v.preferVehicle}
            hint={!v.preferVehicle ? "Turn on “Prefer a vehicle” first" : undefined}
            onChange={(x) => set("preferVehicleWithDriver", x)}
          />
        </div>
      </Section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-brand text-brand-ink px-7 py-3 text-body font-semibold transition-opacity  disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <Link
          href="/dashboard/profile"
          className="rounded-sm border border-hairline px-7 py-3 text-body font-semibold text-fg-mid transition-colors hover:bg-panel-raised"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 font-sans text-body font-semibold text-fg">{title}</h3>
      {children}
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  rows,
  counter,
  mono,
  readOnly,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric";
  maxLength?: number;
  rows?: number;
  counter?: boolean;
  mono?: boolean;
  readOnly?: boolean;
  hint?: string;
}) {
  const cls = [
    "w-full rounded-lg border bg-panel-raised px-4 py-3 text-body text-fg outline-none transition-colors placeholder:text-fg-faint",
    mono ? "font-mono tracking-wider" : "",
    readOnly ? "cursor-not-allowed text-fg-mid" : "",
    error ? "border-fault" : "border-hairline focus:border-edge",
  ].join(" ");

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-body-sm font-medium text-fg-mid">
        {label}
      </label>
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}

      <div className="mt-1.5 flex justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-body-sm text-fault">
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-body-sm text-fg-faint">
            {hint}
          </p>
        ) : (
          <span />
        )}
        {counter && maxLength ? (
          <span className="shrink-0 text-label text-fg-faint">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4 border-b border-hairline py-3 last:border-b-0",
        disabled ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="text-body text-fg">{label}</p>
        {hint ? <p className="mt-0.5 text-label text-fg-faint">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          checked ? "bg-brand" : "bg-edge",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-panel transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
