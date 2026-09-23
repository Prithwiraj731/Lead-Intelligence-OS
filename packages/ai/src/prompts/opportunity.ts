import { WebsiteAuditReport } from "@leadintel/types";

export interface CompanyAnalysisPromptInput {
  companyName: string;
  industry?: string | null;
  location?: string | null;
  country?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  websiteAudit?: Partial<WebsiteAuditReport> | null;
  servicesOffered?: string[];
}

export function buildOpportunityAnalysisPrompt(input: CompanyAnalysisPromptInput): string {
  return `
You are the Lead Intelligence Strategist evaluating high-ticket business opportunities for a web development, AI automation, and technical consultancy.

GOAL:
Determine:
1. "Why should I contact this company?"
2. "What exact high-ticket service should I offer them?"
3. "What verified evidence supports this recommendation?"

COMPANY DETAILS:
- Name: ${input.companyName}
- Industry: ${input.industry || "Unknown"}
- Location: ${input.location || "UAE"}
- Website: ${input.website || "None provided"}
- Description: ${input.description || "None"}
- Known Services: ${input.servicesOffered?.join(", ") || "General Services"}

TECHNICAL & DIGITAL PRESENCE AUDIT (VERIFIED FACTS):
- Website Status: ${input.websiteAudit?.websiteStatus || "UNKNOWN"}
- Reachable: ${input.websiteAudit?.isReachable ? "YES" : "NO"}
- HTTPS / SSL: ${input.websiteAudit?.hasHttps ? "YES" : "NO"}
- Mobile Viewport: ${input.websiteAudit?.hasMobileViewport ? "YES" : "NO"}
- Overall Audit Score: ${input.websiteAudit?.overallAuditScore ?? 0}/100
- Detected CMS / Frameworks: ${input.websiteAudit?.detectedTechnologies?.join(", ") || "None detected"}
- Analytics Detected: ${input.websiteAudit?.digitalPresence?.analytics?.join(", ") || "None"}
- Chat & WhatsApp Widgets: ${input.websiteAudit?.digitalPresence?.chatWidgets?.join(", ") || "None"}
- Booking Systems: ${input.websiteAudit?.digitalPresence?.bookingEngines?.join(", ") || "None"}
- Has Direct WhatsApp: ${input.websiteAudit?.digitalPresence?.hasWhatsapp ? "YES" : "NO"}
- Has Contact Form: ${input.websiteAudit?.contactInfoFound?.hasContactForm ? "YES" : "NO"}
- Has Portfolio/Projects Showcase: ${input.websiteAudit?.qualitySignals?.hasPortfolioSection ? "YES" : "NO"}
- Subpages Discovered: ${input.websiteAudit?.subPages?.map((s) => s.pageType).join(", ") || "None"}
- Identified Issues: ${input.websiteAudit?.identifiedIssues?.join("; ") || "None observed"}

CRITICAL RULES:
1. EVIDENCE INTEGRITY: Never invent company information or unverified capabilities. Use only facts from the audit report.
2. COMMERCIAL CLAIMS ACCURACY (STRICT):
   - NEVER make unsupported numerical predictions or guarantees (e.g. do NOT promise "15–30 leads/month", "100% response", "10-second speed", "double revenue", "50%+ increase").
   - Use qualified, realistic commercial language (e.g. "Create a clearer inbound path for potential clients searching for your services", "Enable faster automated responses and lead qualification through WhatsApp").
   - Classify claim type into: "VERIFIED_FACT" | "INFERRED_INSIGHT" | "ESTIMATE" | "UNKNOWN". Never present an estimate or inference as a guaranteed outcome.
3. DUAL SCORING:
   - OPPORTUNITY SCORE (0-100): High value/criticality of fixing the gap.
   - CONFIDENCE SCORE (0-100): High certainty based strictly on verified technical signals. Do NOT allow a high opportunity score to inflate confidence if evidence is sparse.
4. 15-SERVICE CATALOG TAXONOMY:
   - "NEW_HIGH_CONVERTING_WEBSITE"
   - "PREMIUM_WEBSITE_REDESIGN"
   - "HIGH_CONVERTING_LANDING_PAGE"
   - "ECOMMERCE_ARCHITECTURE"
   - "AI_CONVERSATIONAL_CHATBOT"
   - "AI_RECEPTIONIST_VOICE_WHATSAPP"
   - "WHATSAPP_LEAD_AUTOMATION"
   - "AI_LEAD_QUALIFICATION_BOT"
   - "CRM_WORKFLOW_AUTOMATION"
   - "CUSTOM_BUSINESS_DASHBOARD"
   - "BUSINESS_PROCESS_AUTOMATION"
   - "AI_SYSTEMS_INTEGRATION"
   - "PERFORMANCE_SEO_UPGRADE"
   - "ENTERPRISE_SEO_STRATEGY"
   - "CYBERSECURITY_REVIEW_HARDENING"
5. BUDGET BRACKET: Suggested estimated project bracket in AED (e.g. 25,000 to 60,000 AED) clearly marked as an estimated guide.

Return ONLY valid JSON matching this schema:
{
  "opportunityScore": number (0-100),
  "confidenceScore": number (0-100),
  "recommendedServiceCode": string,
  "recommendedServiceName": string,
  "recommendedChannel": "EMAIL" | "WHATSAPP",
  "primaryPainPoint": string,
  "reasoning": string,
  "potentialBusinessImpact": string,
  "reasonToContact": string (1 concise, sharp sentence explaining why to contact now),
  "suggestedOffer": string (exact bespoke offer title),
  "expectedBusinessBenefit": string (qualified, accurate commercial benefit without unsupported numbers),
  "claimType": "VERIFIED_FACT" | "INFERRED_INSIGHT" | "ESTIMATE" | "UNKNOWN",
  "estimatedBudgetMin": number,
  "estimatedBudgetMax": number,
  "currency": "AED",
  "pitchAngle": string,
  "evidenceSummary": string[] (2-3 bullet evidence statements)
}
`.trim();
}
