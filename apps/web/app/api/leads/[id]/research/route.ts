import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";
import { getAiProvider } from "@leadintel/ai";
import { auditCompanyWebsite } from "@/lib/research/inspector";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: { contacts: { where: { isPrimary: true }, take: 1 } },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    // Update status to RESEARCHING & record audit log
    await prisma.$transaction([
      prisma.company.update({
        where: { id },
        data: { status: "RESEARCHING" },
      }),
      prisma.auditLog.create({
        data: {
          companyId: id,
          action: "RESEARCH_STARTED",
          actor: "USER",
          details: { targetDomain: company.domain },
        },
      }),
    ]);

    // 1. Multi-Page SSRF-Safe Website Audit & Signal Extraction
    const auditReport = await auditCompanyWebsite(company.domain);

    // 2. AI Opportunity & Dual Scoring Engine
    const aiProvider = getAiProvider();
    const analysis = await aiProvider.analyzeCompanyOpportunity({
      companyName: company.name,
      industry: company.industry,
      location: company.city || company.location || company.country,
      website: company.domain,
      description: company.description,
      websiteAudit: auditReport,
    });

    // 3. Find matching service in ServiceCatalog
    const matchedService = await prisma.serviceCatalog.findFirst({
      where: { code: analysis.recommendedServiceCode },
    });

    // 4. Save Research and Opportunity in Database
    const result = await prisma.$transaction(async (tx) => {
      // Upsert research record with deep Milestone 2 signals
      const research = await tx.companyResearch.upsert({
        where: { companyId: id },
        update: {
          websiteUrl: company.domain || null,
          websiteStatus: auditReport.websiteStatus,
          websiteScore: auditReport.overallAuditScore,
          confidenceScore: analysis.confidenceScore,
          techStack: auditReport.detectedTechnologies,
          performanceSignals: {
            loadTimeMs: auditReport.loadTimeMs,
            hasHttps: auditReport.hasHttps,
            hasMobileViewport: auditReport.hasMobileViewport,
          },
          seoSignals: {
            pageTitle: auditReport.pageTitle,
            metaDescription: auditReport.metaDescription,
            ...auditReport.digitalPresence?.seoSignals,
          },
          detectedProblems: auditReport.identifiedIssues,
          verifiedServices: auditReport.qualitySignals ? Object.keys(auditReport.qualitySignals) : [],
          contactSignals: auditReport.contactInfoFound,
          qualitySignals: auditReport.qualitySignals,
          truthTiers: auditReport.truthTiers,
          subPagesAudited: auditReport.subPages as any,
          digitalPresence: auditReport.digitalPresence as any,
          evidenceMatrix: auditReport.evidenceMatrix as any,
          conversionFriction: auditReport.identifiedIssues as any,
          summary: analysis.reasoning,
          rawAuditData: auditReport as any,
          status: "COMPLETED",
          errorMessage: null,
        },
        create: {
          companyId: id,
          websiteUrl: company.domain || null,
          websiteStatus: auditReport.websiteStatus,
          websiteScore: auditReport.overallAuditScore,
          confidenceScore: analysis.confidenceScore,
          techStack: auditReport.detectedTechnologies,
          performanceSignals: {
            loadTimeMs: auditReport.loadTimeMs,
            hasHttps: auditReport.hasHttps,
            hasMobileViewport: auditReport.hasMobileViewport,
          },
          seoSignals: {
            pageTitle: auditReport.pageTitle,
            metaDescription: auditReport.metaDescription,
            ...auditReport.digitalPresence?.seoSignals,
          },
          detectedProblems: auditReport.identifiedIssues,
          verifiedServices: auditReport.qualitySignals ? Object.keys(auditReport.qualitySignals) : [],
          contactSignals: auditReport.contactInfoFound,
          qualitySignals: auditReport.qualitySignals,
          truthTiers: auditReport.truthTiers,
          subPagesAudited: auditReport.subPages as any,
          digitalPresence: auditReport.digitalPresence as any,
          evidenceMatrix: auditReport.evidenceMatrix as any,
          conversionFriction: auditReport.identifiedIssues as any,
          summary: analysis.reasoning,
          rawAuditData: auditReport as any,
          status: "COMPLETED",
        },
      });

      // Create opportunity record with reasonToContact and expectedBusinessBenefit
      const opportunity = await tx.opportunity.create({
        data: {
          companyId: id,
          serviceId: matchedService?.id || null,
          opportunityScore: analysis.opportunityScore,
          confidenceScore: analysis.confidenceScore,
          recommendedChannel: analysis.recommendedChannel || "EMAIL",
          primaryPainPoint: analysis.primaryPainPoint,
          reasoning: analysis.reasoning,
          potentialImpact: analysis.potentialBusinessImpact,
          reasonToContact: analysis.reasonToContact,
          suggestedOffer: analysis.suggestedOffer,
          expectedBusinessBenefit: analysis.expectedBusinessBenefit,
          claimType: analysis.claimType || "ESTIMATE",
          estimatedBudgetMin: analysis.estimatedBudgetMin,
          estimatedBudgetMax: analysis.estimatedBudgetMax,
          currency: analysis.currency || "AED",
          pitchAngle: analysis.pitchAngle,
          evidenceSummary: (analysis.evidenceSummary || []) as any,
          status: "IDENTIFIED",
        },
        include: { service: true },
      });

      // Update company status
      await tx.company.update({
        where: { id },
        data: { status: "OPPORTUNITY_IDENTIFIED" },
      });

      // Audit logs
      await tx.auditLog.create({
        data: {
          companyId: id,
          action: "RESEARCH_COMPLETED",
          actor: "AI_ENGINE",
          details: {
            websiteScore: auditReport.overallAuditScore,
            websiteStatus: auditReport.websiteStatus,
            subPagesCount: auditReport.subPages?.length || 0,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: id,
          action: "OPPORTUNITY_GENERATED",
          actor: "AI_ENGINE",
          details: {
            opportunityScore: analysis.opportunityScore,
            confidenceScore: analysis.confidenceScore,
            recommendedService: analysis.recommendedServiceName,
          },
        },
      });

      return { research, opportunity };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Research lead error:", error);
    try {
      const { id } = await params;
      await prisma.companyResearch.upsert({
        where: { companyId: id },
        update: { status: "FAILED", errorMessage: error.message },
        create: { companyId: id, status: "FAILED", errorMessage: error.message },
      });
      await prisma.company.update({ where: { id }, data: { status: "NEW" } });
      await prisma.auditLog.create({
        data: { companyId: id, action: "RESEARCH_FAILED", actor: "SYSTEM", details: { error: error.message } },
      });
    } catch {}

    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute research" },
      { status: 500 }
    );
  }
}
