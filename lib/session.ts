/**
 * Carries the identity captured at signup across to the two verify screens.
 *
 * The VerifyPhone design hardcodes `last4: '0560'`. This replaces that with the
 * number actually entered, and degrades to a neutral mask when a verify screen
 * is opened directly (deep link, refresh after clearing storage).
 *
 * sessionStorage, not localStorage: an abandoned half-finished signup should not
 * outlive the tab. Swap this whole module for real server session reads when the
 * backend lands.
 */

const KEY = "20fourr.pending-signup";

export type PendingSignup = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function savePendingSignup(data: PendingSignup): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Private browsing / storage disabled. The verify screens fall back to masks.
  }
}

export function readPendingSignup(): PendingSignup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "email" in parsed &&
      "phone" in parsed
    ) {
      return parsed as PendingSignup;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingSignup(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}

/** "98765 43210" → "0560"-style tail for the "code sent to ****NNNN" line. */
export function lastFour(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : null;
}

/** "jane.doe@acme.com" → "j•••••••e@acme.com" */
export function maskEmail(email: string): string | null {
  const at = email.indexOf("@");
  if (at < 1) return null;
  const name = email.slice(0, at);
  const domain = email.slice(at);
  if (name.length <= 2) return `${name[0]}•${domain}`;
  return `${name[0]}${"•".repeat(Math.min(name.length - 2, 8))}${name.at(-1)}${domain}`;
}
