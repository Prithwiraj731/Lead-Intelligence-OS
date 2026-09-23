import { getAiProvider } from "@leadintel/ai";
import { WebsiteAuditReport } from "@leadintel/types";

export interface CalibrationScenario {
  id: string;
  name: string;
  industry: string;
  location: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  audit: Partial<WebsiteAuditReport>;
}

export const CALIBRATION_SCENARIOS: CalibrationScenario[] = [
  // 1. No Website (Traditional Joinery / Fitout)
  {
    id: "sc-01",
    name: "Tawam Carpentry & Joinery",
    industry: "Carpentry & Fitout",
    location: "Al Ain",
    website: null,
    phone: "+971559876543",
    email: "info@tawamcarpentry.ae",
    audit: {
      websiteStatus: "NO_WEBSITE",
      isReachable: false,
      hasHttps: false,
      hasMobileViewport: false,
      overallAuditScore: 0,
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
    },
  },

  // 2. Excellent Website (Luxury Studio with Next.js, Fast, Booking, WhatsApp, Portfolio)
  {
    id: "sc-02",
    name: "Aura Luxury Design Studio",
    industry: "Interior Architecture",
    location: "Dubai",
    website: "https://auradesign.ae",
    phone: "+971501112233",
    email: "contact@auradesign.ae",
    audit: {
      websiteStatus: "ONLINE",
      isReachable: true,
      hasHttps: true,
      hasMobileViewport: true,
      loadTimeMs: 950,
      overallAuditScore: 94,
      detectedTechnologies: ["Next.js", "React", "Tailwind CSS", "Google Analytics (GA4)"],
      contactInfoFound: {
        emails: ["contact@auradesign.ae"],
        phones: ["+971501112233"],
        socialLinks: ["Instagram", "LinkedIn"],
        hasContactForm: true,
        hasBookingEngine: true,
      },
      qualitySignals: {
        hasPortfolioSection: true,
        hasTestimonials: true,
        hasClearPricing: true,
        isOutdatedVisualDesign: false,
        hasBrokenElementsNotice: false,
      },
      digitalPresence: {
        cms: [],
        frameworks: ["Next.js", "React"],
        ecommerce: [],
        analytics: ["GA4"],
        chatWidgets: ["WhatsApp Direct Button"],
        bookingEngines: ["Calendly"],
        socialLinks: { instagram: "https://instagram.com/aura", linkedin: "https://linkedin.com/company/aura" },
        hasWhatsapp: true,
        hasHttps: true,
        hasMobileViewport: true,
        hasContactForm: true,
        hasBooking: true,
        hasPortfolio: true,
        ctaQuality: "STRONG",
        seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
      },
    },
  },

  // 3. Poor Mobile Website (Desktop-only layout, non-responsive viewport, broken buttons)
  {
    id: "sc-03",
    name: "Al Barsha Industrial Hardware",
    industry: "Industrial Hardware & Tools",
    location: "Dubai",
    website: "http://albarshahardware.ae",
    phone: "+97143441122",
    email: "sales@albarshahardware.ae",
    audit: {
      websiteStatus: "ONLINE",
      isReachable: true,
      hasHttps: true,
      hasMobileViewport: false, // BROKEN MOBILE
      loadTimeMs: 2200,
      overallAuditScore: 52,
      detectedTechnologies: ["WordPress", "Apache"],
      contactInfoFound: {
        emails: ["sales@albarshahardware.ae"],
        phones: ["+97143441122"],
        socialLinks: [],
        hasContactForm: true,
        hasBookingEngine: false,
      },
      qualitySignals: {
        hasPortfolioSection: false,
        hasTestimonials: false,
        hasClearPricing: false,
        isOutdatedVisualDesign: true,
        hasBrokenElementsNotice: false,
      },
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
    },
  },

  // 4. Strong Website but Weak CTA / No Enquiry Form
  {
    id: "sc-04",
    name: "DIFC Corporate Consulting Partners",
    industry: "Corporate Financial Advisory",
    location: "DIFC, Dubai",
    website: "https://difcpartners.ae",
    phone: "+97144558800",
    email: "info@difcpartners.ae",
    audit: {
      websiteStatus: "ONLINE",
      isReachable: true,
      hasHttps: true,
      hasMobileViewport: true,
      loadTimeMs: 1400,
      overallAuditScore: 74,
      detectedTechnologies: ["Webflow"],
      contactInfoFound: {
        emails: ["info@difcpartners.ae"],
        phones: ["+97144558800"],
        socialLinks: ["LinkedIn"],
        hasContactForm: false, // NO FORM / WEAK CTA
        hasBookingEngine: false,
      },
      qualitySignals: {
        hasPortfolioSection: false,
        hasTestimonials: true,
        hasClearPricing: false,
        isOutdatedVisualDesign: false,
        hasBrokenElementsNotice: false,
      },
      digitalPresence: {
        cms: ["Webflow"],
        frameworks: [],
        ecommerce: [],
        analytics: ["GA4"],
        chatWidgets: [],
        bookingEngines: [],
        socialLinks: { linkedin: "https://linkedin.com" },
        hasWhatsapp: false,
        hasHttps: true,
        hasMobileViewport: true,
        hasContactForm: false,
        hasBooking: false,
        hasPortfolio: false,
        ctaQuality: "NONE",
        seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
      },
    },
  },

  // 5. Restaurant / Hospitality with Active Online Booking System
  {
    id: "sc-05",
    name: "Saffron Royal Fine Dining",
    industry: "Hospitality & Restaurants",
    location: "Downtown Dubai",
    website: "https://saffrondining.ae",
    phone: "+97148889900",
    email: "reservations@saffrondining.ae",
    audit: {
      websiteStatus: "ONLINE",
      isReachable: true,
      hasHttps: true,
      hasMobileViewport: true,
      loadTimeMs: 1100,
      overallAuditScore: 88,
      detectedTechnologies: ["SevenRooms", "OpenTable", "Next.js"],
      contactInfoFound: {
        emails: ["reservations@saffrondining.ae"],
        phones: ["+97148889900"],
        socialLinks: ["Instagram"],
        hasContactForm: true,
        hasBookingEngine: true, // ACTIVE BOOKING
      },
      qualitySignals: {
        hasPortfolioSection: true,
        hasTestimonials: true,
        hasClearPricing: true,
        isOutdatedVisualDesign: false,
        hasBrokenElementsNotice: false,
      },
      digitalPresence: {
        cms: [],
        frameworks: ["Next.js"],
        ecommerce: [],
        analytics: ["GA4", "Meta Pixel"],
        chatWidgets: [],
        bookingEngines: ["SevenRooms", "OpenTable"],
        socialLinks: { instagram: "https://instagram.com" },
        hasWhatsapp: false,
        hasHttps: true,
        hasMobileViewport: true,
        hasContactForm: true,
        hasBooking: true,
        hasPortfolio: true,
        ctaQuality: "STRONG",
        seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
      },
    },
  },

  // 6. Medical Clinic Lacking Online Booking System
  {
    id: "sc-06",
    name: "Al Zahra Dental & Aesthetics Clinic",
    industry: "Dentistry & Medical Aesthetics",
    location: "Jumeirah 3, Dubai",
    website: "https://alzahradentaldxb.com",
    phone: "+97143456789",
    email: "contact@alzahradentaldxb.com",
    audit: {
      websiteStatus: "ONLINE",
      isReachable: true,
      hasHttps: true,
      hasMobileViewport: true,
      loadTimeMs: 1400,
      overallAuditScore: 72,
      detectedTechnologies: ["WordPress"],
      contactInfoFound: {
        emails: ["contact@alzahradentaldxb.com"],
        phones: ["+97143456789"],
        socialLinks: ["Instagram"],
        hasContactForm: true,
        hasBookingEngine: false, // NO BOOKING ENGINE
      },
      qualitySignals: {
        hasPortfolioSection: false,
        hasTestimonials: true,
        hasClearPricing: false,
        isOutdatedVisualDesign: false,
        hasBrokenElementsNotice: false,
      },
      digitalPresence: {
        cms: ["WordPress"],
        frameworks: [],
        ecommerce: [],
        analytics: ["GA4"],
        chatWidgets: [],
        bookingEngines: [],
        socialLinks: { instagram: "https://instagram.com" },
        hasWhatsapp: false,
        hasHttps: true,
        hasMobileViewport: true,
        hasContactForm: true,
        hasBooking: false, // NO BOOKING
        hasPortfolio: false,
        ctaQuality: "AVERAGE",
        seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
      },
    },
  },

  // 7. Contractor / Fitout with Active Website but NO Portfolio
  {
    id: "sc-07",
    name: "Gulf Precision Joinery & Interiors",
    industry: "Interior Fitout & Joinery",
    location: "Al Quoz, Dubai",
    website: "https://gulfprecisionfitout.ae",
    phone: "+971502223344",
    email: "projects@gulfprecisionfitout.ae",
    audit: {
      websiteStatus: "ONLINE",
      isReachable: true,
      hasHttps: true,
      hasMobileViewport: true,
      loadTimeMs: 1600,
      overallAuditScore: 71,
      detectedTechnologies: ["Wix"],
      contactInfoFound: {
        emails: ["projects@gulfprecisionfitout.ae"],
        phones: ["+971502223344"],
        socialLinks: [],
        hasContactForm: true,
        hasBookingEngine: false,
      },
      qualitySignals: {
        hasPortfolioSection: false, // NO PORTFOLIO
        hasTestimonials: false,
        hasClearPricing: false,
        isOutdatedVisualDesign: false,
        hasBrokenElementsNotice: false,
      },
      digitalPresence: {
        cms: ["Wix"],
        frameworks: [],
        ecommerce: [],
        analytics: [],
        chatWidgets: [],
        bookingEngines: [],
        socialLinks: {},
        hasWhatsapp: true,
        hasHttps: true,
        hasMobileViewport: true,
        hasContactForm: true,
        hasBooking: false,
        hasPortfolio: false, // WEAK PORTFOLIO
        ctaQuality: "AVERAGE",
        seoSignals: { hasMetaDescription: true, hasOpenGraph: false, hasH1: true },
      },
    },
  },

  // 8. High-Volume Logistics with Raw WhatsApp Button (Manual Overload)
  {
    id: "sc-08",
    name: "Emirates Freight & Cargo Express",
    industry: "Logistics & Freight",
    location: "JAFZA, Dubai",
    website: "https://emiratesfreightexpress.ae",
    phone: "+97148812345",
    email: "operations@emiratesfreightexpress.ae",
    audit: {
      websiteStatus: "ONLINE",
      isReachable: true,
      hasHttps: true,
      hasMobileViewport: true,
      loadTimeMs: 1800,
      overallAuditScore: 73,
      detectedTechnologies: ["WordPress"],
      contactInfoFound: {
        emails: ["operations@emiratesfreightexpress.ae"],
        phones: ["+97148812345"],
        socialLinks: ["WhatsApp"],
        hasContactForm: true,
        hasBookingEngine: false,
      },
      qualitySignals: {
        hasPortfolioSection: false,
        hasTestimonials: true,
        hasClearPricing: false,
        isOutdatedVisualDesign: false,
        hasBrokenElementsNotice: false,
      },
      digitalPresence: {
        cms: ["WordPress"],
        frameworks: [],
        ecommerce: [],
        analytics: ["GA4"],
        chatWidgets: ["WhatsApp Direct Button"], // RAW WHATSAPP
        bookingEngines: [],
        socialLinks: { whatsapp: "https://wa.me/97148812345" },
        hasWhatsapp: true,
        hasHttps: true,
        hasMobileViewport: true,
        hasContactForm: true,
        hasBooking: false,
        hasPortfolio: false,
        ctaQuality: "AVERAGE",
        seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
      },
    },
  },

  // 9. Enterprise Firm with Strong CRM & Automation (Negative Signal)
  {
    id: "sc-09",
    name: "Al Tamimi & Co Legal Consultants",
    industry: "Corporate Law",
    location: "DIFC, Dubai",
    website: "https://tamimilegal.ae",
    phone: "+97143641641",
    email: "info@tamimilegal.ae",
    audit: {
      websiteStatus: "ONLINE",
      isReachable: true,
      hasHttps: true,
      hasMobileViewport: true,
      loadTimeMs: 1150,
      overallAuditScore: 92,
      detectedTechnologies: ["HubSpot", "Zendesk", "React", "GA4"],
      contactInfoFound: {
        emails: ["info@tamimilegal.ae"],
        phones: ["+97143641641"],
        socialLinks: ["LinkedIn", "Twitter/X"],
        hasContactForm: true,
        hasBookingEngine: true,
      },
      qualitySignals: {
        hasPortfolioSection: true,
        hasTestimonials: true,
        hasClearPricing: true,
        isOutdatedVisualDesign: false,
        hasBrokenElementsNotice: false,
      },
      digitalPresence: {
        cms: [],
        frameworks: ["React"],
        ecommerce: [],
        analytics: ["GA4", "HubSpot"],
        chatWidgets: ["HubSpot Chat"],
        bookingEngines: ["Calendly"],
        socialLinks: { linkedin: "https://linkedin.com" },
        hasWhatsapp: false,
        hasHttps: true,
        hasMobileViewport: true,
        hasContactForm: true,
        hasBooking: true,
        hasPortfolio: true,
        ctaQuality: "STRONG",
        seoSignals: { hasMetaDescription: true, hasOpenGraph: true, hasH1: true },
      },
    },
  },

  // 10. Research Unavailable (DNS Failure / Timeout / Unreachable)
  {
    id: "sc-10",
    name: "Desert Mirage Falconry Supplies",
    industry: "Retail & Outdoor Supplies",
    location: "Dubai",
    website: "https://desertmiragefalconry-unknown.ae",
    phone: "+971509990000",
    email: "contact@desertmirage.ae",
    audit: {
      websiteStatus: "NOT_FOUND", // DNS FAILURE / UNRESOLVED
      isReachable: false,
      hasHttps: false,
      hasMobileViewport: false,
      loadTimeMs: 0,
      overallAuditScore: 10,
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
    },
  },
];

export async function runCalibrationSuite() {
  const ai = getAiProvider();
  const results: any[] = [];

  for (const sc of CALIBRATION_SCENARIOS) {
    const opp = await ai.analyzeCompanyOpportunity({
      companyName: sc.name,
      industry: sc.industry,
      location: sc.location,
      website: sc.website,
      phone: sc.phone,
      email: sc.email,
      websiteAudit: sc.audit as any,
    });

    let messageQuality = "N/A";
    let messageStatus = "NOT_ELIGIBLE";

    // Strict Outreach Eligibility: Only PROCEED leads generate outreach
    if (opp.decision === "PROCEED") {
      const outreach = await ai.generatePersonalizedOutreach({
        companyName: sc.name,
        contactName: null,
        isContactVerified: false,
        contactIdentityConfidence: 0,
        industry: sc.industry,
        location: sc.location,
        opportunity: opp,
      });

      messageQuality = `${outreach.qualityScore}/100 (${outreach.qualityReport?.qualityTier || "GOOD"})`;
      messageStatus = "READY_FOR_REVIEW";
    }

    results.push({
      scenario: sc.name,
      researchEvidence: sc.audit.websiteStatus,
      evidenceLevel: opp.evidenceLevel,
      opportunityScore: opp.opportunityScore,
      confidenceScore: opp.confidenceScore,
      recommendedService: opp.recommendedServiceName,
      reasonCode: opp.reasonCode,
      recommendedChannel: opp.recommendedChannel,
      messageQuality,
      messageStatus,
      decision: opp.decision,
    });
  }

  return results;
}

export function runMessageQualityVarianceTests() {
  const { evaluateMessageQuality } = require("@leadintel/ai");

  const variations = [
    {
      draftType: "EXCELLENT (Fully Evidence-Grounded & Strict Identity Guard)",
      payload: {
        companyName: "Tawam Carpentry",
        emailSubject: "tawam carpentry - web showcase",
        emailBody: "Hi Tawam Carpentry team,\n\nI was looking into Tawam Carpentry's fitout work in Al Ain and noticed you don't currently have a dedicated website to capture inbound search inquiries.\n\nWe build clean, high-speed digital showcases designed specifically for commercial businesses in UAE.\n\nWould you be open to seeing a 2-minute concept video?\n\nBest regards,",
        whatsappBody: "Hi Tawam Carpentry team, noticed you don't have a dedicated web showcase for your services in UAE. Happy to share a quick preview if you're open?",
        callToAction: "Would you be open to seeing a 2-minute concept video?",
        evidenceUsed: ["Zero verified website domain detected.", "Commercial inquiries currently restricted to word-of-mouth."],
        primaryPainPoint: "No website",
      },
    },
    {
      draftType: "GOOD (1 Evidence Item & Standard Copy)",
      payload: {
        companyName: "Al Barsha Hardware",
        emailSubject: "al barsha hardware - mobile view",
        emailBody: "Hi Al Barsha Hardware team,\n\nI was browsing your website and noticed the layout does not adapt to smartphone screen sizes.\n\nWe build responsive web interfaces optimized for mobile performance.\n\nWould you like me to send a brief screen recording showing the layout fixes?\n\nBest regards,",
        whatsappBody: "Hi Al Barsha Hardware team, noticed your website isn't scaling properly on smartphone screens. Happy to share a quick video demo if you're open?",
        callToAction: "Would you like me to send a brief screen recording showing the layout fixes?",
        evidenceUsed: ["Missing viewport meta tag."],
        primaryPainPoint: "Non-responsive mobile layout",
      },
    },
    {
      draftType: "ACCEPTABLE (Generic Phrasing, No Cited Evidence Array)",
      payload: {
        companyName: "DIFC Partners",
        emailSubject: "difc partners - digital upgrade",
        emailBody: "Hi DIFC Partners team,\n\nI was looking through your digital presence in Dubai and identified a few technical areas where conversion flow can be improved.\n\nWe specialize in high-converting web architecture for growing businesses.\n\nWould you like me to share a 2-minute video breakdown?\n\nBest regards,",
        whatsappBody: "Hi DIFC Partners team, reviewed your web presence and spotted a few technical improvements. Happy to share a quick breakdown?",
        callToAction: "Would you like me to share a 2-minute video breakdown?",
        evidenceUsed: [],
        primaryPainPoint: "Website lacks conversion funnel",
      },
    },
    {
      draftType: "WEAK (Banned Buzzwords, Unsupported 10-Second Guarantee, Unverified Name)",
      payload: {
        companyName: "Apex Med Aesthetics",
        contactName: "Tariq",
        isContactVerified: false,
        contactIdentityConfidence: 30,
        emailSubject: "Revolutionize your business and double your leads",
        emailBody: "Dear sir,\n\nI hope this email finds you well. We provide cutting-edge AI-powered solutions to take your business to the next level with synergy and respond to 100% of WhatsApp inquiries in under 10 seconds guaranteed.\n\nContact us now,",
        whatsappBody: "Revolutionize your business with cutting-edge next level synergy and double your conversion rate 100%.",
        callToAction: "Contact us immediately",
        evidenceUsed: [],
        primaryPainPoint: "Manual operations",
      },
    },
  ];

  return variations.map((v) => {
    const report = evaluateMessageQuality(v.payload);
    return {
      draftType: v.draftType,
      overallScore: `${report.overallScore}/100`,
      tier: report.qualityTier,
      claimSafetyScore: `${report.claimSafetyScore}/100`,
      naturalnessScore: `${report.naturalnessScore}/100`,
      evidenceScore: `${report.evidenceScore}/100`,
      brevityScore: `${report.brevityScore}/100`,
      specificityScore: `${report.specificityScore}/100`,
      detectedIssues: report.detectedIssues.length > 0 ? report.detectedIssues.join("; ") : "None (Clean)",
    };
  });
}

if (require.main === module) {
  console.log("\n=======================================================");
  console.log("1. 10-SCENARIO INTELLIGENCE CALIBRATION MATRIX");
  console.log("=======================================================");
  runCalibrationSuite().then((res) => {
    console.table(res);

    console.log("\n=======================================================");
    console.log("2. MESSAGE QUALITY SCORER VARIANCE & TIER SPECTRUM");
    console.log("=======================================================");
    const qualityRes = runMessageQualityVarianceTests();
    console.table(qualityRes);

    process.exit(0);
  });
}
