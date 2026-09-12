/**
 * One error type for every failure that comes back from the API.
 *
 * The backend emits two envelope shapes and we have to read both:
 *
 *   { success: false, error: { code, message, status, fields? }, requestId }
 *   { success: false, code, message }
 *
 * `fields` is the useful one — the API's zod/express-validator layer returns a
 * `{ fieldName: "message" }` map, which is exactly what the forms already render
 * inline. Without it every validation failure degrades to a banner.
 */

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  /** HTTP status. 0 when the request never reached the server. */
  readonly status: number;
  /** The API's own code — "SC_101", "SC_VALIDATION_ERROR", … */
  readonly code: string;
  /** Per-field messages, present only on validation failures. */
  readonly fields?: FieldErrors;

  constructor(message: string, status: number, code: string, fields?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  /** True when re-authenticating could plausibly fix this. */
  get isAuthError(): boolean {
    return this.status === 401 || ["SC_105", "SC_106", "SC_107", "SC_108"].includes(this.code);
  }
}

export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server. Check your connection and try again.";

/** Reads either envelope shape and returns a normalised ApiError. */
export function toApiError(status: number, body: unknown): ApiError {
  const b = (body ?? {}) as Record<string, unknown>;
  const nested = (b.error ?? null) as Record<string, unknown> | null;

  const code =
    (typeof nested?.code === "string" && nested.code) ||
    (typeof b.code === "string" && b.code) ||
    "SC_UNKNOWN";

  const message =
    (typeof nested?.message === "string" && nested.message) ||
    (typeof b.message === "string" && b.message) ||
    "Something went wrong. Please try again.";

  const rawFields = nested?.fields ?? b.fields;
  const fields =
    rawFields && typeof rawFields === "object"
      ? (rawFields as FieldErrors)
      : undefined;

  return new ApiError(friendlyMessage(code, message), status, code, fields);
}

/** Narrowing helper — `error` in a catch block is `unknown`. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const FRIENDLY: Record<string, string> = {
  SC_1413: "Tell us the state this shift is in so we can price GST correctly.",
  SC_1420: "This provider is not currently bookable. Pick another.",
  SC_1421: "Add a state to your profile address, then try again.",
  SC_1422: "We couldn't price this booking — try again shortly.",
  SC_1423: "This booking is below the minimum value. Extend the duration and try again.",
  SC_1424: "Wallet coins and points cannot be used on this booking.",
  SC_1425: "Coupon codes cannot be used on this booking.",
  // PSARA state coverage, gated on REQUIRE_PSARA_STATE_MATCH. Architecture
  // v6.0 §W.2-17: a provider must hold a live PSARA licence in the state the
  // guards actually work in, not their home state.
  SC_1414: "This provider isn't PSARA-licensed in the state you're deploying to. Pick another provider, or change the deployment state.",
  SC_1415: "This provider's PSARA licence for that state has expired. Pick another provider.",
  SC_1440: "That document could not be found.",
  SC_1441: "You don't have access to that document.",
};

function friendlyMessage(code: string, fallback: string): string {
  return FRIENDLY[code] ?? fallback;
}

/** The message to show when we don't have anything better. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return friendlyMessage(error.code, error.message);
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function errorCode(error: unknown): string | null {
  return isApiError(error) ? error.code : null;
}
