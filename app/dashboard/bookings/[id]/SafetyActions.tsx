"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/dashboard/primitives";
import { AlertCircleIcon, ShieldFill } from "@/components/dashboard/icons";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import {
  ABSENCE_STATUSES,
  DISPUTE_STATUSES,
  INCIDENT_CATEGORIES,
  INCIDENT_STATUSES,
  SOS_STATUSES,
} from "@/lib/api/types";

/**
 * The four things a client does when a booking goes wrong.
 *
 * Every one is gated on booking status by the API, and those gates are mirrored
 * here rather than discovered through a 400 — a panic button that returns an
 * error is worse than one that isn't shown.
 *
 *   SOS       duty_started only
 *   Incident  duty_started / duty_ended / completed / settled
 *   Absence   payment_done / duty_started
 *   Dispute   duty_started / duty_ended / completed
 *
 * SOS is deliberately different from the rest: no form, one confirmation, and
 * it attaches location if the browser will give it. Someone pressing this is
 * not going to fill in fields.
 */

type Props = {
  bookingId: string;
  status: string;
  onChanged: () => void;
};

/**
 * Best-effort coordinates for an SOS. Never blocks the alert — a denied or slow
 * permission prompt must not delay a panic button, so this resolves to null
 * after 4 seconds and the alert goes without a position.
 */
function getPosition(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const done = (v: { latitude: number; longitude: number } | null) => resolve(v);
    const timer = setTimeout(() => done(null), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        done({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 },
    );
  });
}

export function SafetyActions({ bookingId, status, onChanged }: Props) {
  const [open, setOpen] = useState<null | "sos" | "incident" | "absence" | "dispute">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // Form state, kept flat — only one dialog is open at a time.
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<string>("safety_threat");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");

  const canSos = SOS_STATUSES.includes(status);
  const canIncident = INCIDENT_STATUSES.includes(status);
  const canAbsence = ABSENCE_STATUSES.includes(status);
  const canDispute = DISPUTE_STATUSES.includes(status) && status !== "disputed";

  if (!canSos && !canIncident && !canAbsence && !canDispute) return null;

  function reset() {
    setOpen(null);
    setError(null);
    setNote("");
    setDescription("");
    setReason("");
    setCategory("safety_threat");
  }

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setDone(label);
      reset();
      onChanged();
    } catch (cause) {
      // The SOS endpoint rate-limits with 429 so a repeated press doesn't spam
      // the safety team — say that plainly rather than "something went wrong".
      if (isApiError(cause) && cause.status === 429) {
        setError("An alert was just raised for this duty. Give it a moment.");
      } else {
        setError(errorMessage(cause));
      }
    } finally {
      setBusy(false);
    }
  }

  const raiseSos = () =>
    run("SOS raised — the safety team has been alerted.", async () => {
      const position = await getPosition();
      return api(`protection/${bookingId}/sos`, {
        method: "POST",
        body: { ...(position ?? {}), ...(note.trim() ? { note: note.trim() } : {}) },
      });
    });

  const fileIncident = () =>
    run("Incident filed. Support will follow up.", () =>
      api(`protection/${bookingId}/incidents`, {
        method: "POST",
        body: { category, description: description.trim() },
      }),
    );

  const raiseAbsence = () =>
    run("Absence reported. We're contacting the provider.", () =>
      api(`bookings/${bookingId}/absence-alert`, {
        method: "POST",
        body: { reason: reason.trim() },
      }),
    );

  const raiseDispute = () =>
    run("Dispute raised. Support will review this booking.", () =>
      api(`bookings/${bookingId}/dispute`, {
        method: "POST",
        body: {
          reason: reason.trim().slice(0, 200),
          ...(description.trim() ? { description: description.trim().slice(0, 1000) } : {}),
        },
      }),
    );

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {done ? (
        <p className="rounded-lg border border-live bg-transparent px-4 py-3 text-body-sm text-live">
          {done}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-fault bg-transparent px-4 py-3 text-body-sm leading-relaxed text-fault"
        >
          {error}
        </p>
      ) : null}

      {/* ── SOS ──────────────────────────────────────────────────────────── */}
      {canSos ? (
        open === "sos" ? (
          <Panel tone="danger" title="Raise an SOS?">
            <p className="text-body-sm leading-relaxed text-fg-mid">
              This alerts the 20fourr safety team immediately and shares your location if
              your browser allows it. Use it when someone is in danger.
            </p>
            <p className="mt-2 text-body-sm font-semibold text-fault">
              If there is an immediate threat to life, call 112 first.
            </p>
            <textarea
              rows={2}
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's happening? (optional)"
              className={inputCls}
            />
            <Actions
              busy={busy}
              confirmLabel={busy ? "Raising…" : "Raise SOS now"}
              tone="danger"
              onConfirm={raiseSos}
              onCancel={reset}
            />
          </Panel>
        ) : (
          <button
            type="button"
            onClick={() => setOpen("sos")}
            className="flex items-center justify-center gap-2.5 rounded-lg bg-fault px-6 py-4 text-body font-semibold uppercase tracking-[1px] text-ground-ink transition-colors hover:opacity-90"
          >
            <AlertCircleIcon size={18} />
            SOS
          </button>
        )
      ) : null}

      {/* ── Absence ──────────────────────────────────────────────────────── */}
      {canAbsence ? (
        open === "absence" ? (
          <Panel tone="warning" title="Report the provider absent">
            <p className="text-body-sm leading-relaxed text-fg-mid">
              Use this if the guard has not arrived, or has left the site during the
              shift. Checked against duty and geofence records.
            </p>
            <textarea
              rows={2}
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What happened? (required)"
              className={inputCls}
            />
            <Actions
              busy={busy || !reason.trim()}
              confirmLabel={busy ? "Reporting…" : "Report absence"}
              tone="warning"
              onConfirm={raiseAbsence}
              onCancel={reset}
            />
          </Panel>
        ) : (
          <ActionButton
            tone="warning"
            icon={<ShieldFill size={16} />}
            label="Raise absence alert"
            onClick={() => setOpen("absence")}
          />
        )
      ) : null}

      {/* ── Incident ─────────────────────────────────────────────────────── */}
      {canIncident ? (
        open === "incident" ? (
          <Panel tone="warning" title="File an incident report">
            <div className="flex flex-wrap gap-2">
              {INCIDENT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                  className={[
                    "rounded-full border px-3.5 py-1.5 text-body-sm font-semibold transition-colors",
                    category === c.id
                      ? "border-brand bg-panel-raised text-brand"
                      : "border-hairline text-fg-mid hover:border-edge",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={description}
              maxLength={4000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened — dates, times and names help."
              className={inputCls}
            />
            <p className="text-label text-fg-faint">
              {description.trim().length}/4000 · at least 5 characters
            </p>
            <Actions
              busy={busy || description.trim().length < 5}
              confirmLabel={busy ? "Filing…" : "File incident"}
              onConfirm={fileIncident}
              onCancel={reset}
            />
          </Panel>
        ) : (
          <ActionButton
            icon={<AlertCircleIcon size={16} />}
            label="Report an incident"
            onClick={() => setOpen("incident")}
          />
        )
      ) : null}

      {/* ── Dispute ──────────────────────────────────────────────────────── */}
      {canDispute ? (
        open === "dispute" ? (
          <Panel tone="danger" title="Dispute this booking">
            <p className="text-body-sm leading-relaxed text-fg-mid">
              This puts the booking under review and pauses the provider&apos;s payout
              while support investigates.
            </p>
            <input
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason in one line (required)"
              className={inputCls}
            />
            <textarea
              rows={3}
              value={description}
              maxLength={1000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any detail that helps (optional)"
              className={inputCls}
            />
            <Actions
              busy={busy || !reason.trim()}
              confirmLabel={busy ? "Raising…" : "Raise dispute"}
              tone="danger"
              onConfirm={raiseDispute}
              onCancel={reset}
            />
          </Panel>
        ) : (
          <ActionButton
            tone="danger"
            icon={<AlertCircleIcon size={16} />}
            label="Dispute this booking"
            onClick={() => setOpen("dispute")}
          />
        )
      ) : null}
    </div>
  );
}

const inputCls =
  "mt-3 w-full rounded-lg border border-hairline bg-panel-raised px-3 py-2.5 text-body-sm text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-edge";

function Panel({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "danger" | "warning";
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-4",
        tone === "danger"
          ? "border-fault bg-fault/6"
          : tone === "warning"
            ? "border-attention bg-transparent"
            : "border-hairline bg-panel",
      ].join(" ")}
    >
      <p
        className={[
          "text-body font-semibold",
          tone === "danger" ? "text-fault" : tone === "warning" ? "text-attention" : "text-fg",
        ].join(" ")}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function Actions({
  busy,
  confirmLabel,
  tone,
  onConfirm,
  onCancel,
}: {
  busy: boolean;
  confirmLabel: string;
  tone?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className={[
          "rounded-sm px-5 py-2 text-body-sm font-semibold transition-opacity disabled:opacity-50",
          tone === "danger"
            ? "bg-fault text-ground-ink"
            : tone === "warning"
              ? "bg-attention"
              : "bg-brand text-brand-ink",
        ].join(" ")}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-sm border border-hairline px-5 py-2 text-body-sm font-semibold text-fg-mid"
      >
        Cancel
      </button>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone?: "danger" | "warning";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-body font-semibold transition-colors",
        tone === "danger"
          ? "border-fault text-fault hover:bg-panel-raised"
          : tone === "warning"
            ? "border-attention text-attention hover:bg-transparent"
            : "border-hairline text-fg-mid hover:bg-panel-raised",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
