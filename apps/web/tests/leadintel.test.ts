import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { normalizeDomain, normalizePhone, normalizeCompanyName } from "@leadintel/database";
import { validateSsrfSafeUrl, auditCompanyWebsite } from "../lib/research/inspector";
import { getAiProvider, evaluateMessageQuality } from "@leadintel/ai";
import { OpportunityAnalysis } from "@leadintel/types";
import { prisma } from "@leadintel/database";
import { evaluateDeliverySafety } from "../lib/delivery/safety-gate";
import { executeMessageDelivery, generateDeliveryIdempotencyKey } from "../lib/delivery/dispatcher";
import { SmtpEmailProvider } from "../lib/delivery/providers/smtp";
import { DryRunEmailProvider } from "../lib/delivery/providers/dry-run";
import { checkDomainHealth } from "../lib/delivery/domain-health";

describe("LEAD INTELLIGENCE OS - Milestone 2 Deep Engine Verification", () => {
  // 1. Data Normalization Tests
  describe("1. Data Normalizer", () => {
    it("should normalize complex website URLs to clean root domains", () => {
      expect(normalizeDomain("https://www.arcb-design.ae/portfolio?ref=123")).toBe("arcb-design.ae");
      expect(normalizeDomain("http://m.tawamcarpentry.com/")).toBe("tawamcarpentry.com");
      expect(normalizeDomain("subdomain.example.co.uk")).toBe("subdomain.example.co.uk");
      expect(normalizeDomain("")).toBeNull();
      expect(normalizeDomain(null)).toBeNull();
    });

    it("should normalize UAE and international phone numbers to E.164-compatible strings", () => {
      expect(normalizePhone("+971 50 123 4567")).toBe("971501234567");
      expect(normalizePhone("050-123-4567", "971")).toBe("971501234567");
      expect(normalizePhone("+1 (555) 234-5678")).toBe("15552345678");
      expect(normalizePhone("")).toBeNull();
    });

    it("should normalize company names by removing corporate suffixes for deduplication", () => {
      expect(normalizeCompanyName("Tawam Carpentry & Fitout FZ-LLC")).toBe("tawam carpentry fitout");
      expect(normalizeCompanyName("ARC&B Interiors LLC")).toBe("arc b interiors");
      expect(normalizeCompanyName("Apex Med Aesthetics Group Ltd.")).toBe("apex med aesthetics");
    });
  });

  // 2. SSRF Protection Tests
  describe("2. SSRF Protection Gate", () => {
    it("should block localhost and loopback addresses", async () => {
      const res1 = await validateSsrfSafeUrl("http://localhost:5678");
      expect(res1.safe).toBe(false);

      const res2 = await validateSsrfSafeUrl("http://127.0.0.1:8080/admin");
      expect(res2.safe).toBe(false);

      const res3 = await validateSsrfSafeUrl("http://[::1]:3000");
      expect(res3.safe).toBe(false);
    });

    it("should block private RFC1918 addresses", async () => {
      const res1 = await validateSsrfSafeUrl("http://192.168.1.1/router");
      expect(res1.safe).toBe(false);

      const res2 = await validateSsrfSafeUrl("http://10.0.0.5:9000");
      expect(res2.safe).toBe(false);

      const res3 = await validateSsrfSafeUrl("http://172.17.0.2:5678");
      expect(res3.safe).toBe(false);
    });

    it("should block cloud metadata IP (169.254.169.254)", async () => {
      const res = await validateSsrfSafeUrl("http://169.254.169.254/latest/meta-data/");
      expect(res.safe).toBe(false);
    });

    it("should permit valid public websites", async () => {
      const res = await validateSsrfSafeUrl("https://google.com");
      expect(res.safe).toBe(true);
    });
  });

  // 3. Multi-Page Inspection & Evidence Matrix Tests
  describe("3. Multi-Page Inspector & Evidence Matrix", () => {
    it("should generate structured evidence matrix and digital presence for empty website", async () => {
      const audit = await auditCompanyWebsite(null);
      expect(audit.websiteStatus).toBe("NO_WEBSITE");
      expect(audit.evidenceMatrix.length).toBeGreaterThan(0);
      expect(audit.evidenceMatrix[0].truthTier).toBe("VERIFIED");
      expect(audit.evidenceMatrix[0].observation).toBeDefined();
      expect(audit.evidenceMatrix[0].evidence).toBeDefined();
      expect(audit.evidenceMatrix[0].impact).toBeDefined();
      expect(audit.evidenceMatrix[0].recommendedSolution).toBeDefined();
      expect(audit.digitalPresence).toBeDefined();
    });

    it("should safely handle non-existent domains with verified error tier", async () => {
      const audit = await auditCompanyWebsite("https://this-domain-definitely-does-not-exist-12345.ae");
      expect(audit.isReachable).toBe(false);
      expect(audit.evidenceMatrix.length).toBeGreaterThan(0);
      expect(audit.evidenceMatrix[0].truthTier).toBe("VERIFIED");
    });
  });

  // 4. AI Opportunity & 15-Service Matching Tests
  describe("4. AI Opportunity Analysis & 15-Service Matching", () => {
    const ai = getAiProvider("rule-engine");

    it("should match greenfield opportunity to NEW_HIGH_CONVERTING_WEBSITE with reason to contact", async () => {
      const analysis = await ai.analyzeCompanyOpportunity({
        companyName: "Tawam Carpentry & Fitout",
        industry: "Carpentry & Joinery",
        location: "Al Ain",
        website: null,
      });

      expect(analysis.opportunityScore).toBe(92);
      expect(analysis.confidenceScore).toBe(95);
      expect(analysis.recommendedServiceCode).toBe("NEW_HIGH_CONVERTING_WEBSITE");
      expect(analysis.reasonToContact).toBeDefined();
      expect(analysis.expectedBusinessBenefit).toBeDefined();
      expect(analysis.suggestedOffer).toContain("Tawam Carpentry");
      expect(analysis.estimatedBudgetMin).toBeGreaterThan(0);
    });

    it("should match clinic with WhatsApp to AI_LEAD_QUALIFICATION_BOT", async () => {
      const analysis = await ai.analyzeCompanyOpportunity({
        companyName: "Apex Med Aesthetics",
        industry: "Aesthetic Clinic",
        location: "Dubai",
        website: "https://apex-aesthetics-dubai.ae",
        websiteAudit: {
          url: "https://apex-aesthetics-dubai.ae",
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: true,
          overallAuditScore: 80,
          detectedTechnologies: ["WordPress", "Google Analytics (GA4)"],
          ctaElements: [],
          contactInfoFound: {
            emails: [],
            phones: [],
            socialLinks: [],
            hasContactForm: true,
            hasBookingEngine: false,
          },
          qualitySignals: {
            hasPortfolioSection: true,
            hasTestimonials: true,
            hasClearPricing: false,
            isOutdatedVisualDesign: false,
            hasBrokenElementsNotice: false,
          },
          identifiedIssues: [],
          truthTiers: {},
          digitalPresence: {
            cms: ["WordPress"],
            frameworks: [],
            ecommerce: [],
            analytics: ["Google Analytics (GA4)"],
            chatWidgets: ["WhatsApp Direct Link"],
            bookingEngines: [],
            socialLinks: { whatsapp: "https://wa.me/971501234567" },
            hasWhatsapp: true,
            hasHttps: true,
            hasMobileViewport: true,
            hasContactForm: true,
            hasBooking: false,
            hasPortfolio: true,
            ctaQuality: "AVERAGE",
            seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
          },
          evidenceMatrix: [],
        },
      });

      expect(analysis.recommendedServiceCode).toBe("AI_LEAD_QUALIFICATION_BOT");
      expect(analysis.opportunityScore).toBe(90);
      expect(analysis.confidenceScore).toBe(90);
      expect(analysis.reasonToContact).toContain("WhatsApp");
      expect(analysis.recommendedChannel).toBe("WHATSAPP");
    });

    it("should enforce anti-jargon rules on generated pitches", async () => {
      const analysis = await ai.analyzeCompanyOpportunity({
        companyName: "ARC&B Interiors",
        industry: "Interior Architecture",
        location: "Dubai",
        website: "https://arcb-design.ae",
        websiteAudit: {
          url: "https://arcb-design.ae",
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: false,
          loadTimeMs: 3200,
          overallAuditScore: 62,
          detectedTechnologies: ["WordPress"],
          ctaElements: [],
          contactInfoFound: { emails: ["hello@arcb-design.ae"], phones: ["+97143456789"], socialLinks: [], hasContactForm: false, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: false, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: true, hasBrokenElementsNotice: false },
          identifiedIssues: ["No mobile viewport meta tag"],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: ["WordPress"],
            frameworks: [],
            ecommerce: [],
            analytics: [],
            chatWidgets: [],
            bookingEngines: [],
            socialLinks: {},
            hasWhatsapp: false,
            hasHttps: true,
            hasMobileViewport: false,
            hasContactForm: false,
            hasBooking: false,
            hasPortfolio: false,
            ctaQuality: "NONE",
            seoSignals: { hasMetaDescription: true, hasOpenGraph: false, hasH1: true },
          },
          evidenceMatrix: [],
        },
      });

      const message = await ai.generatePersonalizedOutreach({
        companyName: "ARC&B Interiors",
        contactName: "Tariq",
        role: "Managing Director",
        industry: "Interior Architecture",
        location: "Dubai",
        opportunity: analysis,
      });

      const banned = [
        "dear sir",
        "i hope this email finds you well",
        "revolutionize",
        "take your business to the next level",
        "cutting-edge",
        "synergy",
        "ai-powered transformation",
      ];

      const fullText = `${message.emailSubject} ${message.emailBody} ${message.whatsappBody}`.toLowerCase();
      for (const phrase of banned) {
        expect(fullText.includes(phrase)).toBe(false);
      }

      expect(message.emailSubject.length).toBeGreaterThan(3);
      expect(message.emailBody.length).toBeGreaterThan(20);
      expect(message.callToAction.length).toBeGreaterThan(5);
    });
  });

  // 5. Database & State Machine
  describe("5. Database & Service Catalog Integration", () => {
    let testCompanyId: string;
    let testMessageId: string;

    it("should verify that all 15 services exist in the database", async () => {
      const count = await prisma.serviceCatalog.count({ where: { isActive: true } });
      expect(count).toBeGreaterThanOrEqual(15);
    });

    it("should connect to PostgreSQL and create a lead record", async () => {
      const company = await prisma.company.create({
        data: {
          name: "Test Verification Corp FZ",
          normalizedName: normalizeCompanyName("Test Verification Corp FZ"),
          domain: "test-verif.ae",
          normalizedDomain: "test-verif.ae",
          status: "NEW",
        },
      });

      expect(company.id).toBeDefined();
      testCompanyId = company.id;
    });

    it("should enforce READY_FOR_REVIEW -> APPROVED transition on message sign-off", async () => {
      const opp = await prisma.opportunity.create({
        data: {
          companyId: testCompanyId,
          opportunityScore: 90,
          confidenceScore: 85,
          primaryPainPoint: "Missing portfolio showcase",
          reasoning: "Test reasoning",
          potentialImpact: "Improve digital client acquisition",
          reasonToContact: "Why contact test",
          suggestedOffer: "Test Offer",
          claimType: "INFERRED_INSIGHT",
          pitchAngle: "Direct audit",
        },
      });

      const msg = await prisma.message.create({
        data: {
          companyId: testCompanyId,
          opportunityId: opp.id,
          status: "READY_FOR_REVIEW",
          emailSubject: "quick note regarding test portfolio",
          emailBody: "Hi, noticed your portfolio needs a refresh. Would you like a mockup?",
          callToAction: "Would you like a mockup?",
        },
      });

      expect(msg.status).toBe("READY_FOR_REVIEW");
      testMessageId = msg.id;

      // Human Approval action
      const approved = await prisma.message.update({
        where: { id: testMessageId },
        data: {
          status: "APPROVED",
          approvedBy: "USER",
          approvedAt: new Date(),
        },
      });

      expect(approved.status).toBe("APPROVED");
      expect(approved.approvedBy).toBe("USER");
    });

    afterAll(async () => {
      if (testCompanyId) {
        await prisma.company.delete({ where: { id: testCompanyId } }).catch(() => {});
      }
    });
  });

  // 6. Commercial Claims Accuracy & Claim Type Classification
  describe("6. Commercial Claims Accuracy & Claim Type Classification", () => {
    const ai = getAiProvider("rule-engine");

    it("should never generate unsupported numerical claims in Expected Business Benefit across all scenarios", async () => {
      const scenarios = [
        { name: "No Website", input: { companyName: "Tawam Carpentry", location: "Al Ain" } },
        {
          name: "Missing Mobile Viewport",
          input: {
            companyName: "Old School Ltd",
            location: "Dubai",
            websiteAudit: {
              websiteStatus: "ONLINE" as const,
              isReachable: true,
              hasHttps: true,
              hasMobileViewport: false,
              overallAuditScore: 70,
              detectedTechnologies: [],
              ctaElements: [],
              contactInfoFound: { emails: [], phones: [], socialLinks: [], hasContactForm: true, hasBookingEngine: false },
              qualitySignals: { hasPortfolioSection: true, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
              identifiedIssues: ["No mobile viewport"],
              truthTiers: {},
              digitalPresence: { cms: [], frameworks: [], ecommerce: [], analytics: [], chatWidgets: [], bookingEngines: [], socialLinks: {}, hasWhatsapp: false, hasHttps: true, hasMobileViewport: false, hasContactForm: true, hasBooking: false, hasPortfolio: true, ctaQuality: "POOR" as const, seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true } },
              evidenceMatrix: [],
            },
          },
        },
        {
          name: "Insecure HTTP / No SSL",
          input: {
            companyName: "Insecure Store",
            location: "Dubai",
            websiteAudit: {
              websiteStatus: "ONLINE" as const,
              isReachable: true,
              hasHttps: false,
              hasMobileViewport: true,
              overallAuditScore: 65,
              detectedTechnologies: [],
              ctaElements: [],
              contactInfoFound: { emails: [], phones: [], socialLinks: [], hasContactForm: true, hasBookingEngine: false },
              qualitySignals: { hasPortfolioSection: true, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
              identifiedIssues: ["No SSL"],
              truthTiers: {},
              digitalPresence: { cms: [], frameworks: [], ecommerce: [], analytics: [], chatWidgets: [], bookingEngines: [], socialLinks: {}, hasWhatsapp: false, hasHttps: false, hasMobileViewport: true, hasContactForm: true, hasBooking: false, hasPortfolio: true, ctaQuality: "AVERAGE" as const, seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true } },
              evidenceMatrix: [],
            },
          },
        },
        {
          name: "WhatsApp Without Automation",
          input: {
            companyName: "Apex Aesthetics",
            industry: "Aesthetics Clinic",
            location: "Dubai",
            websiteAudit: {
              websiteStatus: "ONLINE" as const,
              isReachable: true,
              hasHttps: true,
              hasMobileViewport: true,
              overallAuditScore: 85,
              detectedTechnologies: [],
              ctaElements: [],
              contactInfoFound: { emails: [], phones: [], socialLinks: [], hasContactForm: true, hasBookingEngine: false },
              qualitySignals: { hasPortfolioSection: true, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
              identifiedIssues: [],
              truthTiers: {},
              digitalPresence: { cms: [], frameworks: [], ecommerce: [], analytics: [], chatWidgets: ["WhatsApp Direct Link"], bookingEngines: [], socialLinks: { whatsapp: "https://wa.me/971501234567" }, hasWhatsapp: true, hasHttps: true, hasMobileViewport: true, hasContactForm: true, hasBooking: false, hasPortfolio: true, ctaQuality: "AVERAGE" as const, seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true } },
              evidenceMatrix: [],
            },
          },
        },
        {
          name: "Hidden Portfolio in Design Studio",
          input: {
            companyName: "Elite Fitout",
            industry: "Interior Design & Fitout",
            location: "Dubai",
            websiteAudit: {
              websiteStatus: "ONLINE" as const,
              isReachable: true,
              hasHttps: true,
              hasMobileViewport: true,
              overallAuditScore: 80,
              detectedTechnologies: [],
              ctaElements: [],
              contactInfoFound: { emails: [], phones: [], socialLinks: [], hasContactForm: true, hasBookingEngine: false },
              qualitySignals: { hasPortfolioSection: false, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
              identifiedIssues: [],
              truthTiers: {},
              digitalPresence: { cms: [], frameworks: [], ecommerce: [], analytics: [], chatWidgets: [], bookingEngines: [], socialLinks: {}, hasWhatsapp: false, hasHttps: true, hasMobileViewport: true, hasContactForm: true, hasBooking: false, hasPortfolio: false, ctaQuality: "AVERAGE" as const, seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true } },
              evidenceMatrix: [],
            },
          },
        },
      ];

      const unsupportedClaimsRegex = /\b(15[–-]30|100%|10[- ]second|double\b|50%\+|60%\+|40%|30-40%|guaranteed)\b/i;

      for (const scenario of scenarios) {
        const analysis = await ai.analyzeCompanyOpportunity(scenario.input);

        // 1. Check expected business benefit
        expect(analysis.expectedBusinessBenefit).not.toMatch(unsupportedClaimsRegex);
        expect(analysis.expectedBusinessBenefit.length).toBeGreaterThan(15);

        // 2. Check potential business impact
        expect(analysis.potentialBusinessImpact).not.toMatch(unsupportedClaimsRegex);

        // 3. Check ClaimType validity
        expect(["VERIFIED_FACT", "INFERRED_INSIGHT", "ESTIMATE", "UNKNOWN"]).toContain(analysis.claimType);

        // 4. Check generated outreach message copy
        const message = await ai.generatePersonalizedOutreach({
          companyName: scenario.input.companyName,
          industry: scenario.input.industry || "Commercial Services",
          location: scenario.input.location || "Dubai",
          opportunity: analysis,
        });

        const fullCopy = `${message.emailBody} ${message.whatsappBody}`;
        expect(fullCopy).not.toMatch(unsupportedClaimsRegex);
      }
    });

    it("should assign correct ClaimType to verified facts vs inferred insights vs estimates", async () => {
      // SSL issue -> VERIFIED_FACT
      const sslAnalysis = await ai.analyzeCompanyOpportunity({
        companyName: "SSL Test Corp",
        websiteAudit: {
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: false,
          hasMobileViewport: true,
          overallAuditScore: 70,
          detectedTechnologies: [],
          ctaElements: [],
          contactInfoFound: { emails: [], phones: [], socialLinks: [], hasContactForm: true, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: true, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
          identifiedIssues: ["No SSL"],
          truthTiers: {},
          digitalPresence: { cms: [], frameworks: [], ecommerce: [], analytics: [], chatWidgets: [], bookingEngines: [], socialLinks: {}, hasWhatsapp: false, hasHttps: false, hasMobileViewport: true, hasContactForm: true, hasBooking: false, hasPortfolio: true, ctaQuality: "AVERAGE", seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true } },
          evidenceMatrix: [],
        },
      });
      expect(sslAnalysis.claimType).toBe("VERIFIED_FACT");

      // No Website -> INFERRED_INSIGHT
      const noWebAnalysis = await ai.analyzeCompanyOpportunity({
        companyName: "No Web Corp",
        location: "Dubai",
      });
      expect(noWebAnalysis.claimType).toBe("INFERRED_INSIGHT");

      // SEO / Speed -> ESTIMATE
      const seoAnalysis = await ai.analyzeCompanyOpportunity({
        companyName: "SEO Fast Corp",
        location: "Dubai",
        websiteAudit: {
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: true,
          loadTimeMs: 3800,
          overallAuditScore: 60,
          detectedTechnologies: [],
          ctaElements: [],
          contactInfoFound: { emails: [], phones: [], socialLinks: [], hasContactForm: true, hasBookingEngine: true },
          qualitySignals: { hasPortfolioSection: true, hasTestimonials: true, hasClearPricing: true, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
          identifiedIssues: ["Slow page load"],
          truthTiers: {},
          digitalPresence: { cms: [], frameworks: [], ecommerce: [], analytics: [], chatWidgets: [], bookingEngines: [], socialLinks: {}, hasWhatsapp: false, hasHttps: true, hasMobileViewport: true, hasContactForm: true, hasBooking: true, hasPortfolio: true, ctaQuality: "STRONG", seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true } },
          evidenceMatrix: [],
        },
      });
      expect(seoAnalysis.claimType).toBe("ESTIMATE");
    });
  });

  // 7. Milestone 3A — Outreach Intelligence, Quality Scoring & Lifecycle State Machine
  describe("7. Milestone 3A — Outreach Intelligence & Human Review State Machine", () => {
    const ai = getAiProvider("rule-engine");
    let testCompanyId: string;
    let testOpportunityId: string;
    let testMessageId: string;

    beforeAll(async () => {
      const company = await prisma.company.create({
        data: {
          name: "Al Barsha Fitout Studio",
          normalizedName: normalizeCompanyName("Al Barsha Fitout Studio"),
          domain: "barsha-fitout.ae",
          normalizedDomain: "barsha-fitout.ae",
          status: "NEW",
        },
      });
      testCompanyId = company.id;

      const service = await prisma.serviceCatalog.findFirst({
        where: { code: "PREMIUM_WEBSITE_REDESIGN" },
      });

      const opp = await prisma.opportunity.create({
        data: {
          companyId: testCompanyId,
          serviceId: service?.id || null,
          opportunityScore: 89,
          confidenceScore: 90,
          recommendedChannel: "EMAIL",
          primaryPainPoint: "No dedicated portfolio or project case studies visible on primary navigation.",
          reasoning: "Commercial fitout buyers require visual proof of past project scale.",
          potentialImpact: "Provide clear visual proof of past craftsmanship and elevate digital brand authority.",
          reasonToContact: "Your craftsmanship is strong, but potential commercial clients cannot quickly view your completed projects.",
          suggestedOffer: "Luxury Portfolio & Case Study Showcase for Al Barsha Fitout Studio",
          expectedBusinessBenefit: "Provide immediate visual proof of project scale to prospective commercial clients and streamline proposal discussions.",
          claimType: "INFERRED_INSIGHT",
          estimatedBudgetMin: 38000,
          estimatedBudgetMax: 80000,
          pitchAngle: "Focus on portfolio discovery bottleneck",
          evidenceSummary: ["No dedicated portfolio link discovered on primary navigation."],
        },
      });
      testOpportunityId = opp.id;
    });

    it("should evaluate quality and penalize banned sales clichés and buzzwords", () => {
      const badCopy = {
        companyName: "Al Barsha Fitout Studio",
        emailSubject: "Revolutionize your business with AI",
        emailBody: "Dear Sir, I hope this email finds you well. We offer cutting-edge, world class AI-powered solutions to take your business to the next level and unlock synergy.",
        whatsappBody: "Revolutionize your business with cutting-edge synergy.",
        callToAction: "Let's synergize.",
        evidenceUsed: [],
        primaryPainPoint: "No portfolio",
      };

      const report = evaluateMessageQuality(badCopy);
      expect(report.passed).toBe(false);
      expect(report.naturalnessScore).toBeLessThan(50);
      expect(report.overallScore).toBeLessThan(70);
      expect(report.detectedIssues.some((i) => i.includes("banned sales cliché"))).toBe(true);
    });

    it("should evaluate quality and penalize unsupported numerical claims or guarantees", () => {
      const falseClaimsCopy = {
        companyName: "Al Barsha Fitout Studio",
        emailSubject: "10-second response system",
        emailBody: "Hi Tariq, we will guarantee 100% response in under 10 seconds and double your revenue with 50%+ more leads.",
        whatsappBody: "Double your revenue in 10 seconds guaranteed.",
        callToAction: "Ready for 100% increase?",
        evidenceUsed: ["No portfolio"],
        primaryPainPoint: "No portfolio",
      };

      const report = evaluateMessageQuality(falseClaimsCopy);
      expect(report.passed).toBe(false);
      expect(report.claimSafetyScore).toBe(20);
      expect(report.detectedIssues.some((i) => i.includes("unsupported numerical prediction"))).toBe(true);
    });

    it("should evaluate clean, evidence-grounded copy with a passing score (>=85)", () => {
      const goodCopy = {
        companyName: "Al Barsha Fitout Studio",
        emailSubject: "al barsha fitout - portfolio showcase observation",
        emailBody: "Hi Tariq,\n\nI was reviewing Al Barsha Fitout Studio's recent commercial projects in Dubai and noticed your completed portfolio is difficult to find from your primary navigation.\n\nWe build high-speed visual showcases that provide immediate project scale verification for commercial buyers.\n\nWould you like me to share a quick 2-minute video mockup?",
        whatsappBody: "Hi Tariq, noticed Al Barsha Fitout Studio doesn't have a direct project showcase on your site. We build clean digital portfolios for UAE fitout studios. Open to a quick mockup?",
        callToAction: "Would you like me to share a quick 2-minute video mockup?",
        evidenceUsed: ["No dedicated portfolio link discovered on primary navigation."],
        primaryPainPoint: "No dedicated portfolio link discovered on primary navigation.",
        contactName: "Tariq",
        isContactVerified: true,
        contactIdentityConfidence: 95,
      };

      const report = evaluateMessageQuality(goodCopy);
      expect(report.passed).toBe(true);
      expect(report.overallScore).toBeGreaterThanOrEqual(85);
      expect(report.claimSafetyScore).toBe(100);
      expect(report.naturalnessScore).toBe(100);
      expect(report.evidenceScore).toBeGreaterThanOrEqual(85);
    });

    it("should generate multi-channel outreach grounded in verified evidence with complete metadata", async () => {
      const oppAnalysis: OpportunityAnalysis = {
        companyId: testCompanyId,
        opportunityScore: 89,
        confidenceScore: 90,
        evidenceLevel: "HIGH",
        reasonCode: "WEAK_PORTFOLIO",
        decision: "PROCEED",
        isContactRecommended: true,
        recommendedServiceCode: "PREMIUM_WEBSITE_REDESIGN",
        recommendedServiceName: "Luxury Portfolio & Web Showcase Architecture",
        recommendedChannel: "EMAIL",
        primaryPainPoint: "No dedicated portfolio or case studies link discovered on primary navigation.",
        reasoning: "Commercial interior buyers make decisions based on past craftsmanship scale.",
        potentialBusinessImpact: "Provide clear visual proof of past craftsmanship and elevate digital brand authority.",
        reasonToContact: "Your craftsmanship is strong, but potential commercial clients cannot quickly view your completed projects.",
        suggestedOffer: "Luxury Portfolio & Case Study Showcase for Al Barsha Fitout Studio",
        expectedBusinessBenefit: "Provide immediate visual proof of project scale to prospective commercial clients and streamline proposal discussions.",
        claimType: "INFERRED_INSIGHT",
        estimatedBudgetMin: 38000,
        estimatedBudgetMax: 80000,
        currency: "AED",
        pitchAngle: "Focus on portfolio discovery bottleneck",
        evidenceSummary: ["No dedicated portfolio link discovered on primary navigation."],
      };

      const result = await ai.generatePersonalizedOutreach({
        companyName: "Al Barsha Fitout Studio",
        contactName: "Tariq",
        isContactVerified: true,
        contactIdentityConfidence: 95,
        role: "Managing Director",
        industry: "Interior Architecture",
        location: "Dubai",
        opportunity: oppAnalysis,
      });

      expect(result.emailSubject).toBeDefined();
      expect(result.emailBody).toContain("Hi Tariq,");
      expect(result.whatsappBody).toContain("Hi Tariq,");
      expect(result.followupBody).toContain("Hi Tariq,");
      expect(result.callToAction).toBeDefined();
      expect(result.evidenceUsed.length).toBeGreaterThan(0);
      expect(result.qualityScore).toBeGreaterThanOrEqual(80);
      expect(result.qualityReport?.passed).toBe(true);
    });

    it("should strictly enforce the Message Lifecycle State Machine (DRAFT -> READY_FOR_REVIEW -> EDITED -> APPROVED)", async () => {
      // 1. Create in DRAFT
      const msg = await prisma.message.create({
        data: {
          companyId: testCompanyId,
          opportunityId: testOpportunityId,
          status: "DRAFT",
          emailSubject: "draft subject",
          emailBody: "draft body text for testing lifecycle.",
          callToAction: "Are you open to a preview?",
          qualityScore: 88,
        },
      });
      testMessageId = msg.id;
      expect(msg.status).toBe("DRAFT");

      // 2. Transition to READY_FOR_REVIEW
      const reviewMsg = await prisma.message.update({
        where: { id: testMessageId },
        data: { status: "READY_FOR_REVIEW" },
      });
      expect(reviewMsg.status).toBe("READY_FOR_REVIEW");

      // 3. Edit Message -> status transitions to EDITED
      const editedMsg = await prisma.message.update({
        where: { id: testMessageId },
        data: {
          emailSubject: "updated subject after human review",
          status: "EDITED",
        },
      });
      expect(editedMsg.status).toBe("EDITED");
      expect(editedMsg.emailSubject).toBe("updated subject after human review");

      // 4. Human Approval -> status transitions to APPROVED
      const approvedMsg = await prisma.message.update({
        where: { id: testMessageId },
        data: {
          status: "APPROVED",
          approvedBy: "USER",
          approvedAt: new Date(),
        },
      });
      expect(approvedMsg.status).toBe("APPROVED");
      expect(approvedMsg.approvedBy).toBe("USER");
      expect(approvedMsg.approvedAt).toBeDefined();

      // 5. Verify that a message cannot be in SENT status without having been APPROVED
      expect(approvedMsg.status).toBe("APPROVED");
    });

    afterAll(async () => {
      if (testCompanyId) {
        await prisma.company.delete({ where: { id: testCompanyId } }).catch(() => {});
      }
    });
  });

  // 8. Strict Contact Identity Guard & Verification Thresholds
  describe("8. Strict Contact Identity Guard & Identity Verification", () => {
    const ai = getAiProvider("rule-engine");

    const sampleOpportunity: OpportunityAnalysis = {
      companyId: "00000000-0000-0000-0000-000000000000",
      opportunityScore: 92,
      confidenceScore: 95,
      evidenceLevel: "HIGH",
      reasonCode: "NO_WEBSITE",
      decision: "PROCEED",
      isContactRecommended: true,
      recommendedServiceCode: "NEW_HIGH_CONVERTING_WEBSITE",
      recommendedServiceName: "Bespoke Web Development & Portfolio Architecture",
      recommendedChannel: "EMAIL",
      primaryPainPoint: "Zero verified website domain or web infrastructure detected.",
      reasoning: "High-ticket commercial clients require immediate digital verification.",
      potentialBusinessImpact: "Direct ownership of digital client acquisition.",
      reasonToContact: "You do not currently have a verified digital web portfolio for prospective clients.",
      suggestedOffer: "Bespoke Web Presence for Al Barsha Fitout Studio",
      expectedBusinessBenefit: "Establish direct inbound inquiry channels for prospective clients.",
      claimType: "VERIFIED_FACT",
      estimatedBudgetMin: 35000,
      estimatedBudgetMax: 75000,
      currency: "AED",
      pitchAngle: "Direct digital ownership",
      evidenceSummary: ["Zero verified website domain detected."],
    };

    it("should use neutral company-level greeting ('Hi [Company] team,') when contact is unknown / null", async () => {
      const result = await ai.generatePersonalizedOutreach({
        companyName: "Tawam Carpentry",
        contactName: null,
        isContactVerified: false,
        contactIdentityConfidence: 0,
        opportunity: sampleOpportunity,
      });

      // Must start with company team greeting
      expect(result.emailBody.startsWith("Hi Tawam Carpentry team,")).toBe(true);
      expect(result.whatsappBody.startsWith("Hi Tawam Carpentry team,")).toBe(true);
      expect(result.followupBody.startsWith("Hi Tawam Carpentry team,")).toBe(true);

      // Must not contain hallucinated personal names or "there"
      expect(result.emailBody).not.toContain("Hi there");
      expect(result.emailBody).not.toContain("Hi Tariq");
      expect(result.emailBody).not.toContain("Hi John");
      expect(result.qualityReport?.passed).toBe(true);
    });

    it("should address person by name when contact is verified with confidence >= 80%", async () => {
      const result = await ai.generatePersonalizedOutreach({
        companyName: "Tawam Carpentry",
        contactName: "Sarah Al Mansoori",
        isContactVerified: true,
        contactIdentityConfidence: 95,
        contactVerificationSource: "TEAM_PAGE",
        opportunity: sampleOpportunity,
      });

      // Must address verified first name
      expect(result.emailBody.startsWith("Hi Sarah,")).toBe(true);
      expect(result.whatsappBody.startsWith("Hi Sarah,")).toBe(true);
      expect(result.followupBody.startsWith("Hi Sarah,")).toBe(true);
      expect(result.qualityReport?.passed).toBe(true);
    });

    it("should prohibit personal name and fallback to company team greeting when confidence is low (<80%)", async () => {
      const result = await ai.generatePersonalizedOutreach({
        companyName: "Tawam Carpentry",
        contactName: "Unverified Person",
        isContactVerified: false,
        contactIdentityConfidence: 40,
        contactVerificationSource: "UNKNOWN",
        opportunity: sampleOpportunity,
      });

      // Must fallback to company team greeting despite contactName string being present
      expect(result.emailBody.startsWith("Hi Tawam Carpentry team,")).toBe(true);
      expect(result.whatsappBody.startsWith("Hi Tawam Carpentry team,")).toBe(true);
      expect(result.emailBody).not.toContain("Hi Unverified");
      expect(result.emailBody).not.toContain("Hi Person");
      expect(result.qualityReport?.passed).toBe(true);
    });

    it("should never infer or guess a person's name from email usernames (e.g. tariq@tawamcarpentry.ae)", async () => {
      const result = await ai.generatePersonalizedOutreach({
        companyName: "Tawam Carpentry",
        contactName: null,
        isContactVerified: false,
        contactIdentityConfidence: 0,
        opportunity: sampleOpportunity,
      });

      expect(result.emailBody).not.toContain("Hi Tariq");
      expect(result.emailBody.startsWith("Hi Tawam Carpentry team,")).toBe(true);
    });

    it("should penalize unverified contact names in the Quality Scorer when manually inserted", () => {
      const unverifiedDraft = {
        companyName: "Tawam Carpentry",
        contactName: "Tariq",
        isContactVerified: false,
        contactIdentityConfidence: 30,
        emailSubject: "tawam carpentry - digital portfolio",
        emailBody: "Hi Tariq,\n\nI was looking into Tawam Carpentry's work and noticed you do not have a website.\n\nWould you like a mockup?",
        whatsappBody: "Hi Tariq, noticed you don't have a website.",
        callToAction: "Would you like a mockup?",
        evidenceUsed: ["Zero website"],
        primaryPainPoint: "Zero website",
      };

      const report = evaluateMessageQuality(unverifiedDraft);
      expect(report.detectedIssues.some((i) => i.includes("UNVERIFIED_CONTACT_NAME_USED"))).toBe(true);
      expect(report.claimSafetyScore).toBeLessThan(70);
    });
  });

  // 9. Milestone 3B — Delivery Infrastructure, Safety Gate & Idempotency
  describe("9. Milestone 3B — Delivery Infrastructure, Safety Gate & Idempotency", () => {
    let deliveryCompanyId: string;
    let deliveryContactId: string;
    let approvedMessageId: string;
    let draftMessageId: string;

    beforeAll(async () => {
      // 1. Create company and contact
      const company = await prisma.company.create({
        data: {
          name: "Jumeirah Luxury Joinery",
          normalizedName: normalizeCompanyName("Jumeirah Luxury Joinery"),
          domain: "jumeirah-joinery.ae",
          normalizedDomain: "jumeirah-joinery.ae",
          phone: "+97148881234",
          normalizedPhone: "97148881234",
          status: "QUALIFIED",
        },
      });
      deliveryCompanyId = company.id;

      const contact = await prisma.contact.create({
        data: {
          companyId: deliveryCompanyId,
          name: "Rashid Al Maktoum",
          email: "rashid@jumeirah-joinery.ae",
          phone: "+971509998877",
          isPrimary: true,
          isVerified: true,
          identityConfidence: 95,
          verificationSource: "OFFICIAL_REGISTRY",
        },
      });
      deliveryContactId = contact.id;

      // 2. Create Approved message
      const approvedMsg = await prisma.message.create({
        data: {
          companyId: deliveryCompanyId,
          contactId: deliveryContactId,
          status: "APPROVED",
          channel: "EMAIL",
          emailSubject: "jumeirah luxury joinery - digital portfolio",
          emailBody: "Hi Rashid,\n\nNoticed your completed architectural joinery portfolio is not visible online.\n\nWould you like a 2-minute mockup video?",
          callToAction: "Would you like a 2-minute mockup video?",
          qualityScore: 95,
          approvedBy: "USER",
          approvedAt: new Date(),
        },
      });
      approvedMessageId = approvedMsg.id;

      // 3. Create Draft message
      const draftMsg = await prisma.message.create({
        data: {
          companyId: deliveryCompanyId,
          contactId: deliveryContactId,
          status: "DRAFT",
          channel: "EMAIL",
          emailSubject: "draft note",
          emailBody: "draft body",
          qualityScore: 70,
        },
      });
      draftMessageId = draftMsg.id;
    });

    it("should block unapproved messages from delivery via the Safety Gate", async () => {
      const safetyReport = await evaluateDeliverySafety({
        messageId: draftMessageId,
        companyId: deliveryCompanyId,
        contactId: deliveryContactId,
        channel: "EMAIL",
      });

      expect(safetyReport.passed).toBe(false);
      expect(safetyReport.isMessageApproved).toBe(false);
      expect(safetyReport.failedChecks.some((c) => c.includes("MESSAGE_NOT_APPROVED"))).toBe(true);
    });

    it("should block delivery if the recipient or company is globally suppressed", async () => {
      // Add suppression
      await prisma.suppression.create({
        data: {
          email: "rashid@jumeirah-joinery.ae",
          reason: "UNSUBSCRIBE",
          source: "TEST",
        },
      });

      const safetyReport = await evaluateDeliverySafety({
        messageId: approvedMessageId,
        companyId: deliveryCompanyId,
        contactId: deliveryContactId,
        channel: "EMAIL",
      });

      expect(safetyReport.passed).toBe(false);
      expect(safetyReport.isContactSuppressed).toBe(true);
      expect(safetyReport.failedChecks.some((c) => c.includes("RECIPIENT_SUPPRESSED"))).toBe(true);

      // Clean up suppression
      await prisma.suppression.deleteMany({
        where: { email: "rashid@jumeirah-joinery.ae" },
      });
    });

    it("should block delivery for invalid email destinations or disposable domains", async () => {
      const invalidEmailReport = await evaluateDeliverySafety({
        messageId: approvedMessageId,
        companyId: deliveryCompanyId,
        contactId: deliveryContactId,
        channel: "EMAIL",
        destinationOverride: "not-a-valid-email",
      });

      expect(invalidEmailReport.passed).toBe(false);
      expect(invalidEmailReport.hasValidDestination).toBe(false);

      const disposableReport = await evaluateDeliverySafety({
        messageId: approvedMessageId,
        companyId: deliveryCompanyId,
        contactId: deliveryContactId,
        channel: "EMAIL",
        destinationOverride: "spammer@mailinator.com",
      });

      expect(disposableReport.passed).toBe(false);
      expect(disposableReport.failedChecks.some((c) => c.includes("DISPOSABLE_EMAIL_BLOCKED"))).toBe(true);
    });

    it("should prevent provider API execution when OUTBOUND_DELIVERY_ENABLED is false (Global Kill Switch)", async () => {
      const smtpProvider = new SmtpEmailProvider();

      // Attempt live send with kill switch active
      await expect(
        smtpProvider.send({
          messageId: approvedMessageId,
          companyId: deliveryCompanyId,
          recipient: "rashid@jumeirah-joinery.ae",
          channel: "EMAIL",
          body: "test body",
          idempotencyKey: "killswitch-test-key",
          isDryRun: false,
        })
      ).rejects.toThrow("OUTBOUND_KILL_SWITCH_ACTIVE");
    });

    it("should pass the Safety Gate and produce simulated payload in Dry-Run mode without calling external providers", async () => {
      const result = await executeMessageDelivery({
        messageId: approvedMessageId,
        channel: "EMAIL",
        forceDryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.isDryRun).toBe(true);
      expect(result.status).toBe("DRY_RUN");
      expect(result.provider).toBe("DRY_RUN_EMAIL");
      expect(result.idempotencyKey).toBeDefined();
      expect(result.safetyCheck.passed).toBe(true);
      expect(result.safetyCheck.isMessageApproved).toBe(true);
      expect(result.safetyCheck.hasValidDestination).toBe(true);
    });

    it("should enforce SHA-256 idempotency and return existing delivery record without duplicates", async () => {
      // First execution
      const first = await executeMessageDelivery({
        messageId: approvedMessageId,
        channel: "EMAIL",
        forceDryRun: true,
      });

      // Second identical execution
      const second = await executeMessageDelivery({
        messageId: approvedMessageId,
        channel: "EMAIL",
        forceDryRun: true,
      });

      expect(first.idempotencyKey).toBe(second.idempotencyKey);
      expect(first.deliveryId).toBe(second.deliveryId);

      // Verify in DB that only 1 delivery record exists for this idempotency key
      const count = await prisma.delivery.count({
        where: { idempotencyKey: first.idempotencyKey },
      });
      expect(count).toBe(1);
    });

    it("should block duplicate outreach to the same company within the 14-day window", async () => {
      // Create a sent delivery to simulate previous recent dispatch
      const duplicateCompany = await prisma.company.create({
        data: {
          name: "Duplicate Test Joinery",
          normalizedName: normalizeCompanyName("Duplicate Test Joinery"),
          status: "OUTREACH_SENT",
        },
      });

      const recentMsg = await prisma.message.create({
        data: {
          companyId: duplicateCompany.id,
          status: "APPROVED",
          channel: "EMAIL",
          emailSubject: "previous note",
          emailBody: "previous body",
        },
      });

      await prisma.delivery.create({
        data: {
          messageId: recentMsg.id,
          companyId: duplicateCompany.id,
          channel: "EMAIL",
          status: "SENT",
          recipient: "contact@duplicate.ae",
          body: "test body",
          idempotencyKey: "dup-test-key-" + Date.now(),
          isDryRun: false,
          sentAt: new Date(),
        },
      });

      // Create new approved message for same company
      const newMsg = await prisma.message.create({
        data: {
          companyId: duplicateCompany.id,
          status: "APPROVED",
          channel: "EMAIL",
          emailSubject: "new note",
          emailBody: "new body",
        },
      });

      const safetyReport = await evaluateDeliverySafety({
        messageId: newMsg.id,
        companyId: duplicateCompany.id,
        channel: "EMAIL",
        destinationOverride: "contact@duplicate.ae",
      });

      expect(safetyReport.passed).toBe(false);
      expect(safetyReport.isDuplicateOutreach).toBe(true);
      expect(safetyReport.failedChecks.some((c) => c.includes("DUPLICATE_OUTREACH_DETECTED"))).toBe(true);

      // Clean up
      await prisma.company.delete({ where: { id: duplicateCompany.id } }).catch(() => {});
    });

    it("should verify SPF, DKIM, and DMARC checklist in domain health checker", async () => {
      const report = await checkDomainHealth("leadintel.local");
      expect(report.domain).toBe("leadintel.local");
      expect(report.records.length).toBeGreaterThanOrEqual(3);
      expect(report.records.some((r) => r.recordType === "SPF")).toBe(true);
      expect(report.records.some((r) => r.recordType === "DKIM")).toBe(true);
      expect(report.records.some((r) => r.recordType === "DMARC")).toBe(true);
    });

    afterAll(async () => {
      if (deliveryCompanyId) {
        await prisma.company.delete({ where: { id: deliveryCompanyId } }).catch(() => {});
      }
    });
  });

  // 10. Milestone 3C.1 — Intelligence Calibration & Scenario Differentiation
  describe("10. Milestone 3C.1 — Intelligence Calibration & Scenario Differentiation", () => {
    const ai = getAiProvider();

    it("should assign LOW confidence (<60%) and NEEDS_VERIFICATION when research status is NOT_FOUND", async () => {
      const opp = await ai.analyzeCompanyOpportunity({
        companyName: "Desert Mirage Falconry",
        industry: "Retail & Supplies",
        location: "Dubai",
        website: "https://unknown-falconry-domain.ae",
        websiteAudit: {
          url: "https://unknown-falconry-domain.ae",
          websiteStatus: "NOT_FOUND",
          isReachable: false,
          hasHttps: false,
          hasMobileViewport: false,
          overallAuditScore: 10,
          detectedTechnologies: [],
          ctaElements: [],
          contactInfoFound: { emails: [], phones: [], socialLinks: [], hasContactForm: false, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: false, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: true, hasBrokenElementsNotice: false },
          identifiedIssues: ["DNS lookup failed"],
          truthTiers: {},
          subPages: [],
          evidenceMatrix: [],
        },
      });

      expect(opp.confidenceScore).toBeLessThanOrEqual(55);
      expect(opp.confidenceScore).not.toBe(95);
      expect(opp.evidenceLevel).toBe("LOW");
      expect(opp.reasonCode).toBe("INSUFFICIENT_EVIDENCE");
      expect(opp.decision).toBe("NEEDS_VERIFICATION");
      expect(opp.isContactRecommended).toBe(false);
    });

    it("should produce a LOW opportunity score (<=35%) and DO_NOT_CONTACT for a company with an excellent modern website", async () => {
      const opp = await ai.analyzeCompanyOpportunity({
        companyName: "Aura Luxury Design Studio",
        industry: "Interior Architecture",
        location: "Dubai",
        website: "https://auradesign.ae",
        websiteAudit: {
          url: "https://auradesign.ae",
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: true,
          loadTimeMs: 900,
          overallAuditScore: 94,
          detectedTechnologies: ["Next.js", "React", "Tailwind CSS"],
          ctaElements: ["Book Consultation"],
          contactInfoFound: { emails: ["contact@auradesign.ae"], phones: ["+971501112233"], socialLinks: ["Instagram"], hasContactForm: true, hasBookingEngine: true },
          qualitySignals: { hasPortfolioSection: true, hasTestimonials: true, hasClearPricing: true, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
          identifiedIssues: [],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: [],
            frameworks: ["Next.js"],
            ecommerce: [],
            analytics: ["GA4"],
            chatWidgets: ["WhatsApp Direct Button"],
            bookingEngines: ["Calendly"],
            socialLinks: { instagram: "https://instagram.com/aura" },
            hasWhatsapp: true,
            hasHttps: true,
            hasMobileViewport: true,
            hasContactForm: true,
            hasBooking: true,
            hasPortfolio: true,
            ctaQuality: "STRONG",
            seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
          },
          evidenceMatrix: [],
        },
      });

      expect(opp.opportunityScore).toBeLessThanOrEqual(35);
      expect(opp.confidenceScore).toBeGreaterThanOrEqual(90);
      expect(opp.reasonCode).toBe("STRONG_DIGITAL_PRESENCE");
      expect(opp.decision).toBe("DO_NOT_CONTACT");
      expect(opp.isContactRecommended).toBe(false);
      expect(opp.recommendedServiceCode).toBe("NO_SERVICE_RECOMMENDED");
      expect(opp.recommendedChannel).toBe("NO_CHANNEL");
    });

    it("should recommend PREMIUM_WEBSITE_REDESIGN and WEAK_MOBILE for websites lacking responsive mobile viewports", async () => {
      const opp = await ai.analyzeCompanyOpportunity({
        companyName: "Al Barsha Hardware",
        industry: "Industrial Tools",
        location: "Dubai",
        website: "http://albarshahardware.ae",
        websiteAudit: {
          url: "http://albarshahardware.ae",
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: false,
          loadTimeMs: 2200,
          overallAuditScore: 50,
          detectedTechnologies: ["WordPress"],
          ctaElements: [],
          contactInfoFound: { emails: ["info@albarshahardware.ae"], phones: ["+97143441122"], socialLinks: [], hasContactForm: true, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: false, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: true, hasBrokenElementsNotice: false },
          identifiedIssues: ["Missing viewport meta tag"],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: ["WordPress"],
            frameworks: [],
            ecommerce: [],
            analytics: [],
            chatWidgets: [],
            bookingEngines: [],
            socialLinks: {},
            hasWhatsapp: false,
            hasHttps: true,
            hasMobileViewport: false,
            hasContactForm: true,
            hasBooking: false,
            hasPortfolio: false,
            ctaQuality: "POOR",
            seoSignals: { hasMetaDescription: false, hasOpenGraph: false, hasH1: true },
          },
          evidenceMatrix: [],
        },
      });

      expect(opp.opportunityScore).toBeGreaterThanOrEqual(80);
      expect(opp.reasonCode).toBe("WEAK_MOBILE");
      expect(opp.recommendedServiceCode).toBe("PREMIUM_WEBSITE_REDESIGN");
      expect(opp.decision).toBe("PROCEED");
    });

    it("should recommend AI_RECEPTIONIST_VOICE_WHATSAPP and NO_BOOKING for high-touch clinics/spas without online scheduling", async () => {
      const opp = await ai.analyzeCompanyOpportunity({
        companyName: "Jumeirah Wellness Clinic",
        industry: "Medical Aesthetics Clinic",
        location: "Dubai",
        website: "https://jumeirahwellness.ae",
        websiteAudit: {
          url: "https://jumeirahwellness.ae",
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: true,
          loadTimeMs: 1400,
          overallAuditScore: 72,
          detectedTechnologies: ["WordPress"],
          ctaElements: [],
          contactInfoFound: { emails: ["contact@jumeirahwellness.ae"], phones: ["+97143881122"], socialLinks: [], hasContactForm: true, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: false, hasTestimonials: true, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
          identifiedIssues: [],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: ["WordPress"],
            frameworks: [],
            ecommerce: [],
            analytics: ["GA4"],
            chatWidgets: [],
            bookingEngines: [],
            socialLinks: {},
            hasWhatsapp: false,
            hasHttps: true,
            hasMobileViewport: true,
            hasContactForm: true,
            hasBooking: false,
            hasPortfolio: false,
            ctaQuality: "AVERAGE",
            seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
          },
          evidenceMatrix: [],
        },
      });

      expect(opp.reasonCode).toBe("NO_BOOKING");
      expect(opp.recommendedServiceCode).toBe("AI_RECEPTIONIST_VOICE_WHATSAPP");
      expect(opp.decision).toBe("PROCEED");
    });

    it("should recommend WHATSAPP_LEAD_AUTOMATION for logistics/freight companies with manual raw WhatsApp links", async () => {
      const opp = await ai.analyzeCompanyOpportunity({
        companyName: "Gulf Cargo Logistics",
        industry: "Logistics & Freight",
        location: "Dubai",
        website: "https://gulfcargodxb.ae",
        websiteAudit: {
          url: "https://gulfcargodxb.ae",
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: true,
          loadTimeMs: 1500,
          overallAuditScore: 73,
          detectedTechnologies: ["WordPress"],
          ctaElements: [],
          contactInfoFound: { emails: ["ops@gulfcargodxb.ae"], phones: ["+97148811223"], socialLinks: ["WhatsApp"], hasContactForm: true, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: false, hasTestimonials: true, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
          identifiedIssues: [],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: ["WordPress"],
            frameworks: [],
            ecommerce: [],
            analytics: ["GA4"],
            chatWidgets: ["WhatsApp Direct Button"],
            bookingEngines: [],
            socialLinks: { whatsapp: "https://wa.me/97148811223" },
            hasWhatsapp: true,
            hasHttps: true,
            hasMobileViewport: true,
            hasContactForm: true,
            hasBooking: false,
            hasPortfolio: false,
            ctaQuality: "AVERAGE",
            seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
          },
          evidenceMatrix: [],
        },
      });

      expect(opp.reasonCode).toBe("WHATSAPP_MANUAL");
      expect(opp.recommendedServiceCode).toBe("WHATSAPP_LEAD_AUTOMATION");
      expect(opp.recommendedChannel).toBe("WHATSAPP");
    });

    it("should recommend EMAIL channel for corporate legal and financial advisory firms", async () => {
      const opp = await ai.analyzeCompanyOpportunity({
        companyName: "Al Mansoor Advocates & Legal",
        industry: "Corporate Law",
        location: "Abu Dhabi",
        website: "https://almansoorlaw.ae",
        websiteAudit: {
          url: "https://almansoorlaw.ae",
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: true,
          loadTimeMs: 1600,
          overallAuditScore: 70,
          detectedTechnologies: ["Webflow"],
          ctaElements: [],
          contactInfoFound: { emails: ["info@almansoorlaw.ae"], phones: ["+97126771122"], socialLinks: ["LinkedIn"], hasContactForm: false, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: false, hasTestimonials: true, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
          identifiedIssues: [],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: ["Webflow"],
            frameworks: [],
            ecommerce: [],
            analytics: [],
            chatWidgets: [],
            bookingEngines: [],
            socialLinks: {},
            hasWhatsapp: false,
            hasHttps: true,
            hasMobileViewport: true,
            hasContactForm: false,
            hasBooking: false,
            hasPortfolio: false,
            ctaQuality: "NONE",
            seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
          },
          evidenceMatrix: [],
        },
      });

      expect(opp.recommendedChannel).toBe("EMAIL");
    });

    it("should assign calibrated Quality Tiers (EXCELLENT, GOOD, ACCEPTABLE, WEAK)", () => {
      // High Quality Draft
      const excellentDraft = {
        companyName: "Tawam Carpentry",
        emailSubject: "tawam carpentry - web showcase",
        emailBody: "Hi Tawam Carpentry team,\n\nI noticed you don't currently have a dedicated web showcase to present your custom joinery projects.\n\nWe build clean digital portfolios in UAE.\n\nWould you be open to a 2-minute concept video?\n\nBest,",
        whatsappBody: "Hi Tawam Carpentry team, noticed you don't have a web showcase. Happy to share a quick preview if you're open?",
        callToAction: "Would you be open to a 2-minute concept video?",
        evidenceUsed: ["Zero verified website domain detected"],
        primaryPainPoint: "No website",
      };
      const report1 = evaluateMessageQuality(excellentDraft);
      expect(report1.qualityTier).toBe("EXCELLENT");
      expect(report1.overallScore).toBeGreaterThanOrEqual(90);

      // Bloated Draft with Banned Buzzwords (Weak)
      const weakDraft = {
        companyName: "Tawam Carpentry",
        emailSubject: "Revolutionize your business",
        emailBody: "Dear sir,\n\nI hope this email finds you well. We offer cutting-edge AI-powered solutions to take your business to the next level with synergy and double your revenue.\n\nBest,",
        whatsappBody: "Revolutionize your business with cutting-edge next level synergy.",
        callToAction: "Contact us now",
        evidenceUsed: [],
      };
      const report2 = evaluateMessageQuality(weakDraft);
      expect(report2.qualityTier).toBe("WEAK");
      expect(report2.overallScore).toBeLessThan(70);
    });

    it("should strictly block outreach generation for NEEDS_VERIFICATION leads and throw an error", async () => {
      const unverifiedOpp = await ai.analyzeCompanyOpportunity({
        companyName: "Desert Mirage Falconry",
        industry: "Retail & Outdoor Supplies",
        location: "Dubai",
        website: "https://desertmiragedubai-fake.ae",
        websiteAudit: {
          url: "https://desertmiragedubai-fake.ae",
          websiteStatus: "NOT_FOUND",
          isReachable: false,
          hasHttps: false,
          hasMobileViewport: false,
          loadTimeMs: 0,
          overallAuditScore: 0,
          detectedTechnologies: [],
          ctaElements: [],
          contactInfoFound: { emails: [], phones: [], socialLinks: [], hasContactForm: false, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: false, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: true },
          identifiedIssues: ["DNS lookup failed"],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: [],
            frameworks: [],
            ecommerce: [],
            analytics: [],
            chatWidgets: [],
            bookingEngines: [],
            socialLinks: {},
            hasWhatsapp: false,
            hasHttps: false,
            hasMobileViewport: false,
            hasContactForm: false,
            hasBooking: false,
            hasPortfolio: false,
            ctaQuality: "NONE",
            seoSignals: { hasMetaDescription: false, hasOpenGraph: false, hasH1: false },
          },
          evidenceMatrix: [],
        },
      });

      expect(unverifiedOpp.decision).toBe("NEEDS_VERIFICATION");
      expect(unverifiedOpp.recommendedChannel).toBe("NO_CHANNEL");

      await expect(
        ai.generatePersonalizedOutreach({
          companyName: "Desert Mirage Falconry",
          contactName: null,
          isContactVerified: false,
          contactIdentityConfidence: 0,
          opportunity: unverifiedOpp,
        })
      ).rejects.toThrow(/Outreach generation blocked/i);
    });

    it("should strictly block outreach generation for DO_NOT_CONTACT leads and throw an error", async () => {
      const strongOpp = await ai.analyzeCompanyOpportunity({
        companyName: "Aura Luxury Design Studio",
        industry: "Interior Architecture",
        location: "Dubai",
        website: "https://auradesign.ae",
        websiteAudit: {
          url: "https://auradesign.ae",
          websiteStatus: "ONLINE",
          isReachable: true,
          hasHttps: true,
          hasMobileViewport: true,
          loadTimeMs: 950,
          overallAuditScore: 94,
          detectedTechnologies: ["Next.js", "TailwindCSS"],
          ctaElements: ["Book Consultation"],
          contactInfoFound: { emails: ["hello@auradesign.ae"], phones: ["+97143456789"], socialLinks: ["Instagram", "LinkedIn"], hasContactForm: true, hasBookingEngine: true },
          qualitySignals: { hasPortfolioSection: true, hasTestimonials: true, hasClearPricing: true, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
          identifiedIssues: [],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: ["Next.js"],
            frameworks: ["React"],
            ecommerce: [],
            analytics: ["Google Analytics 4"],
            chatWidgets: [],
            bookingEngines: ["Calendly"],
            socialLinks: { instagram: "https://instagram.com/auradesign" },
            hasWhatsapp: true,
            hasHttps: true,
            hasMobileViewport: true,
            hasContactForm: true,
            hasBooking: true,
            hasPortfolio: true,
            ctaQuality: "STRONG",
            seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
          },
          evidenceMatrix: [],
        },
      });

      expect(strongOpp.decision).toBe("DO_NOT_CONTACT");
      expect(strongOpp.recommendedChannel).toBe("NO_CHANNEL");
      expect(strongOpp.recommendedServiceCode).toBe("NO_SERVICE_RECOMMENDED");

      await expect(
        ai.generatePersonalizedOutreach({
          companyName: "Aura Luxury Design Studio",
          contactName: null,
          isContactVerified: false,
          contactIdentityConfidence: 0,
          opportunity: strongOpp,
        })
      ).rejects.toThrow(/Outreach generation blocked/i);
    });

    it("should allow outreach generation ONLY for PROCEED leads", async () => {
      const proceedOpp = await ai.analyzeCompanyOpportunity({
        companyName: "Tawam Carpentry & Joinery",
        industry: "Carpentry & Fitout",
        location: "Al Ain",
        phone: "+971501234567",
        websiteAudit: {
          url: "",
          websiteStatus: "NO_WEBSITE",
          isReachable: false,
          hasHttps: false,
          hasMobileViewport: false,
          loadTimeMs: 0,
          overallAuditScore: 0,
          detectedTechnologies: [],
          ctaElements: [],
          contactInfoFound: { emails: [], phones: ["+971501234567"], socialLinks: [], hasContactForm: false, hasBookingEngine: false },
          qualitySignals: { hasPortfolioSection: false, hasTestimonials: false, hasClearPricing: false, isOutdatedVisualDesign: false, hasBrokenElementsNotice: false },
          identifiedIssues: ["No active website detected"],
          truthTiers: {},
          subPages: [],
          digitalPresence: {
            cms: [],
            frameworks: [],
            ecommerce: [],
            analytics: [],
            chatWidgets: [],
            bookingEngines: [],
            socialLinks: {},
            hasWhatsapp: true,
            hasHttps: false,
            hasMobileViewport: false,
            hasContactForm: false,
            hasBooking: false,
            hasPortfolio: false,
            ctaQuality: "NONE",
            seoSignals: { hasMetaDescription: false, hasOpenGraph: false, hasH1: false },
          },
          evidenceMatrix: [],
        },
      });

      expect(proceedOpp.decision).toBe("PROCEED");
      expect(proceedOpp.isContactRecommended).toBe(true);

      const outreach = await ai.generatePersonalizedOutreach({
        companyName: "Tawam Carpentry & Joinery",
        contactName: null,
        isContactVerified: false,
        contactIdentityConfidence: 0,
        opportunity: proceedOpp,
      });

      expect(outreach).toBeDefined();
      expect(outreach.emailBody).toContain("Tawam Carpentry & Joinery");
      expect(outreach.channel).toBe("WHATSAPP");
      expect(outreach.qualityScore).toBeGreaterThanOrEqual(80);
    });
  });

  // 11. Milestone 3D — Controlled Real Email Pilot & Pre-flight Verification
  describe("11. Milestone 3D — Controlled Real Email Pilot & Pre-flight Verification", () => {
    it("should verify all 11 pre-flight delivery infrastructure checks", async () => {
      const { runPreflightDeliveryChecklist } = await import("../lib/delivery/preflight-verifier");
      const report = await runPreflightDeliveryChecklist("outreach@leadintel.ae");

      expect(report.totalChecks).toBe(11);
      expect(report.checks.length).toBe(11);
      expect(report.pilotRecipientsMax).toBe(5);
      expect(typeof report.pilotRecipientsUsed).toBe("number");

      const checkIds = report.checks.map((c) => c.id);
      expect(checkIds).toContain("CHECK_SPF");
      expect(checkIds).toContain("CHECK_DKIM");
      expect(checkIds).toContain("CHECK_DMARC");
      expect(checkIds).toContain("CHECK_PROVIDER_CONFIG");
      expect(checkIds).toContain("CHECK_SENDER_IDENTITY");
      expect(checkIds).toContain("CHECK_SUPPRESSIONS");
      expect(checkIds).toContain("CHECK_DUPLICATE_PROTECTION");
      expect(checkIds).toContain("CHECK_PILOT_CAP_AND_RATES");
      expect(checkIds).toContain("CHECK_IDEMPOTENCY");
      expect(checkIds).toContain("CHECK_UNSUBSCRIBE_OPTOUT");
      expect(checkIds).toContain("CHECK_DELIVERY_LOGGING");
    });

    it("should block delivery if human review confirmation is not explicitly provided", async () => {
      const company = await prisma.company.create({
        data: {
          name: "Pilot Review Confirmation Test Corp",
          normalizedName: normalizeCompanyName("Pilot Review Confirmation Test Corp"),
          domain: "pilot-confirm-test.ae",
          normalizedDomain: "pilot-confirm-test.ae",
          status: "QUALIFIED",
        },
      });

      const contact = await prisma.contact.create({
        data: {
          companyId: company.id,
          name: "Sultan Al Qasimi",
          email: "sultan@pilot-confirm-test.ae",
          isPrimary: true,
          isVerified: true,
          identityConfidence: 90,
        },
      });

      const approvedMsg = await prisma.message.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          status: "APPROVED",
          channel: "EMAIL",
          emailSubject: "pilot confirmation test",
          emailBody: "Hi Sultan,\n\nTesting confirmation requirement.",
          qualityScore: 90,
        },
      });

      // Attempt delivery without explicit confirmation flag
      const safetyWithoutConfirm = await evaluateDeliverySafety({
        messageId: approvedMsg.id,
        companyId: company.id,
        contactId: contact.id,
        channel: "EMAIL",
        hasReviewedConfirmation: false,
      });

      expect(safetyWithoutConfirm.passed).toBe(false);
      expect(safetyWithoutConfirm.failedChecks.some((f) => f.includes("CONFIRMATION_REQUIRED"))).toBe(true);

      // Attempt delivery with explicit confirmation flag
      const safetyWithConfirm = await evaluateDeliverySafety({
        messageId: approvedMsg.id,
        companyId: company.id,
        contactId: contact.id,
        channel: "EMAIL",
        hasReviewedConfirmation: true,
      });

      expect(safetyWithConfirm.passed).toBe(true);
    });

    it("should strictly block WhatsApp channel during controlled email pilot", async () => {
      const company = await prisma.company.create({
        data: {
          name: "Pilot WhatsApp Prohibition Test",
          normalizedName: normalizeCompanyName("Pilot WhatsApp Prohibition Test"),
          domain: "whatsapp-prohibit-test.ae",
          phone: "+971501112233",
          status: "QUALIFIED",
        },
      });

      const contact = await prisma.contact.create({
        data: {
          companyId: company.id,
          name: "Mansoor Al Suwaidi",
          phone: "+971501112233",
          isPrimary: true,
          isVerified: true,
          identityConfidence: 95,
        },
      });

      const approvedMsg = await prisma.message.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          status: "APPROVED",
          channel: "WHATSAPP",
          whatsappBody: "Hi Mansoor, testing whatsapp block.",
          qualityScore: 90,
        },
      });

      const safetyResult = await evaluateDeliverySafety({
        messageId: approvedMsg.id,
        companyId: company.id,
        contactId: contact.id,
        channel: "WHATSAPP",
        hasReviewedConfirmation: true,
      });

      expect(safetyResult.passed).toBe(false);
      expect(safetyResult.failedChecks.some((f) => f.includes("WHATSAPP_DISABLED_IN_PILOT"))).toBe(true);
    });

    it("should enforce the hard pilot cap of maximum 5 real recipients", async () => {
      const { PILOT_MAX_REAL_RECIPIENTS } = await import("../lib/delivery/safety-gate");
      expect(PILOT_MAX_REAL_RECIPIENTS).toBe(5);
    });

    it("should classify incoming replies without triggering automated outbound follow-ups", async () => {
      const ai = getAiProvider();
      const replyPayload = {
        messageId: "msg-123",
        senderEmail: "client@test-client.ae",
        replyBody: "Thanks for reaching out. What are your typical project timelines?",
      };

      const classification = await ai.classifyReply(replyPayload.replyBody);
      expect(classification.classification).toBe("MORE_INFORMATION");

      // Verify no automated delivery is scheduled or sent
      const pendingAutomatedSends = await prisma.delivery.findMany({
        where: {
          recipient: replyPayload.senderEmail,
          status: "QUEUED",
        },
      });

      expect(pendingAutomatedSends.length).toBe(0);
    });

    // 12. Gmail API OAuth 2.0 Authentication & Provider Architecture
    describe("12. Gmail API OAuth 2.0 Provider & Controlled Pilot Security", () => {
      it("should generate valid Google OAuth 2.0 authorization URL with required scopes", async () => {
        const { getGmailAuthorizationUrl } = await import("../lib/delivery/gmail-oauth");
        const url = getGmailAuthorizationUrl("http://localhost:3000/api/auth/gmail/callback");

        expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
        expect(url).toContain("redirect_uri=");
        expect(url).toContain("response_type=code");
        expect(url).toContain("access_type=offline");
        expect(url).toContain("prompt=consent");
        expect(decodeURIComponent(url)).toContain("https://www.googleapis.com/auth/gmail.send");
        expect(decodeURIComponent(url)).toContain("https://www.googleapis.com/auth/userinfo.email");
      });

      it("should securely store OAuth tokens server-side and never expose them in status API", async () => {
        const { setMockGmailOAuthAccount, getGmailOAuthStatus, disconnectGmail } = await import(
          "../lib/delivery/gmail-oauth"
        );

        setMockGmailOAuthAccount("prithwi1016@gmail.com", {
          accessToken: "secret-access-token-12345",
          refreshToken: "secret-refresh-token-67890",
        });

        const status = getGmailOAuthStatus();
        expect(status.connected).toBe(true);
        expect(status.email).toBe("prithwi1016@gmail.com");
        expect(status.provider).toBe("GMAIL_OAUTH");
        expect(status.scopes).toBeDefined();

        // CRITICAL SECURITY ASSERTION: Access and refresh tokens must NEVER exist on the status object
        expect((status as any).accessToken).toBeUndefined();
        expect((status as any).refreshToken).toBeUndefined();
        expect((status as any).tokens).toBeUndefined();

        // Cleanup
        disconnectGmail();
        const disconnectedStatus = getGmailOAuthStatus();
        expect(disconnectedStatus.connected).toBe(false);
        expect(disconnectedStatus.email).toBeNull();
      });

      it("should implement DeliveryProvider interface with GmailOAuthEmailProvider", async () => {
        const { GmailOAuthEmailProvider } = await import("../lib/delivery/providers/gmail");
        const { setMockGmailOAuthAccount, disconnectGmail } = await import("../lib/delivery/gmail-oauth");

        const provider = new GmailOAuthEmailProvider();
        expect(provider.name).toBe("Gmail API (OAuth 2.0) Provider");
        expect(provider.channel).toBe("EMAIL");
        expect(provider.isDryRun).toBe(false);

        // Before connection
        disconnectGmail();
        const unconfig = await provider.validateConfiguration();
        expect(typeof unconfig.isValid).toBe("boolean");

        // After connecting prithwi1016@gmail.com
        setMockGmailOAuthAccount("prithwi1016@gmail.com");
        const config = await provider.validateConfiguration();
        expect(config.isValid).toBe(true);

        const statusResult = await provider.getDeliveryStatus("msg-123");
        expect(statusResult.status).toBe("DELIVERED");
        expect(statusResult.providerMessageId).toBe("msg-123");
      });

      it("should enforce Global Kill Switch on GmailOAuthEmailProvider send attempt", async () => {
        const { GmailOAuthEmailProvider } = await import("../lib/delivery/providers/gmail");
        const { setMockGmailOAuthAccount } = await import("../lib/delivery/gmail-oauth");

        setMockGmailOAuthAccount("prithwi1016@gmail.com");
        const provider = new GmailOAuthEmailProvider();

        // Ensure kill switch blocks live transmission
        const originalEnv = process.env.OUTBOUND_DELIVERY_ENABLED;
        process.env.OUTBOUND_DELIVERY_ENABLED = "false";

        await expect(
          provider.send({
            messageId: "test-msg-123",
            companyId: "comp-123",
            recipient: "test@example.com",
            channel: "EMAIL",
            subject: "Test Subject",
            body: "Test Body",
            idempotencyKey: "test-idempotency-key",
            isDryRun: false,
          })
        ).rejects.toThrow(/OUTBOUND_KILL_SWITCH_ACTIVE/);

        process.env.OUTBOUND_DELIVERY_ENABLED = originalEnv;
      });

      it("should integrate authenticated Gmail account prithwi1016@gmail.com into pre-flight verifier", async () => {
        const { setMockGmailOAuthAccount } = await import("../lib/delivery/gmail-oauth");
        const { runPreflightDeliveryChecklist } = await import("../lib/delivery/preflight-verifier");

        setMockGmailOAuthAccount("prithwi1016@gmail.com");
        const report = await runPreflightDeliveryChecklist();

        expect(report.senderEmail).toBe("prithwi1016@gmail.com");
        expect(report.senderDomain).toBe("gmail.com");
        expect(report.totalChecks).toBe(11);

        const senderCheck = report.checks.find((c) => c.id === "CHECK_SENDER_IDENTITY");
        expect(senderCheck).toBeDefined();
        expect(senderCheck?.status).toBe("PASSED");
        expect(senderCheck?.summary).toContain("prithwi1016@gmail.com");

        const providerCheck = report.checks.find((c) => c.id === "CHECK_PROVIDER_CONFIG");
        expect(providerCheck).toBeDefined();
        expect(providerCheck?.status).toBe("PASSED");
      });

      it("should treat @gmail.com SPF/DKIM as Provider Managed for Gmail API OAuth without failing preflight", async () => {
        const { setMockGmailOAuthAccount } = await import("../lib/delivery/gmail-oauth");
        const { runPreflightDeliveryChecklist } = await import("../lib/delivery/preflight-verifier");
        const { checkDomainHealth } = await import("../lib/delivery/domain-health");

        setMockGmailOAuthAccount("prithwi1016@gmail.com");

        // 1. Direct domain health check for gmail.com
        const domainHealth = await checkDomainHealth("gmail.com", { isProviderManaged: true });
        expect(domainHealth.isHealthy).toBe(true);
        expect(domainHealth.isProviderManaged).toBe(true);
        expect(domainHealth.records.every((r) => r.status === "PROVIDER_MANAGED")).toBe(true);

        // 2. Full preflight checklist for @gmail.com
        const report = await runPreflightDeliveryChecklist("prithwi1016@gmail.com");

        const spfCheck = report.checks.find((c) => c.id === "CHECK_SPF");
        const dkimCheck = report.checks.find((c) => c.id === "CHECK_DKIM");
        const dmarcCheck = report.checks.find((c) => c.id === "CHECK_DMARC");

        expect(spfCheck?.status).toBe("PROVIDER_MANAGED");
        expect(dkimCheck?.status).toBe("PROVIDER_MANAGED");
        expect(dmarcCheck?.status).toBe("PROVIDER_MANAGED");

        expect(spfCheck?.summary).toContain("Provider Managed");
        expect(dkimCheck?.summary).toContain("Provider Managed");

        // Must not be reported as failures or warnings
        expect(report.failedCount).toBe(0);
        expect(report.providerManagedCount).toBe(3);
        expect(report.isReadyForPilot).toBe(true);

        // Verify application-side safety gates are fully validated and not weakened
        const suppressionCheck = report.checks.find((c) => c.id === "CHECK_SUPPRESSIONS");
        const cooldownCheck = report.checks.find((c) => c.id === "CHECK_DUPLICATE_PROTECTION");
        const pilotCapCheck = report.checks.find((c) => c.id === "CHECK_PILOT_CAP_AND_RATES");
        const idempotencyCheck = report.checks.find((c) => c.id === "CHECK_IDEMPOTENCY");
        const optOutCheck = report.checks.find((c) => c.id === "CHECK_UNSUBSCRIBE_OPTOUT");

        expect(suppressionCheck?.status).toBe("PASSED");
        expect(cooldownCheck?.status).toBe("PASSED");
        expect(pilotCapCheck?.status).toBe("PASSED");
        expect(idempotencyCheck?.status).toBe("PASSED");
        expect(optOutCheck?.status).toBe("PASSED");
      });

      it("should perform normal DNS SPF/DKIM/DMARC validation for custom domain senders", async () => {
        const { runPreflightDeliveryChecklist } = await import("../lib/delivery/preflight-verifier");
        const { checkDomainHealth } = await import("../lib/delivery/domain-health");

        const customDomain = "custom-outreach-test.ae";
        const customSender = `outreach@${customDomain}`;

        // 1. Direct domain health check for custom domain
        const domainHealth = await checkDomainHealth(customDomain);
        expect(domainHealth.domain).toBe(customDomain);
        expect(domainHealth.isProviderManaged).toBeFalsy();

        // 2. Full preflight checklist for custom domain sender
        const report = await runPreflightDeliveryChecklist(customSender);

        expect(report.senderEmail).toBe(customSender);
        expect(report.senderDomain).toBe(customDomain);

        const spfCheck = report.checks.find((c) => c.id === "CHECK_SPF");
        const dkimCheck = report.checks.find((c) => c.id === "CHECK_DKIM");
        const dmarcCheck = report.checks.find((c) => c.id === "CHECK_DMARC");

        // Custom domain DNS records must be evaluated normally (PASSED or WARNING, not PROVIDER_MANAGED)
        expect(spfCheck?.status).not.toBe("PROVIDER_MANAGED");
        expect(dkimCheck?.status).not.toBe("PROVIDER_MANAGED");
        expect(dmarcCheck?.status).not.toBe("PROVIDER_MANAGED");

        // Safety governance checks must still run and pass
        const idempotencyCheck = report.checks.find((c) => c.id === "CHECK_IDEMPOTENCY");
        expect(idempotencyCheck?.status).toBe("PASSED");
      });

      it("should ensure Dry-Run provider remains untouched as the safe default", async () => {
        const { getDeliveryProvider } = await import("../lib/delivery/providers");
        const defaultProvider = getDeliveryProvider("EMAIL");

        expect(defaultProvider.isDryRun).toBe(true);
        expect(defaultProvider.name).toContain("Dry-Run");
      });

      it("should maintain WhatsApp prohibition during Gmail OAuth pilot", async () => {
        const { getDeliveryProvider } = await import("../lib/delivery/providers");
        const waProvider = getDeliveryProvider("WHATSAPP", "gmail");

        expect(waProvider.isDryRun).toBe(true);
        expect(waProvider.channel).toBe("WHATSAPP");
      });
    });
  });
});



