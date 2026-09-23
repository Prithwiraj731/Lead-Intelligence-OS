import { NextRequest, NextResponse } from "next/server";
import { prisma, normalizeDomain, normalizePhone, normalizeCompanyName } from "@leadintel/database";
import { LeadRowInputSchema } from "@leadintel/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const industry = searchParams.get("industry") || "";
    const minOpportunity = searchParams.get("minOpportunity")
      ? Number(searchParams.get("minOpportunity"))
      : undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 25)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (industry && industry !== "ALL") {
      where.industry = { equals: industry, mode: "insensitive" };
    }

    if (minOpportunity !== undefined && !isNaN(minOpportunity)) {
      where.opportunities = {
        some: {
          opportunityScore: { gte: minOpportunity },
        },
      };
    }

    const [total, leads] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          contacts: { where: { isPrimary: true }, take: 1 },
          research: {
            select: {
              websiteStatus: true,
              websiteScore: true,
              confidenceScore: true,
              status: true,
            },
          },
          opportunities: {
            take: 1,
            orderBy: { opportunityScore: "desc" },
            include: { service: { select: { name: true, code: true } } },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { id: true, status: true, channel: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("List leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const lead = LeadRowInputSchema.parse(json);

    const normDomain = normalizeDomain(lead.website);
    const normPhone = normalizePhone(lead.phone);
    const normName = normalizeCompanyName(lead.companyName);
    const city = lead.city?.trim() || lead.location?.trim() || "";

    // Check duplicate
    if (normDomain) {
      const match = await prisma.company.findFirst({ where: { normalizedDomain: normDomain } });
      if (match) {
        return NextResponse.json(
          { success: false, error: `Company with domain '${normDomain}' already exists (${match.name}).` },
          { status: 409 }
        );
      }
    }

    const company = await prisma.$transaction(async (tx) => {
      const comp = await tx.company.create({
        data: {
          name: lead.companyName.trim(),
          normalizedName: normName,
          domain: lead.website?.trim() || null,
          normalizedDomain: normDomain,
          phone: lead.phone?.trim() || null,
          normalizedPhone: normPhone,
          industry: lead.industry?.trim() || null,
          location: lead.location?.trim() || null,
          city: city || null,
          country: lead.country || "UAE",
          description: lead.description?.trim() || null,
          source: lead.source || "MANUAL_INPUT",
          status: "NEW",
        },
      });

      if (lead.contactName || lead.email || lead.phone) {
        await tx.contact.create({
          data: {
            companyId: comp.id,
            name: lead.contactName?.trim() || "Decision Maker",
            role: lead.role?.trim() || "Leadership",
            email: lead.email?.trim() || null,
            phone: lead.phone?.trim() || null,
            isPrimary: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: comp.id,
          action: "LEAD_IMPORTED",
          actor: "USER",
          details: { manualCreation: true },
        },
      });

      return comp;
    });

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (error: any) {
    console.error("Create lead error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create lead" },
      { status: 400 }
    );
  }
}
