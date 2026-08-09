import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/route-helpers";
import { apiFetch } from "@/lib/api/server";
import { clearTokens, hasSession } from "@/lib/api/session";
import { isApiError } from "@/lib/api/errors";
import type { ApiUser } from "@/lib/api/types";

/**
 * Who am I? Returns `{ user: null }` rather than a 401 for a signed-out
 * visitor, so the client can treat "no session" as a normal state instead of
 * an error path.
 */
export async function GET() {
  try {
    if (!(await hasSession())) return NextResponse.json({ user: null });

    const data = await apiFetch<{ user: ApiUser }>({ path: "/auth/me" });
    return NextResponse.json({ user: data.user });
  } catch (error) {
    if (isApiError(error) && error.isAuthError) {
      // The refresh token is dead too. Drop the cookies so the next request
      // doesn't repeat this round-trip.
      await clearTokens();
      return NextResponse.json({ user: null });
    }
    return errorResponse(error);
  }
}
