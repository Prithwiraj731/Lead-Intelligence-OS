import { prisma } from "@leadintel/database";

export interface CampaignReportRow {
  company: string;
  industry: string;
  location: string;
  website: string;
  opportunityScore: number;
  confidenceScore: number;
  rankScore: number;
  recommendedService: string;
  recommendedOffer: string;
  reasonToContact: string;
  claimType: string;
  messageQuality: string;
  recommendedChannel: string;
  researchStatus: string;
  humanReviewStatus: string;
  dryRunStatus: string;
  idempotencyKey: string;
  needsVerification: boolean;
}

export async function fetchOptimizedCampaignReport(batchSize = 10): Promise<{
  rows: CampaignReportRow[];
  metrics: {
    totalCompanies: number;
    highOpportunity: number;
    highConfidence: number;
    needsVerification: number;
    messagesApproved: number;
    dryRunDeliveries: number;
    safetyBlocks: number;
  };
  top10Ranked: CampaignReportRow[];
}> {
  const totalCount = await prisma.company.count();
  const rows: CampaignReportRow[] = [];

  let offset = 0;
  while (offset < totalCount) {
    const batch = await prisma.company.findMany({
      skip: offset,
      take: batchSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        industry: true,
        city: true,
        location: true,
        domain: true,
        phone: true,
        contacts: {
          take: 1,
          select: {
            email: true,
            phone: true,
            isVerified: true,
            identityConfidence: true,
          },
        },
        research: {
          select: {
            websiteStatus: true,
            websiteScore: true,
            confidenceScore: true,
          },
        },
        opportunities: {
          take: 1,
          select: {
            opportunityScore: true,
            confidenceScore: true,
            recommendedChannel: true,
            suggestedOffer: true,
            reasonToContact: true,
            primaryPainPoint: true,
            claimType: true,
            service: {
              select: { name: true },
            },
          },
        },
        messages: {
          take: 1,
          select: {
            status: true,
            qualityScore: true,
            channel: true,
            deliveries: {
              take: 1,
              select: {
                status: true,
                provider: true,
                idempotencyKey: true,
                isDryRun: true,
              },
            },
          },
        },
      },
    });

    for (const c of batch) {
      const opp = c.opportunities[0];
      const msg = c.messages[0];
      const del = msg?.deliveries?.[0];
      const contact = c.contacts[0];

      const oppScore = opp?.opportunityScore ?? 0;
      const confScore = opp?.confidenceScore ?? 0;
      const rankScore = (oppScore * confScore) / 100;

      // Needs Verification Flag Rule:
      // Confidence < 80 OR critical business/contact info UNKNOWN
      const isMissingCritical = !contact?.phone && !contact?.email && !c.phone;
      const isUnreachable = c.research?.websiteStatus === "UNREACHABLE";
      const needsVerification = confScore < 80 || isMissingCritical || isUnreachable;

      let humanReviewStatus = "READY_FOR_REVIEW";
      if (needsVerification) {
        humanReviewStatus = "NEEDS_VERIFICATION";
      } else if (msg?.status === "APPROVED") {
        humanReviewStatus = "APPROVED";
      } else if (msg?.status) {
        humanReviewStatus = msg.status;
      }

      let dryRunStatus = "NOT_DELIVERED";
      if (del && del.status === "DRY_RUN") {
        dryRunStatus = `DRY_RUN_PASSED (${del.provider})`;
      } else if (msg?.status !== "APPROVED") {
        dryRunStatus = "SAFETY_HELD (UNAPPROVED)";
      }

      rows.push({
        company: c.name,
        industry: c.industry || "Commercial Services",
        location: c.city || c.location || "Dubai",
        website: c.domain || "NONE (Zero Web)",
        opportunityScore: oppScore,
        confidenceScore: confScore,
        rankScore,
        recommendedService: opp?.service?.name || "New High-Converting Business Website & Digital Presence",
        recommendedOffer: opp?.suggestedOffer || `Custom Digital Presence for ${c.name}`,
        reasonToContact: opp?.reasonToContact || opp?.primaryPainPoint || "Direct ownership of digital acquisition channel",
        claimType: opp?.claimType || "ESTIMATE",
        messageQuality: `${msg?.qualityScore || 90}/100`,
        recommendedChannel: opp?.recommendedChannel || "WHATSAPP",
        researchStatus: c.research?.websiteStatus || "COMPLETED",
        humanReviewStatus,
        dryRunStatus,
        idempotencyKey: del?.idempotencyKey || "N/A",
        needsVerification,
      });
    }

    offset += batchSize;
  }

  // Calculate Aggregates
  let highOpportunity = 0;
  let highConfidence = 0;
  let needsVerificationCount = 0;
  let messagesApproved = 0;
  let dryRunDeliveries = 0;
  let safetyBlocks = 0;

  for (const r of rows) {
    if (r.opportunityScore >= 80) highOpportunity++;
    if (r.confidenceScore >= 80) highConfidence++;
    if (r.needsVerification) needsVerificationCount++;
    if (r.humanReviewStatus === "APPROVED") messagesApproved++;
    if (r.dryRunStatus.startsWith("DRY_RUN_PASSED")) dryRunDeliveries++;
    if (r.dryRunStatus.startsWith("SAFETY_HELD") || r.humanReviewStatus === "NEEDS_VERIFICATION") safetyBlocks++;
  }

  // Sort Top 10 by Opportunity Score * Confidence
  const sorted = [...rows].sort((a, b) => b.rankScore - a.rankScore);

  return {
    rows,
    metrics: {
      totalCompanies: rows.length,
      highOpportunity,
      highConfidence,
      needsVerification: needsVerificationCount,
      messagesApproved,
      dryRunDeliveries,
      safetyBlocks,
    },
    top10Ranked: sorted.slice(0, 10),
  };
}

if (require.main === module) {
  fetchOptimizedCampaignReport()
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
