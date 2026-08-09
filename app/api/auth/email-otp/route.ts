import { NextResponse } from "next/server";
import { errorResponse, readJsonBody } from "@/lib/api/route-helpers";
import { apiFetch } from "@/lib/api/server";

/**
 * Email verification. Both API endpoints are authenticated and take the address
 * from the token, so there is nothing to pass but the code itself.
 */

/** POST — send (or resend) the emailed code. */
export async function POST() {
  try {
    await apiFetch({ path: "/auth/send-email-verification", method: "POST" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT — submit the 6 digits. */
export async function PUT(request: Request) {
  try {
    const { otp } = await readJsonBody<{ otp?: string }>(request);
    await apiFetch({ path: "/auth/verify-email", method: "POST", body: { otp } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
