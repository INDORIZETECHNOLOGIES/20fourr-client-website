/**
 * Auth service — now backed by the real API.
 *
 * This file was written as the swap seam, and it held: the screens still import
 * `signIn`, `signUp`, `sendOtp`, `verifyOtp` with the same signatures, and
 * still catch `AuthError` with an optional `field` to render inline. What
 * changed is underneath — every call goes to this app's own route handlers,
 * which attach the session and forward to SecureConnect.
 *
 * Three things the stub could not model, and the screens now have to:
 *
 *  1. **Registration signs you in.** The API issues a token pair at /register
 *     because the email OTP endpoints are authenticated. So the verify screens
 *     run inside a session, and a half-finished signup leaves a real account.
 *  2. **Phone and email verify differently.** Phone OTP is public and keyed by
 *     number; email OTP is authenticated and keyed by the token. Both are
 *     hidden behind `sendOtp(channel)` / `verifyOtp(channel, code)` here.
 *  3. **Login can succeed and still not be done.** `requiresVerification` comes
 *     back true when either identifier is outstanding, and the user has to
 *     finish before the API will serve any feature route.
 */

import { authApi } from "./api/client";
import { isApiError } from "./api/errors";
import type { ApiUser } from "./api/types";

export type OtpChannel = "phone" | "email";

/** Seconds before "Resend" re-arms. Matches the design's starting countdown. */
export const RESEND_SECONDS = 54;

export class AuthError extends Error {
  /** Name of the input this message belongs to, when it maps to one. */
  readonly field?: string;
  /** The API's own code, for callers that need to branch on it. */
  readonly code?: string;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = "AuthError";
    this.field = field;
    this.code = code;
  }
}

/**
 * Which input an API error belongs to.
 *
 * SC_101 is deliberately absent: "Invalid email or password" is one message for
 * both, because saying which half was wrong tells an attacker which addresses
 * are registered. Keep it form-level.
 */
const CODE_TO_FIELD: Record<string, string> = {
  SC_204: "email", // email already registered
  SC_205: "phone", // phone already registered
  SC_202: "email",
  SC_203: "phone",
  SC_206: "password",
  SC_207: "code", // invalid or expired OTP
};

/** The API's field names, where they differ from the form's input names. */
const FIELD_ALIASES: Record<string, string> = {
  name: "firstName",
  otp: "code",
  newPassword: "password",
};

function toAuthError(error: unknown): AuthError {
  if (!isApiError(error)) {
    return new AuthError(
      error instanceof Error ? error.message : "Something went wrong. Please try again.",
    );
  }

  // A validation failure carries a per-field map — surface the first one on its
  // own input rather than flattening everything into a banner.
  if (error.fields) {
    const [apiField, message] = Object.entries(error.fields)[0] ?? [];
    if (apiField && message) {
      return new AuthError(message, FIELD_ALIASES[apiField] ?? apiField, error.code);
    }
  }

  return new AuthError(error.message, CODE_TO_FIELD[error.code], error.code);
}

export type SignInInput = { email: string; password: string };

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  referralCode?: string;
  termsAccepted?: boolean;
};

export type AuthUser = ApiUser;

export type SignInResult = {
  user: AuthUser;
  /** True when phone or email is still unverified — send them to the OTP screens. */
  requiresVerification: boolean;
};

export async function signIn(input: SignInInput): Promise<SignInResult> {
  try {
    return await authApi<SignInResult>("login", {
      method: "POST",
      body: { email: input.email.trim().toLowerCase(), password: input.password },
    });
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function signUp(
  input: SignUpInput,
): Promise<{ userId: string; email: string; phone: string }> {
  try {
    return await authApi("register", {
      method: "POST",
      body: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.replace(/\D/g, ""),
        password: input.password,
        confirmPassword: input.confirmPassword ?? input.password,
        referralCode: input.referralCode?.trim() || undefined,
        termsAccepted: input.termsAccepted ?? true,
      },
    });
  } catch (error) {
    throw toAuthError(error);
  }
}

/** Sends, or resends, the code for the given channel. */
export async function sendOtp(channel: OtpChannel): Promise<{ channel: OtpChannel }> {
  try {
    await authApi(channel === "phone" ? "phone-otp" : "email-otp", { method: "POST" });
    return { channel };
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function verifyOtp(
  channel: OtpChannel,
  code: string,
): Promise<{ channel: OtpChannel; verified: true }> {
  if (code.length !== 6) {
    throw new AuthError("Enter all 6 digits of the code.", "code");
  }
  try {
    await authApi(channel === "phone" ? "phone-otp" : "email-otp", {
      method: "PUT",
      body: { otp: code },
    });
    return { channel, verified: true };
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await authApi("forgot-password", {
      method: "POST",
      body: { email: email.trim().toLowerCase() },
    });
  } catch (error) {
    throw toAuthError(error);
  }
}

/** Clears the session cookies and the API's stored refresh token. */
export async function signOut(): Promise<void> {
  try {
    await authApi("logout", { method: "POST" });
  } catch {
    // The route clears cookies even when the API call fails, so there is
    // nothing useful to report here — the user is signed out either way.
  }
}

/** The signed-in user, or null. Never throws for "not signed in". */
export async function fetchSession(): Promise<AuthUser | null> {
  try {
    const { user } = await authApi<{ user: AuthUser | null }>("session");
    return user;
  } catch {
    return null;
  }
}
