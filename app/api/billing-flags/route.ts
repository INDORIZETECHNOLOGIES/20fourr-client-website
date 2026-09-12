import { NextResponse } from "next/server";
import { getV6Enabled } from "@/lib/api/billing-flags";

/** Browser-readable flag for the booking funnel. No session. */
export async function GET() {
  const v6Enabled = await getV6Enabled();
  return NextResponse.json({ v6Enabled });
}
