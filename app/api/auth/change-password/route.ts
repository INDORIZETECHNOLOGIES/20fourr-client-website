import { NextResponse } from "next/server";
import { errorResponse, readJsonBody } from "@/lib/api/route-helpers";
import { apiFetch } from "@/lib/api/server";
import { clearTokens } from "@/lib/api/session";

/**
 * Password change — a two-step flow, not a form submit.
 *
 * The API does not accept the current password as authorisation. It emails a
 * 6-digit code (`POST /auth/change-password/send-otp`), and the change itself
 * (`POST /auth/change-password`) carries that code. Anyone building this as
 * "old password → new password" would find no endpoint for it.
 *
 * These live here rather than behind /api/bff because the BFF allowlist
 * deliberately excludes `auth/` — session-mutating routes get explicit
 * handlers so nothing about the session can be driven by an arbitrary path.
 */

/** POST — send (or resend) the emailed code. */
export async function POST() {
  try {
    await apiFetch({ path: "/auth/change-password/send-otp", method: "POST" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT — submit the code and the new password. */
export async function PUT(request: Request) {
  try {
    const body = await readJsonBody<{
      otp?: string;
      newPassword?: string;
      confirmPassword?: string;
    }>(request);

    await apiFetch({
      path: "/auth/change-password",
      method: "POST",
      body: {
        otp: body.otp,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword ?? body.newPassword,
      },
    });

    // The API revokes every session on success — including this one. Clearing
    // the cookies here keeps the browser honest: without this the user would
    // appear signed in while every subsequent request 401s.
    await clearTokens();

    return NextResponse.json({ ok: true, signedOut: true });
  } catch (error) {
    return errorResponse(error);
  }
}
