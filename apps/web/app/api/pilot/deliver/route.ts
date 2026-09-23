import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";
import { executeMessageDelivery } from "@/lib/delivery/dispatcher";
import { PILOT_MAX_REAL_RECIPIENTS } from "@/lib/delivery/safety-gate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, hasReviewedConfirmation, destinationOverride } = body;

    if (!messageId) {
      return NextResponse.json({ success: false, error: "messageId is required" }, { status: 400 });
    }

    // 1. Mandatory Human Confirmation Check
    if (hasReviewedConfirmation !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "HUMAN_CONFIRMATION_REQUIRED: You must explicitly check 'I have reviewed this recipient, evidence, and message' prior to pilot delivery.",
        },
        { status: 400 }
      );
    }

    // 2. Fetch message and verify human approval
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        company: {
          include: {
            research: true,
            opportunities: {
              take: 1,
              orderBy: { opportunityScore: "desc" },
              include: { service: true },
            },
          },
        },
        contact: true,
      },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    if (message.status !== "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          error: `APPROVAL_REQUIRED: Message status is '${message.status}'. Delivery requires explicit human approval ('APPROVED') first.`,
        },
        { status: 422 }
      );
    }

    // 3. Verify Opportunity Decision is PROCEED
    const opp = message.company.opportunities[0];
    const isDoNotContact =
      (opp?.opportunityScore && opp.opportunityScore <= 35 && opp.confidenceScore >= 80) ||
      opp?.service?.code === "NO_SERVICE_RECOMMENDED";
    const isNeedsVerification =
      message.company.research?.websiteStatus === "NOT_FOUND" ||
      (opp?.confidenceScore && opp.confidenceScore < 60);

    const decision = isDoNotContact
      ? "DO_NOT_CONTACT"
      : isNeedsVerification
      ? "NEEDS_VERIFICATION"
      : "PROCEED";

    if (decision !== "PROCEED") {
      return NextResponse.json(
        {
          success: false,
          error: `OUTREACH_INELIGIBLE: Lead decision is '${decision}'. Only 'PROCEED' leads are eligible for pilot delivery.`,
        },
        { status: 422 }
      );
    }

    // 4. Check Pilot Hard Cap (Max 5 Real Recipients)
    const isOutboundEnabled = process.env.OUTBOUND_DELIVERY_ENABLED === "true";
    const isDryRun = process.env.OUTBOUND_DRY_RUN !== "false" || !isOutboundEnabled;

    if (!isDryRun) {
      const realDeliveriesCount = await prisma.delivery.count({
        where: {
          isDryRun: false,
          status: { in: ["SENT", "DELIVERED", "BOUNCED", "FAILED", "PROCESSING"] },
        },
      });

      if (realDeliveriesCount >= PILOT_MAX_REAL_RECIPIENTS) {
        return NextResponse.json(
          {
            success: false,
            error: `PILOT_CAP_REACHED: Hard limit of ${PILOT_MAX_REAL_RECIPIENTS} real email recipients in pilot campaign has been reached.`,
          },
          { status: 429 }
        );
      }
    }

    // 5. Execute Safe Delivery
    const deliveryResult = await executeMessageDelivery({
      messageId: message.id,
      channel: "EMAIL",
      destinationOverride,
      hasReviewedConfirmation: true,
    });

    return NextResponse.json({
      success: deliveryResult.success,
      data: deliveryResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute pilot delivery",
      },
      { status: 500 }
    );
  }
}
