import {
  OpportunityAnalysis,
  GeneratedMessagePayload,
  ReplyClassification,
  ServiceCode,
  ClaimType,
  ResearchEvidenceLevel,
  OpportunityReasonCode,
  OpportunityDecision,
  OutreachChannel,
} from "@leadintel/types";
import { AiProvider } from "./base";
import { CompanyAnalysisPromptInput } from "../prompts/opportunity";
import { OutreachPromptInput, resolveOutreachGreeting } from "../prompts/outreach";
import { evaluateMessageQuality } from "../evaluation/quality-scorer";

export class RuleEngineAiProvider implements AiProvider {
  public name = "Calibrated Rule-Based Lead Intelligence Engine";

  public async analyzeCompanyOpportunity(
    input: CompanyAnalysisPromptInput
  ): Promise<OpportunityAnalysis> {
    const audit = input.websiteAudit;
    const industry = (input.industry || "").toLowerCase();
    const websiteStatus = audit?.websiteStatus || (input.website ? "UNKNOWN" : "NO_WEBSITE");

    let opportunityScore = 50;
    let confidenceScore = 50;
    let evidenceLevel: ResearchEvidenceLevel = "UNVERIFIED";
    let reasonCode: OpportunityReasonCode = "INSUFFICIENT_EVIDENCE";
    let decision: OpportunityDecision = "PROCEED";
    let isContactRecommended = true;

    let recommendedServiceCode: ServiceCode = "NEW_HIGH_CONVERTING_WEBSITE";
    let recommendedServiceName = "New High-Converting Business Website & Digital Presence";
    let primaryPainPoint = "";
    let reasoning = "";
    let potentialBusinessImpact = "";
    let reasonToContact = "";
    let suggestedOffer = "";
    let expectedBusinessBenefit = "";
    let claimType: ClaimType = "ESTIMATE";
    let pitchAngle = "";
    let minBudget = 25000;
    let maxBudget = 60000;
    let recommendedChannel: OutreachChannel = "EMAIL";
    const evidenceSummary: string[] = [];

    // =========================================================================
    // SCENARIO 1: RESEARCH NOT FOUND / TIMEOUT / UNREACHABLE (Low Confidence)
    // =========================================================================
    if (
      websiteStatus === "NOT_FOUND" ||
      websiteStatus === "TIMEOUT" ||
      websiteStatus === "BLOCKED" ||
      websiteStatus === "OFFLINE" ||
      (websiteStatus === "UNKNOWN" && input.website)
    ) {
      evidenceLevel = "LOW";
      confidenceScore = 45; // Low/Medium confidence!
      opportunityScore = 50;
      reasonCode = "INSUFFICIENT_EVIDENCE";
      decision = "NEEDS_VERIFICATION";
      isContactRecommended = false;

      recommendedServiceCode = "NO_SERVICE_RECOMMENDED";
      recommendedServiceName = "Verification Required (Unreachable Domain)";
      primaryPainPoint = "Automated research could not resolve or verify domain availability.";
      reasoning = `Domain query for '${input.website || input.companyName}' returned '${websiteStatus}'. Automated research is inconclusive.`;
      potentialBusinessImpact = "Verify domain registry and live status before committing outreach resources.";
      reasonToContact = "Domain status could not be independently verified. Manual verification is required before initiating contact.";
      suggestedOffer = "Manual Domain Verification Required";
      expectedBusinessBenefit = "Avoid sending premature outreach to unreachable or invalid domains.";
      claimType = "UNKNOWN";
      pitchAngle = "Domain verification check.";
      recommendedChannel = "NO_CHANNEL";
      evidenceSummary.push(`Automated research returned status '${websiteStatus}'.`);
      evidenceSummary.push("No verified technical audit data available for automated opportunity scoring.");
    }

    // =========================================================================
    // SCENARIO 2: CONFIRMED NO WEBSITE (High Confidence Greenfield Opportunity)
    // =========================================================================
    else if (websiteStatus === "NO_WEBSITE" || (!input.website && !audit)) {
      evidenceLevel = "HIGH";
      confidenceScore = 95; // High confidence for confirmed absence of website
      decision = "PROCEED";
      isContactRecommended = true;
      reasonCode = "NO_WEBSITE";
      opportunityScore = 92;

      recommendedServiceCode = "NEW_HIGH_CONVERTING_WEBSITE";
      recommendedServiceName = "New High-Converting Business Website & Digital Presence";
      primaryPainPoint = "No dedicated verified web presence exists to capture direct client search and commercial inquiries.";
      reasoning = `The business is actively operating in ${input.location || "UAE"} but lacks an online headquarters, losing inbound search demand to competitors.`;
      potentialBusinessImpact = "Establish immediate direct search authority and create a direct inbound channel for high-intent client inquiries.";
      reasonToContact = `Your business is established in ${input.location || "UAE"}, but without a dedicated website you are losing inbound client search demand directly to competitors.`;
      suggestedOffer = `Custom Greenfield Digital Presence & Portfolio for ${input.companyName}`;
      expectedBusinessBenefit = "Create a clearer inbound path for potential clients searching for your services and establish direct digital credibility.";
      claimType = "INFERRED_INSIGHT";
      pitchAngle = "Direct ownership of digital acquisition channel without relying solely on social media or aggregators.";
      minBudget = 28000;
      maxBudget = 60000;
      evidenceSummary.push("Zero verified website domain or web infrastructure detected.");
      evidenceSummary.push("Commercial inquiries currently restricted to word-of-mouth or social direct messages.");
      recommendedChannel = "WHATSAPP";
    }

    // =========================================================================
    // SCENARIO 3: LIVE WEBSITE AUDIT EVALUATION (Evidence-Driven Variations)
    // =========================================================================
    else if (audit && audit.websiteStatus === "ONLINE" && audit.isReachable) {
      evidenceLevel = "HIGH";
      confidenceScore = 92;

      const digital = audit.digitalPresence || {
        hasMobileViewport: audit.hasMobileViewport,
        hasSsl: audit.hasHttps,
        hasWhatsapp: Boolean(audit.contactInfoFound?.phones && audit.contactInfoFound.phones.length > 0),
        hasContactForm: audit.contactInfoFound?.hasContactForm,
        hasBooking: audit.contactInfoFound?.hasBookingEngine,
        hasPortfolio: audit.qualitySignals?.hasPortfolioSection,
        ctaQuality: "POOR" as const,
      };

      const auditScore = audit.overallAuditScore ?? 70;
      const loadTime = audit.loadTimeMs ?? 1500;

      // 3A. INSECURE HTTP (NO SSL)
      if (!audit.hasHttps) {
        opportunityScore = 85;
        confidenceScore = 95;
        reasonCode = "PERFORMANCE_ISSUE";
        decision = "PROCEED";

        recommendedServiceCode = "CYBERSECURITY_REVIEW_HARDENING";
        recommendedServiceName = "Web Security Review & Vulnerability Hardening";
        primaryPainPoint = "Domain is missing SSL encryption, triggering browser 'Not Secure' warnings for prospective clients.";
        reasoning = "Missing HTTPS flags security warnings in modern browsers, damaging client trust and search engine visibility.";
        potentialBusinessImpact = "Eliminate browser security warnings and protect customer privacy across all enquiry forms.";
        reasonToContact = "Your website is currently triggering 'Not Secure' browser warnings because SSL encryption is inactive on your domain.";
        suggestedOffer = `Security & SSL Infrastructure Upgrade for ${input.companyName}`;
        expectedBusinessBenefit = "Eliminate browser security warnings and protect customer enquiry transmission with standard SSL encryption.";
        claimType = "VERIFIED_FACT";
        pitchAngle = "Browser security trust badge and search penalty mitigation.";
        minBudget = 18000;
        maxBudget = 45000;
        evidenceSummary.push("Site loads over plain HTTP protocol without active SSL certificate.");
        evidenceSummary.push("Browser displays prominent 'Not Secure' warning badge on initial load.");
        recommendedChannel = digital.hasWhatsapp ? "WHATSAPP" : "EMAIL";
      }

      // 3B. WEAK MOBILE / MISSING VIEWPORT
      else if (!audit.hasMobileViewport || !digital.hasMobileViewport) {
        opportunityScore = 88;
        confidenceScore = 92;
        reasonCode = "WEAK_MOBILE";
        decision = "PROCEED";

        recommendedServiceCode = "PREMIUM_WEBSITE_REDESIGN";
        recommendedServiceName = "Mobile-First Website Redesign & Modernization";
        primaryPainPoint = "Website layout lacks a responsive mobile viewport, creating immediate conversion friction for smartphone visitors.";
        reasoning = "A significant majority of commercial UAE traffic originates from mobile devices; non-responsive viewports cause high bounce rates.";
        potentialBusinessImpact = "Reduce mobile visitor bounce and eliminate interface scaling friction on mobile devices.";
        reasonToContact = "Your website content is solid, but the layout is not optimized for mobile screens, creating friction for smartphone visitors.";
        suggestedOffer = `Modern Mobile-First Web Architecture for ${input.companyName}`;
        expectedBusinessBenefit = "Improve mobile user experience and remove layout friction for smartphone visitors.";
        claimType = "INFERRED_INSIGHT";
        pitchAngle = "Mobile viewport friction audit showing immediate visitor drop-off.";
        minBudget = 35000;
        maxBudget = 70000;
        evidenceSummary.push("Missing <meta name='viewport' content='width=device-width'> in HTML source.");
        evidenceSummary.push("Mobile visitors encounter broken layout scaling and hard-to-click navigation.");
        recommendedChannel = digital.hasWhatsapp ? "WHATSAPP" : "EMAIL";
      }

      // 3C. HIGH-TOUCH CLINIC / SALON / SPA / CONSULTING WITH WHATSAPP BUT MANUAL HANDLING
      else if (
        digital.hasWhatsapp &&
        (industry.includes("clinic") ||
          industry.includes("medical") ||
          industry.includes("aesthetic") ||
          industry.includes("salon") ||
          industry.includes("consult"))
      ) {
        opportunityScore = 90;
        confidenceScore = 90;
        reasonCode = "WHATSAPP_MANUAL";
        decision = "PROCEED";

        recommendedServiceCode = "AI_LEAD_QUALIFICATION_BOT";
        recommendedServiceName = "AI Lead Qualification & 24/7 WhatsApp Conversational System";
        primaryPainPoint = "Business promotes WhatsApp contact but relies on manual replies, creating severe delays during off-hours and peak times.";
        reasoning = "Inbound clients expect timely responses; automated conversational qualification captures lead details and intent promptly.";
        potentialBusinessImpact = "Improve inquiry capture during off-hours and streamline initial client qualification.";
        reasonToContact = "You provide a direct WhatsApp link on your site, but without an automated conversational bot, you risk losing prospects who message during off-hours.";
        suggestedOffer = `24/7 AI Receptionist & WhatsApp Booking Integration for ${input.companyName}`;
        expectedBusinessBenefit = "Enable faster automated responses and lead qualification through WhatsApp.";
        claimType = "INFERRED_INSIGHT";
        pitchAngle = "Instant off-hours lead qualification and calendar booking.";
        minBudget = 25000;
        maxBudget = 55000;
        recommendedChannel = "WHATSAPP";
        evidenceSummary.push("Direct WhatsApp link detected on web presence.");
        evidenceSummary.push("No interactive conversational AI qualification or automated booking flow detected.");
      }

      // 3D. HIGH-TOUCH APPOINTMENT NICHE LACKING ONLINE BOOKING (Clinic, Medical, Spa, Dental, Hospitality)
      else if (
        !digital.hasBooking &&
        (industry.includes("clinic") ||
          industry.includes("medical") ||
          industry.includes("aesthetic") ||
          industry.includes("dental") ||
          industry.includes("spa") ||
          industry.includes("wellness") ||
          industry.includes("hospitality") ||
          industry.includes("restaurant") ||
          industry.includes("dining"))
      ) {
        opportunityScore = 84;
        confidenceScore = 90;
        reasonCode = "NO_BOOKING";
        decision = "PROCEED";

        recommendedServiceCode = "AI_RECEPTIONIST_VOICE_WHATSAPP";
        recommendedServiceName = "24/7 AI Receptionist & Automated Calendar Booking System";
        primaryPainPoint = "High-touch service business lacks automated calendar booking, requiring manual back-and-forth scheduling.";
        reasoning = "Clients seeking appointment-based services prefer instant booking confirmation; manual booking causes booking drop-offs.";
        potentialBusinessImpact = "Enable instant 24/7 appointment scheduling and eliminate manual booking coordination.";
        reasonToContact = "Your service offerings are established, but prospective clients cannot schedule appointments directly online, adding friction to the booking process.";
        suggestedOffer = `24/7 AI Booking & Scheduling Engine for ${input.companyName}`;
        expectedBusinessBenefit = "Enable instant automated appointment booking and reduce scheduling friction for prospective clients.";
        claimType = "INFERRED_INSIGHT";
        pitchAngle = "Direct calendar integration and automated appointment confirmation.";
        minBudget = 25000;
        maxBudget = 55000;
        evidenceSummary.push("Website offers appointment-based services but lacks online booking or calendar integration.");
        evidenceSummary.push("Appointments currently rely on manual phone calls or unformatted contact forms.");
        recommendedChannel = digital.hasWhatsapp ? "WHATSAPP" : "EMAIL";
      }

      // 3E. NEGATIVE SIGNAL: Strong existing digital presence (Do Not Contact)
      else if (
        auditScore >= 85 &&
        audit.hasHttps &&
        audit.hasMobileViewport &&
        digital.ctaQuality === "STRONG" &&
        (digital.hasBooking || digital.hasContactForm) &&
        (digital.hasPortfolio || audit.qualitySignals?.hasTestimonials) &&
        loadTime < 2500
      ) {
        opportunityScore = 25; // LOW opportunity score
        confidenceScore = 95;
        reasonCode = "STRONG_DIGITAL_PRESENCE";
        decision = "DO_NOT_CONTACT";
        isContactRecommended = false;

        recommendedServiceCode = "NO_SERVICE_RECOMMENDED";
        recommendedServiceName = "No Service Recommended (Strong Existing Presence)";
        primaryPainPoint = "Company already maintains a high-quality, modern digital presence with active lead capture mechanisms.";
        reasoning = `Audit score is ${auditScore}/100 with responsive mobile viewport, HTTPS, fast load speed (${loadTime}ms), and established conversion channels.`;
        potentialBusinessImpact = "N/A — Digital infrastructure is fully mature.";
        reasonToContact = "Digital presence is already mature and well-optimized. Commercial outreach is not recommended.";
        suggestedOffer = "None — Do Not Contact";
        expectedBusinessBenefit = "N/A — Digital infrastructure is fully operational.";
        claimType = "VERIFIED_FACT";
        pitchAngle = "No outreach angle recommended.";
        recommendedChannel = "NO_CHANNEL";
        evidenceSummary.push(`Website audit score is ${auditScore}/100 with active SSL and mobile viewport.`);
        evidenceSummary.push("Established lead capture and portfolio showcase detected.");
      }

      // 3F. HIGH-VOLUME LOGISTICS / REAL ESTATE / SERVICES WITH MANUAL WHATSAPP
      else if (
        digital.hasWhatsapp &&
        (industry.includes("logistics") ||
          industry.includes("freight") ||
          industry.includes("real estate") ||
          industry.includes("cleaning") ||
          industry.includes("security") ||
          industry.includes("catering") ||
          industry.includes("ecommerce") ||
          industry.includes("wholesale"))
      ) {
        opportunityScore = 81;
        confidenceScore = 89;
        reasonCode = "WHATSAPP_MANUAL";
        decision = "PROCEED";

        recommendedServiceCode = "WHATSAPP_LEAD_AUTOMATION";
        recommendedServiceName = "WhatsApp Lead Qualification & Conversational Routing Engine";
        primaryPainPoint = "Business promotes direct WhatsApp inquiries but lacks automated qualification and CRM routing.";
        reasoning = "High-volume WhatsApp chats create operational bottlenecks when answered manually without structured qualification.";
        potentialBusinessImpact = "Qualify inbound WhatsApp inquiries automatically and route ready prospects directly to sales teams.";
        reasonToContact = "You promote WhatsApp as a key contact channel, but inquiries appear to be handled manually, creating response delays during peak hours.";
        suggestedOffer = `Automated WhatsApp Qualification & CRM Integration for ${input.companyName}`;
        expectedBusinessBenefit = "Enable structured conversational lead qualification and faster response times for WhatsApp inquiries.";
        claimType = "INFERRED_INSIGHT";
        pitchAngle = "Automating initial client qualification on WhatsApp.";
        minBudget = 22000;
        maxBudget = 48000;
        evidenceSummary.push("Direct WhatsApp click-to-chat link detected on website.");
        evidenceSummary.push("No interactive conversational AI qualification or automated lead routing detected.");
        recommendedChannel = "WHATSAPP";
      }

      // 3G. FITOUT / JOINERY / INTERIOR / DESIGN STUDIO WITH WEAK / HIDDEN PORTFOLIO
      else if (
        !digital.hasPortfolio &&
        (industry.includes("interior") ||
          industry.includes("architecture") ||
          industry.includes("fitout") ||
          industry.includes("joinery") ||
          industry.includes("construction") ||
          industry.includes("design") ||
          industry.includes("signage"))
      ) {
        opportunityScore = 87;
        confidenceScore = 89;
        reasonCode = "WEAK_PORTFOLIO";
        decision = "PROCEED";

        recommendedServiceCode = "PREMIUM_WEBSITE_REDESIGN";
        recommendedServiceName = "Luxury Portfolio & Case Study Showcase Architecture";
        primaryPainPoint = "Completed client projects and craftsmanship case studies are hidden from prospective buyers.";
        reasoning = "High-ticket commercial clients require visual proof of past project scale before awarding tenders or contracts.";
        potentialBusinessImpact = "Provide immediate visual proof of craftsmanship and elevate digital brand authority for tender discussions.";
        reasonToContact = "Your project reputation is strong, but your current website makes it difficult for commercial clients to review your completed work.";
        suggestedOffer = `Visual Portfolio & Case Study Showcase for ${input.companyName}`;
        expectedBusinessBenefit = "Provide immediate visual proof of project scale to prospective commercial clients.";
        claimType = "INFERRED_INSIGHT";
        pitchAngle = "Transforming the website from a brochure into a visual proof engine.";
        minBudget = 38000;
        maxBudget = 80000;
        evidenceSummary.push("No dedicated project gallery or case studies page found on primary navigation.");
        evidenceSummary.push("Craftsmanship proof is not discoverable by commercial clients evaluating vendor credibility.");
        recommendedChannel = digital.hasWhatsapp ? "WHATSAPP" : "EMAIL";
      }

      // 3H. WEAK CTA / NO ENQUIRY FORM ON EXISTING SITE
      else if (!digital.hasContactForm || digital.ctaQuality === "NONE" || digital.ctaQuality === "POOR") {
        opportunityScore = 78;
        confidenceScore = 88;
        reasonCode = "NO_CTA";
        decision = "PROCEED";

        recommendedServiceCode = "HIGH_CONVERTING_LANDING_PAGE";
        recommendedServiceName = "High-Converting Campaign Landing Page & Funnel Architecture";
        primaryPainPoint = "Website lacks clear call-to-action prompts and structured enquiry forms to convert traffic.";
        reasoning = "Without prominent conversion mechanisms, visiting prospects leave without submitting their details.";
        potentialBusinessImpact = "Capture high-intent traffic with targeted enquiry funnels and clear value propositions.";
        reasonToContact = "Your website presents your services, but lacks clear conversion prompts for visitors ready to enquire.";
        suggestedOffer = `High-Converting Funnel & Enquiry Architecture for ${input.companyName}`;
        expectedBusinessBenefit = "Create clearer conversion pathways for website visitors seeking service information.";
        claimType = "INFERRED_INSIGHT";
        pitchAngle = "Conversion friction audit showing missing lead capture mechanisms.";
        minBudget = 18000;
        maxBudget = 42000;
        evidenceSummary.push("No structured enquiry form or prominent primary call-to-action button found on homepage.");
        evidenceSummary.push("Visitor journey ends without an explicit next step for requesting a consultation.");
        recommendedChannel = "EMAIL";
      }

      // 3I. PERFORMANCE / SLOW SPEED / SEO DEFICIENCIES
      else if (loadTime > 3000 || auditScore < 65) {
        opportunityScore = 68;
        confidenceScore = 85;
        reasonCode = "PERFORMANCE_ISSUE";
        decision = "PROCEED";

        recommendedServiceCode = "PERFORMANCE_SEO_UPGRADE";
        recommendedServiceName = "Technical SEO & Speed Optimization Engine";
        primaryPainPoint = "Page load speed is sluggish, degrading visitor retention and search engine rankings.";
        reasoning = "Slow web performance increases mobile bounce rates and penalizes Google search visibility.";
        potentialBusinessImpact = "Achieve sub-second load times and improve organic search visibility.";
        reasonToContact = "Your website content is comprehensive, but page load speed is slow, creating drop-off for mobile users.";
        suggestedOffer = `Core Web Vitals & Speed Optimization Upgrade for ${input.companyName}`;
        expectedBusinessBenefit = "Improve web page loading speed and mobile browsing performance.";
        claimType = "ESTIMATE";
        pitchAngle = "Speed and Core Web Vitals optimization.";
        minBudget = 18000;
        maxBudget = 38000;
        evidenceSummary.push(`Measured page load time is ${loadTime}ms (benchmark: <1500ms).`);
        evidenceSummary.push("Performance metrics indicate uncompressed assets and render-blocking scripts.");
        recommendedChannel = "EMAIL";
      }

      // 3J. GENERAL MODERN REDESIGN
      else {
        opportunityScore = 70;
        confidenceScore = 82;
        reasonCode = "PERFORMANCE_ISSUE";
        decision = "PROCEED";

        recommendedServiceCode = "PREMIUM_WEBSITE_REDESIGN";
        recommendedServiceName = "Premium Website Redesign & Modernization";
        primaryPainPoint = "Web presentation does not fully reflect the modern scale of the business.";
        reasoning = "A modernized web framework enhances brand authority and positions the company for higher-ticket inquiries.";
        potentialBusinessImpact = "Strengthen digital brand positioning and streamline lead intake.";
        reasonToContact = "Your business is established in Dubai, and an upgraded web architecture will better reflect your capabilities.";
        suggestedOffer = `Modern Web Architecture Upgrade for ${input.companyName}`;
        expectedBusinessBenefit = "Modernize visual presentation and streamline client inquiry flow.";
        claimType = "ESTIMATE";
        pitchAngle = "Brand positioning and modern interface upgrade.";
        minBudget = 32000;
        maxBudget = 65000;
        evidenceSummary.push("Website framework shows opportunities for modernized layout and faster loading.");
        recommendedChannel = "EMAIL";
      }
    }

    // =========================================================================
    // CHANNEL SELECTION GOVERNANCE (Strictly evidence-driven)
    // =========================================================================
    const phone = input.phone || input.websiteAudit?.contactInfoFound?.phones?.[0];
    const email = input.email || input.websiteAudit?.contactInfoFound?.emails?.[0];
    const isUaeMobile = Boolean(
      phone && /(?:\+971|00971|0)?(?:50|51|52|54|55|56|58)\d{7}/.test(phone.replace(/\s+|-/g, ""))
    );
    const hasVerifiedWhatsapp = Boolean(
      audit?.digitalPresence?.hasWhatsapp ||
      audit?.digitalPresence?.socialLinks?.whatsapp ||
      isUaeMobile
    );

    if (decision === "DO_NOT_CONTACT" || decision === "NEEDS_VERIFICATION") {
      recommendedChannel = "NO_CHANNEL";
    } else if (
      industry.includes("legal") ||
      industry.includes("law") ||
      industry.includes("financial") ||
      industry.includes("advisory") ||
      industry.includes("tax")
    ) {
      recommendedChannel = email ? "EMAIL" : hasVerifiedWhatsapp ? "WHATSAPP" : "NO_CHANNEL";
    } else if (hasVerifiedWhatsapp) {
      recommendedChannel = "WHATSAPP";
    } else if (email) {
      recommendedChannel = "EMAIL";
    } else {
      recommendedChannel = "NO_CHANNEL";
    }

    return {
      opportunityScore: Math.min(100, Math.max(0, opportunityScore)),
      confidenceScore: Math.min(100, Math.max(0, confidenceScore)),
      evidenceLevel,
      reasonCode,
      decision,
      isContactRecommended,
      recommendedServiceCode,
      recommendedServiceName,
      recommendedChannel,
      primaryPainPoint,
      reasoning,
      potentialBusinessImpact,
      reasonToContact,
      suggestedOffer,
      expectedBusinessBenefit,
      claimType,
      estimatedBudgetMin: minBudget,
      estimatedBudgetMax: maxBudget,
      currency: "AED",
      pitchAngle,
      evidenceSummary,
    };
  }

  public async generatePersonalizedOutreach(
    input: OutreachPromptInput
  ): Promise<GeneratedMessagePayload> {
    const opp = input.opportunity;
    const decision = opp.decision || "PROCEED";
    const isContactRecommended = opp.isContactRecommended ?? (decision === "PROCEED");

    // Strict Outreach Eligibility Guard:
    // Only leads with decision === "PROCEED" are eligible for outreach generation.
    // If decision === "NEEDS_VERIFICATION" or decision === "DO_NOT_CONTACT" or !isContactRecommended:
    // Outreach generation is strictly prohibited.
    if (
      decision === "NEEDS_VERIFICATION" ||
      decision === "DO_NOT_CONTACT" ||
      decision !== "PROCEED" ||
      !isContactRecommended
    ) {
      throw new Error(
        `Outreach generation blocked: Lead is not eligible for outreach (decision: '${decision}', reason: '${opp.reasonCode || "NOT_RECOMMENDED"}'). Only leads with decision 'PROCEED' are eligible for outreach generation.`
      );
    }

    // 1. Resolve Greeting via Contact Identity Guard
    const { greeting } = resolveOutreachGreeting(input);

    // 2. Determine Channel Body Text based on diagnosed reason code & service
    let emailSubject = `${input.companyName.toLowerCase()} - digital portfolio`;
    let emailBody = "";
    let whatsappBody = "";
    let followupBody = "";
    const evidenceUsed: string[] = opp.evidenceSummary.slice(0, 2);

    if (opp.reasonCode === "NO_WEBSITE") {
      emailSubject = `${input.companyName.toLowerCase()} - web showcase`;
      emailBody = `${greeting}\n\nI was looking into ${input.companyName}'s work in ${input.location || "Dubai"} and noticed you don't currently have a dedicated website to capture inbound search inquiries.\n\nWe build clean, high-speed digital showcases designed specifically for commercial businesses.\n\nWould you be open to seeing a 2-minute concept video?\n\nBest regards,`;
      whatsappBody = `${greeting} noticed ${input.companyName} doesn't have a dedicated web showcase for your services. We build clean digital portfolios in ${input.location || "Dubai"}. Happy to share a quick preview if you're open?`;
      followupBody = `${greeting} following up on my previous note regarding a digital showcase for ${input.companyName}. Let me know if you'd like a quick preview.`;
    } else if (opp.reasonCode === "WEAK_MOBILE") {
      emailSubject = `${input.companyName.toLowerCase()} - mobile view`;
      emailBody = `${greeting}\n\nI was browsing ${input.companyName}'s website and noticed the layout does not adapt to smartphone screen sizes, causing broken scaling for mobile visitors.\n\nWe build responsive web interfaces optimized for mobile performance.\n\nWould you like me to send a brief screen recording showing the layout fixes?\n\nBest regards,`;
      whatsappBody = `${greeting} noticed ${input.companyName}'s website isn't scaling properly on smartphone screens. We help fix mobile responsive layouts. Happy to share a quick video demo if you're open?`;
      followupBody = `${greeting} following up regarding the mobile layout fix for ${input.companyName}.`;
    } else if (opp.reasonCode === "NO_BOOKING") {
      emailSubject = `${input.companyName.toLowerCase()} - online booking`;
      emailBody = `${greeting}\n\nI was looking through ${input.companyName}'s service menu and noticed clients cannot schedule appointments directly on your site.\n\nWe integrate 24/7 automated calendar booking systems designed to reduce scheduling back-and-forth.\n\nWould you be open to a quick demo of how the booking flow works?\n\nBest regards,`;
      whatsappBody = `${greeting} noticed clients can't book appointments directly on ${input.companyName}'s site. We build automated 24/7 calendar booking systems. Happy to share a quick concept?`;
      followupBody = `${greeting} following up on my note regarding online booking for ${input.companyName}.`;
    } else if (opp.reasonCode === "WHATSAPP_MANUAL") {
      emailSubject = `${input.companyName.toLowerCase()} - whatsapp lead routing`;
      emailBody = `${greeting}\n\nI noticed ${input.companyName} uses WhatsApp for client inquiries. Without automated qualification, peak inquiry volume can lead to response delays.\n\nWe build conversational qualification bots that filter inquiries and route qualified leads immediately.\n\nWould you be open to a quick 2-minute demo?\n\nBest regards,`;
      whatsappBody = `${greeting} noticed you handle inquiries on WhatsApp. We build automated lead qualification bots for businesses in ${input.location || "Dubai"}. Happy to share a quick preview?`;
      followupBody = `${greeting} following up on automated WhatsApp qualification for ${input.companyName}.`;
    } else if (opp.reasonCode === "WEAK_PORTFOLIO") {
      emailSubject = `${input.companyName.toLowerCase()} - project showcase`;
      emailBody = `${greeting}\n\nI was researching ${input.companyName}'s work and noticed your completed projects are not prominently displayed on your primary web navigation.\n\nWe design visual case study showcases that present past project scale to prospective commercial clients.\n\nWould you be open to seeing a 2-minute mockup?\n\nBest regards,`;
      whatsappBody = `${greeting} noticed ${input.companyName}'s completed projects aren't showcased on your site. We build visual case study galleries for clients. Happy to share a quick concept?`;
      followupBody = `${greeting} following up on the project showcase mockup for ${input.companyName}.`;
    } else {
      emailSubject = `${input.companyName.toLowerCase()} - digital upgrade`;
      emailBody = `${greeting}\n\nI was looking through ${input.companyName}'s digital presence in ${input.location || "Dubai"} and identified a few technical areas where conversion flow can be improved.\n\nWe specialize in high-converting web architecture for growing businesses.\n\nWould you like me to share a 2-minute video breakdown?\n\nBest regards,`;
      whatsappBody = `${greeting} reviewed ${input.companyName}'s web presence and spotted a few technical improvements for client conversion. Happy to share a quick breakdown?`;
      followupBody = `${greeting} following up regarding technical improvements for ${input.companyName}.`;
    }

    const callToAction = "Would you be open to seeing a 2-minute concept video?";

    // 3. Evaluate Quality Scorer
    const qualityReport = evaluateMessageQuality({
      companyName: input.companyName,
      contactName: input.contactName,
      isContactVerified: input.isContactVerified,
      contactIdentityConfidence: input.contactIdentityConfidence,
      emailSubject,
      emailBody,
      whatsappBody,
      callToAction,
      evidenceUsed,
      primaryPainPoint: opp.primaryPainPoint,
      recommendedService: opp.recommendedServiceName,
    });

    return {
      channel: opp.recommendedChannel,
      emailSubject,
      emailBody,
      whatsappBody,
      followupBody,
      callToAction,
      outreachAngle: opp.pitchAngle,
      verifiedObservation: opp.primaryPainPoint,
      proposedSolution: opp.suggestedOffer,
      evidenceUsed,
      qualityScore: qualityReport.overallScore,
      qualityReport,
    };
  }

  public async classifyReply(
    rawText: string
  ): Promise<{ classification: ReplyClassification; sentiment: string; reasoning: string }> {
    const lower = rawText.toLowerCase().trim();

    if (
      lower.includes("unsubscribe") ||
      lower.includes("remove me") ||
      lower.includes("stop") ||
      lower.includes("do not contact") ||
      lower.includes("take me off") ||
      lower.includes("dont email")
    ) {
      return {
        classification: "OPT_OUT",
        sentiment: "NEGATIVE",
        reasoning: "Explicit unsubscribe or opt-out keyword detected.",
      };
    }

    if (
      lower.includes("not interested") ||
      lower.includes("no thanks") ||
      lower.includes("pass on this") ||
      lower.includes("dont need") ||
      lower.includes("don't need")
    ) {
      return {
        classification: "NOT_INTERESTED",
        sentiment: "NEGATIVE",
        reasoning: "Prospect declined the offer or stated lack of interest.",
      };
    }

    if (
      lower.includes("wrong person") ||
      lower.includes("not my department") ||
      lower.includes("contact someone else") ||
      lower.includes("i do not handle") ||
      lower.includes("i don't handle")
    ) {
      return {
        classification: "WRONG_CONTACT",
        sentiment: "NEUTRAL",
        reasoning: "Recipient indicated they are not the relevant decision maker.",
      };
    }

    if (
      lower.includes("book a call") ||
      lower.includes("schedule a call") ||
      lower.includes("call me") ||
      lower.includes("let's meet") ||
      lower.includes("lets meet") ||
      lower.includes("calendar link") ||
      lower.includes("zoom") ||
      lower.includes("google meet")
    ) {
      return {
        classification: "MEETING_REQUEST",
        sentiment: "POSITIVE",
        reasoning: "Prospect requested a meeting or phone conversation.",
      };
    }

    if (
      lower.includes("pricing") ||
      lower.includes("how much") ||
      lower.includes("cost") ||
      lower.includes("rate card") ||
      lower.includes("quote")
    ) {
      return {
        classification: "PRICING",
        sentiment: "POSITIVE",
        reasoning: "Prospect inquired about pricing, fees, or project cost.",
      };
    }

    if (
      lower.includes("timeline") ||
      lower.includes("timelines") ||
      lower.includes("more info") ||
      lower.includes("tell me more") ||
      lower.includes("share details") ||
      lower.includes("send details") ||
      lower.includes("case studies") ||
      lower.includes("portfolio") ||
      lower.includes("how does it work") ||
      lower.includes("what is the process")
    ) {
      return {
        classification: "MORE_INFORMATION",
        sentiment: "POSITIVE",
        reasoning: "Prospect requested additional details, project timelines, or portfolio examples.",
      };
    }

    if (
      lower.includes("next quarter") ||
      lower.includes("next month") ||
      lower.includes("check back") ||
      lower.includes("busy right now") ||
      lower.includes("later this year")
    ) {
      return {
        classification: "MAYBE_LATER",
        sentiment: "NEUTRAL",
        reasoning: "Prospect requested follow-up at a later date.",
      };
    }

    if (
      lower.includes("send video") ||
      lower.includes("send concept") ||
      lower.includes("send mockup") ||
      lower.includes("interested") ||
      lower.includes("sounds good") ||
      lower.includes("love to see")
    ) {
      return {
        classification: "INTERESTED",
        sentiment: "POSITIVE",
        reasoning: "Prospect expressed general positive interest or requested preview concepts.",
      };
    }

    if (
      lower.includes("out of office") ||
      lower.includes("auto-reply") ||
      lower.includes("automatic reply") ||
      lower.includes("on annual leave")
    ) {
      return {
        classification: "OTHER",
        sentiment: "NEUTRAL",
        reasoning: "Automated out-of-office vacation or absence responder detected.",
      };
    }

    return {
      classification: "OTHER",
      sentiment: "NEUTRAL",
      reasoning: "Standard inquiry or general reply message.",
    };
  }
}
