"use client";

import { useEffect, useState } from "react";

/**
 * Prospective engine for the funnel. Existing bookings use
 * `booking.billingEngine` instead — never this flag (spec 0002 rule 1).
 */
export function useV6Enabled() {
  const [v6Enabled, setV6Enabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing-flags")
      .then((r) => r.json())
      .then((data: { v6Enabled?: boolean }) => {
        if (!cancelled) setV6Enabled(Boolean(data?.v6Enabled));
      })
      .catch(() => {
        if (!cancelled) setV6Enabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return v6Enabled;
}
