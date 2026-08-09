/**
 * Shared plumbing for the route handlers under app/api.
 *
 * Every handler answers in one shape so the browser client has a single thing
 * to parse:
 *
 *   ok    → 2xx, the payload as-is
 *   error → non-2xx, { message, code, fields? }
 */

import { NextResponse } from "next/server";
import { ApiError, isApiError } from "./errors";

export type ErrorBody = {
  message: string;
  code: string;
  fields?: Record<string, string>;
};

export function errorResponse(error: unknown): NextResponse<ErrorBody> {
  if (isApiError(error)) {
    // Status 0 means the request never left this server — report it as a
    // gateway failure rather than a client error, which is what it is.
    const status = error.status === 0 ? 502 : error.status;
    return NextResponse.json(
      { message: error.message, code: error.code, ...(error.fields && { fields: error.fields }) },
      { status },
    );
  }

  console.error("[api] unhandled route error", error);
  return NextResponse.json(
    { message: "Something went wrong. Please try again.", code: "SC_UNKNOWN" },
    { status: 500 },
  );
}

/** Parses a JSON body, turning a malformed one into a 400 rather than a 500. */
export async function readJsonBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError("Malformed request body.", 400, "SC_BAD_REQUEST");
  }
}
