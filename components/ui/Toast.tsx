"use client";

import { useEffect, useRef } from "react";
import { CheckIcon } from "@/components/icons";

export function Toast({
  message,
  onDismiss,
  duration = 4000,
}: {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}) {
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
      className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4"
    >
      {message ? (
        <div
          className="animate-toast-in pointer-events-auto flex items-center gap-3 rounded-lg bg-panel px-6 py-4 text-ground-ink shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
          style={{ width: "min(640px, 100%)" }}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-live text-ground-ink">
            <CheckIcon />
          </span>
          <span className="text-body font-medium text-ground-ink">{message}</span>
        </div>
      ) : null}
    </div>
  );
}
