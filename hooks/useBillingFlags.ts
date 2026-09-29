"use client";

import { useEffect, useState } from "react";
import type { BillingFlags } from "@/lib/api/billing-flags";

const CLOSED: BillingFlags = { v6Enabled: false, contractsEnabled: false };

/**
 * GET /api/billing-flags, fail closed. `loaded` is false until the answer is in, so a caller can
 * hold off rather than flash the switched-off state.
 */
export function useBillingFlags(): BillingFlags & { loaded: boolean } {
  const [flags, setFlags] = useState<BillingFlags & { loaded: boolean }>({ ...CLOSED, loaded: false });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing-flags")
      .then((r) => r.json())
      .then((data: Partial<BillingFlags>) => {
        if (!cancelled) {
          setFlags({ v6Enabled: Boolean(data?.v6Enabled), contractsEnabled: Boolean(data?.contractsEnabled), loaded: true });
        }
      })
      .catch(() => {
        if (!cancelled) setFlags({ ...CLOSED, loaded: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return flags;
}
