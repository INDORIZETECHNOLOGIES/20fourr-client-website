/**
 * Authenticated server-side API access.
 *
 * `apiFetch` attaches the session's access token, and retries once through a
 * refresh if the API answers 401 — that covers the case where the token looked
 * valid by its `exp` but the API rejected it anyway (revoked, rotated
 * elsewhere, clock drift).
 *
 * Safe from Route Handlers and Server Actions. From a Server Component use
 * `apiFetchReadOnly`, which will not attempt to rotate cookies.
 */

import { callBackend, type BackendRequest } from "./backend";
import { toApiError } from "./errors";
import { getAccessToken, refreshSession, SessionExpiredError } from "./session";

type AuthedRequest = Omit<BackendRequest, "token">;

function unwrap<T>(body: unknown): T {
  const envelope = (body ?? {}) as Record<string, unknown>;
  return (envelope.data !== undefined ? envelope.data : envelope) as T;
}

export async function apiFetch<T = unknown>(request: AuthedRequest): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new SessionExpiredError();

  let response = await callBackend({ ...request, token });

  if (response.status === 401) {
    const rotated = await refreshSession();
    if (!rotated) throw new SessionExpiredError();
    response = await callBackend({ ...request, token: rotated.accessToken });
  }

  if (response.status < 200 || response.status >= 300) {
    throw toApiError(response.status, response.body);
  }
  return unwrap<T>(response.body);
}

/**
 * Read-only variant for Server Components, which cannot write cookies. A token
 * that has already expired is used as-is and the resulting 401 becomes a
 * SessionExpiredError for the page to redirect on — the proxy will have
 * refreshed on the way in for ordinary navigations.
 */
export async function apiFetchReadOnly<T = unknown>(request: AuthedRequest): Promise<T> {
  const token = await getAccessToken({ allowRefresh: false });
  if (!token) throw new SessionExpiredError();

  const response = await callBackend({ ...request, token });

  if (response.status === 401) throw new SessionExpiredError();
  if (response.status < 200 || response.status >= 300) {
    throw toApiError(response.status, response.body);
  }
  return unwrap<T>(response.body);
}
