"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BOOKING_STEPS, useBooking } from "./BookingContext";
import { ArrowLeftIcon, CheckIcon, CloseIcon } from "@/components/dashboard/icons";

export function BookingShell({ children }: { children: ReactNode }) {
  const { currentStep, furthestStep, hydrated } = useBooking();
  const router = useRouter();
  const pathname = usePathname();
  // Terminal screen — the funnel is finished and the draft has been cleared,
  // so neither the step rail nor the gate guard applies.
  const isTerminal = pathname === "/book/success";

  // A consent gate can't be skipped by typing a URL. If the draft doesn't
  // satisfy the prerequisites for this step, fall back to the furthest valid one.
  useEffect(() => {
    if (isTerminal) return;
    // Before hydration the draft is empty, so furthestStep is 0 and this would
    // bounce every direct load — a refresh or a deep link mid-funnel — back to
    // step 1. Wait until the stored draft has actually been read.
    if (!hydrated) return;
    if (currentStep > furthestStep) {
      router.replace(`/book/${BOOKING_STEPS[furthestStep].slug}`);
    }
  }, [currentStep, furthestStep, router, isTerminal, hydrated]);

  if (isTerminal) {
    return (
      <div className="min-h-screen bg-app-bg font-body text-slate-200">
        <main className="mx-auto max-w-[1100px] px-4 py-14 lg:px-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg font-body text-slate-200">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-app-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-[1100px] items-center gap-3 px-4 lg:px-8">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-white/6"
            >
              <ArrowLeftIcon size={18} />
            </button>
          ) : null}

          <p className="flex-1 truncate font-display text-[16px] font-semibold text-slate-100">
            Book Security Service
          </p>

          <Link
            href="/dashboard"
            aria-label="Exit booking"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white/6 hover:text-slate-200"
          >
            <CloseIcon size={18} />
          </Link>
        </div>

        {/* Step rail */}
        <div className="mx-auto max-w-[1100px] overflow-x-auto px-4 pb-3 lg:px-8">
          <ol className="flex min-w-max items-center gap-1.5">
            {BOOKING_STEPS.map((s, i) => {
              const done = i < furthestStep && i < currentStep;
              const active = i === currentStep;
              const reachable = i <= furthestStep;

              const body = (
                <span
                  className={[
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                    active
                      ? "bg-app-gold/15 text-app-gold"
                      : done
                        ? "text-green-500 hover:bg-white/5"
                        : reachable
                          ? "text-slate-400 hover:bg-white/5"
                          : "text-slate-600",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px]",
                      active
                        ? "bg-app-gold text-black"
                        : done
                          ? "bg-green-500/20 text-green-500"
                          : "bg-white/8 text-slate-400",
                    ].join(" ")}
                  >
                    {done ? <CheckIcon size={11} /> : i + 1}
                  </span>
                  {s.label}
                </span>
              );

              return (
                <li key={s.slug} className="flex items-center gap-1.5">
                  {reachable && !active ? (
                    <Link href={`/book/${s.slug}`}>{body}</Link>
                  ) : (
                    body
                  )}
                  {i < BOOKING_STEPS.length - 1 ? (
                    <span className="h-px w-4 bg-white/10" aria-hidden="true" />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}

/** Shared footer for each step. */
export function StepFooter({
  onContinue,
  continueLabel = "Continue",
  disabled = false,
  hint,
}: {
  onContinue: () => void;
  continueLabel?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/6 pt-6">
      <p className="text-[13px] text-slate-500">{hint}</p>
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled}
        className={[
          "rounded-full px-8 py-3.5 text-[15px] font-bold transition-all",
          disabled
            ? "cursor-not-allowed bg-app-disabled text-slate-500"
            : "bg-app-gold-gradient text-black hover:-translate-y-px",
        ].join(" ")}
      >
        {continueLabel}
      </button>
    </div>
  );
}

export function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[26px] font-extrabold tracking-[-0.5px] text-slate-100">
        {title}
      </h1>
      {subtitle ? <p className="mt-1.5 text-[14.5px] text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
