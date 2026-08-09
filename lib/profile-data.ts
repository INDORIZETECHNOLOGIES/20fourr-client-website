/**
 * Fixtures for the Profile sub-pages. Swap seam — see lib/dashboard-data.ts.
 * All money is integer paise; SecurePoints are a separate non-currency unit.
 */

export type WalletTxn = {
  id: string;
  label: string;
  detail: string;
  date: string;
  /** Positive credits, negative debits. */
  deltaPaise: number;
  kind: "refund" | "referral" | "bonus" | "spend";
};

export const WALLET = {
  /** SecureCoins — spendable, 1 coin = ₹1, stored in paise. */
  coinsPaise: 240000,
  /** SecurePoints — loyalty units, not currency. */
  points: 1850,
  pointsToNextTier: 650,
  nextTier: "Gold",
  expiringPoints: 200,
  expiringOn: "31 Dec 2026",
};

export const WALLET_TXNS: WalletTxn[] = [
  {
    id: "TX-9012",
    label: "Booking refund",
    detail: "BK-2795 · cancelled by provider",
    date: "14 Jul 2026",
    deltaPaise: 280000,
    kind: "refund",
  },
  {
    id: "TX-8871",
    label: "Referral reward",
    detail: "Aarti M. completed first booking",
    date: "02 Jul 2026",
    deltaPaise: 50000,
    kind: "referral",
  },
  {
    id: "TX-8840",
    label: "Milestone bonus",
    detail: "25 bookings completed",
    date: "18 Jun 2026",
    deltaPaise: 100000,
    kind: "bonus",
  },
  {
    id: "TX-8802",
    label: "Applied to booking",
    detail: "BK-2801 · Security Guard",
    date: "20 Jul 2026",
    deltaPaise: -190000,
    kind: "spend",
  },
];

export const EARN_METHODS = [
  {
    title: "Refer a friend",
    body: "500 SecureCoins when they complete their first booking. They get 10% off.",
  },
  {
    title: "Booking milestones",
    body: "Bonus coins at 10, 25, 50 and 100 completed bookings.",
  },
  {
    title: "Rate your provider",
    body: "50 SecurePoints for every rating left within 48 hours of duty ending.",
  },
  {
    title: "Booking refunds",
    body: "Cancellations and disputes resolved in your favour are credited here.",
  },
];

export type Invoice = {
  id: string;
  bookingId: string;
  service: string;
  date: string;
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
  status: "paid" | "due" | "refunded";
};

export const INVOICES: Invoice[] = [
  {
    id: "INV-2026-0418",
    bookingId: "BK-2831",
    service: "Event Security",
    date: "05 Aug 2026",
    basePaise: 8135600,
    gstPaise: 1464400,
    totalPaise: 9600000,
    status: "paid",
  },
  {
    id: "INV-2026-0402",
    bookingId: "BK-2812",
    service: "Personal Guard",
    date: "28 Jul 2026",
    basePaise: 864400,
    gstPaise: 155600,
    totalPaise: 1020000,
    status: "paid",
  },
  {
    id: "INV-2026-0388",
    bookingId: "BK-2801",
    service: "Security Guard",
    date: "20 Jul 2026",
    basePaise: 338983,
    gstPaise: 61017,
    totalPaise: 400000,
    status: "paid",
  },
  {
    id: "INV-2026-0371",
    bookingId: "BK-2795",
    service: "Bouncer",
    date: "14 Jul 2026",
    basePaise: 237288,
    gstPaise: 42712,
    totalPaise: 280000,
    status: "refunded",
  },
];





export const MEMBERSHIP_BENEFITS = [
  "Zero convenience fee on every booking",
  "Priority matching — your requests go to the top of the queue",
  "Free cancellation up to 2 hours before start",
  "Dedicated support line with a 15-minute response target",
  "Double SecurePoints on every completed booking",
  "Quarterly threat assessment at no charge",
];




export const THREAT_LEVELS = [
  {
    id: "low",
    label: "Low",
    tone: "green",
    body: "No known threats. Standard unarmed cover is appropriate.",
  },
  {
    id: "moderate",
    label: "Moderate",
    tone: "gold",
    body: "Some risk indicators. Consider a trained guard with crowd-control experience.",
  },
  {
    id: "high",
    label: "High",
    tone: "red",
    body: "Credible threat. Armed cover and a route plan are recommended.",
  },
];

export const THREAT_QUESTIONS = [
  "Have you received any direct threats in the last 12 months?",
  "Is the location publicly known or advertised?",
  "Will cash or high-value goods be present?",
  "Has there been an incident at this location before?",
  "Do you have a public profile, or media attention?",
];
