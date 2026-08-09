/**
 * Booking funnel fixtures. Swap seam — see lib/dashboard-data.ts.
 */

export type Provider = {
  id: string;
  name: string;
  initials: string;
  serviceName: string;
  city: string;
  rating: number;
  reviews: number;
  jobs: number;
  yearsExperience: number;
  ratePaise: number;
  verified: boolean;
  psaraId: string;
  languages: string[];
  skills: string[];
  about: string;
};

export const CITIES = [
  "New Delhi",
  "Gurugram",
  "Noida",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
];

export const PROVIDERS: Provider[] = [
  {
    id: "PRV-101",
    name: "Rajveer Singh",
    initials: "RS",
    serviceName: "Security Guard",
    city: "New Delhi",
    rating: 4.9,
    reviews: 218,
    jobs: 341,
    yearsExperience: 9,
    ratePaise: 28000,
    verified: true,
    psaraId: "PSARA/DL/2019/4471",
    languages: ["Hindi", "English", "Punjabi"],
    skills: ["Perimeter control", "Access screening", "Fire safety"],
    about:
      "Nine years guarding retail and corporate premises across Delhi NCR. Trained in crowd management and emergency evacuation.",
  },
  {
    id: "PRV-102",
    name: "Imran Hussain",
    initials: "IH",
    serviceName: "Bouncer",
    city: "New Delhi",
    rating: 4.7,
    reviews: 156,
    jobs: 402,
    yearsExperience: 7,
    ratePaise: 42000,
    verified: true,
    psaraId: "PSARA/DL/2020/8812",
    languages: ["Hindi", "English"],
    skills: ["Crowd control", "Conflict de-escalation", "VIP handling"],
    about:
      "Nightlife and event specialist. Handles door screening and crowd flow for venues up to 2,000 capacity.",
  },
  {
    id: "PRV-103",
    name: "Anil Kumar",
    initials: "AK",
    serviceName: "PSO",
    city: "Gurugram",
    rating: 5.0,
    reviews: 94,
    jobs: 132,
    yearsExperience: 14,
    ratePaise: 72000,
    verified: true,
    psaraId: "PSARA/HR/2016/2205",
    languages: ["Hindi", "English"],
    skills: ["Close protection", "Route planning", "Threat assessment"],
    about:
      "Former state police, fourteen years in personal security. Specialises in executive protection and secure transit.",
  },
  {
    id: "PRV-104",
    name: "Vikram Shetty",
    initials: "VS",
    serviceName: "Corporate Security",
    city: "Bengaluru",
    rating: 4.8,
    reviews: 173,
    jobs: 289,
    yearsExperience: 11,
    ratePaise: 52000,
    verified: true,
    psaraId: "PSARA/KA/2018/6390",
    languages: ["Kannada", "Hindi", "English"],
    skills: ["Access control", "CCTV monitoring", "Incident reporting"],
    about:
      "Manages security desks for tech campuses. Experienced with visitor management systems and shift rosters.",
  },
  {
    id: "PRV-105",
    name: "Harpreet Kaur",
    initials: "HK",
    serviceName: "Personal Guard",
    city: "New Delhi",
    rating: 4.9,
    reviews: 121,
    jobs: 198,
    yearsExperience: 8,
    ratePaise: 88000,
    verified: true,
    psaraId: "PSARA/DL/2019/7734",
    languages: ["Hindi", "English"],
    skills: ["Close protection", "Family security", "Defensive driving"],
    about:
      "Personal protection for families and individuals. Trained in defensive driving and discreet close escort.",
  },
  {
    id: "PRV-106",
    name: "Ex-Sub Ramesh Yadav",
    initials: "RY",
    serviceName: "Ex-Servicemen",
    city: "Noida",
    rating: 4.8,
    reviews: 88,
    jobs: 164,
    yearsExperience: 22,
    ratePaise: 47000,
    verified: true,
    psaraId: "PSARA/UP/2017/1188",
    languages: ["Hindi", "English"],
    skills: ["Site command", "Team supervision", "Emergency response"],
    about:
      "Twenty-two years army service, six years in private security. Leads guard teams on industrial sites.",
  },
];

/**
 * The API's `bookingPurpose` enum, verbatim.
 *
 * These were previously invented (residential / commercial / event / personal /
 * transit / other) and the server rejected every one of them with
 * "bookingPurpose: Invalid booking purpose", blocking the final Confirm step.
 * The values below are the nine the validator accepts, with the same labels and
 * descriptions the client app shows.
 */
export const BOOKING_PURPOSES = [
  { id: "political", label: "Political Security", desc: "Political events, rallies, VIP protection" },
  { id: "wedding", label: "Wedding", desc: "Wedding ceremonies and receptions" },
  { id: "functions", label: "Functions & Events", desc: "Corporate events, galas, concerts" },
  { id: "celebrity", label: "Celebrity Security", desc: "Celebrity or public figure protection" },
  { id: "industrial", label: "Industrial Security", desc: "Factories, warehouses, industrial sites" },
  { id: "building_guard", label: "Building Guard", desc: "Residential or commercial building security" },
  { id: "commute_travel", label: "Commute / Travel", desc: "Travel escort and route protection" },
  { id: "protection_threat", label: "Protection / Threat", desc: "Personal threat or high-risk protection" },
  { id: "other", label: "Other", desc: "Specify your own requirement" },
] as const;

export type BookingPurposeId = (typeof BOOKING_PURPOSES)[number]["id"];

export function isBookingPurpose(value: string): value is BookingPurposeId {
  return BOOKING_PURPOSES.some((p) => p.id === value);
}

export const DURATION_PRESETS = [4, 8, 12, 24];

export const REPEAT_PATTERNS = [
  { id: "none", label: "One-time" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekly", label: "Weekly" },
];

/** Convenience fee the app adds on top of the base amount, in basis points. */
export const CONVENIENCE_FEE_BPS = 500; // 5%
export const GST_BPS = 1800; // 18%

export type PriceBreakdown = {
  basePaise: number;
  conveniencePaise: number;
  gstPaise: number;
  discountPaise: number;
  totalPaise: number;
};

/**
 * Every line is derived from the same integer base and rounded once, so the
 * lines always sum to the total — see the rounding note in lib/money.ts.
 */
export function priceBooking(
  ratePaise: number,
  hours: number,
  discountPaise = 0,
): PriceBreakdown {
  const basePaise = ratePaise * hours;
  const conveniencePaise = Math.round((basePaise * CONVENIENCE_FEE_BPS) / 10000);
  const taxable = basePaise + conveniencePaise - discountPaise;
  const gstPaise = Math.round((taxable * GST_BPS) / 10000);
  return {
    basePaise,
    conveniencePaise,
    gstPaise,
    discountPaise,
    totalPaise: taxable + gstPaise,
  };
}

export const COUPONS: Record<string, { label: string; offBps: number }> = {
  FIRST10: { label: "10% off your first booking", offBps: 1000 },
  SAFE20: { label: "20% off — safety week", offBps: 2000 },
};
