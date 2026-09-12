"use client";

import { passwordRuleResults, passwordScore, PASSWORD_RULES } from "@/lib/validation";
import { CheckIcon, InfoIcon } from "@/components/icons";

const LABELS = ["", "Weak", "Weak", "Fair", "Good", "Strong"] as const;

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const rules = passwordRuleResults(value);
  const allPassed = score === PASSWORD_RULES.length;

  return (
    <div
      className={[
        "rounded-lg border px-4 py-3.5",
        allPassed ? "border-live" : "border-hairline",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className={allPassed ? "shrink-0 text-live" : "shrink-0 text-fg-mid"}>
          {allPassed ? <CheckIcon /> : <InfoIcon />}
        </span>

        <div className="flex flex-1 items-center gap-2">
          {PASSWORD_RULES.map((rule, i) => (
            <span
              key={rule.id}
              className={[
                "h-1.5 flex-1 rounded-pill transition-colors duration-150 ease-out",
                i < score ? (allPassed ? "bg-live" : "bg-edge") : "bg-hairline",
              ].join(" ")}
            />
          ))}
        </div>

        <span
          aria-live="polite"
          className={[
            "w-12 shrink-0 text-right text-body-sm font-medium",
            allPassed ? "text-live" : "text-fg-mid",
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
              "flex items-center gap-1.5 text-body-sm font-medium transition-colors duration-150 ease-out",
              rule.passed ? "text-live" : "text-fg-faint",
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
