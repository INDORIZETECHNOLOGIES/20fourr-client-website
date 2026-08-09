/**
 * Browser-side API client.
 *
 * Talks only to this app's own routes — `/api/auth/*` and `/api/bff/*` — never
 * to the SecureConnect API directly. There is no token to attach here: the
 * session rides on an httpOnly cookie the browser sends automatically.
 */

import { ApiError } from "./errors";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
};

function withQuery(path: string, query?: RequestOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Fired when a request comes back with an expired session, so the shell can
 * bounce to /login from one place instead of every call site remembering to.
 */
export const SESSION_EXPIRED_EVENT = "20fourr:session-expired";

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal } = options;
  const isFormData = body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(withQuery(path, query), {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal,
      // Same-origin, but be explicit: the session cookie is the whole point.
      credentials: "same-origin",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(
      "Couldn't reach the server. Check your connection and try again.",
      0,
      "SC_NETWORK",
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: "Unexpected response from the server." };
    }
  }

  if (!response.ok) {
    const b = (parsed ?? {}) as Record<string, unknown>;
    const nested = (b.error ?? null) as Record<string, unknown> | null;
    const error = new ApiError(
      (typeof nested?.message === "string" && nested.message) ||
        (typeof b.message === "string" && b.message) ||
        "Something went wrong. Please try again.",
      response.status,
      (typeof nested?.code === "string" && nested.code) ||
        (typeof b.code === "string" && b.code) ||
        "SC_UNKNOWN",
      (b.fields ?? nested?.fields) as Record<string, string> | undefined,
    );

    if (error.code === "SC_SESSION_EXPIRED" && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    throw error;
  }

  // The proxy forwards the API envelope untouched, so unwrap `data` here the
  // same way the server helper does.
  const envelope = (parsed ?? {}) as Record<string, unknown>;
  return (envelope.data !== undefined ? envelope.data : envelope) as T;
}

/** Authenticated data access, proxied to the API. */
export function api<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(`/api/bff/${path.replace(/^\//, "")}`, options);
}

/** This app's own auth endpoints. */
export function authApi<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(`/api/auth/${path.replace(/^\//, "")}`, options);
}
