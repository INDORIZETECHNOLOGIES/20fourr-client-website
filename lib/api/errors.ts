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

  return new ApiError(message, status, code, fields);
}

/** Narrowing helper — `error` in a catch block is `unknown`. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** The message to show when we don't have anything better. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
