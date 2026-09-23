import { prisma } from "./client";

export const DEFAULT_SERVICES = [
  {
    code: "NEW_HIGH_CONVERTING_WEBSITE",
    name: "New High-Converting Business Website & Digital Presence",
    category: "WEB_DEV",
    description:
      "Complete greenfield website creation for businesses lacking an online hub, structured for search visibility and client trust.",
    targetProblems: [
      "no dedicated website",
      "relying only on social media",
      "unreachable domain",
      "unregistered brand web presence",
    ],
    typicalValueProp:
      "Establish direct ownership of your client acquisition channel with a professional digital headquarters.",
    estimatedPriceMin: 25000,
    estimatedPriceMax: 60000,
    currency: "AED",
  },
  {
    code: "PREMIUM_WEBSITE_REDESIGN",
    name: "Premium Website Redesign & Conversion Architecture",
    category: "WEB_DEV",
    description:
      "Modern, high-performance web redesign built with Next.js/React, fast mobile responsiveness, and high-converting portfolio presentation.",
    targetProblems: [
      "outdated visual design",
      "poor mobile responsiveness",
      "slow page speed",
      "weak portfolio / project display",
      "unclear CTA",
    ],
    typicalValueProp:
      "Elevate brand authority and multiply high-ticket enquiries with a bespoke, lightning-fast digital experience.",
    estimatedPriceMin: 35000,
    estimatedPriceMax: 85000,
    currency: "AED",
  },
  {
    code: "HIGH_CONVERTING_LANDING_PAGE",
    name: "High-Converting Campaign Landing Page",
    category: "WEB_DEV",
    description:
      "Single-page conversion funnel optimized for paid traffic campaigns, ad lead capture, and product launches.",
    targetProblems: [
      "low ad traffic conversion",
      "cluttered website diluting campaign focus",
      "missing high-intent lead capture forms",
    ],
    typicalValueProp:
      "Turn paid ad clicks into booked revenue with laser-targeted, high-converting standalone landing experiences.",
    estimatedPriceMin: 18000,
    estimatedPriceMax: 38000,
    currency: "AED",
  },
  {
    code: "ECOMMERCE_ARCHITECTURE",
    name: "Modern E-Commerce Store & Checkout Architecture",
    category: "WEB_DEV",
    description:
      "High-converting online store setup with Shopify, WooCommerce, or headless React, integrated with UAE payment gateways and inventory sync.",
    targetProblems: [
      "clunky checkout process",
      "abandoned carts due to slow store speed",
      "missing local UAE payment methods (Apple Pay, Tabby, Tamara)",
    ],
    typicalValueProp:
      "Maximize store checkout velocity and reduce cart abandonment with seamless one-click payments.",
    estimatedPriceMin: 35000,
    estimatedPriceMax: 95000,
    currency: "AED",
  },
  {
    code: "AI_CONVERSATIONAL_CHATBOT",
    name: "AI Web Conversational Assistant & Knowledge Bot",
    category: "AI_AUTOMATION",
    description:
      "Custom AI chatbot trained on company service documentation, pricing models, and case studies to answer visitor inquiries instantly.",
    targetProblems: [
      "unanswered website inquiries",
      "repetitive customer support questions",
      "visitor drop-off without engaging sales",
    ],
    typicalValueProp:
      "Engage every website visitor instantly 24/7 with accurate AI-driven answers that guide prospects to consultation.",
    estimatedPriceMin: 22000,
    estimatedPriceMax: 48000,
    currency: "AED",
  },
  {
    code: "AI_RECEPTIONIST_VOICE_WHATSAPP",
    name: "24/7 AI Voice & WhatsApp Receptionist",
    category: "AI_AUTOMATION",
    description:
      "Multi-channel AI receptionist that handles phone calls and WhatsApp messages, qualifies intent, and schedules appointments automatically.",
    targetProblems: [
      "missed after-hours phone calls",
      "front-desk bottleneck during busy clinic/consulting hours",
      "inconsistent customer enquiry logging",
    ],
    typicalValueProp:
      "Never miss a high-ticket client phone call or message with an instant, human-sounding AI receptionist.",
    estimatedPriceMin: 28000,
    estimatedPriceMax: 65000,
    currency: "AED",
  },
  {
    code: "WHATSAPP_LEAD_AUTOMATION",
    name: "Automated WhatsApp Lead Flow & Re-Engagement",
    category: "AI_AUTOMATION",
    description:
      "Instant WhatsApp auto-responder, interactive menus, lead categorization, and automated abandoned enquiry follow-up sequences.",
    targetProblems: [
      "business relies on WhatsApp but answers manually with delays",
      "lost prospects due to delayed reply",
      "no structured re-engagement for cold enquiries",
    ],
    typicalValueProp:
      "Automate 80% of WhatsApp communication and re-engage dormant prospects without adding manual staff.",
    estimatedPriceMin: 20000,
    estimatedPriceMax: 45000,
    currency: "AED",
  },
  {
    code: "AI_LEAD_QUALIFICATION_BOT",
    name: "AI Lead Qualification & Intake Bot",
    category: "AI_AUTOMATION",
    description:
      "Intelligent qualification bot that assesses budget, timeline, and project scope before routing high-value prospects to leadership calendars.",
    targetProblems: [
      "sales team wasting time on low-budget inquiries",
      "delayed response times to leads",
      "unqualified enquiry spam",
    ],
    typicalValueProp:
      "Filter out tire-kickers and fast-track pre-qualified, high-budget prospects directly into your calendar.",
    estimatedPriceMin: 20000,
    estimatedPriceMax: 50000,
    currency: "AED",
  },
  {
    code: "CRM_WORKFLOW_AUTOMATION",
    name: "Automated CRM Pipeline & Multi-Channel Sync",
    category: "AI_AUTOMATION",
    description:
      "Seamless integration between website forms, WhatsApp, email, and CRM (HubSpot, Zoho, Pipedrive) for zero-lead-leakage sales tracking.",
    targetProblems: [
      "leads falling through cracks",
      "no automated follow-up sequence",
      "manual data entry across disconnected tools",
    ],
    typicalValueProp:
      "Automate lead tracking and follow-ups to increase conversion rates without hiring extra sales staff.",
    estimatedPriceMin: 25000,
    estimatedPriceMax: 55000,
    currency: "AED",
  },
  {
    code: "CUSTOM_BUSINESS_DASHBOARD",
    name: "Custom Real-Time Business Dashboard & Portal",
    category: "WEB_DEV",
    description:
      "Tailored analytics dashboard aggregating sales, operations, customer metrics, and KPI tracking into one unified live view.",
    targetProblems: [
      "scattered data across 5+ spreadsheets and tools",
      "lack of real-time visibility on revenue and client pipelines",
      "slow manual executive reporting",
    ],
    typicalValueProp:
      "Gain real-time clarity into operations and revenue metrics with a custom executive command dashboard.",
    estimatedPriceMin: 35000,
    estimatedPriceMax: 80000,
    currency: "AED",
  },
  {
    code: "BUSINESS_PROCESS_AUTOMATION",
    name: "End-to-End Business Workflow & Operations Automation",
    category: "AI_AUTOMATION",
    description:
      "Automation of repetitive back-office processes (invoicing, document extraction, client onboarding, notification workflows) via n8n & API orchestration.",
    targetProblems: [
      "manual back-office paperwork bottlenecks",
      "delayed customer onboarding",
      "high operational labor costs on repetitive tasks",
    ],
    typicalValueProp:
      "Save 20+ hours per week per employee by automating manual data transfer and routine administrative workflows.",
    estimatedPriceMin: 30000,
    estimatedPriceMax: 75000,
    currency: "AED",
  },
  {
    code: "AI_SYSTEMS_INTEGRATION",
    name: "Custom AI Systems & LLM Integration",
    category: "AI_AUTOMATION",
    description:
      "Custom integration of OpenAI, Gemini, or local AI models into proprietary software workflows, internal document retrieval, and proposal engines.",
    targetProblems: [
      "inability to leverage enterprise generative AI safely",
      "manual document processing and proposal creation",
      "unstructured company knowledge silos",
    ],
    typicalValueProp:
      "Empower your team with proprietary AI assistants connected securely to your internal databases and workflows.",
    estimatedPriceMin: 45000,
    estimatedPriceMax: 120000,
    currency: "AED",
  },
  {
    code: "PERFORMANCE_SEO_UPGRADE",
    name: "Technical SEO & Speed Optimization Engine",
    category: "DIGITAL_INFRA",
    description:
      "Core Web Vitals optimization, schema markup injection, asset compression, and search engine discovery tuning.",
    targetProblems: [
      "poor Google search rankings",
      "slow mobile load times (>4s)",
      "missing schema structured data",
      "sub-par Core Web Vitals failing Google thresholds",
    ],
    typicalValueProp:
      "Rank higher on search and retain impatient mobile visitors with sub-second page performance.",
    estimatedPriceMin: 15000,
    estimatedPriceMax: 40000,
    currency: "AED",
  },
  {
    code: "ENTERPRISE_SEO_STRATEGY",
    name: "Commercial SEO Architecture & Search Domination",
    category: "DIGITAL_INFRA",
    description:
      "Comprehensive search architecture overhaul, programmatic landing pages for UAE localities, and high-intent buyer keyword strategy.",
    targetProblems: [
      "competitors capturing all high-intent local search queries",
      "no structured landing pages for key commercial services",
      "low organic inbound qualified deal flow",
    ],
    typicalValueProp:
      "Capture high-intent commercial buyers searching for your services across Dubai and the UAE.",
    estimatedPriceMin: 25000,
    estimatedPriceMax: 65000,
    currency: "AED",
  },
  {
    code: "CYBERSECURITY_REVIEW_HARDENING",
    name: "Web Security Review & Vulnerability Hardening",
    category: "CYBERSECURITY",
    description:
      "Security audit of web endpoints, SSL/TLS configuration, headers (HSTS, CSP), and vulnerability mitigation.",
    targetProblems: [
      "insecure HTTP / SSL issues",
      "vulnerable CMS plugins and outdated software dependencies",
      "exposed sensitive endpoints and admin panels",
      "missing security headers (CSP, X-Frame-Options, HSTS)",
    ],
    typicalValueProp:
      "Protect your business reputation and customer data against cyber threats and compliance penalties.",
    estimatedPriceMin: 20000,
    estimatedPriceMax: 60000,
    currency: "AED",
  },
];

export async function seedServiceCatalog() {
  console.log("Seeding expanded 15-service catalog...");
  for (const svc of DEFAULT_SERVICES) {
    await prisma.serviceCatalog.upsert({
      where: { code: svc.code },
      update: {
        name: svc.name,
        category: svc.category,
        description: svc.description,
        targetProblems: svc.targetProblems,
        typicalValueProp: svc.typicalValueProp,
        estimatedPriceMin: svc.estimatedPriceMin,
        estimatedPriceMax: svc.estimatedPriceMax,
        currency: svc.currency,
        isActive: true,
      },
      create: {
        code: svc.code,
        name: svc.name,
        category: svc.category,
        description: svc.description,
        targetProblems: svc.targetProblems,
        typicalValueProp: svc.typicalValueProp,
        estimatedPriceMin: svc.estimatedPriceMin,
        estimatedPriceMax: svc.estimatedPriceMax,
        currency: svc.currency,
        isActive: true,
      },
    });
  }
  console.log(`Seeded all ${DEFAULT_SERVICES.length} services successfully.`);
}

if (process.argv[1]?.includes("seed.ts")) {
  seedServiceCatalog()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
