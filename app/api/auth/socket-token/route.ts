import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/route-helpers";
import { getAccessToken, tokenExpiry } from "@/lib/api/session";

/**
 * Hands the browser an access token for the Socket.io handshake.
 *
 * THIS IS THE ONE PLACE THE ACCESS TOKEN LEAVES THE COOKIE. Everything else on
 * this site is designed so no script can read it — the token lives in an
 * httpOnly cookie and the BFF attaches it server-side. Socket.io's handshake
 * authenticates with the raw JWT (`socket.handshake.auth.token`, verified
 * against JWT_ACCESS_SECRET), so realtime is impossible without exposing it.
 *
 * The residual risk is real and worth stating plainly: an XSS on this site
 * could call this endpoint and exfiltrate a working token. What limits the
 * blast radius:
 *
 *  - The access token is short-lived (15 minutes). The REFRESH token, which is
 *    what would give an attacker durable access, is never returned here and
 *    stays httpOnly.
 *  - Callers hold it in memory only. Never write it to localStorage,
 *    sessionStorage, or a non-httpOnly cookie.
 *  - It is only fetched on screens that actually open a socket.
 *
 * If realtime is ever dropped, delete this route.
 */
export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json(
        { message: "Your session has expired. Please sign in again.", code: "SC_SESSION_EXPIRED" },
        { status: 401 },
      );
    }

    const exp = tokenExpiry(token);
    return NextResponse.json(
      { token, expiresAt: exp ? exp * 1000 : null },
      // Belt and braces: never let a proxy or the browser cache a credential.
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
