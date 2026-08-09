"use client";

import { useEffect, useRef } from "react";
import { CheckIcon } from "@/components/icons";

/**
 * The VerifyEmail design pins this toast permanently visible with no trigger.
 * Here it is transient: it appears on send/resend and dismisses itself.
 *
 * The design's `min-width:640px` is wider than a phone, so it becomes
 * `min(640px, 100vw - 32px)`.
 */
export function Toast({
  message,
  onDismiss,
  duration = 4000,
}: {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}) {
  // Held in a ref so the dismiss timer depends only on the message. Callers pass
  // an inline arrow whose identity changes on every parent render — and these
  // screens re-render once a second from the resend countdown, which would
  // otherwise reset the timer forever and pin the toast open.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => onDismissRef.current(), duration);
    return () => clearTimeout(id);
  }, [message, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-9 z-50 flex justify-center px-4"
    >
      {message ? (
        <div
          className="animate-toast-in pointer-events-auto flex items-center gap-3.5 rounded-field bg-toast px-7 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
          style={{ width: "min(640px, 100%)" }}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-white">
            <CheckIcon />
          </span>
          <span className="text-[17px] font-semibold text-white">{message}</span>
        </div>
      ) : null}
    </div>
  );
}
