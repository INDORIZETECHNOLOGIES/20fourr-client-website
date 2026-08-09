"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CloseIcon,
  PencilIcon,
  PinFill,
  PlusIcon,
  TrashIcon,
} from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { adaptAddress } from "@/lib/api/adapters";
import type { ApiSavedAddress } from "@/lib/api/types";
import { MAX_ADDRESSES, formatAddress, type Address } from "@/lib/dashboard-data";

type Draft = Omit<Address, "id">;

const EMPTY: Draft = {
  label: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

type Errors = Partial<Record<keyof Draft, string>>;

export function AddressesClient() {
  const { data, loading, error, refetch } = useApiQuery<{ addresses: ApiSavedAddress[] }>(
    "client/saved-addresses",
  );

  /** null = closed; "new" = adding; an id = editing that address. */
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const addresses = (data?.addresses ?? []).map(adaptAddress);
  const atLimit = addresses.length >= MAX_ADDRESSES;
  const current =
    editing && editing !== "new" ? addresses.find((a) => a.id === editing) : undefined;

  const close = useCallback(() => setEditing(null), []);

  /**
   * Saves through the API and re-reads the list rather than patching state
   * locally. The server owns rules this component can't reproduce — the
   * ten-address cap, case-insensitive duplicate labels, and demoting the
   * previous default when a new one claims it.
   */
  async function save(draft: Draft) {
    setActionError(null);
    const body = {
      label: draft.label,
      street: draft.street || undefined,
      city: draft.city,
      state: draft.state,
      pincode: draft.pincode || undefined,
      isDefault: draft.isDefault,
    };

    if (editing === "new") {
      await api("client/saved-addresses", { method: "POST", body });
    } else {
      await api(`client/saved-addresses/${editing}`, { method: "PUT", body });
    }
    close();
    refetch();
  }

  async function remove(id: string) {
    setActionError(null);
    setBusyId(id);
    try {
      await api(`client/saved-addresses/${id}`, { method: "DELETE" });
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function makeDefault(id: string) {
    setActionError(null);
    setBusyId(id);
    try {
      await api(`client/saved-addresses/${id}/default`, { method: "PATCH" });
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/profile"
          aria-label="Back to profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-gold/12 text-app-gold transition-colors hover:bg-app-gold/20"
        >
          <ArrowLeftIcon size={18} />
        </Link>

        <h2 className="flex-1 font-display text-[22px] font-extrabold tracking-[-0.4px] text-slate-100">
          Saved Addresses
        </h2>

        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={atLimit || loading}
          aria-label="Add address"
          title={atLimit ? `Limit of ${MAX_ADDRESSES} addresses reached` : "Add address"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-app-gold transition-colors hover:bg-app-gold/12 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon size={20} />
        </button>
      </div>

      {actionError ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[118px] animate-pulse rounded-2xl border border-white/6 bg-app-card" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/8 px-6 py-10 text-center">
          <p className="text-[15px] text-red-300">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-full border border-app-gold px-6 py-2.5 text-[14px] font-bold text-app-gold"
          >
            Try again
          </button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-app-card px-6 py-14 text-center">
          <p className="text-[15px] text-slate-400">No addresses saved yet.</p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="mt-4 rounded-full bg-app-gold-gradient px-6 py-2.5 text-[14px] font-bold text-black"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={[
                "rounded-2xl px-5 pb-3 pt-4 transition-opacity",
                a.isDefault
                  ? "border border-app-gold/45 bg-app-gold/5"
                  : "border border-white/6 bg-app-card",
                busyId === a.id ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-gold/15 text-app-gold">
                  <PinFill size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[17px] font-bold text-slate-100">{a.label}</p>
                    {a.isDefault ? (
                      <span className="shrink-0 rounded-md bg-app-gold/20 px-2.5 py-1 text-[12px] font-bold text-app-gold">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-slate-500">
                    {formatAddress(a)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-white/8 pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(a.id)}
                  className="flex items-center gap-2 rounded px-1 py-1 text-[14.5px] font-semibold text-app-gold transition-opacity hover:opacity-80"
                >
                  <PencilIcon size={16} />
                  Edit
                </button>
                {!a.isDefault ? (
                  <button
                    type="button"
                    onClick={() => makeDefault(a.id)}
                    className="rounded px-1 py-1 text-[14.5px] font-semibold text-slate-300 transition-opacity hover:opacity-80"
                  >
                    Set as default
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="flex items-center gap-2 rounded px-1 py-1 text-[14.5px] font-semibold text-red-500 transition-opacity hover:opacity-80"
                >
                  <TrashIcon size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error ? (
        <p className="mt-5 text-center text-[13.5px] text-slate-600">
          {addresses.length}/{MAX_ADDRESSES} addresses saved
        </p>
      ) : null}

      {editing ? (
        <AddressDialog
          key={editing}
          initial={current ? { ...current } : EMPTY}
          isFirst={addresses.length === 0}
          title={editing === "new" ? "Add Address" : "Edit Address"}
          onCancel={close}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function AddressDialog({
  initial,
  isFirst,
  title,
  onCancel,
  onSave,
}: {
  initial: Draft;
  isFirst: boolean;
  title: string;
  onCancel: () => void;
  onSave: (d: Draft) => Promise<void>;
}) {
  // The very first address has to be the default — there is nothing else to be it.
  const [draft, setDraft] = useState<Draft>(
    isFirst ? { ...initial, isDefault: true } : initial,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    // Don't let the page behind scroll while the sheet is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit() {
    // Same rules the API's savedAddressValidator enforces, so the common
    // mistakes are caught before a round trip.
    const found: Errors = {
      label: !draft.label.trim()
        ? "Label is required."
        : draft.label.trim().length > 50
          ? "Label cannot exceed 50 characters."
          : undefined,
      city: draft.city.trim() ? undefined : "City is required.",
      state: draft.state.trim() ? undefined : "State is required.",
      pincode:
        !draft.pincode || /^\d{6}$/.test(draft.pincode)
          ? undefined
          : "Pincode must be 6 digits.",
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    setFormError(null);
    try {
      await onSave({
        ...draft,
        label: draft.label.trim(),
        street: draft.street.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
      });
    } catch (cause) {
      // Duplicate labels and the ten-address cap are only knowable server-side.
      setFormError(errorMessage(cause));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        onClick={onCancel}
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-3xl border border-white/8 bg-[#101a33] px-6 pb-7 pt-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3
            id={`${uid}-title`}
            className="font-display text-[22px] font-extrabold text-white"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/8"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {formError ? (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col gap-4">
          <DField
            id={`${uid}-label`}
            label="Label"
            required
            placeholder="e.g. Home, Office"
            value={draft.label}
            error={errors.label}
            onChange={(v) => set("label", v)}
          />
          <DField
            id={`${uid}-street`}
            label="Street / Area"
            placeholder="e.g. 12A, MG Road"
            value={draft.street}
            onChange={(v) => set("street", v)}
          />
          <DField
            id={`${uid}-city`}
            label="City"
            required
            placeholder="e.g. Bengaluru"
            value={draft.city}
            error={errors.city}
            onChange={(v) => set("city", v)}
          />
          <DField
            id={`${uid}-state`}
            label="State"
            required
            placeholder="e.g. Karnataka"
            value={draft.state}
            error={errors.state}
            onChange={(v) => set("state", v)}
          />
          <DField
            id={`${uid}-pincode`}
            label="Pincode"
            placeholder="560001"
            inputMode="numeric"
            value={draft.pincode}
            error={errors.pincode}
            onChange={(v) => set("pincode", v.replace(/\D/g, "").slice(0, 6))}
          />

          <label
            className={[
              "mt-1 flex items-center gap-3 text-[15px] text-slate-200",
              isFirst ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={draft.isDefault}
              disabled={isFirst}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="h-5 w-5 shrink-0 accent-app-gold"
            />
            Set as default address
            {isFirst ? (
              <span className="text-[13px] text-slate-500">(your only address)</span>
            ) : null}
          </label>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full border border-white/15 py-3.5 text-[16px] font-bold text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-full bg-app-gold-gradient py-3.5 text-[16px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  inputMode?: "numeric";
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[14px] font-semibold text-slate-300">
        {label} {required ? <span className="text-app-gold">*</span> : null}
      </label>
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full rounded-2xl border bg-white/4 px-4 py-3.5 text-[15px] text-slate-100 outline-none transition-colors placeholder:text-slate-600",
          error ? "border-red-500" : "border-white/10 focus:border-app-gold/60",
        ].join(" ")}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
