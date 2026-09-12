"use client";

import type { useOtp } from "@/hooks/useOtp";

type OtpState = ReturnType<typeof useOtp>;

type OtpInputProps = {
  otp: OtpState;
  size?: "lg" | "md";
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
};

export function OtpInput({
  otp,
  size = "lg",
  invalid = false,
  disabled = false,
  describedBy,
}: OtpInputProps) {
  const box = size === "lg" ? { max: 80 } : { max: 74 };

  return (
    <div
      className="flex w-full justify-center gap-2 sm:gap-4"
      role="group"
      aria-label="6-digit verification code"
    >
      {otp.digits.map((digit, i) => (
        <input
          key={i}
          ref={otp.registerInput(i)}
          value={digit}
          onChange={(e) => otp.setDigit(i, e.target.value)}
          onKeyDown={otp.handleKeyDown(i)}
          onPaste={otp.handlePaste(i)}
          onFocus={(e) => e.currentTarget.select()}
          disabled={disabled}
          maxLength={1}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of 6`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          style={{ maxWidth: box.max, aspectRatio: "5 / 6" }}
          className={[
            "min-w-0 flex-1 rounded-sm border bg-panel-raised text-center font-mono text-mono-lg text-fg",
            "outline-none transition-colors duration-150 ease-out disabled:opacity-45",
            invalid
              ? "border-fault"
              : digit
                ? "border-brand"
                : "border-edge focus:border-edge",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

export function OtpDots({ dots }: { dots: boolean[] }) {
  return (
    <div className="flex gap-3" aria-hidden="true">
      {dots.map((filled, i) => (
        <span
          key={i}
          className={[
            "h-2 w-2 rounded-full transition-colors duration-150 ease-out",
            filled ? "bg-brand" : "bg-hairline",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
