"use client";

import { passwordRuleResults, passwordScore, PASSWORD_RULES } from "@/lib/validation";
import { CheckIcon, InfoIcon } from "@/components/icons";

/** One label per possible score, so this array tracks PASSWORD_RULES.length + 1. */
const LABELS = ["", "Weak", "Weak", "Fair", "Good", "Strong"] as const;

/**
 * The Signup design shows the password rule as one static gold strip:
 * "Min 8 chars · uppercase · number · special char". This keeps that exact panel
 * treatment but makes it report progress — a segmented meter plus per-rule ticks —
 * and turns green only when every rule the API enforces passes.
 */
export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const rules = passwordRuleResults(value);
  const allPassed = score === PASSWORD_RULES.length;

  return (
    <div
      className={[
        "rounded-notice border border-l-4 px-[18px] py-3.5",
        allPassed
          ? "border-success/35 border-l-success bg-success/10"
          : "border-gold/35 border-l-gold bg-gold/8",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className={allPassed ? "shrink-0 text-success" : "shrink-0 text-gold"}>
          {allPassed ? <CheckIcon /> : <InfoIcon />}
        </span>

        <div className="flex flex-1 items-center gap-2">
          {PASSWORD_RULES.map((rule, i) => (
            <span
              key={rule.id}
              className={[
                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                i < score
                  ? allPassed
                    ? "bg-success"
                    : "bg-gold"
                  : "bg-white/10",
              ].join(" ")}
            />
          ))}
        </div>

        <span
          aria-live="polite"
          className={[
            "w-12 shrink-0 text-right text-[13px] font-semibold",
            allPassed ? "text-success" : "text-gold",
          ].join(" ")}
        >
          {LABELS[score]}
        </span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={[
              "flex items-center gap-1.5 text-[13px] font-medium transition-colors",
              rule.passed ? "text-success" : "text-gold/70",
            ].join(" ")}
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center">
              {rule.passed ? (
                <CheckIcon size={12} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
