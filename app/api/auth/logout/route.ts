import { NextResponse } from "next/server";
import { callBackend } from "@/lib/api/backend";
import { errorResponse } from "@/lib/api/route-helpers";
import { clearTokens, readTokens } from "@/lib/api/session";

export async function POST() {
  try {
    const { accessToken } = await readTokens();

    // Tell the API to drop the stored refresh token, but never let that failure
    // strand the user in a signed-in shell — the local cookies go either way.
    if (accessToken) {
      try {
        await callBackend({ path: "/auth/logout", method: "POST", token: accessToken });
      } catch {
        // Network or 401. Clearing cookies below is what actually signs them out.
      }
    }

    await clearTokens();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
