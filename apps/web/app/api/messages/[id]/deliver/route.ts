import { NextRequest, NextResponse } from "next/server";
import { executeMessageDelivery } from "@/lib/delivery/dispatcher";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty
    }

    const result = await executeMessageDelivery({
      messageId: id,
      channel: body.channel,
      destinationOverride: body.destinationOverride,
      forceDryRun: body.forceDryRun ?? true,
    });

    if (!result.success && result.status === "FAILED") {
      return NextResponse.json(
        {
          success: false,
          data: result,
          error: result.error || "Delivery blocked by safety gate.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: result.isDryRun
        ? "Simulated Dry-Run Delivery completed. Zero external network calls executed."
        : "Message dispatched via delivery provider.",
    });
  } catch (err: any) {
    console.error("Delivery error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute delivery" },
      { status: 500 }
    );
  }
}
