"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "./BookingContext";
import { StepHeading } from "./BookingShell";
import { AlertCircleIcon } from "@/components/dashboard/icons";

/**
 * Shared shell for the three legal gates (Risk, Safety, Waiver).
 *
 * These are compliance screens, not UX friction. The rules they enforce:
 *  - the acknowledgement checkbox starts unticked on every visit
 *  - the continue button is inert until it is explicitly ticked
 *  - the acceptance is recorded on the draft, and BookingShell refuses to render
 *    any later step whose prerequisite acceptance is missing
 *
 * Do not "helpfully" pre-tick these or collapse them into one screen.
 */
export function ConsentGate({
  title,
  subtitle,
  tone = "warning",
  points,
  acknowledgement,
  confirmLabel,
  confirmDisabled = false,
  error,
  onAccept,
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: "warning" | "danger";
  points: { heading: string; body: string }[];
  acknowledgement: string;
  confirmLabel: string;
  /** Blocks the button even once the box is ticked — e.g. while submitting. */
  confirmDisabled?: boolean;
  /**
   * Rendered directly above the button rather than with the page content.
   * A submit failure shown at the top of a long consent screen is off-screen
   * at the moment it happens — the user sees the button do nothing.
   */
  error?: ReactNode;
  onAccept: () => void;
  children?: ReactNode;
}) {
  const [checked, setChecked] = useState(false);
  const accent =
    tone === "danger"
      ? { text: "text-red-400", ring: "border-red-500/35", bg: "bg-red-500/8" }
      : { text: "text-app-gold", ring: "border-app-gold/35", bg: "bg-app-gold/8" };

  return (
    <>
      <StepHeading title={title} subtitle={subtitle} />

      <div className={`rounded-2xl border ${accent.ring} ${accent.bg} p-5 sm:p-6`}>
        <div className="mb-5 flex items-start gap-3">
          <span className={`mt-0.5 shrink-0 ${accent.text}`}>
            <AlertCircleIcon size={22} />
          </span>
          <p className={`text-[15px] font-semibold leading-relaxed ${accent.text}`}>
            Read this carefully before continuing.
          </p>
        </div>

        <ol className="flex flex-col gap-5">
          {points.map((p, i) => (
            <li key={p.heading} className="flex gap-3.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/8 text-[12px] font-bold ${accent.text}`}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-[14.5px] font-bold text-slate-100">{p.heading}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-slate-400">
                  {p.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {children}
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-slate-200">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-app-gold"
        />
        {acknowledgement}
      </label>

      {error ? <div className="mt-6">{error}</div> : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/6 pt-6">
        <p className="text-[13px] text-slate-500">
          {checked ? "Recorded with your booking." : "Tick the box above to continue."}
        </p>
        <button
          type="button"
          disabled={!checked || confirmDisabled}
          onClick={onAccept}
          className={[
            "rounded-full px-8 py-3.5 text-[15px] font-bold transition-all",
            checked && !confirmDisabled
              ? "bg-app-gold-gradient text-black hover:-translate-y-px"
              : "cursor-not-allowed bg-app-disabled text-slate-500",
          ].join(" ")}
        >
          {confirmLabel}
        </button>
      </div>
    </>
  );
}

export function useGate(next: string) {
  const { update } = useBooking();
  const router = useRouter();
  return (patch: Record<string, boolean>) => {
    update(patch);
    router.push(next);
  };
}
