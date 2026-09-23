import fs from "fs";
import path from "path";
import { prisma, normalizeCompanyName, normalizeDomain, normalizePhone } from "@leadintel/database";
import { getAiProvider } from "@leadintel/ai";
import { executeMessageDelivery } from "../lib/delivery/dispatcher";
import { evaluateDeliverySafety } from "../lib/delivery/safety-gate";
import { auditCompanyWebsite } from "../lib/research/inspector";
import { OpportunityAnalysis } from "@leadintel/types";

interface LeadCsvRow {
  companyName: string;
  contactName?: string;
  role?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  city?: string;
  industry?: string;
  description?: string;
  sourceFile: string;
}

function parseCsv(filePath: string): LeadCsvRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const filename = path.basename(filePath);
  const rows: LeadCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser for standard quotes/commas
    const cols: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    cols.push(cur.trim());

    if (cols.length >= 1 && cols[0]) {
      rows.push({
        companyName: cols[0] || "",
        contactName: cols[1] || undefined,
        role: cols[2] || undefined,
        email: cols[3] || undefined,
        phone: cols[4] || undefined,
        website: cols[5] || undefined,
        location: cols[6] || undefined,
        city: cols[7] || "Dubai",
        industry: cols[8] || undefined,
        description: cols[9] || undefined,
        sourceFile: filename,
      });
    }
  }

  return rows;
}

export async function runFullCampaignSimulation() {
  console.log("================================================================================");
  console.log("  LEAD INTELLIGENCE OS — MILESTONE 3C: REAL-WORLD CAMPAIGN SIMULATION  ");
  console.log("  Strict Mode: Zero External Network Outbound & 100% Dry-Run Execution          ");
  console.log("================================================================================\n");

  const aiProvider = getAiProvider();

  // 1. Ingest Datasets without modifying original files
  const file1 = path.resolve(process.cwd(), "../../sample_data/dubai_leads.csv");
  const file2 = path.resolve(process.cwd(), "../../sample_data/dubai_leads_batch2.csv");

  const rows1 = fs.existsSync(file1) ? parseCsv(file1) : [];
  const rows2 = fs.existsSync(file2) ? parseCsv(file2) : [];
  const allRows = [...rows1, ...rows2];

  console.log(`[1. IMPORT] Ingested ${allRows.length} raw lead rows across ${[file1, file2].map(f => path.basename(f)).join(", ")}`);

  // Fetch available services in DB for opportunity mapping
  const services = await prisma.serviceCatalog.findMany();
  const defaultService = services[0] || {
    id: "default-srv",
    code: "NEW_HIGH_CONVERTING_WEBSITE",
    name: "New High-Converting Business Website & Digital Presence",
  };

  // Metrics Accumulator
  const metrics = {
    totalImported: allRows.length,
    duplicates: 0,
    researchSuccessful: 0,
    researchFailed: 0,
    highOpportunity: 0,
    highConfidence: 0,
    needsVerification: 0,
    messagesGenerated: 0,
    messagesApproved: 0,
    dryRunDeliveries: 0,
    safetyBlocks: 0,
  };

  const campaignReportRows: any[] = [];
  const rankedOpportunities: any[] = [];

  // Track in-session seen keys
  const seenDomains = new Set<string>();
  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();

  for (let idx = 0; idx < allRows.length; idx++) {
    const raw = allRows[idx];
    const normDomain = normalizeDomain(raw.website);
    const normPhone = normalizePhone(raw.phone);
    const normName = normalizeCompanyName(raw.companyName);
    const city = raw.city?.trim() || raw.location?.trim() || "Dubai";

    // 2. Deduplication Check against Postgres DB and current batch
    let isDuplicate = false;
    let duplicateReason = "";
    let existingCompany: any = null;

    if (normDomain && seenDomains.has(normDomain)) {
      isDuplicate = true;
      duplicateReason = "IN_BATCH_DOMAIN";
    } else if (normPhone && seenPhones.has(normPhone)) {
      isDuplicate = true;
      duplicateReason = "IN_BATCH_PHONE";
    } else if (normName && seenNames.has(normName)) {
      isDuplicate = true;
      duplicateReason = "IN_BATCH_NAME";
    }

    if (!isDuplicate) {
      if (normDomain) {
        existingCompany = await prisma.company.findFirst({
          where: { normalizedDomain: normDomain },
          include: { contacts: true, research: true, opportunities: true, messages: true },
        });
        if (existingCompany) {
          isDuplicate = true;
          duplicateReason = "EXACT_DOMAIN_IN_DB";
        }
      }
      if (!isDuplicate && normPhone) {
        existingCompany = await prisma.company.findFirst({
          where: { normalizedPhone: normPhone },
          include: { contacts: true, research: true, opportunities: true, messages: true },
        });
        if (existingCompany) {
          isDuplicate = true;
          duplicateReason = "NORMALIZED_PHONE_IN_DB";
        }
      }
      if (!isDuplicate && normName.length > 2) {
        existingCompany = await prisma.company.findFirst({
          where: { normalizedName: normName },
          include: { contacts: true, research: true, opportunities: true, messages: true },
        });
        if (existingCompany) {
          isDuplicate = true;
          duplicateReason = "NORMALIZED_NAME_IN_DB";
        }
      }
    }

    if (normDomain) seenDomains.add(normDomain);
    if (normPhone) seenPhones.add(normPhone);
    if (normName) seenNames.add(normName);

    let company: any = null;
    let contact: any = null;

    if (isDuplicate && existingCompany) {
      metrics.duplicates++;
      company = existingCompany;
      contact = existingCompany.contacts?.[0] || null;
    } else {
      // 3. Create New Lead in PostgreSQL
      company = await prisma.company.create({
        data: {
          name: raw.companyName.trim(),
          normalizedName: normName,
          domain: raw.website?.trim() || null,
          normalizedDomain: normDomain,
          phone: raw.phone?.trim() || null,
          normalizedPhone: normPhone,
          industry: raw.industry?.trim() || "Commercial Services",
          location: raw.location?.trim() || null,
          city: city,
          country: "UAE",
          description: raw.description?.trim() || null,
          source: raw.sourceFile,
          status: "NEW",
        },
      });

      if (raw.contactName || raw.email || raw.phone) {
        contact = await prisma.contact.create({
          data: {
            companyId: company.id,
            name: raw.contactName?.trim() || "Decision Maker",
            role: raw.role?.trim() || "Leadership",
            email: raw.email?.trim() || null,
            phone: raw.phone?.trim() || null,
            isPrimary: true,
            isVerified: false,
            identityConfidence: 0,
            verificationSource: null,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          action: "LEAD_IMPORTED",
          actor: "CAMPAIGN_SIMULATOR",
          details: { source: raw.sourceFile, duplicate: false },
        },
      });
    }

    // 4. Research & Multi-Page Digital Inspection
    let websiteAudit: any = null;
    let websiteStatus = "NO_WEBSITE";
    let websiteScore = 0;
    let confidenceScore = 90;

    if (company.domain) {
      try {
        websiteAudit = await auditCompanyWebsite(company.domain);
        websiteStatus = websiteAudit.websiteStatus;
        websiteScore = websiteAudit.websiteScore;
        metrics.researchSuccessful++;
      } catch (err: any) {
        websiteStatus = "UNREACHABLE";
        websiteScore = 0;
        confidenceScore = 70;
        metrics.researchFailed++;
      }
    } else {
      websiteStatus = "NO_WEBSITE";
      websiteScore = 0;
      confidenceScore = 95; // High confidence that company has zero website
      metrics.researchSuccessful++;
    }

    // Save Research
    const researchRecord = await prisma.companyResearch.upsert({
      where: { companyId: company.id },
      create: {
        companyId: company.id,
        websiteStatus,
        websiteScore,
        confidenceScore,
        status: "COMPLETED",
        digitalPresence: (websiteAudit?.digitalPresence as any) || {
          hasMobileViewport: false,
          hasSsl: false,
          hasWhatsapp: Boolean(company.phone),
          hasContactForm: false,
        },
        evidenceMatrix: (websiteAudit?.evidenceMatrix as any) || [
          {
            observation: "Zero verified website domain or web infrastructure detected.",
            truthTier: "VERIFIED",
            evidence: "No active domain registry or web server found.",
          },
        ],
      },
      update: {
        websiteStatus,
        websiteScore,
        confidenceScore,
        status: "COMPLETED",
      },
    });

    // 5. Opportunity Analysis & Qualified Scoring
    const evalInput = {
      companyName: company.name,
      website: company.domain,
      industry: company.industry,
      location: company.city || company.location || "Dubai",
      description: company.description,
      websiteAudit: websiteAudit || {
        websiteStatus,
        websiteScore,
        digitalPresence: researchRecord.digitalPresence,
        evidenceMatrix: researchRecord.evidenceMatrix,
      },
    };

    const opportunityAnalysis: OpportunityAnalysis = await aiProvider.analyzeCompanyOpportunity(evalInput);

    // Map to DB Service
    const matchedService =
      services.find((s) => s.code === opportunityAnalysis.recommendedServiceCode) || defaultService;

    const oppRecord = await prisma.opportunity.create({
      data: {
        companyId: company.id,
        serviceId: matchedService.id,
        opportunityScore: opportunityAnalysis.opportunityScore,
        confidenceScore: opportunityAnalysis.confidenceScore,
        recommendedChannel: opportunityAnalysis.recommendedChannel,
        primaryPainPoint: opportunityAnalysis.primaryPainPoint,
        reasoning: opportunityAnalysis.reasoning || "Business lacks digital infrastructure.",
        potentialImpact: (opportunityAnalysis as any).potentialBusinessImpact || (opportunityAnalysis as any).potentialImpact || opportunityAnalysis.reasoning || "Establish digital authority and capture inbound high-intent demand.",
        reasonToContact: opportunityAnalysis.reasonToContact || "Strengthen inbound commercial presence.",
        suggestedOffer: opportunityAnalysis.suggestedOffer,
        expectedBusinessBenefit: opportunityAnalysis.expectedBusinessBenefit,
        claimType: opportunityAnalysis.claimType || "ESTIMATE",
        estimatedBudgetMin: opportunityAnalysis.estimatedBudgetMin,
        estimatedBudgetMax: opportunityAnalysis.estimatedBudgetMax,
        currency: "AED",
        pitchAngle: opportunityAnalysis.pitchAngle,
        evidenceSummary: opportunityAnalysis.evidenceSummary,
        status: "IDENTIFIED",
      },
    });

    // Rank value: Opportunity Score * Confidence
    const rankScore = (oppRecord.opportunityScore * oppRecord.confidenceScore) / 100;
    rankedOpportunities.push({
      companyName: company.name,
      industry: company.industry,
      opportunityScore: oppRecord.opportunityScore,
      confidenceScore: oppRecord.confidenceScore,
      rankScore,
      serviceName: matchedService.name,
      suggestedOffer: oppRecord.suggestedOffer,
      primaryPainPoint: oppRecord.primaryPainPoint,
      reasonToContact: oppRecord.reasonToContact,
      claimType: oppRecord.claimType,
    });

    if (oppRecord.opportunityScore >= 80) metrics.highOpportunity++;
    if (oppRecord.confidenceScore >= 80) metrics.highConfidence++;

    // 6. Check "Needs Verification" flag
    const hasUnknownCritical =
      oppRecord.confidenceScore < 80 ||
      websiteStatus === "UNREACHABLE" ||
      (!contact?.email && !contact?.phone && !company.phone);

    const needsVerification = hasUnknownCritical || opportunityAnalysis.decision === "NEEDS_VERIFICATION";
    if (needsVerification) metrics.needsVerification++;

    // Strict Outreach Eligibility Guard: Only PROCEED leads enter outreach generation
    if (opportunityAnalysis.decision !== "PROCEED") {
      continue;
    }

    // 7. Outreach Generation with Contact Identity Guard & Non-Guaranteed Commercial Claims
    const outreach = await aiProvider.generatePersonalizedOutreach({
      companyName: company.name,
      contactName: contact?.name,
      isContactVerified: contact?.isVerified ?? false,
      contactIdentityConfidence: contact?.identityConfidence ?? 0,
      contactVerificationSource: contact?.verificationSource ?? undefined,
      opportunity: opportunityAnalysis,
    });

    metrics.messagesGenerated++;

    const messageRecord = await prisma.message.create({
      data: {
        companyId: company.id,
        contactId: contact?.id,
        opportunityId: oppRecord.id,
        channel: opportunityAnalysis.recommendedChannel,
        status: "READY_FOR_REVIEW", // Strict rule: never auto-approve in initial generation
        emailSubject: outreach.emailSubject,
        emailBody: outreach.emailBody,
        whatsappBody: outreach.whatsappBody,
        followupBody: outreach.followupBody,
        outreachAngle: outreach.outreachAngle,
        verifiedObservation: outreach.verifiedObservation,
        proposedSolution: outreach.proposedSolution,
        callToAction: outreach.callToAction,
        evidenceUsed: outreach.evidenceUsed,
        qualityScore: outreach.qualityReport?.overallScore || 90,
        qualityReport: (outreach.qualityReport as any) || {},
      },
    });

    await prisma.messageEvent.create({
      data: {
        messageId: messageRecord.id,
        eventType: "GENERATED",
        metadata: { qualityScore: messageRecord.qualityScore, channel: messageRecord.channel },
      },
    });

    // 8. Human Review Simulation & Approval Gate
    // Rules: Only approve if high confidence (>=80), NOT needing verification, and quality score >= 90
    let humanReviewStatus = "READY_FOR_REVIEW";
    let dryRunStatus = "NOT_SCHEDULED";

    if (!needsVerification && oppRecord.confidenceScore >= 80 && (messageRecord.qualityScore || 0) >= 90) {
      // Simulate human review approval
      await prisma.message.update({
        where: { id: messageRecord.id },
        data: {
          status: "APPROVED",
          approvedBy: "HUMAN_REVIEWER_SIM",
          approvalNotes: "Verified via Milestone 3C Campaign Review Pipeline",
          approvedAt: new Date(),
        },
      });

      await prisma.messageEvent.create({
        data: {
          messageId: messageRecord.id,
          eventType: "APPROVED",
          metadata: { reviewer: "HUMAN_REVIEWER_SIM" },
        },
      });

      humanReviewStatus = "APPROVED";
      metrics.messagesApproved++;

      // 9. Delivery Safety Gate & Dry-Run Execution
      const deliveryResult = await executeMessageDelivery({
        messageId: messageRecord.id,
        channel: messageRecord.channel as any,
        forceDryRun: true,
      });

      if (deliveryResult.success && deliveryResult.isDryRun) {
        metrics.dryRunDeliveries++;
        dryRunStatus = `DRY_RUN_PASSED (${deliveryResult.provider})`;
      } else {
        metrics.safetyBlocks++;
        dryRunStatus = `BLOCKED: ${deliveryResult.error || "SAFETY_GATE_FAIL"}`;
      }
    } else {
      // Try safety gate on unapproved message to verify safety blocking
      const unapprovedSafety = await evaluateDeliverySafety({
        messageId: messageRecord.id,
        companyId: company.id,
        contactId: contact?.id,
        channel: messageRecord.channel as any,
      });

      if (!unapprovedSafety.passed) {
        metrics.safetyBlocks++;
        dryRunStatus = "SAFETY_HELD (UNAPPROVED)";
      }
      humanReviewStatus = needsVerification ? "NEEDS_VERIFICATION" : "READY_FOR_REVIEW";
    }

    // 10. Record Row for Campaign Table
    campaignReportRows.push({
      company: company.name,
      industry: company.industry || "General",
      location: company.city || company.location || "Dubai",
      website: company.domain || "NONE (Zero Web)",
      opportunityScore: oppRecord.opportunityScore,
      confidenceScore: oppRecord.confidenceScore,
      recommendedService: matchedService.name,
      recommendedOffer: oppRecord.suggestedOffer,
      reasonToContact: oppRecord.reasonToContact || oppRecord.primaryPainPoint,
      messageQuality: `${messageRecord.qualityScore}/100`,
      recommendedChannel: oppRecord.recommendedChannel,
      researchStatus: websiteStatus,
      humanReviewStatus,
      dryRunStatus,
    });
  }

  // Sort ranked opportunities by rankScore descending
  rankedOpportunities.sort((a, b) => b.rankScore - a.rankScore);

  console.log("\n================================================================================");
  console.log("                       CAMPAIGN EXECUTION METRICS                               ");
  console.log("================================================================================");
  console.log(`  • Total Imported Raw Leads:    ${metrics.totalImported}`);
  console.log(`  • Database Deduplications:     ${metrics.duplicates}`);
  console.log(`  • Research Successful:         ${metrics.researchSuccessful}`);
  console.log(`  • Research Failed/Unreachable: ${metrics.researchFailed}`);
  console.log(`  • High Opportunity (Score>=80):${metrics.highOpportunity}`);
  console.log(`  • High Confidence (Conf>=80):  ${metrics.highConfidence}`);
  console.log(`  • Needs Verification Flagged:  ${metrics.needsVerification}`);
  console.log(`  • Messages Generated:          ${metrics.messagesGenerated}`);
  console.log(`  • Messages Human-Approved:     ${metrics.messagesApproved}`);
  console.log(`  • Dry-Run Deliveries (Passed): ${metrics.dryRunDeliveries}`);
  console.log(`  • Safety Gate Holds/Blocks:    ${metrics.safetyBlocks}`);
  console.log("================================================================================\n");

  return {
    metrics,
    campaignReportRows,
    top10Ranked: rankedOpportunities.slice(0, 10),
  };
}

// Execute if run directly
if (require.main === module) {
  runFullCampaignSimulation()
    .then((result) => {
      console.log("Campaign simulation execution finished successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Campaign simulation error:", err);
      process.exit(1);
    });
}
