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
    return <div className="h-[420px] animate-pulse rounded-2xl bg-app-card" />;
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
            <p className="text-[12px] font-semibold uppercase tracking-[1px] text-slate-600">
              Current assessment
            </p>
            <p className="mt-1 text-[14px] text-slate-400">
              Assigned by 20fourr from your answers.
            </p>
          </div>
          <span
            className={[
              "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold capitalize",
              level === "high"
                ? "bg-red-500/14 text-red-400"
                : level === "medium"
                  ? "bg-app-warning/14 text-app-warning"
                  : "bg-green-500/14 text-green-500",
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
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300"
        >
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={!complete || saving}
          className={[
            "rounded-full px-7 py-3 text-[14.5px] font-bold transition-transform",
            complete && !saving
              ? "bg-app-gold-gradient text-black hover:-translate-y-px"
              : "cursor-not-allowed bg-app-disabled text-slate-500",
          ].join(" ")}
        >
          {saving ? "Saving…" : "Save assessment"}
        </button>
        {!complete ? (
          <p className="text-[13px] text-slate-500">Answer both questions to save.</p>
        ) : null}
      </div>

      <p className="text-[12.5px] leading-relaxed text-slate-600">
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
      <p className="text-[15px] font-semibold text-slate-100">{question}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{help}</p>

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
              "rounded-full border px-6 py-2 text-[14px] font-semibold transition-colors",
              value === opt.v
                ? "border-app-gold bg-app-gold/12 text-app-gold"
                : "border-app-border text-slate-300 hover:border-app-gold/40",
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
            className="mb-2 block text-[13px] font-medium text-slate-400"
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
              "w-full rounded-xl border bg-white/4 px-4 py-3 text-[14.5px] text-slate-100 outline-none transition-colors placeholder:text-slate-600",
              detailError ? "border-red-500" : "border-app-border focus:border-app-gold/60",
            ].join(" ")}
          />
          <div className="mt-1.5 flex justify-between gap-3">
            {detailError ? (
              <p role="alert" className="text-[12.5px] text-red-400">
                {detailError}
              </p>
            ) : (
              <span />
            )}
            <span className="shrink-0 text-[12px] text-slate-600">
              {detailValue.length}/{MAX_DESC}
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
