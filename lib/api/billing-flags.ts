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

export async function getV6Enabled(): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_FORCE_V6 === "1" || process.env.NEXT_PUBLIC_FORCE_V6 === "true") {
    return true;
  }

  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/public/billing-flags`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return false;
    const body: unknown = await res.json();
    return unwrap(body).v6Enabled === true;
  } catch {
    return false;
  }
}
