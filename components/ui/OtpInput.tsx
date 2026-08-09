"use client";

import type { useOtp } from "@/hooks/useOtp";

type OtpState = ReturnType<typeof useOtp>;

type OtpInputProps = {
  otp: OtpState;
  /** VerifyEmail draws 80×96 boxes; VerifyPhone draws 74×88. */
  size?: "lg" | "md";
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
};

/**
 * Six single-character boxes.
 *
 * The fixed widths from the designs (6×80 + 5×16 = 560px) overflow a phone
 * viewport, so each box is `min(design width, an even share of the row)` and the
 * row shrinks instead of scrolling.
 */
export function OtpInput({
  otp,
  size = "lg",
  invalid = false,
  disabled = false,
  describedBy,
}: OtpInputProps) {
  // The boxes flex to share the row and hold the design's 5:6 proportion at every
  // width, capping at the design's own size (80×96 / 74×88) once there is room.
  // A fixed height with a shrinking width would go tall-and-narrow on a phone.
  const box =
    size === "lg"
      ? { max: 80, fs: "clamp(20px, 5.5vw, 32px)" }
      : { max: 74, fs: "clamp(18px, 5vw, 30px)" };

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
          style={{ maxWidth: box.max, aspectRatio: "5 / 6", fontSize: box.fs }}
          className={[
            "min-w-0 flex-1 rounded-field border-2 bg-field-otp text-center font-bold text-text-input",
            "outline-none transition-colors disabled:opacity-60",
            invalid
              ? "border-danger"
              : digit
                ? "border-gold"
                : "border-border focus:border-gold focus:ring-2 focus:ring-gold/30",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

/** The progress dots under the VerifyPhone code row. */
export function OtpDots({ dots }: { dots: boolean[] }) {
  return (
    <div className="flex gap-3" aria-hidden="true">
      {dots.map((filled, i) => (
        <span
          key={i}
          className={[
            "h-2 w-2 rounded-full transition-colors",
            filled ? "bg-gold" : "bg-dot-off",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
