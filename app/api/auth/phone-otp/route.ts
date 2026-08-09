import { NextResponse } from "next/server";
import { backendJson } from "@/lib/api/backend";
import { errorResponse, readJsonBody } from "@/lib/api/route-helpers";
import { apiFetch } from "@/lib/api/server";
import type { ApiUser } from "@/lib/api/types";

/**
 * Phone verification, both halves.
 *
 * The API's /auth/send-otp and /auth/verify-otp are public and take the phone
 * number in the body. We deliberately do NOT forward a client-supplied number:
 * the phone is read from the signed-in user, so this proxy can't be driven as
 * an open SMS relay against arbitrary numbers. Registration and login both
 * issue a session before these screens, so there is always one to read.
 */
async function sessionPhone(): Promise<string> {
  const { user } = await apiFetch<{ user: ApiUser }>({ path: "/auth/me" });
  return user.phone;
}

/** POST — send (or resend) the SMS code. */
export async function POST() {
  try {
    const phone = await sessionPhone();
    await backendJson({ path: "/auth/send-otp", method: "POST", body: { phone } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT — submit the 6 digits. */
export async function PUT(request: Request) {
  try {
    const { otp } = await readJsonBody<{ otp?: string }>(request);
    const phone = await sessionPhone();
    await backendJson({
      path: "/auth/verify-otp",
      method: "POST",
      body: { phone, otp },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
