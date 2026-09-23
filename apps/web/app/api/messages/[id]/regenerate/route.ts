import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";
import { getAiProvider } from "@leadintel/ai";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            contacts: { where: { isPrimary: true }, take: 1 },
            research: true,
          },
        },
        opportunity: { include: { service: true } },
      },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    const company = message.company;
    const opportunity = message.opportunity;

    if (!opportunity) {
      return NextResponse.json({ success: false, error: "No opportunity associated with this message" }, { status: 400 });
    }

    const isDoNotContact =
      (opportunity.opportunityScore <= 35 && opportunity.confidenceScore >= 80) ||
      opportunity.service?.code === "NO_SERVICE_RECOMMENDED";
    const isNeedsVerification =
      opportunity.confidenceScore < 60;

    const decision = isDoNotContact
      ? "DO_NOT_CONTACT"
      : isNeedsVerification
      ? "NEEDS_VERIFICATION"
      : "PROCEED";

    if (decision !== "PROCEED") {
      return NextResponse.json(
        {
          success: false,
          error: `Outreach regeneration blocked: Lead is marked as NOT_ELIGIBLE (decision: '${decision}'). Only leads with PROCEED decision are eligible for outreach.`,
          decision,
          messageStatus: "NOT_ELIGIBLE",
        },
        { status: 422 }
      );
    }

    const primaryContact = company.contacts[0];
    const isContactVerified = Boolean(
      primaryContact &&
      primaryContact.isVerified &&
      primaryContact.identityConfidence >= 80 &&
      primaryContact.name &&
      primaryContact.name.trim().length > 0
    );

    const aiProvider = getAiProvider();

    const generated = await aiProvider.generatePersonalizedOutreach({
      companyName: company.name,
      contactName: isContactVerified ? primaryContact.name : null,
      isContactVerified,
      contactIdentityConfidence: primaryContact?.identityConfidence ?? 0,
      contactVerificationSource: primaryContact?.verificationSource || null,
      role: isContactVerified ? primaryContact.role || null : null,
      industry: company.industry || null,
      location: company.city || company.location || company.country,
      opportunity: {
        companyId: company.id,
        opportunityScore: opportunity.opportunityScore,
        confidenceScore: opportunity.confidenceScore,
        evidenceLevel: "HIGH" as const,
        reasonCode: (opportunity.service?.code === "NEW_HIGH_CONVERTING_WEBSITE" ? "NO_WEBSITE" : "PERFORMANCE_ISSUE") as any,
        decision: "PROCEED" as const,
        isContactRecommended: true,
        recommendedServiceCode: (opportunity.service?.code || "PREMIUM_WEBSITE_REDESIGN") as any,
        recommendedServiceName: opportunity.service?.name || "Premium Website Redesign",
        recommendedChannel: (opportunity.recommendedChannel || "EMAIL") as any,
        primaryPainPoint: opportunity.primaryPainPoint,
        reasoning: opportunity.reasoning,
        potentialBusinessImpact: opportunity.potentialImpact,
        reasonToContact: opportunity.reasonToContact || opportunity.primaryPainPoint,
        suggestedOffer: opportunity.suggestedOffer,
        expectedBusinessBenefit: opportunity.expectedBusinessBenefit || opportunity.potentialImpact,
        claimType: (opportunity.claimType as any) || "ESTIMATE",
        estimatedBudgetMin: Number(opportunity.estimatedBudgetMin),
        estimatedBudgetMax: Number(opportunity.estimatedBudgetMax),
        currency: opportunity.currency,
        pitchAngle: opportunity.pitchAngle,
        evidenceSummary: (opportunity.evidenceSummary as string[]) || [],
      },
      verifiedDetails: (company.research?.detectedProblems as string[]) || [],
    });

    const updated = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.update({
        where: { id },
        data: {
          emailSubject: generated.emailSubject,
          emailBody: generated.emailBody,
          whatsappBody: generated.whatsappBody,
          followupBody: generated.followupBody,
          outreachAngle: generated.outreachAngle,
          verifiedObservation: generated.verifiedObservation,
          proposedSolution: generated.proposedSolution,
          callToAction: generated.callToAction,
          evidenceUsed: generated.evidenceUsed as any,
          qualityScore: generated.qualityScore,
          qualityReport: (generated.qualityReport || {}) as any,
          status: "READY_FOR_REVIEW",
        },
      });

      await tx.messageEvent.create({
        data: {
          messageId: id,
          eventType: "REGENERATED",
          metadata: {
            actor: "USER",
            qualityScore: generated.qualityScore,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: message.companyId,
          action: "MESSAGE_REGENERATED",
          actor: "USER",
          details: { messageId: id, qualityScore: generated.qualityScore },
        },
      });

      return msg;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Regenerate message error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to regenerate message" },
      { status: 500 }
    );
  }
}
