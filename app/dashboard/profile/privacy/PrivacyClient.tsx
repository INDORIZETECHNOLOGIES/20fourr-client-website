"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
import { Notice } from "@/components/ui/Notice";
import { AlertCircleIcon, ShieldLockIcon } from "@/components/dashboard/icons";
import { useSession } from "@/components/session/SessionProvider";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";

/**
 * DPDP Act 2023 rights, wired to the API.
 *
 * Three of these are legally binding requests, not settings, so the interface
 * is deliberately blunt about consequences:
 *
 *  - **Withdrawal is one way.** `POST /account/consent-withdrawal` sets the
 *    chosen purposes to false and there is NO endpoint that sets them back —
 *    re-granting means contacting the DPO. Presenting these as toggles would
 *    imply a reversibility the API does not have, so they are checkboxes on an
 *    explicit "withdraw" action.
 *  - **Only optional purposes can be withdrawn.** kyc, booking and payments are
 *    refused by the API under DPDP §7(a) (contract performance), so they are
 *    shown as locked rather than offered and then rejected.
 *  - **Erasure suspends the account immediately** and deletes within 30 days.
 *    It is refused (409) while any booking is active or unpaid. It requires a
 *    typed confirmation here and signs the user out on success, because the
 *    account is suspended the moment it succeeds.
 *
 * Current consent state comes from the data export — the only endpoint that
 * returns `dpdpConsent`. That looked too heavy until it was measured: the whole
 * export is ~11KB. Reading it is far better than rendering checkboxes that
 * claim nothing about what is actually set.
 */

const WITHDRAWABLE = [
  {
    id: "marketing",
    label: "Marketing",
    body: "Offers, promotions and campaign emails. Service and safety messages are unaffected.",
  },
  {
    id: "analytics",
    label: "Analytics",
    body: "Usage measurement used to improve the product.",
  },
  {
    id: "profiling",
    label: "Profiling",
    body: "Building a preference profile to personalise provider recommendations.",
  },
];

const LOCKED = [
  { id: "kyc", label: "Identity & KYC" },
  { id: "booking", label: "Bookings" },
  { id: "payments", label: "Payments & tax records" },
];

type ConsentState = {
  purposes?: Record<string, boolean>;
  withdrawals?: { purpose: string; withdrawnAt?: string }[];
};

type ExportPayload = {
  consent?: { dpdpConsent?: ConsentState };
  erasureStatus?: { requested?: boolean; requestedAt?: string | null };
};

type Grievance = {
  grievanceOfficer?: { name?: string; email?: string; phone?: string; address?: string };
  dataProtectionOfficer?: { name?: string; email?: string; phone?: string };
};

export function PrivacyClient() {
  const { signOut } = useSession();
  const { data: contacts } = useApiQuery<Grievance>("client/grievance-officer");
  // ~11KB — cheap enough to read for the consent state and erasure flag.
  const { data: snapshot, refetch: refetchSnapshot } =
    useApiQuery<ExportPayload>("client/account/data-export");

  const granted = snapshot?.consent?.dpdpConsent?.purposes;
  const erasurePending = Boolean(snapshot?.erasureStatus?.requested);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [purposes, setPurposes] = useState<string[]>([]);
  const [erasureOpen, setErasureOpen] = useState(false);
  const [erasureConfirm, setErasureConfirm] = useState("");
  const [erasureReason, setErasureReason] = useState("");

  async function exportData() {
    setBusy("export");
    setError(null);
    setNotice(null);
    try {
      const payload = await api<Record<string, unknown>>("client/account/data-export");

      // The endpoint returns JSON, not a file. Portability under DPDP means a
      // machine-readable copy, so save it as one rather than rendering it.
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `20fourr-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setNotice("Your data export has been downloaded as a JSON file.");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function withdraw() {
    if (purposes.length === 0) return;
    setBusy("consent");
    setError(null);
    setNotice(null);
    try {
      await api("client/account/consent-withdrawal", {
        method: "POST",
        body: { purposes, reason: "Withdrawn by the user from the website." },
      });
      setNotice(
        `Consent withdrawn for ${purposes.join(", ")}. To grant it again you'll need to contact the Data Protection Officer.`,
      );
      setPurposes([]);
      refetchSnapshot();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function requestErasure() {
    setBusy("erasure");
    setError(null);
    try {
      await api("client/account/erasure-request", {
        method: "POST",
        body: { reason: erasureReason.trim() || undefined },
      });
      // The API suspends the account on success, so staying signed in would
      // mean every subsequent request fails. Leave deliberately.
      await signOut();
    } catch (cause) {
      // 409 while bookings are open is the common case and is recoverable —
      // say what to do about it rather than just echoing the message.
      if (isApiError(cause) && cause.status === 409) {
        setError(
          `${cause.message} You can cancel them from Bookings, then come back here.`,
        );
      } else {
        setError(errorMessage(cause));
      }
      setBusy(null);
    }
  }

  return (
    <>
      <div className="mb-5">
        <Notice>
          These rights are granted under India&apos;s Digital Personal Data Protection
          Act 2023. Requests are answered within 30 days. This copy has not been
          reviewed by counsel — do that before launch.
        </Notice>
      </div>

      {notice ? (
        <p className="mb-4 rounded-xl border border-green-500/35 bg-green-500/10 px-4 py-3 text-[14px] text-green-400">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] leading-relaxed text-red-300"
        >
          {error}
        </p>
      ) : null}

      {/* Access & portability */}
      <Card className="p-6">
        <Row
          icon={<ShieldLockIcon size={20} />}
          title="Access and portability"
          body="Download everything 20fourr holds about you — profile, bookings, payments, documents, wallet and ratings — as a machine-readable JSON file. Booking and payment history covers the last three years."
        />
        <button
          type="button"
          onClick={exportData}
          disabled={busy !== null}
          className="mt-4 rounded-full bg-app-gold-gradient px-6 py-2.5 text-[14px] font-bold text-black transition-transform hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60"
        >
          {busy === "export" ? "Preparing…" : "Download my data"}
        </button>
      </Card>

      {/* Correction */}
      <Card className="mt-4 p-6">
        <Row
          icon={<ShieldLockIcon size={20} />}
          title="Correct your data"
          body="Update inaccurate personal details yourself. Your email address can only be changed by support, and identity documents may need re-verification."
        />
        <Link
          href="/dashboard/profile/edit"
          className="mt-4 inline-block rounded-full border border-app-border px-6 py-2.5 text-[14px] font-semibold text-slate-300 transition-colors hover:bg-white/5"
        >
          Edit profile
        </Link>
      </Card>

      {/* Consent */}
      <Card className="mt-4 p-6">
        <Row
          icon={<ShieldLockIcon size={20} />}
          title="Withdraw consent"
          body="Choose which optional purposes to withdraw. This takes effect immediately and cannot be reversed from here — granting consent again requires contacting the Data Protection Officer."
        />

        <div className="mt-4 flex flex-col gap-2">
          {WITHDRAWABLE.map((p) => {
            // undefined while the snapshot loads — treat as still granted so a
            // slow request never hides a control the user does have.
            const active = granted ? granted[p.id] !== false : true;
            return (
              <label
                key={p.id}
                className={[
                  "flex items-start gap-3 rounded-xl border px-4 py-3",
                  active
                    ? "cursor-pointer border-app-border bg-white/3"
                    : "cursor-not-allowed border-white/6 bg-white/2 opacity-60",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  disabled={!active}
                  checked={purposes.includes(p.id)}
                  onChange={(e) =>
                    setPurposes((prev) =>
                      e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id),
                    )
                  }
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-app-gold"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14.5px] font-semibold text-slate-200">
                      {p.label}
                    </span>
                    {!active ? (
                      <span className="rounded-full bg-white/8 px-2.5 py-[3px] text-[11px] font-bold text-slate-400">
                        Already withdrawn
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-slate-500">
                    {p.body}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[1px] text-slate-600">
          Cannot be withdrawn while your account is open
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LOCKED.map((p) => (
            <span
              key={p.id}
              title="Required for contract performance — DPDP §7(a)"
              className="rounded-full border border-white/8 bg-white/3 px-3.5 py-1.5 text-[12.5px] text-slate-600"
            >
              {p.label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">
          These are necessary to perform the contract between you and 20fourr. To remove
          them, request erasure below.
        </p>

        <button
          type="button"
          onClick={withdraw}
          disabled={purposes.length === 0 || busy !== null}
          className={[
            "mt-4 rounded-full px-6 py-2.5 text-[14px] font-bold transition-colors",
            purposes.length > 0 && busy === null
              ? "bg-app-gold-gradient text-black"
              : "cursor-not-allowed bg-app-disabled text-slate-500",
          ].join(" ")}
        >
          {busy === "consent" ? "Withdrawing…" : "Withdraw selected consent"}
        </button>
      </Card>

      {/* Erasure */}
      <Card className="mt-4 border-red-500/30 p-6">
        <Row
          icon={<AlertCircleIcon size={20} />}
          tone="danger"
          title="Delete your account and data"
          body="Your account is suspended immediately and all personal data is permanently deleted within 30 days, as required by DPDP §12. Booking, invoice and tax records are retained where the law requires it. This cannot be undone."
        />

        {erasurePending ? (
          <p className="mt-4 rounded-xl border border-app-warning/40 bg-app-warning/10 px-4 py-3 text-[13.5px] leading-relaxed text-app-warning">
            An erasure request is already in progress. Contact the Data Protection
            Officer below if you need to withdraw it.
          </p>
        ) : !erasureOpen ? (
          <button
            type="button"
            onClick={() => setErasureOpen(true)}
            className="mt-4 rounded-full border border-red-500/40 px-6 py-2.5 text-[14px] font-bold text-red-400 transition-colors hover:bg-red-500/10"
          >
            Request erasure
          </button>
        ) : (
          <div className="mt-4 rounded-xl border border-red-500/35 bg-red-500/6 p-5">
            <p className="text-[14.5px] font-semibold text-red-300">
              This is permanent.
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[13px] leading-relaxed text-slate-400">
              <li>You&apos;ll be signed out and unable to sign back in.</li>
              <li>Any wallet balance is forfeited.</li>
              <li>It cannot be requested while a booking is active or unpaid.</li>
            </ul>

            <label
              htmlFor="erasure-reason"
              className="mt-4 block text-[12.5px] text-slate-500"
            >
              Reason (optional, helps us improve)
            </label>
            <textarea
              id="erasure-reason"
              rows={2}
              value={erasureReason}
              onChange={(e) => setErasureReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-app-border bg-white/4 px-3 py-2 text-[13.5px] text-slate-100 outline-none focus:border-app-gold/60"
            />

            <label
              htmlFor="erasure-confirm"
              className="mt-3 block text-[12.5px] text-slate-500"
            >
              Type <span className="font-mono font-bold text-red-300">DELETE</span> to
              confirm
            </label>
            <input
              id="erasure-confirm"
              value={erasureConfirm}
              onChange={(e) => setErasureConfirm(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-app-border bg-white/4 px-3 py-2 font-mono text-[14px] tracking-widest text-slate-100 outline-none focus:border-red-500/60"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={requestErasure}
                disabled={erasureConfirm !== "DELETE" || busy !== null}
                className={[
                  "rounded-full px-6 py-2.5 text-[14px] font-bold transition-colors",
                  erasureConfirm === "DELETE" && busy === null
                    ? "bg-red-500/90 text-white"
                    : "cursor-not-allowed bg-app-disabled text-slate-500",
                ].join(" ")}
              >
                {busy === "erasure" ? "Submitting…" : "Permanently delete my account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setErasureOpen(false);
                  setErasureConfirm("");
                }}
                className="rounded-full border border-app-border px-6 py-2.5 text-[14px] font-semibold text-slate-300"
              >
                Keep my account
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Contacts */}
      <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
        Who to contact
      </h3>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Contact
          role="Data Protection Officer"
          name={contacts?.dataProtectionOfficer?.name}
          email={contacts?.dataProtectionOfficer?.email}
          phone={contacts?.dataProtectionOfficer?.phone}
          note="For consent, access and erasure questions."
        />
        <Contact
          role="Grievance Redressal Officer"
          name={contacts?.grievanceOfficer?.name}
          email={contacts?.grievanceOfficer?.email}
          phone={contacts?.grievanceOfficer?.phone}
          note="If a request isn't answered within 30 days."
        />
      </div>
    </>
  );
}

function Row({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: "danger";
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          tone === "danger" ? "bg-red-500/14 text-red-400" : "bg-app-gold/12 text-app-gold",
        ].join(" ")}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[15.5px] font-bold text-slate-100">{title}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">{body}</p>
      </div>
    </div>
  );
}

function Contact({
  role,
  name,
  email,
  phone,
  note,
}: {
  role: string;
  name?: string;
  email?: string;
  phone?: string;
  note: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[1px] text-slate-600">
        {role}
      </p>
      <p className="mt-1.5 text-[14.5px] font-semibold text-slate-200">
        {name ?? "—"}
      </p>
      {email ? (
        <a
          href={`mailto:${email}`}
          className="mt-1 block text-[13.5px] text-app-gold hover:underline"
        >
          {email}
        </a>
      ) : null}
      {/* The API ships a placeholder phone in this environment; don't render a
          number nobody can call. */}
      {phone && !phone.includes("XXXX") ? (
        <p className="text-[13.5px] text-slate-400">{phone}</p>
      ) : null}
      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{note}</p>
    </Card>
  );
}
