/**
 * Documented worked example for the marketing quote fragment.
 *
 * This is not a live marketplace average. Spec 0001 forbids fabricated proof
 * numbers. The arithmetic uses the GST rate the product actually applies (18%,
 * split CGST/SGST on an intra-state supply) on round rupee principals, so a
 * procurement reader can check the lines. Live quotes come from the booking
 * funnel once a provider is selected (spec 0002 wires price-preview).
 */
export type WorkedQuoteLine = {
  id: string;
  label: string;
  amountPaise: number;
};

export type WorkedQuote = {
  categoryLabel: string;
  hours: number;
  lines: WorkedQuoteLine[];
  totalPaise: number;
  note: string;
};

const GST_RATE = 0.18;

function gstSplit(basePaise: number) {
  const gst = Math.round(basePaise * GST_RATE);
  const half = Math.round(gst / 2);
  return { cgst: half, sgst: gst - half, gst };
}

/**
 * Commission, as a fraction of the provider's pre-GST price.
 *
 * This MUST track `PlatformSettings.billingV6.commissionRate` (default 0.15 —
 * SecureConnect spec 0005, rule 1: `platformFee = round(providerPreGst ×
 * commissionRate)`, charged to the client on top of the provider's price).
 *
 * It was previously a flat ₹100 regardless of booking size, which understated
 * the default 8h guard example by ₹236 (~9.5%). On the one page whose whole
 * argument is that we publish the real breakdown, a fee that does not match the
 * engine is worse than publishing nothing.
 */
const COMMISSION_RATE = 0.15;

/** Round principals used in the worked example (paise). */
const SERVICE_BASE: Record<string, number> = {
  guard: 200000,
  bouncer: 320000,
  gunman: 720000,
  pso: 560000,
};

/**
 * Same shape as a live quote: service, platform fee, their total, one GST line
 * at 18% of that total, then the amount to be paid. GST is computed per
 * supply (service, fee) and summed, exactly as the engine charges it.
 */
export function workedQuote(category: string, hours: number): WorkedQuote {
  const eightHourBase = SERVICE_BASE[category] ?? SERVICE_BASE.guard;
  const service = Math.round((eightHourBase * hours) / 8);
  const platform = Math.round(service * COMMISSION_RATE);
  const gst = gstSplit(service).gst + gstSplit(platform).gst;
  const lines: WorkedQuoteLine[] = [
    { id: "service", label: "Service charge (base price)", amountPaise: service },
    { id: "platform", label: "Platform fee (15%)", amountPaise: platform },
    { id: "subtotal", label: "Total", amountPaise: service + platform },
    { id: "gst", label: "GST 18%", amountPaise: gst },
  ];
  return {
    categoryLabel: category,
    hours,
    lines,
    totalPaise: service + platform + gst,
    note: "Worked example: platform fee 15% of the service price, GST 18% on the total, intra-state supply. Not a live quote — rates are the platform defaults.",
  };
}

export const DEFAULT_QUOTE = workedQuote("guard", 8);

/** Per-hour pre-GST base rate for a category, derived from the same SERVICE_BASE used above. */
export function baseHourlyRatePaise(category: string): number {
  const eightHourBase = SERVICE_BASE[category] ?? SERVICE_BASE.guard;
  return Math.round(eightHourBase / 8);
}
