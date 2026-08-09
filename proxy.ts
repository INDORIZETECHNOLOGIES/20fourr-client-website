import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guard. (`middleware.ts` in Next 15 and earlier — renamed to `proxy.ts`
 * in 16; the function must be the default export or named `proxy`.)
 *
 * Deliberately thin. It answers one question — "is there a session cookie?" —
 * and redirects on that. It does not refresh tokens and it does not call the
 * API:
 *
 *  - Refreshing here as well as in /api/bff would mean two rotations racing for
 *    the same refresh token, and the API rejects the loser, signing the user
 *    out. One refresh implementation, in the proxy route, is the whole point.
 *  - The cookie's presence is not proof of a valid session. This is a cheap
 *    redirect so signed-out visitors don't watch a dashboard shell paint before
 *    it fails; the real check is the API rejecting the token.
 *
 * Verification state (phone/email OTP still outstanding) is not decidable here
 * — the JWT carries only the user id and role — so SessionProvider handles that
 * redirect once it has the user.
 */

const SESSION_COOKIE = "sc_rt";

/** Signed-in-only areas. */
const PROTECTED = ["/dashboard", "/book", "/verify-phone", "/verify-email"];

/** Pointless once you're signed in. */
const AUTH_ONLY = ["/login", "/signup", "/forgot-password"];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!signedIn && matches(pathname, PROTECTED)) {
    const url = new URL("/login", request.url);
    // Round-trip the destination so the user lands where they were headed.
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (signedIn && matches(pathname, AUTH_ONLY)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next's own assets and the API routes — /api/bff does
    // its own auth and must be able to answer 401 rather than redirect, which
    // an XHR can't follow usefully.
    "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
