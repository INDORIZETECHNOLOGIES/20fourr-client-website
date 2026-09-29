import { NextResponse } from "next/server";
import { getBillingFlags } from "@/lib/api/billing-flags";

/** Browser-readable flags for the booking funnel and the dashboard nav. No session. */
export async function GET() {
  return NextResponse.json(await getBillingFlags());
}
