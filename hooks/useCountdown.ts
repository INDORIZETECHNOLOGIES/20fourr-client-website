"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Port of the VerifyPhone resend timer (`setInterval` ticking `seconds` down to 0).
 *
 * Added over the source: a `restart` so the Resend button can re-arm the timer.
 * In the design the countdown runs out and nothing can restart it.
 */
export function useCountdown(from: number) {
  const [seconds, setSeconds] = useState(from);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const run = useCallback(() => {
    clear();
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clear();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [clear]);

  useEffect(() => {
    run();
    return clear;
  }, [run, clear]);

  const restart = useCallback(() => {
    setSeconds(from);
    run();
  }, [from, run]);

  return { seconds, expired: seconds === 0, restart };
}
