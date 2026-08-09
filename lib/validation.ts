/**
 * Field validators.
 *
 * The password rules started as the hint the Signup design shows as static text
 * ("Min 8 chars · uppercase · number · special char") and now mirror the API's
 * `strongPassword` schema exactly — including the **lowercase** requirement the
 * design's copy omits. That omission mattered: "PASSWORD1!" satisfied every
 * rule on screen and was then rejected by the server, so the meter said "strong"
 * on a password that could not be registered.
 */

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v: string) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "One special character",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

export type PasswordRuleId = (typeof PASSWORD_RULES)[number]["id"];

export function passwordRuleResults(value: string) {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(value),
  }));
}

/** 0–5, one point per satisfied rule. */
export function passwordScore(value: string): number {
  if (!value) return 0;
  return PASSWORD_RULES.reduce((n, rule) => n + (rule.test(value) ? 1 : 0), 0);
}

export function requiredError(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`;
}

export function emailError(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Email address is required.";
  // Deliberately permissive: reject the obviously-malformed, let the server
  // be the authority on the rest.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address.";
  return undefined;
}

/** Indian mobile numbers: 10 digits starting 6–9, ignoring spaces and a +91 prefix. */
export function phoneError(value: string): string | undefined {
  const digits = value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (!digits) return "Phone number is required.";
  if (digits.length !== 10) return "Enter a 10-digit mobile number.";
  if (!/^[6-9]/.test(digits)) return "Enter a valid Indian mobile number.";
  return undefined;
}

export function passwordError(value: string): string | undefined {
  if (!value) return "Password is required.";
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
  if (failed.length === 0) return undefined;
  return "Password must have 8+ characters, upper and lowercase letters, a number and a special character.";
}

export function confirmPasswordError(
  value: string,
  password: string,
): string | undefined {
  if (!value) return "Please confirm your password.";
  if (value !== password) return "Passwords do not match.";
  return undefined;
}

/** Strips everything but digits and caps at 10 — used as the phone input mask. */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

/**
 * GSTIN: 2-digit state code, 5 letters (PAN), 4 digits, 1 letter, 1 alphanumeric,
 * literal Z, then 1 alphanumeric checksum. Same pattern the app enforces.
 */
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function gstinError(value: string): string | undefined {
  if (!value.trim()) return "GSTIN is required for a registered business.";
  if (!GSTIN_RE.test(value.trim()))
    return "Invalid GSTIN format — 15 characters, e.g. 27AAPFU0939F1ZV.";
  return undefined;
}

/** Uppercases and caps at 15, as the app's input mask does. */
export function normalizeGstin(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
}

/** The app requires a minimum of 2 characters on both name fields. */
export function nameError(value: string, label: string): string | undefined {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return "Minimum 2 characters.";
  return undefined;
}

/**
 * The signup name, checked against what the API will accept.
 *
 * Registration sends one `name` built from both fields, and the server's
 * schema allows only letters, spaces, hyphens, apostrophes and dots. Catching
 * that here means a digit in the surname fails on the input rather than after a
 * round trip that has already been rate-limited.
 */
const NAME_CHARS_RE = /^[a-zA-Z\s'.-]+$/;

export function signupNameError(value: string, label: string): string | undefined {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (!NAME_CHARS_RE.test(v)) return "Letters, spaces, hyphens and apostrophes only.";
  return undefined;
}

/** Referral codes are uppercase alphanumeric, 20 characters at most. */
export function referralCodeError(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  if (!/^[A-Z0-9]{1,20}$/.test(v)) return "Letters and numbers only, up to 20 characters.";
  return undefined;
}

export function normalizeReferralCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
}
