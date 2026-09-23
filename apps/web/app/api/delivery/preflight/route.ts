import { NextRequest, NextResponse } from "next/server";
import { runPreflightDeliveryChecklist } from "@/lib/delivery/preflight-verifier";

export async function GET(req: NextRequest) {
  try {
    const senderEmail = req.nextUrl.searchParams.get("senderEmail") || undefined;
    const report = await runPreflightDeliveryChecklist(senderEmail);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute preflight delivery checklist",
      },
      { status: 500 }
    );
  }
}
