"use client";

import { useBillingFlags } from "@/hooks/useBillingFlags";

/**
 * Prospective engine for the funnel. Existing bookings use
 * `booking.billingEngine` instead — never this flag (spec 0002 rule 1).
 */
export function useV6Enabled() {
  return useBillingFlags().v6Enabled;
}
