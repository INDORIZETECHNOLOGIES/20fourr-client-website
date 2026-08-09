/**
 * Session storage: the JWT pair, held in httpOnly cookies.
 *
 * SERVER ONLY, and specifically only from Route Handlers and Server Actions —
 * `cookies().set()` throws inside a Server Component render. Server Components
 * may call `readTokens()` / `getAccessToken({ allowRefresh: false })` to read,
 * never to rotate.
 *
 * Why cookies rather than localStorage (which is what the mobile app's
 * AsyncStorage maps onto): this site handles GST invoices, saved addresses and
 * payments, so a single XSS that can read a token is an account takeover. An
 * httpOnly cookie is unreadable from JS, and the tokens never enter the bundle.
 */

import { cookies } from "next/headers";
import { backendJson } from "./backend";
import { ApiError } from "./errors";

const ACCESS_COOKIE = "sc_at";
const REFRESH_COOKIE = "sc_rt";

/** Backend defaults: JWT_ACCESS_EXPIRY 15m, JWT_REFRESH_EXPIRY 7d. */
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * Refresh this many seconds before the access token actually expires, so a
 * request that takes a moment doesn't land after the boundary.
 */
const REFRESH_SKEW_SECONDS = 30;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export type Tokens = { accessToken: string; refreshToken: string };

export async function readTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS_COOKIE)?.value ?? null,
    refreshToken: jar.get(REFRESH_COOKIE)?.value ?? null,
  };
}

/** Route Handlers / Server Actions only. */
export async function writeTokens(tokens: Tokens): Promise<void> {
  const jar = await cookies();
  // The access cookie outlives the token itself on purpose: it is the refresh
  // token's 7 days that define the session, and an expired access token is
  // simply exchanged on the next request.
  jar.set(ACCESS_COOKIE, tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_MAX_AGE });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_MAX_AGE });
}

/** Route Handlers / Server Actions only. */
export async function clearTokens(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** Reads `exp` out of a JWT without verifying it — we only need the clock. */
export function tokenExpiry(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { exp?: unknown };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export function isExpired(token: string, skewSeconds = REFRESH_SKEW_SECONDS): boolean {
  const exp = tokenExpiry(token);
  // A token we can't read is treated as expired: worst case we spend one
  // refresh, versus sending a dead token and bouncing the user to /login.
  if (exp === null) return true;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}

/**
 * The API rotates refresh tokens and rejects the second use of one
 * ("single-winner rotation guard"), so two concurrent refreshes would sign the
 * user out. This collapses concurrent callers in this process onto one request.
 * It is not a distributed lock — with several server instances a simultaneous
 * refresh can still lose the race, which surfaces as one forced re-login.
 */
let inFlightRefresh: { token: string; promise: Promise<Tokens | null> } | null = null;

async function requestRefresh(refreshToken: string): Promise<Tokens | null> {
  try {
    const data = await backendJson<{ accessToken?: string; refreshToken?: string }>({
      path: "/auth/refresh-token",
      method: "POST",
      body: { refreshToken },
    });
    if (!data?.accessToken || !data?.refreshToken) return null;
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    return null;
  }
}

/**
 * Exchanges the stored refresh token for a new pair and persists it.
 * Returns null when the session is genuinely over — the caller should clear
 * cookies and send the user to /login.
 */
export async function refreshSession(): Promise<Tokens | null> {
  const { refreshToken } = await readTokens();
  if (!refreshToken) return null;

  if (inFlightRefresh?.token !== refreshToken) {
    inFlightRefresh = { token: refreshToken, promise: requestRefresh(refreshToken) };
  }

  let tokens: Tokens | null;
  try {
    tokens = await inFlightRefresh.promise;
  } finally {
    if (inFlightRefresh?.token === refreshToken) inFlightRefresh = null;
  }

  if (tokens) await writeTokens(tokens);
  return tokens;
}

/**
 * The access token to put on an outgoing request, refreshing first if it has
 * expired. Pass `allowRefresh: false` from a Server Component, where writing
 * cookies is not permitted.
 */
export async function getAccessToken({ allowRefresh = true } = {}): Promise<string | null> {
  const { accessToken, refreshToken } = await readTokens();

  if (accessToken && !isExpired(accessToken)) return accessToken;
  if (!allowRefresh || !refreshToken) return accessToken;

  const rotated = await refreshSession();
  return rotated?.accessToken ?? null;
}

/** True when there is any chance of an authenticated request succeeding. */
export async function hasSession(): Promise<boolean> {
  const { refreshToken } = await readTokens();
  return Boolean(refreshToken);
}

/** Thrown when a request needs a session and there isn't a usable one. */
export class SessionExpiredError extends ApiError {
  constructor() {
    super("Your session has expired. Please sign in again.", 401, "SC_SESSION_EXPIRED");
    this.name = "SessionExpiredError";
  }
}
