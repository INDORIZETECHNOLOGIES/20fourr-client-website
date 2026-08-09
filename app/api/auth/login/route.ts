import { NextResponse } from "next/server";
import { backendJson } from "@/lib/api/backend";
import { errorResponse, readJsonBody } from "@/lib/api/route-helpers";
import { writeTokens } from "@/lib/api/session";
import type { LoginResponse } from "@/lib/api/types";

export async function POST(request: Request) {
  try {
    const { email, password } = await readJsonBody<{ email?: string; password?: string }>(request);

    const data = await backendJson<LoginResponse>({
      path: "/auth/login",
      method: "POST",
      // `role` is not optional in practice: the API rejects a provider account
      // signing in here (SC_109) rather than handing this site a session it has
      // no screens for. Omitting it would let a provider in and then 403 on
      // every subsequent call.
      body: { email, password, role: "client" },
    });

    await writeTokens(data.tokens);

    // The tokens themselves never reach the browser — only what the UI renders.
    return NextResponse.json({
      user: data.user,
      requiresVerification: data.requiresVerification ?? false,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
