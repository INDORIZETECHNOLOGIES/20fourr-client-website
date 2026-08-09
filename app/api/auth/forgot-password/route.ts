import { NextResponse } from "next/server";
import { backendJson } from "@/lib/api/backend";
import { errorResponse, readJsonBody } from "@/lib/api/route-helpers";

export async function POST(request: Request) {
  try {
    const { email } = await readJsonBody<{ email?: string }>(request);
    await backendJson({ path: "/auth/forgot-password", method: "POST", body: { email } });

    // The API answers "If email exists, reset link has been sent" whether or not
    // the account exists. Keep that — the screen must not become an oracle for
    // which addresses are registered.
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
