import { NextRequest, NextResponse } from "next/server";
import { prisma, normalizeDomain, normalizePhone, normalizeCompanyName } from "@leadintel/database";
import { LeadRowInputSchema } from "@leadintel/types";
import { z } from "zod";

const CommitImportBodySchema = z.object({
  leads: z.array(LeadRowInputSchema),
  skipDuplicates: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CommitImportBodySchema.parse(json);

    let createdCount = 0;
    let skippedCount = 0;
    const createdCompanyIds: string[] = [];

    for (const lead of parsed.leads) {
      const normDomain = normalizeDomain(lead.website);
      const normPhone = normalizePhone(lead.phone);
      const normName = normalizeCompanyName(lead.companyName);
      const city = lead.city?.trim() || lead.location?.trim() || "";

      // Deduplication check
      let isDuplicate = false;
      if (normDomain) {
        const match = await prisma.company.findFirst({ where: { normalizedDomain: normDomain } });
        if (match) isDuplicate = true;
      }
      if (!isDuplicate && normPhone) {
        const match = await prisma.company.findFirst({ where: { normalizedPhone: normPhone } });
        if (match) isDuplicate = true;
      }
      if (!isDuplicate && normName.length > 2) {
        const match = await prisma.company.findFirst({
          where: {
            normalizedName: normName,
            ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
          },
        });
        if (match) isDuplicate = true;
      }

      if (isDuplicate && parsed.skipDuplicates) {
        skippedCount++;
        continue;
      }

      // Create company record with contact in a single transaction
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
            source: lead.source || "CSV_IMPORT",
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
            details: {
              companyName: comp.name,
              source: comp.source,
              domain: comp.domain,
            },
          },
        });

        return comp;
      });

      createdCompanyIds.push(company.id);
      createdCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        createdCount,
        skippedCount,
        createdCompanyIds,
      },
    });
  } catch (error: any) {
    console.error("Lead commit import error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to commit lead import" },
      { status: 500 }
    );
  }
}
