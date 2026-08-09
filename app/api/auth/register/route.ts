import { NextResponse } from "next/server";
import { backendJson } from "@/lib/api/backend";
import { errorResponse, readJsonBody } from "@/lib/api/route-helpers";
import { writeTokens } from "@/lib/api/session";
import type { RegisterResponse } from "@/lib/api/types";

type Body = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  referralCode?: string;
  termsAccepted?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<Body>(request);

    const data = await backendJson<RegisterResponse>({
      path: "/auth/register",
      method: "POST",
      body: {
        // The User model stores one `name`. The form collects two fields
        // because the app's Edit Profile does, and it splits on the first
        // space to get them back — so join with exactly one space.
        name: `${body.firstName ?? ""} ${body.lastName ?? ""}`.trim().replace(/\s+/g, " "),
        email: body.email,
        phone: body.phone,
        password: body.password,
        confirmPassword: body.confirmPassword ?? body.password,
        role: "client",
        ...(body.referralCode ? { referralCode: body.referralCode.trim().toUpperCase() } : {}),
        // Recorded server-side at the moment of consent. The signup form's
        // terms checkbox is the gate; this is the evidence.
        ...(body.termsAccepted ? { termsAcceptedAt: new Date().toISOString() } : {}),
      },
    });

    // Registration already issues a session, and it has to: the phone OTP is
    // verified on a public route but the email OTP endpoints are
    // authenticated, so the user must be signed in before /verify-email.
    await writeTokens(data.tokens);

    return NextResponse.json({
      userId: data.userId,
      email: data.email,
      phone: data.phone,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
