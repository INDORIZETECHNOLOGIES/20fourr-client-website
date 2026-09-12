"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/dashboard/primitives";
import { Notice } from "@/components/ui/Notice";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import type { ApiClientProfile } from "@/lib/api/types";
import { THREAT_LEVELS } from "@/lib/profile-data";

/**
 * Threat assessment, matching `PUT /client/profile/threat-assessment`.
 *
 * This was a generic yes/no questionnaire that never saved. The endpoint takes
 * exactly two booleans and, when either is true, a description of **10–1000
 * characters** — so the questions here are the two the server actually stores,
 * and the descriptions are required rather than optional prose.
 *
 * `threatLevel` is deliberately not sent: it is a risk classification the
 * platform assigns, and letting a client set their own would make it
 * meaningless for provider matching.
 */

const MIN_DESC = 10;
const MAX_DESC = 1000;

export function ThreatForm() {
  const { data, loading } = useApiQuery<{ profile: ApiClientProfile }>("client/profile");

  const [hasKnownThreat, setHasKnownThreat] = useState<boolean | null>(null);
  const [wasAttackedBefore, setWasAttackedBefore] = useState<boolean | null>(null);
  const [threatDescription, setThreatDescription] = useState("");
  const [attackDescription, setAttackDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || loading) return;
    const t = data?.profile?.threatAssessment;
    if (t) {
      setHasKnownThreat(t.hasKnownThreat ?? null);
      setWasAttackedBefore(t.wasAttackedBefore ?? null);
      setThreatDescription(t.threatDescription ?? "");
      setAttackDescription(t.attackDescription ?? "");
    }
    setHydrated(true);
  }, [hydrated, loading, data]);

  const level = data?.profile?.threatAssessment?.threatLevel;
  const complete = hasKnownThreat !== null && wasAttackedBefore !== null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found: Record<string, string | undefined> = {
      threatDescription:
        hasKnownThreat && threatDescription.trim().length < MIN_DESC
          ? `Describe the threat in at least ${MIN_DESC} characters.`
          : undefined,
      attackDescription:
        wasAttackedBefore && attackDescription.trim().length < MIN_DESC
          ? `Describe what happened in at least ${MIN_DESC} characters.`
          : undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean) || !complete) return;

    setSaving(true);
    try {
      await api("client/profile/threat-assessment", {
        method: "PUT",
        body: {
          hasKnownThreat,
          wasAttackedBefore,
          // Only sent when the matching answer is yes — the API rejects a
          // description that arrives without its flag set.
          ...(hasKnownThreat ? { threatDescription: threatDescription.trim() } : {}),
          ...(wasAttackedBefore ? { attackDescription: attackDescription.trim() } : {}),
        },
      });
      setSaved(true);
    } catch (cause) {
      if (isApiError(cause) && cause.fields) {
        setErrors((prev) => ({ ...prev, ...cause.fields }));
      } else {
        setFormError(errorMessage(cause));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading && !hydrated) {
    return <div className="h-[420px] animate-pulse rounded-lg bg-panel" />;
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {saved ? (
        <Notice>
          Assessment saved. This informs which providers we match you with and how a
          duty is briefed — it is not shared with providers verbatim.
        </Notice>
      ) : null}

      {level ? (
        <Card className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-label font-semibold uppercase tracking-[1px] text-fg-faint">
              Current assessment
            </p>
            <p className="mt-1 text-body text-fg-mid">
              Assigned by 20fourr from your answers.
            </p>
          </div>
          <span
            className={[
              "shrink-0 rounded-sm px-4 py-1.5 text-body-sm font-semibold capitalize",
              level === "high"
                ? "border border-fault text-fault"
                : level === "medium"
                  ? "bg-transparent text-attention"
                  : "border border-live text-live",
            ].join(" ")}
          >
            {level}
          </span>
        </Card>
      ) : null}

      <Question
        id="known-threat"
        question="Do you have a known threat against you?"
        help="For example an ongoing dispute, a stalker, or a specific person or group you believe poses a risk."
        value={hasKnownThreat}
        onChange={(v) => {
          setHasKnownThreat(v);
          setSaved(false);
          if (!v) setErrors((e) => ({ ...e, threatDescription: undefined }));
        }}
        detailLabel="Describe the threat"
        detailValue={threatDescription}
        detailError={errors.threatDescription}
        onDetailChange={(v) => {
          setThreatDescription(v);
          setErrors((e) => ({ ...e, threatDescription: undefined }));
          setSaved(false);
        }}
      />

      <Question
        id="attacked-before"
        question="Have you been attacked or threatened before?"
        help="Any previous incident — physical, verbal or online — that led you to seek protection."
        value={wasAttackedBefore}
        onChange={(v) => {
          setWasAttackedBefore(v);
          setSaved(false);
          if (!v) setErrors((e) => ({ ...e, attackDescription: undefined }));
        }}
        detailLabel="Describe what happened"
        detailValue={attackDescription}
        detailError={errors.attackDescription}
        onDetailChange={(v) => {
          setAttackDescription(v);
          setErrors((e) => ({ ...e, attackDescription: undefined }));
          setSaved(false);
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

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={!complete || saving}
          className={[
            "rounded-sm px-7 py-3 text-body font-semibold transition-opacity",
            complete && !saving
              ? "bg-brand text-brand-ink "
              : "cursor-not-allowed bg-panel-raised text-fg-faint",
          ].join(" ")}
        >
          {saving ? "Saving…" : "Save assessment"}
        </button>
        {!complete ? (
          <p className="text-body-sm text-fg-faint">Answer both questions to save.</p>
        ) : null}
      </div>

      <p className="text-body-sm leading-relaxed text-fg-faint">
        Risk levels: {THREAT_LEVELS.map((l) => l.label).join(" · ")}. The level is set by
        20fourr from your answers and a booking&apos;s own risk profile — you cannot set
        it yourself.
      </p>
    </form>
  );
}

function Question({
  id,
  question,
  help,
  value,
  onChange,
  detailLabel,
  detailValue,
  detailError,
  onDetailChange,
}: {
  id: string;
  question: string;
  help: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  detailLabel: string;
  detailValue: string;
  detailError?: string;
  onDetailChange: (v: string) => void;
}) {
  return (
    <Card className="p-5">
      <p className="text-body font-semibold text-fg">{question}</p>
      <p className="mt-1 text-body-sm leading-relaxed text-fg-faint">{help}</p>

      <div className="mt-4 flex gap-2.5">
        {[
          { label: "No", v: false },
          { label: "Yes", v: true },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            aria-pressed={value === opt.v}
            onClick={() => onChange(opt.v)}
            className={[
              "rounded-sm border px-6 py-2 text-body font-semibold transition-colors",
              value === opt.v
                ? "border-brand bg-panel-raised text-brand"
                : "border-hairline text-fg-mid hover:border-edge",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {value === true ? (
        <div className="mt-4">
          <label
            htmlFor={`${id}-detail`}
            className="mb-2 block text-body-sm font-medium text-fg-mid"
          >
            {detailLabel}
          </label>
          <textarea
            id={`${id}-detail`}
            rows={3}
            value={detailValue}
            maxLength={MAX_DESC}
            aria-invalid={detailError ? true : undefined}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder="Keep it factual — this is read by our safety team."
            className={[
              "w-full rounded-lg border bg-panel-raised px-4 py-3 text-body text-fg outline-none transition-colors placeholder:text-fg-faint",
              detailError ? "border-fault" : "border-hairline focus:border-edge",
            ].join(" ")}
          />
          <div className="mt-1.5 flex justify-between gap-3">
            {detailError ? (
              <p role="alert" className="text-body-sm text-fault">
                {detailError}
              </p>
            ) : (
              <span />
            )}
            <span className="shrink-0 text-label text-fg-faint">
              {detailValue.length}/{MAX_DESC}
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
