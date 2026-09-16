/**
 * Server-only marketing extras. Fail closed: if the API is unreachable at
 * build time we render nothing rather than invent a count or a name.
 *
 * Uses `cache: "force-cache"` so `/` stays statically generated. Spec 0001
 * forbids fabricated proof numbers.
 */

import { API_BASE_URL } from "@/lib/api/backend";
import { maskPublicProvider, type MaskedProvider } from "@/lib/provider-display";

export type Officer = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type SiteContacts = {
  grievanceOfficer?: Officer;
  dataProtectionOfficer?: Officer;
};

export type CoverageCity = {
  city: string;
  providers: number;
};

export type Coverage = {
  cities: CoverageCity[];
  /** Unique verified providers on the public index, when the API sends pagination. */
  verifiedProviders: number | null;
  /** One listing from the public index, names already stripped. */
  featured: MaskedProvider | null;
  listings: MaskedProvider[];
};

const CITY_ALIASES: Record<string, string> = {
  "ncr delhi": "Delhi",
  "delhi ncr": "Delhi",
  "new delhi": "Delhi",
  delhi: "Delhi",
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  gurgaon: "Gurugram",
  gurugram: "Gurugram",
  "navi mumbai": "Navi Mumbai",
};

function titleCity(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b([a-z])/g, (ch) => ch.toUpperCase());
}

export function normalizeCity(raw: string): string {
  const compact = raw.trim().replace(/\s+/g, " ");
  return CITY_ALIASES[compact.toLowerCase()] ?? titleCity(compact);
}

function unwrap(body: unknown): Record<string, unknown> {
  const root = (body ?? {}) as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return root;
}

async function publicJson(path: string): Promise<unknown | null> {
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Drop values that are obviously unfilled template text.
 *
 * The grievance handler ships with `+91-XXXXXXXXXX` and `[Registered Address]`
 * still in it. Publishing those on the public footer is worse than publishing
 * nothing: a contact nobody can reach reads as negligence to exactly the
 * procurement reader this page is written for, and the IT Act obligation is to
 * provide a *reachable* contact, not a field that exists. So each field is
 * filtered independently — a real email still publishes even while the phone is
 * a placeholder.
 */
const PLACEHOLDER = /^\s*$|X{4,}|\[.*\]|^(tbd|todo|n\/?a)$/i;

function realValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed && !PLACEHOLDER.test(trimmed) ? trimmed : undefined;
}

function cleanOfficer(raw: unknown): Officer | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const cleaned: Officer = {
    name: realValue(o.name),
    email: realValue(o.email),
    phone: realValue(o.phone),
    address: realValue(o.address),
  };
  // A name on its own is not a contact — there must be some way to reach them.
  if (!cleaned.email && !cleaned.phone && !cleaned.address) return undefined;
  return cleaned;
}

export async function getSiteContacts(): Promise<SiteContacts | null> {
  /**
   * `public/`, not `client/`.
   *
   * Both API reference docs describe `GET /client/grievance-officer` as "public,
   * no auth", and it isn't: routes/index.ts mounts the whole /client tree behind
   * `authenticate + requireRole('client')`, so an anonymous call returns SC_106
   * and this function quietly returned null — which is why the footer fell back
   * to prose. IT Act §79 / Intermediary Guidelines 2021 require this contact to
   * be *published*, so the backend now also serves it unauthenticated.
   */
  const body = await publicJson("public/grievance-officer");
  if (!body) return null;
  const data = unwrap(body);
  const go = cleanOfficer(data.grievanceOfficer);
  const dpo = cleanOfficer(data.dataProtectionOfficer);
  if (!go && !dpo) return null;
  return { grievanceOfficer: go, dataProtectionOfficer: dpo };
}

export async function getCoverage(): Promise<Coverage> {
  const body = await publicJson("public/providers?limit=100");
  if (!body) return { cities: [], verifiedProviders: null, featured: null, listings: [] };
  const data = unwrap(body);
  const providers = Array.isArray(data.providers) ? data.providers : [];
  const pagination = data.pagination as { total?: number } | undefined;
  const counts = new Map<string, number>();
  const listings: MaskedProvider[] = [];
  let first: MaskedProvider | null = null;
  let featured: MaskedProvider | null = null;

  for (const raw of providers) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw as Record<string, unknown>;
    const masked = maskPublicProvider(p);
    if (masked) {
      if (!first) first = masked;
      if (!featured && masked.isVerified) featured = masked;
      if (listings.length < 8) listings.push(masked);
    }

    const cities = new Set<string>();
    if (typeof p.serviceCity === "string" && p.serviceCity.trim()) {
      cities.add(normalizeCity(p.serviceCity));
    }
    if (Array.isArray(p.serviceCities)) {
      for (const c of p.serviceCities) {
        if (typeof c === "string" && c.trim()) cities.add(normalizeCity(c));
      }
    }
    for (const city of cities) {
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }
  }

  const list = [...counts.entries()]
    .map(([city, n]) => ({ city, providers: n }))
    .sort((a, b) => b.providers - a.providers || a.city.localeCompare(b.city));

  return {
    cities: list,
    verifiedProviders: typeof pagination?.total === "number" ? pagination.total : null,
    featured: featured ?? first,
    listings,
  };
}

/** @deprecated use getCoverage() */
export async function getCoverageCities(): Promise<CoverageCity[]> {
  return (await getCoverage()).cities;
}
