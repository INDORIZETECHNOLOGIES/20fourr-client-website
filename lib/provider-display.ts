/**
 * Public-facing provider identity.
 *
 * `GET /public/providers` (and discovery search) still send `businessName` and
 * `user.fullName`. Those must not reach the marketing site or the pre-booking
 * list: an agency's trading name and an individual's name are not public
 * until a paid booking exists. Kind is inferred from whether a business name
 * is on file — the list endpoint has no `providerType`.
 */

import { isServiceCategory, serviceById } from "@/lib/services";

export type ProviderKind = "agency" | "individual";

export type MaskedProvider = {
  id: string;
  kind: ProviderKind;
  /** "Licensed agency" or "Licensed professional" — never a personal or trading name. */
  title: string;
  /** Stable public handle derived from the id, not from a name. */
  code: string;
  initials: string;
  city: string | null;
  categoryLabel: string | null;
  isVerified: boolean;
  averageRating: number | null;
  totalRatings: number;
  dailyRatePaise: number | null;
  hourlyRatePaise: number | null;
};

export function publicProviderCode(id: string): string {
  const compact = id.replace(/[^a-zA-Z0-9]/g, "");
  const tail = (compact.slice(-4) || "0000").toUpperCase();
  return `P-${tail}`;
}

export function providerKind(businessName?: string | null): ProviderKind {
  return businessName && businessName.trim() ? "agency" : "individual";
}

export function maskedProviderTitle(kind: ProviderKind): string {
  return kind === "agency" ? "Licensed agency" : "Licensed professional";
}

export function maskedProviderInitials(kind: ProviderKind): string {
  return kind === "agency" ? "LA" : "LP";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function firstCategoryLabel(categories: unknown): string | null {
  if (!Array.isArray(categories)) return null;
  for (const raw of categories) {
    if (typeof raw !== "string") continue;
    if (isServiceCategory(raw)) return serviceById(raw)?.name ?? raw;
  }
  return null;
}

function ratePaise(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function maskPublicProvider(raw: unknown): MaskedProvider | null {
  const p = asRecord(raw);
  if (!p || typeof p.id !== "string" || !p.id) return null;

  const kind = providerKind(typeof p.businessName === "string" ? p.businessName : null);
  const pricing = asRecord(p.pricing);
  const rating =
    typeof p.averageRating === "number" && Number.isFinite(p.averageRating)
      ? p.averageRating
      : null;

  return {
    id: p.id,
    kind,
    title: maskedProviderTitle(kind),
    code: publicProviderCode(p.id),
    initials: maskedProviderInitials(kind),
    city: typeof p.serviceCity === "string" && p.serviceCity.trim() ? p.serviceCity.trim() : null,
    categoryLabel: firstCategoryLabel(p.serviceCategories),
    isVerified: Boolean(p.isVerified),
    averageRating: rating,
    totalRatings: typeof p.totalRatings === "number" ? p.totalRatings : 0,
    dailyRatePaise: ratePaise(pricing?.dailyRate),
    hourlyRatePaise: ratePaise(pricing?.hourlyRate),
  };
}
