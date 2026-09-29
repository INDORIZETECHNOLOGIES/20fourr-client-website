/**
 * Prospective-booking engine: GET /public/billing-flags.
 *
 * Spec 0002 rule 2. Fail closed to false — a v1 UI against a v6 booking
 * degrades; a v6 UI against v1 renders undefined.
 *
 * `NEXT_PUBLIC_FORCE_V6=1` is a local-only shortcut so the money path can be
 * exercised without flipping PlatformSettings. Do not set it in production.
 */

import { API_BASE_URL } from "@/lib/api/backend";

function unwrap(body: unknown): Record<string, unknown> {
  const root = (body ?? {}) as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return root;
}

export type BillingFlags = {
  v6Enabled: boolean;
  /**
   * Backend spec 0014: long-term contracts can be requested. Hides the Contracts nav and the
   * contract step of the funnel while false (website spec 0003, AC 10). Fails closed.
   */
  contractsEnabled: boolean;
};

export async function getBillingFlags(): Promise<BillingFlags> {
  const forceV6 = process.env.NEXT_PUBLIC_FORCE_V6 === "1" || process.env.NEXT_PUBLIC_FORCE_V6 === "true";

  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/public/billing-flags`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return { v6Enabled: forceV6, contractsEnabled: false };
    const flags = unwrap(await res.json());
    return { v6Enabled: forceV6 || flags.v6Enabled === true, contractsEnabled: flags.contractsEnabled === true };
  } catch {
    return { v6Enabled: forceV6, contractsEnabled: false };
  }
}

export async function getV6Enabled(): Promise<boolean> {
  return (await getBillingFlags()).v6Enabled;
}
