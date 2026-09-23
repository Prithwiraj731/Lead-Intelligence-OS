import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@leadintel/database";
import { z } from "zod";

const N8NResearchResultPayloadSchema = z.object({
  companyId: z.string().uuid(),
  websiteStatus: z.string().optional().default("ONLINE"),
  websiteScore: z.number().min(0).max(100).default(50),
  confidenceScore: z.number().min(0).max(100).default(80),
  techStack: z.array(z.string()).default([]),
  detectedProblems: z.array(z.string()).default([]),
  summary: z.string().optional(),
  subPagesAudited: z.array(z.any()).default([]),
  digitalPresence: z.record(z.any()).default({}),
  evidenceMatrix: z.array(z.any()).default([]),
  conversionFriction: z.array(z.string()).default([]),
  opportunity: z
    .object({
      opportunityScore: z.number().min(0).max(100),
      confidenceScore: z.number().min(0).max(100),
      recommendedServiceCode: z.string(),
      recommendedChannel: z.enum(["EMAIL", "WHATSAPP", "LINKEDIN"]).default("EMAIL"),
      primaryPainPoint: z.string(),
      reasoning: z.string(),
      potentialImpact: z.string(),
      reasonToContact: z.string().optional(),
      suggestedOffer: z.string(),
      expectedBusinessBenefit: z.string().optional(),
      claimType: z.enum(["VERIFIED_FACT", "INFERRED_INSIGHT", "ESTIMATE", "UNKNOWN"]).default("ESTIMATE"),
      estimatedBudgetMin: z.number().default(30000),
      estimatedBudgetMax: z.number().default(70000),
      currency: z.string().default("AED"),
      pitchAngle: z.string(),
      evidenceSummary: z.array(z.string()).default([]),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate n8n Webhook Secret
    const incomingSecret =
      req.headers.get("x-n8n-webhook-secret") ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const configuredSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!configuredSecret) {
      console.error("N8N_WEBHOOK_SECRET environment variable is not configured.");
      return NextResponse.json(
        { success: false, error: "Server configuration error: Webhook secret not set." },
        { status: 500 }
      );
    }

    if (!incomingSecret || incomingSecret !== configuredSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing webhook secret." },
        { status: 401 }
      );
    }

    // 2. Validate Payload
    let json = await req.json();
    if (typeof json === "string") {
      try {
        json = JSON.parse(json);
      } catch {}
    }
    const payload = N8NResearchResultPayloadSchema.parse(json);

    const company = await prisma.company.findUnique({
      where: { id: payload.companyId },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: `Company ${payload.companyId} not found.` },
        { status: 404 }
      );
    }

    // 3. Update Database in Transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.companyResearch.upsert({
        where: { companyId: payload.companyId },
        update: {
          websiteStatus: payload.websiteStatus,
          websiteScore: payload.websiteScore,
          confidenceScore: payload.confidenceScore,
          techStack: payload.techStack,
          detectedProblems: payload.detectedProblems,
          subPagesAudited: payload.subPagesAudited as any,
          digitalPresence: payload.digitalPresence as any,
          evidenceMatrix: payload.evidenceMatrix as any,
          conversionFriction: payload.conversionFriction as any,
          summary: payload.summary || "",
          status: "COMPLETED",
          errorMessage: null,
        },
        create: {
          companyId: payload.companyId,
          websiteStatus: payload.websiteStatus,
          websiteScore: payload.websiteScore,
          confidenceScore: payload.confidenceScore,
          techStack: payload.techStack,
          detectedProblems: payload.detectedProblems,
          subPagesAudited: payload.subPagesAudited as any,
          digitalPresence: payload.digitalPresence as any,
          evidenceMatrix: payload.evidenceMatrix as any,
          conversionFriction: payload.conversionFriction as any,
          summary: payload.summary || "",
          status: "COMPLETED",
        },
      });

      if (payload.opportunity) {
        const service = await tx.serviceCatalog.findFirst({
          where: { code: payload.opportunity.recommendedServiceCode },
        });

        await tx.opportunity.create({
          data: {
            companyId: payload.companyId,
            serviceId: service?.id || null,
            opportunityScore: payload.opportunity.opportunityScore,
            confidenceScore: payload.opportunity.confidenceScore,
            recommendedChannel: payload.opportunity.recommendedChannel,
            primaryPainPoint: payload.opportunity.primaryPainPoint,
            reasoning: payload.opportunity.reasoning,
            potentialImpact: payload.opportunity.potentialImpact,
            reasonToContact: payload.opportunity.reasonToContact || payload.opportunity.primaryPainPoint,
            suggestedOffer: payload.opportunity.suggestedOffer,
            expectedBusinessBenefit: payload.opportunity.expectedBusinessBenefit || payload.opportunity.potentialImpact,
            claimType: payload.opportunity.claimType || "ESTIMATE",
            estimatedBudgetMin: payload.opportunity.estimatedBudgetMin,
            estimatedBudgetMax: payload.opportunity.estimatedBudgetMax,
            currency: payload.opportunity.currency,
            pitchAngle: payload.opportunity.pitchAngle,
            evidenceSummary: (payload.opportunity.evidenceSummary || []) as any,
            status: "IDENTIFIED",
          },
        });

        await tx.company.update({
          where: { id: payload.companyId },
          data: { status: "OPPORTUNITY_IDENTIFIED" },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: payload.companyId,
          action: "RESEARCH_COMPLETED",
          actor: "N8N",
          details: {
            source: "N8N_WEBHOOK",
            websiteScore: payload.websiteScore,
            subPagesCount: payload.subPagesAudited?.length || 0,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Research results processed and saved successfully.",
    });
  } catch (error: any) {
    console.error("N8N Webhook error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process n8n webhook" },
      { status: 400 }
    );
  }
}
