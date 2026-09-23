import { NextResponse } from "next/server";
import { prisma } from "@leadintel/database";
import { DashboardMetrics } from "@leadintel/types";

export async function GET() {
  try {
    const [
      totalLeads,
      researchCompleted,
      highOpportunityLeads,
      readyForReview,
      approvedOutreach,
      sentOutreach,
      repliesTotal,
      positiveReplies,
      recentActivity,
      topOpportunities,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.companyResearch.count({ where: { status: "COMPLETED" } }),
      prisma.opportunity.count({ where: { opportunityScore: { gte: 80 } } }),
      prisma.message.count({ where: { status: "READY_FOR_REVIEW" } }),
      prisma.message.count({ where: { status: "APPROVED" } }),
      prisma.message.count({ where: { status: "SENT" } }),
      prisma.reply.count(),
      prisma.reply.count({
        where: {
          classification: { in: ["INTERESTED", "PRICING", "MEETING_REQUEST", "MORE_INFORMATION"] },
        },
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { company: { select: { id: true, name: true } } },
      }),
      prisma.opportunity.findMany({
        take: 5,
        orderBy: { opportunityScore: "desc" },
        include: {
          company: {
            select: { id: true, name: true, location: true, industry: true, domain: true },
          },
          service: { select: { name: true, code: true } },
        },
      }),
    ]);

    const conversionRate =
      sentOutreach > 0 ? Number(((positiveReplies / sentOutreach) * 100).toFixed(1)) : 0;

    const metrics: DashboardMetrics = {
      totalLeads,
      researchCompleted,
      highOpportunityLeads,
      readyForReview,
      approvedOutreach,
      sentOutreach,
      repliesTotal,
      positiveReplies,
      conversionRate,
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        recentActivity,
        topOpportunities,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load metrics" },
      { status: 500 }
    );
  }
}
