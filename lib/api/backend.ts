/**
 * The only module that talks to the SecureConnect API.
 *
 * SERVER ONLY. `API_BASE_URL` has no NEXT_PUBLIC_ prefix, so importing this from
 * a client component gives you `undefined` and a broken request rather than a
 * leak — but don't rely on that, keep it server-side. The browser reaches the
 * API through this app's own route handlers (app/api/*), never directly:
 *
 *   browser → /api/bff/... (route handler, attaches Bearer from httpOnly cookie)
 *           → http://localhost:3000/api/v1/...
 *
 * Two reasons for the indirection, both load-bearing:
 *  1. The JWTs stay in httpOnly cookies, out of reach of any XSS on the page.
 *  2. The API's CORS whitelist doesn't include this origin, so a direct browser
 *     fetch is refused at the preflight anyway.
 */

import { toApiError, ApiError, NETWORK_ERROR_MESSAGE } from "./errors";

export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/api/v1";

/** Matches the API's own timeout so we fail at the same point it does. */
const TIMEOUT_MS = 30_000;

export type BackendResponse = {
  status: number;
  /** Parsed JSON body, or null for 204 / non-JSON responses. */
  body: unknown;
};

export type BackendRequest = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Plain object → JSON. FormData is passed through so the boundary survives. */
  body?: unknown;
  /** Access token to send as `Authorization: Bearer …`. */
  token?: string | null;
  /** Extra headers, merged last. */
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: BackendRequest["query"]): string {
  const url = new URL(
    `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * The underlying fetch, returning the Response untouched.
 *
 * Needed for endpoints that answer with something other than JSON — the GST
 * invoice PDF at /invoices/:id/pdf being the one that matters. Reading those
 * through `callBackend` would run the bytes through `response.text()` and hand
 * back a mangled string.
 */
export async function callBackendRaw({
  path,
  method = "GET",
  body,
  token,
  headers,
  query,
}: BackendRequest): Promise<Response> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body:
        body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      credentials: "omit",
      cache: "no-store",
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    throw new ApiError(
      timedOut ? "The server took too long to respond. Please try again." : NETWORK_ERROR_MESSAGE,
      0,
      timedOut ? "SC_TIMEOUT" : "SC_NETWORK",
    );
  }
}

/**
 * Raw call. Resolves for every HTTP status — it never throws on a 4xx — so the
 * proxy route can forward the API's own status and body through untouched.
 * Only genuine transport failures reject, as an ApiError with status 0.
 */
export async function callBackend({
  path,
  method = "GET",
  body,
  token,
  headers,
  query,
}: BackendRequest): Promise<BackendResponse> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    // Left unset for FormData so fetch can add the multipart boundary itself.
    ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body:
        body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Auth is an explicit Bearer header; never let cookies ride along.
      credentials: "omit",
      cache: "no-store",
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    throw new ApiError(
      timedOut ? "The server took too long to respond. Please try again." : NETWORK_ERROR_MESSAGE,
      0,
      timedOut ? "SC_TIMEOUT" : "SC_NETWORK",
    );
  }

  if (response.status === 204) return { status: 204, body: null };

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // A non-JSON body means something in front of the API answered (nginx, a
      // rate limiter). Keep the text so the message isn't an empty banner.
      parsed = { message: text.slice(0, 300) };
    }
  }

  return { status: response.status, body: parsed };
}

/**
 * Call and unwrap. Returns `body.data` (the API's envelope) and throws ApiError
 * on any non-2xx. Use this everywhere except the pass-through proxy.
 */
export async function backendJson<T = unknown>(request: BackendRequest): Promise<T> {
  const { status, body } = await callBackend(request);

  if (status < 200 || status >= 300) {
    throw toApiError(status, body);
  }

  const envelope = (body ?? {}) as Record<string, unknown>;
  // Most endpoints answer { success, data }, a few answer { success, message }
  // only. Hand back `data` when it exists, else the whole envelope.
  return (envelope.data !== undefined ? envelope.data : envelope) as T;
}
