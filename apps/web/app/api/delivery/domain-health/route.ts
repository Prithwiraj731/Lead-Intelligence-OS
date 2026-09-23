import { NextRequest, NextResponse } from "next/server";
import { checkDomainHealth } from "@/lib/delivery/domain-health";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain") || process.env.OUTBOUND_FROM_DOMAIN || "leadintel.local";

    const report = await checkDomainHealth(domain);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to check domain health" },
      { status: 500 }
    );
  }
}
