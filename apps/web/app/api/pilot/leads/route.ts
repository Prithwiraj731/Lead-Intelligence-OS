import { NextResponse } from "next/server";
import { prisma } from "@leadintel/database";
import { PILOT_MAX_REAL_RECIPIENTS } from "@/lib/delivery/safety-gate";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: {
        status: { not: "DISMISSED" },
      },
      include: {
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
        research: true,
        opportunities: {
          orderBy: { opportunityScore: "desc" },
          take: 1,
          include: {
            service: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            deliveries: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const [realDeliveriesCount, totalPilotApprovedCount] = await Promise.all([
      prisma.delivery.count({
        where: {
          isDryRun: false,
          status: { in: ["SENT", "DELIVERED", "BOUNCED", "FAILED", "PROCESSING"] },
        },
      }),
      prisma.message.count({
        where: {
          status: "APPROVED",
        },
      }),
    ]);

    const pilotLeads = companies.map((c) => {
      const contact = c.contacts[0];
      const opp = c.opportunities[0];
      const message = c.messages[0];
      const latestDelivery = message?.deliveries[0];

      const isDoNotContact =
        (opp?.opportunityScore && opp.opportunityScore <= 35 && opp.confidenceScore >= 80) ||
        opp?.service?.code === "NO_SERVICE_RECOMMENDED";
      const isNeedsVerification =
        c.research?.websiteStatus === "NOT_FOUND" ||
        (opp?.confidenceScore && opp.confidenceScore < 60) ||
        (c.research?.confidenceScore ?? 0) < 60;

      const decision = isDoNotContact
        ? "DO_NOT_CONTACT"
        : isNeedsVerification
        ? "NEEDS_VERIFICATION"
        : "PROCEED";

      const hasEmail = Boolean(contact?.email || (c.domain && `contact@${c.domain}`));
      const recipientEmail = contact?.email || (c.domain ? `contact@${c.domain}` : "");
      const isContactVerified = Boolean(contact?.isVerified && (contact?.identityConfidence ?? 0) >= 80);

      const isEligible = decision === "PROCEED" && Boolean(recipientEmail) && opp?.opportunityScore >= 40;

      const evidenceSummary =
        (opp?.evidenceSummary as string[]) ||
        (c.research?.detectedProblems as string[]) ||
        [];

      return {
        companyId: c.id,
        companyName: c.name,
        industry: c.industry || "Commercial Business",
        location: c.city || c.location || "Dubai, UAE",
        website: c.research?.websiteUrl || (c.domain ? `https://${c.domain}` : null),
        researchStatus: c.research?.websiteStatus || "UNKNOWN",
        researchScore: c.research?.websiteScore ?? 0,
        evidenceSummary,
        opportunityScore: opp?.opportunityScore ?? 0,
        confidenceScore: opp?.confidenceScore ?? 0,
        recommendedService: opp?.service?.name || "Premium Website Redesign",
        recommendedServiceCode: opp?.service?.code || "PREMIUM_WEBSITE_REDESIGN",
        reasonCode: (opp?.reasonToContact || opp?.primaryPainPoint || "NO_WEBSITE") as string,
        decision,
        recipientEmail,
        isContactVerified,
        contactName: contact?.name || null,
        message: message
          ? {
              id: message.id,
              status: message.status,
              emailSubject: message.emailSubject || "",
              emailBody: message.emailBody || "",
              whatsappBody: message.whatsappBody || "",
              qualityScore: message.qualityScore ?? 85,
              qualityReport: message.qualityReport,
              approvedBy: message.approvedBy,
              approvedAt: message.approvedAt,
            }
          : null,
        latestDelivery: latestDelivery
          ? {
              id: latestDelivery.id,
              status: latestDelivery.status,
              provider: latestDelivery.provider,
              isDryRun: latestDelivery.isDryRun,
              sentAt: latestDelivery.sentAt,
              deliveredAt: latestDelivery.deliveredAt,
              failedAt: latestDelivery.failedAt,
              errorMessage: latestDelivery.failureReason,
              idempotencyKey: latestDelivery.idempotencyKey,
            }
          : null,
        isEligible,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        leads: pilotLeads,
        metrics: {
          pilotRecipientsUsed: realDeliveriesCount,
          pilotRecipientsMax: PILOT_MAX_REAL_RECIPIENTS,
          isPilotCapReached: realDeliveriesCount >= PILOT_MAX_REAL_RECIPIENTS,
          totalApprovedMessages: totalPilotApprovedCount,
          isKillSwitchActive: process.env.OUTBOUND_DELIVERY_ENABLED !== "true",
          isDryRunMode: process.env.OUTBOUND_DRY_RUN !== "false",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch pilot campaign leads" },
      { status: 500 }
    );
  }
}
