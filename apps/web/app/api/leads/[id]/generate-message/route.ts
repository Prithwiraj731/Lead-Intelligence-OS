import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";
import { getAiProvider } from "@leadintel/ai";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        opportunities: { orderBy: { opportunityScore: "desc" }, take: 1, include: { service: true } },
        research: true,
      },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    const opportunity = company.opportunities[0];
    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: "Please run research on this lead first to identify an opportunity." },
        { status: 400 }
      );
    }

    const primaryContact = company.contacts[0];

    // Check suppression table
    if (primaryContact?.email || company.normalizedDomain || company.normalizedPhone) {
      const isSuppressed = await prisma.suppression.findFirst({
        where: {
          OR: [
            ...(primaryContact?.email ? [{ email: primaryContact.email }] : []),
            ...(company.normalizedDomain ? [{ domain: company.normalizedDomain }] : []),
            ...(company.normalizedPhone ? [{ phone: company.normalizedPhone }] : []),
          ],
        },
      });

      if (isSuppressed) {
        return NextResponse.json(
          {
            success: false,
            error: `Outreach generation blocked: Lead/domain is globally suppressed (${isSuppressed.reason}).`,
          },
          { status: 403 }
        );
      }
    }

    const isDoNotContact =
      (opportunity.opportunityScore <= 35 && opportunity.confidenceScore >= 80) ||
      opportunity.service?.code === "NO_SERVICE_RECOMMENDED";
    const isNeedsVerification =
      company.research?.websiteStatus === "NOT_FOUND" ||
      opportunity.confidenceScore < 60 ||
      (company.research?.confidenceScore ?? 0) < 60;

    const decision = isDoNotContact
      ? "DO_NOT_CONTACT"
      : isNeedsVerification
      ? "NEEDS_VERIFICATION"
      : "PROCEED";

    if (decision !== "PROCEED") {
      return NextResponse.json(
        {
          success: false,
          error: `Outreach generation blocked: Lead is marked as NOT_ELIGIBLE (decision: '${decision}'). Only leads with PROCEED decision are eligible for outreach.`,
          decision,
          messageStatus: "NOT_ELIGIBLE",
        },
        { status: 422 }
      );
    }

    const isContactVerified = Boolean(
      primaryContact &&
      primaryContact.isVerified &&
      primaryContact.identityConfidence >= 80 &&
      primaryContact.name &&
      primaryContact.name.trim().length > 0
    );

    // AI Message Generation with Anti-Jargon Rules & Contact Identity Guard
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

    // Save message with status READY_FOR_REVIEW
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          companyId: company.id,
          contactId: primaryContact?.id || null,
          opportunityId: opportunity.id,
          channel: generated.channel || opportunity.recommendedChannel || "EMAIL",
          status: "READY_FOR_REVIEW",
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
        },
      });

      await tx.messageEvent.create({
        data: {
          messageId: msg.id,
          eventType: "READY_FOR_REVIEW",
          metadata: {
            channel: msg.channel,
            emailSubject: msg.emailSubject,
          },
        },
      });

      await tx.company.update({
        where: { id: company.id },
        data: { status: "OUTREACH_READY" },
      });

      await tx.auditLog.create({
        data: {
          companyId: company.id,
          action: "MESSAGE_GENERATED",
          actor: "AI_ENGINE",
          details: { messageId: msg.id, channel: msg.channel },
        },
      });

      return msg;
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error("Generate message error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate outreach message" },
      { status: 500 }
    );
  }
}
