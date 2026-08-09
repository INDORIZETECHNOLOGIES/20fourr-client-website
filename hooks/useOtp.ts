"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const LENGTH = 6;

/**
 * Port of the OTP state machine from the VerifyPhone / VerifyEmail DCLogic blocks.
 *
 * Preserved from the source exactly:
 *  - a keystroke is stripped to digits and only the last character is kept, so
 *    typing into an already-filled box replaces rather than appends
 *  - entering a digit advances focus to the next box
 *  - backspace in an empty box retreats focus to the previous one
 *  - `complete` (all six filled) is what gates the submit button's appearance
 *
 * Added here, because the source has neither: pasting a 6-digit code fills every
 * box at once, and arrow keys move between boxes.
 */
export function useOtp(onComplete?: (code: string) => void) {
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(""));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const registerInput = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      inputs.current[index] = el;
    },
    [],
  );

  const focusAt = useCallback((index: number) => {
    const el = inputs.current[Math.max(0, Math.min(LENGTH - 1, index))];
    el?.focus();
    el?.select();
  }, []);

  const code = digits.join("");
  const filled = digits.filter(Boolean).length;
  const complete = filled === LENGTH;

  const setDigit = useCallback(
    (index: number, raw: string) => {
      const value = raw.replace(/\D/g, "").slice(-1);

      setDigits((prev) => {
        const next = prev.slice();
        next[index] = value;

        if (value && next.filter(Boolean).length === LENGTH) {
          onComplete?.(next.join(""));
        }
        return next;
      });

      if (value && index < LENGTH - 1) focusAt(index + 1);
    },
    [focusAt, onComplete],
  );

  const handleKeyDown = useCallback(
    (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
      const target = event.currentTarget;

      if (event.key === "Backspace") {
        if (target.value) return; // let the change handler clear this box
        event.preventDefault();
        setDigits((prev) => {
          const next = prev.slice();
          next[index - 1] = "";
          return next;
        });
        focusAt(index - 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focusAt(index - 1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        focusAt(index + 1);
      }
    },
    [focusAt],
  );

  /** Accepts a pasted code from any box and distributes it across the row. */
  const handlePaste = useCallback(
    (index: number) => (event: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;
      event.preventDefault();

      setDigits((prev) => {
        const next = prev.slice();
        for (let i = 0; i < pasted.length && index + i < LENGTH; i += 1) {
          next[index + i] = pasted[i];
        }
        if (next.filter(Boolean).length === LENGTH) {
          onComplete?.(next.join(""));
        }
        return next;
      });

      focusAt(Math.min(index + pasted.length, LENGTH - 1));
    },
    [focusAt, onComplete],
  );

  const reset = useCallback(() => {
    setDigits(Array(LENGTH).fill(""));
    focusAt(0);
  }, [focusAt]);

  /** Progress dots under the VerifyPhone boxes. */
  const dots = useMemo(() => digits.map((d) => Boolean(d)), [digits]);

  return {
    digits,
    dots,
    code,
    filled,
    complete,
    length: LENGTH,
    setDigit,
    handleKeyDown,
    handlePaste,
    registerInput,
    focusAt,
    reset,
  };
}
