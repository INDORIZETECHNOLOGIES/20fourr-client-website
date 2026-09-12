/**
 * GST state names as `stateCodeFromName()` expects them.
 *
 * Spec 0002: price-preview `deploymentState` is a state *name*, not a code.
 * A two-digit code here will not resolve and falls through to SC_1413.
 */
export const GST_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
];

const ALIASES: Record<string, string> = {
  nct: "Delhi",
  "nct of delhi": "Delhi",
  "ncr delhi": "Delhi",
  "new delhi": "Delhi",
  uttarakhand: "Uttarakhand",
  uttaranchal: "Uttarakhand",
  orissa: "Odisha",
  pondicherry: "Puducherry",
};

export function matchGstStateName(raw?: string | null): string {
  if (!raw?.trim()) return "";
  const compact = raw.trim().replace(/\s+/g, " ");
  const alias = ALIASES[compact.toLowerCase()];
  if (alias) return alias;
  const hit = GST_STATES.find((s) => s.name.toLowerCase() === compact.toLowerCase());
  return hit?.name ?? "";
}
