import { z } from "zod";

// ==========================================
// 1. DATA ACCURACY, TRUTH TIERS & CLAIM TYPES
// ==========================================
export const TruthTierSchema = z.enum(["VERIFIED", "INFERRED", "UNKNOWN"]);
export type TruthTier = z.infer<typeof TruthTierSchema>;

export const ClaimTypeSchema = z.enum([
  "VERIFIED_FACT",
  "INFERRED_INSIGHT",
  "ESTIMATE",
  "UNKNOWN",
]);
export type ClaimType = z.infer<typeof ClaimTypeSchema>;

export const ConfidenceScoreSchema = z.number().min(0).max(100);
export const OpportunityScoreSchema = z.number().min(0).max(100);

// ==========================================
// 2. LEAD & COMPANY SCHEMAS
// ==========================================
export const CompanyStatusSchema = z.enum([
  "NEW",
  "RESEARCHING",
  "RESEARCHED",
  "OPPORTUNITY_IDENTIFIED",
  "OUTREACH_READY",
  "OUTREACH_APPROVED",
  "OUTREACH_SENT",
  "REPLIED",
  "SUPPRESSED",
  "ARCHIVED",
]);
export type CompanyStatus = z.infer<typeof CompanyStatusSchema>;

export const LeadSourceSchema = z.enum([
  "CSV_IMPORT",
  "XLSX_IMPORT",
  "MANUAL_INPUT",
  "N8N_WEBHOOK",
  "API",
]);
export type LeadSource = z.infer<typeof LeadSourceSchema>;

export const LeadRowInputSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  contactName: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country: z.string().optional().nullable().default("UAE"),
  city: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  source: LeadSourceSchema.optional().default("CSV_IMPORT"),
});
export type LeadRowInput = z.infer<typeof LeadRowInputSchema>;

export const ContactVerificationSourceSchema = z.enum([
  "MANUAL_INPUT",
  "TEAM_PAGE",
  "OFFICIAL_REGISTRY",
  "CSV_VERIFIED",
  "DIRECT_INQUIRY",
  "UNKNOWN",
]);
export type ContactVerificationSource = z.infer<typeof ContactVerificationSourceSchema>;

export const CONTACT_IDENTITY_THRESHOLD = 80; // Minimum confidence (0-100) required to address a recipient by name

export const ContactSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  name: z.string().min(1),
  role: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  isPrimary: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  identityConfidence: z.number().min(0).max(100).default(0),
  verificationSource: ContactVerificationSourceSchema.optional().nullable().default("UNKNOWN"),
  isSuppressed: z.boolean().default(false),
});
export type Contact = z.infer<typeof ContactSchema>;

export interface OutreachPromptInput {
  companyName: string;
  contactName?: string | null;
  isContactVerified?: boolean;
  contactIdentityConfidence?: number;
  contactVerificationSource?: string | null;
  role?: string | null;
  industry?: string | null;
  location?: string | null;
  opportunity: OpportunityAnalysis;
  verifiedDetails?: string[];
}

export const LeadImportColumnMappingSchema = z.object({
  companyName: z.string(),
  contactName: z.string().optional(),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
});
export type LeadImportColumnMapping = z.infer<typeof LeadImportColumnMappingSchema>;

export const LeadDeduplicationMatchReasonSchema = z.enum([
  "EXACT_DOMAIN",
  "NORMALIZED_PHONE",
  "NAME_AND_LOCATION",
  "PRIMARY_EMAIL",
]);
export type LeadDeduplicationMatchReason = z.infer<
  typeof LeadDeduplicationMatchReasonSchema
>;

export interface LeadDeduplicationPreviewItem {
  rowNumber: number;
  input: LeadRowInput;
  normalizedDomain?: string;
  normalizedPhone?: string;
  normalizedName?: string;
  isDuplicate: boolean;
  duplicateReason?: LeadDeduplicationMatchReason;
  existingCompanyId?: string;
  existingCompanyName?: string;
  isValid: boolean;
  validationErrors?: string[];
}

export interface LeadImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newLeadsCount: number;
  duplicateLeadsCount: number;
  items: LeadDeduplicationPreviewItem[];
}

// ==========================================
// 3. EVIDENCE ENGINE & DIGITAL PRESENCE
// ==========================================
export const EvidenceItemSchema = z.object({
  id: z.string().optional(),
  observation: z.string(),
  evidence: z.string(),
  impact: z.string(),
  recommendedSolution: z.string(),
  confidence: z.number().min(0).max(100),
  truthTier: TruthTierSchema,
  category: z.string().optional(),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const SubPageTypeSchema = z.enum([
  "HOMEPAGE",
  "ABOUT",
  "SERVICES",
  "CONTACT",
  "PORTFOLIO",
  "CAREERS",
  "BOOKING",
  "OTHER",
]);
export type SubPageType = z.infer<typeof SubPageTypeSchema>;

export const SubPageAuditSchema = z.object({
  url: z.string(),
  pageType: SubPageTypeSchema,
  statusCode: z.number(),
  title: z.string(),
  loadTimeMs: z.number(),
  isReachable: z.boolean(),
  keySignalsFound: z.array(z.string()).default([]),
});
export type SubPageAudit = z.infer<typeof SubPageAuditSchema>;

export const DigitalPresenceSchema = z.object({
  cms: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  ecommerce: z.array(z.string()).default([]),
  analytics: z.array(z.string()).default([]),
  chatWidgets: z.array(z.string()).default([]),
  bookingEngines: z.array(z.string()).default([]),
  socialLinks: z.record(z.string().optional()).default({}),
  hasWhatsapp: z.boolean().default(false),
  hasHttps: z.boolean().default(false),
  hasMobileViewport: z.boolean().default(false),
  hasContactForm: z.boolean().default(false),
  hasBooking: z.boolean().default(false),
  hasPortfolio: z.boolean().default(false),
  ctaQuality: z.enum(["STRONG", "AVERAGE", "POOR", "NONE"]).default("NONE"),
  seoSignals: z
    .object({
      hasMetaDescription: z.boolean().default(false),
      hasOpenGraph: z.boolean().default(false),
      hasH1: z.boolean().default(false),
    })
    .default({}),
});
export type DigitalPresence = z.infer<typeof DigitalPresenceSchema>;

// ==========================================
// 4. WEBSITE AUDIT & RESEARCH SCHEMAS
// ==========================================
export const WebsiteStatusSchema = z.enum([
  "ONLINE",
  "OFFLINE",
  "NOT_FOUND",
  "NO_WEBSITE",
  "REDIRECTED",
  "SSL_ERROR",
  "TIMEOUT",
  "BLOCKED",
]);
export type WebsiteStatus = z.infer<typeof WebsiteStatusSchema>;

export const WebsiteAuditReportSchema = z.object({
  url: z.string(),
  finalUrl: z.string().optional(),
  httpStatus: z.number().optional(),
  websiteStatus: WebsiteStatusSchema,
  isReachable: z.boolean(),
  hasHttps: z.boolean(),
  hasMobileViewport: z.boolean(),
  loadTimeMs: z.number().optional(),
  pageTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  headingsSummary: z.array(z.string()).optional(),
  detectedTechnologies: z.array(z.string()).default([]),
  ctaElements: z.array(z.string()).default([]),
  contactInfoFound: z.object({
    emails: z.array(z.string()).default([]),
    phones: z.array(z.string()).default([]),
    socialLinks: z.array(z.string()).default([]),
    hasContactForm: z.boolean().default(false),
    hasBookingEngine: z.boolean().default(false),
  }),
  qualitySignals: z.object({
    hasPortfolioSection: z.boolean().default(false),
    hasTestimonials: z.boolean().default(false),
    hasClearPricing: z.boolean().default(false),
    isOutdatedVisualDesign: z.boolean().default(false),
    hasBrokenElementsNotice: z.boolean().default(false),
  }),
  overallAuditScore: z.number().min(0).max(100),
  identifiedIssues: z.array(z.string()).default([]),
  truthTiers: z.record(TruthTierSchema).default({}),
  subPages: z.array(SubPageAuditSchema).default([]),
  digitalPresence: DigitalPresenceSchema.optional(),
  evidenceMatrix: z.array(EvidenceItemSchema).default([]),
});
export type WebsiteAuditReport = z.infer<typeof WebsiteAuditReportSchema>;

export const ResearchResultSchema = z.object({
  companyId: z.string().uuid(),
  websiteUrl: z.string().optional(),
  websiteAudit: WebsiteAuditReportSchema.optional(),
  verifiedServices: z.array(z.string()).default([]),
  targetMarket: z.string().optional(),
  primaryBusinessProblems: z.array(z.string()).default([]),
  confidenceScore: ConfidenceScoreSchema,
  researchSummary: z.string(),
  evidenceMatrix: z.array(EvidenceItemSchema).default([]),
  rawNotes: z.string().optional(),
});
export type ResearchResult = z.infer<typeof ResearchResultSchema>;

// ==========================================
// 5. 15-SERVICE CATALOG TAXONOMY & OPPORTUNITY
// ==========================================
export const OutreachChannelSchema = z.enum(["EMAIL", "WHATSAPP", "LINKEDIN", "NO_CHANNEL"]);
export type OutreachChannel = z.infer<typeof OutreachChannelSchema>;

export const ResearchEvidenceLevelSchema = z.enum([
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNVERIFIED",
]);
export type ResearchEvidenceLevel = z.infer<typeof ResearchEvidenceLevelSchema>;

export const OpportunityReasonCodeSchema = z.enum([
  "NO_WEBSITE",
  "WEAK_MOBILE",
  "NO_CTA",
  "WEAK_PORTFOLIO",
  "NO_BOOKING",
  "WHATSAPP_MANUAL",
  "POOR_SEO",
  "PERFORMANCE_ISSUE",
  "AUTOMATION_GAP",
  "STRONG_DIGITAL_PRESENCE",
  "INSUFFICIENT_EVIDENCE",
]);
export type OpportunityReasonCode = z.infer<typeof OpportunityReasonCodeSchema>;

export const OpportunityDecisionSchema = z.enum([
  "PROCEED",
  "DO_NOT_CONTACT",
  "NEEDS_VERIFICATION",
]);
export type OpportunityDecision = z.infer<typeof OpportunityDecisionSchema>;

export const ServiceCodeSchema = z.enum([
  "NEW_HIGH_CONVERTING_WEBSITE",        // 1. Website Development
  "PREMIUM_WEBSITE_REDESIGN",           // 2. Website Redesign
  "HIGH_CONVERTING_LANDING_PAGE",       // 3. Landing Page
  "ECOMMERCE_ARCHITECTURE",             // 4. E-commerce
  "AI_CONVERSATIONAL_CHATBOT",          // 5. AI Chatbot
  "AI_RECEPTIONIST_VOICE_WHATSAPP",     // 6. AI Receptionist
  "WHATSAPP_LEAD_AUTOMATION",           // 7. WhatsApp Automation
  "AI_LEAD_QUALIFICATION_BOT",          // 8. Lead Qualification
  "CRM_WORKFLOW_AUTOMATION",            // 9. CRM Automation
  "CUSTOM_BUSINESS_DASHBOARD",          // 10. Custom Dashboard
  "BUSINESS_PROCESS_AUTOMATION",        // 11. Business Automation
  "AI_SYSTEMS_INTEGRATION",             // 12. AI Integration
  "PERFORMANCE_SEO_UPGRADE",            // 13. Performance Optimization
  "ENTERPRISE_SEO_STRATEGY",            // 14. SEO
  "CYBERSECURITY_REVIEW_HARDENING",     // 15. Security Review
  "NO_SERVICE_RECOMMENDED",             // 16. Negative Signal (Strong Presence / Do Not Contact)
]);
export type ServiceCode = z.infer<typeof ServiceCodeSchema>;

export const OpportunityAnalysisSchema = z.object({
  companyId: z.string().uuid().optional(),
  opportunityScore: OpportunityScoreSchema,
  confidenceScore: ConfidenceScoreSchema,
  evidenceLevel: ResearchEvidenceLevelSchema.default("MEDIUM"),
  reasonCode: OpportunityReasonCodeSchema.default("NO_WEBSITE"),
  decision: OpportunityDecisionSchema.default("PROCEED"),
  isContactRecommended: z.boolean().default(true),
  recommendedServiceCode: ServiceCodeSchema,
  recommendedServiceName: z.string(),
  recommendedChannel: OutreachChannelSchema,
  primaryPainPoint: z.string(),
  reasoning: z.string(),
  potentialBusinessImpact: z.string(),
  reasonToContact: z.string(),
  suggestedOffer: z.string(),
  expectedBusinessBenefit: z.string(),
  claimType: ClaimTypeSchema.default("ESTIMATE"),
  estimatedBudgetMin: z.number().positive(),
  estimatedBudgetMax: z.number().positive(),
  currency: z.string().default("AED"),
  pitchAngle: z.string(),
  evidenceSummary: z.array(z.string()).default([]),
});
export type OpportunityAnalysis = z.infer<typeof OpportunityAnalysisSchema>;

// ==========================================
// 6. MESSAGE GENERATION, QUALITY & APPROVAL GATE
// ==========================================
export const MessageStatusSchema = z.enum([
  "DRAFT",
  "READY_FOR_REVIEW",
  "EDITED",
  "APPROVED",
  "REJECTED",
  "SCHEDULED",
  "SENT",
  "FAILED",
  "REPLIED",
  "CLOSED",
  "NOT_ELIGIBLE",
]);
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const QualityTierSchema = z.enum(["EXCELLENT", "GOOD", "ACCEPTABLE", "WEAK"]);
export type QualityTier = z.infer<typeof QualityTierSchema>;

export const MessageQualityReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  evidenceScore: z.number().min(0).max(100),
  brevityScore: z.number().min(0).max(100),
  naturalnessScore: z.number().min(0).max(100),
  claimSafetyScore: z.number().min(0).max(100),
  specificityScore: z.number().min(0).max(100),
  qualityTier: QualityTierSchema.default("GOOD"),
  passed: z.boolean(),
  detectedIssues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});
export type MessageQualityReport = z.infer<typeof MessageQualityReportSchema>;

export const GeneratedMessagePayloadSchema = z.object({
  emailSubject: z.string().min(5),
  emailBody: z.string().min(20),
  whatsappBody: z.string().min(10),
  followupBody: z.string().min(15),
  verifiedObservation: z.string(),
  proposedSolution: z.string(),
  outreachAngle: z.string().default(""),
  callToAction: z.string(),
  channel: OutreachChannelSchema.default("EMAIL"),
  evidenceUsed: z.array(z.string()).default([]),
  qualityScore: z.number().min(0).max(100).default(85),
  qualityReport: MessageQualityReportSchema.optional(),
});
export type GeneratedMessagePayload = z.infer<typeof GeneratedMessagePayloadSchema>;

export const ApproveMessageActionSchema = z.object({
  messageId: z.string().uuid(),
  decision: z.enum(["APPROVE", "EDIT_AND_APPROVE", "REGENERATE", "REJECT"]),
  editedEmailSubject: z.string().optional(),
  editedEmailBody: z.string().optional(),
  editedWhatsappBody: z.string().optional(),
  editedFollowupBody: z.string().optional(),
  feedbackNotes: z.string().optional(),
});
export type ApproveMessageAction = z.infer<typeof ApproveMessageActionSchema>;

// ==========================================
// 7. REPLY INTELLIGENCE & SUPPRESSIONS
// ==========================================
export const ReplyClassificationSchema = z.enum([
  "INTERESTED",
  "PRICING",
  "MEETING_REQUEST",
  "MORE_INFORMATION",
  "MAYBE_LATER",
  "NOT_INTERESTED",
  "WRONG_CONTACT",
  "OPT_OUT",
  "OTHER",
]);
export type ReplyClassification = z.infer<typeof ReplyClassificationSchema>;

export const SuppressionReasonSchema = z.enum([
  "UNSUBSCRIBE",
  "DO_NOT_CONTACT",
  "BOUNCE",
  "INVALID_CONTACT",
  "MANUAL_SUPPRESSION",
  "OPT_OUT",
  "MANUAL_BLOCK",
  "COMPLAINT",
]);
export type SuppressionReason = z.infer<typeof SuppressionReasonSchema>;

// ==========================================
// 8. DELIVERY INFRASTRUCTURE & SAFETY GATE
// ==========================================
export const DeliveryStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "SENT",
  "DELIVERED",
  "BOUNCED",
  "FAILED",
  "CANCELLED",
  "DRY_RUN",
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const DeliverySafetyCheckReportSchema = z.object({
  passed: z.boolean(),
  isMessageApproved: z.boolean(),
  hasValidDestination: z.boolean(),
  isContactSuppressed: z.boolean(),
  isCompanySuppressed: z.boolean(),
  isDuplicateOutreach: z.boolean(),
  isRateLimitPermitted: z.boolean(),
  isKillSwitchActive: z.boolean(),
  isDryRun: z.boolean(),
  destination: z.string(),
  channel: OutreachChannelSchema,
  failedChecks: z.array(z.string()).default([]),
  reason: z.string().optional(),
});
export type DeliverySafetyCheckReport = z.infer<typeof DeliverySafetyCheckReportSchema>;

export interface DeliveryPayload {
  messageId: string;
  companyId: string;
  contactId?: string | null;
  recipient: string;
  channel: "EMAIL" | "WHATSAPP";
  subject?: string | null;
  body: string;
  idempotencyKey: string;
  isDryRun: boolean;
  metadata?: Record<string, any>;
}

export interface DeliveryResult {
  success: boolean;
  deliveryId: string;
  idempotencyKey: string;
  status: DeliveryStatus;
  provider: string;
  providerMessageId?: string;
  isDryRun: boolean;
  safetyCheck: DeliverySafetyCheckReport;
  error?: string;
  timestamp: string;
}

export interface DomainDnsRecordCheck {
  recordType: "SPF" | "DKIM" | "DMARC";
  name: string;
  expectedPattern: string;
  foundValue?: string;
  status: "VERIFIED" | "MISSING" | "UNVERIFIED" | "PROVIDER_MANAGED";
  notes: string;
}

export interface DomainHealthReport {
  domain: string;
  hasSpf: boolean;
  hasDkim: boolean;
  hasDmarc: boolean;
  isHealthy: boolean;
  isProviderManaged?: boolean;
  records: DomainDnsRecordCheck[];
  checkedAt: string;
}

// ==========================================
// 9. AUDIT LOG & OBSERVABILITY
// ==========================================
export const AuditActionSchema = z.enum([
  "LEAD_IMPORTED",
  "LEAD_UPDATED",
  "LEAD_ARCHIVED",
  "RESEARCH_STARTED",
  "RESEARCH_COMPLETED",
  "RESEARCH_FAILED",
  "OPPORTUNITY_GENERATED",
  "MESSAGE_GENERATED",
  "MESSAGE_APPROVED",
  "MESSAGE_EDITED",
  "MESSAGE_REGENERATED",
  "MESSAGE_REJECTED",
  "MESSAGE_SCHEDULED",
  "MESSAGE_SENT",
  "MESSAGE_DELIVERY_FAILED",
  "DELIVERY_ATTEMPTED",
  "DELIVERY_BLOCKED",
  "DELIVERY_DRY_RUN",
  "DELIVERY_SENT",
  "DELIVERY_FAILED",
  "REPLY_RECEIVED",
  "LEAD_SUPPRESSED",
  "SYSTEM_ERROR",
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export interface AuditLogItem {
  id: string;
  companyId?: string | null;
  action: AuditAction;
  actor: string;
  details?: Record<string, any>;
  createdAt: Date | string;
}

// ==========================================
// 9. API REQUEST & RESPONSE ENVELOPES
// ==========================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  meta?: Record<string, any>;
}

export interface DashboardMetrics {
  totalLeads: number;
  researchCompleted: number;
  highOpportunityLeads: number;
  readyForReview: number;
  approvedOutreach: number;
  sentOutreach: number;
  repliesTotal: number;
  positiveReplies: number;
  conversionRate: number;
}
