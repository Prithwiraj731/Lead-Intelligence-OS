import dns from "node:dns/promises";
import net from "node:net";
import {
  WebsiteAuditReport,
  WebsiteStatus,
  SubPageAudit,
  DigitalPresence,
  EvidenceItem,
  TruthTier,
} from "@leadintel/types";

// SSRF Blocklist Patterns
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "metadata.google.internal",
  "169.254.169.254",
]);

/**
 * Checks if an IPv4 address is in a private, loopback, link-local, or reserved range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [b0, b1] = parts;

  // 0.0.0.0/8 (Broadcast/Current network)
  if (b0 === 0) return true;
  // 10.0.0.0/8 (Private)
  if (b0 === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata)
  if (b0 === 169 && b1 === 254) return true;
  // 172.16.0.0/12 (Private)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (b0 === 192 && b1 === 168) return true;
  // 100.64.0.0/10 (Carrier NAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (b0 >= 224) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a private, loopback, or link-local range.
 */
function isPrivateIPv6(ip: string): boolean {
  const clean = ip.toLowerCase().trim();
  if (
    clean === "::1" ||
    clean === "::" ||
    clean.startsWith("fe80:") ||
    clean.startsWith("fc00:") ||
    clean.startsWith("fd00:")
  ) {
    return true;
  }
  return false;
}

/**
 * Validates a target URL against SSRF attacks.
 * Resolves the DNS hostname and verifies that all resolved IPs are public.
 */
export async function validateSsrfSafeUrl(
  rawUrl: string
): Promise<{ safe: boolean; error?: string; parsedUrl?: URL }> {
  let urlStr = rawUrl.trim();
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { safe: false, error: "Invalid URL syntax." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, error: "Only HTTP and HTTPS protocols are permitted." };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost")
  ) {
    return { safe: false, error: `Host '${hostname}' is an internal/restricted destination.` };
  }

  // Check if hostname is an IP directly
  const ipType = net.isIP(hostname);
  if (ipType === 4 && isPrivateIPv4(hostname)) {
    return { safe: false, error: `Direct IP '${hostname}' belongs to a private/internal network.` };
  }
  if (ipType === 6 && isPrivateIPv6(hostname)) {
    return { safe: false, error: `Direct IPv6 '${hostname}' belongs to a private/internal network.` };
  }

  // Resolve DNS to verify all destination IPs
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return { safe: false, error: `Resolved IP ${record.address} for ${hostname} is private/internal.` };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return { safe: false, error: `Resolved IPv6 ${record.address} for ${hostname} is private/internal.` };
      }
    }
  } catch (err: any) {
    return { safe: false, error: `DNS lookup failed for '${hostname}': ${err.message || "Domain not found"}` };
  }

  return { safe: true, parsedUrl: parsed };
}

/**
 * Extracts internal links from HTML matching strategic subpage types.
 */
function discoverSubpages(html: string, baseUrl: URL): Map<string, { url: string; type: SubPageAudit["pageType"] }> {
  const discovered = new Map<string, { url: string; type: SubPageAudit["pageType"] }>();
  const linkRegex = /href=["']([^"'#\s]+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    if (!rawHref || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || rawHref.startsWith("javascript:")) {
      continue;
    }

    try {
      const resolved = new URL(rawHref, baseUrl);
      // Only keep same origin links
      if (resolved.origin !== baseUrl.origin) continue;

      const path = resolved.pathname.toLowerCase();

      if (path === "/" || path === "") continue;

      if (!discovered.has("ABOUT") && (path.includes("about") || path.includes("who-we-are") || path.includes("company"))) {
        discovered.set("ABOUT", { url: resolved.toString(), type: "ABOUT" });
      } else if (!discovered.has("SERVICES") && (path.includes("service") || path.includes("what-we-do") || path.includes("offerings") || path.includes("solutions"))) {
        discovered.set("SERVICES", { url: resolved.toString(), type: "SERVICES" });
      } else if (!discovered.has("PORTFOLIO") && (path.includes("portfolio") || path.includes("project") || path.includes("case-stud") || path.includes("our-work") || path.includes("gallery"))) {
        discovered.set("PORTFOLIO", { url: resolved.toString(), type: "PORTFOLIO" });
      } else if (!discovered.has("CONTACT") && (path.includes("contact") || path.includes("get-in-touch") || path.includes("reach-us"))) {
        discovered.set("CONTACT", { url: resolved.toString(), type: "CONTACT" });
      } else if (!discovered.has("BOOKING") && (path.includes("book") || path.includes("appointment") || path.includes("schedule") || path.includes("consultation"))) {
        discovered.set("BOOKING", { url: resolved.toString(), type: "BOOKING" });
      } else if (!discovered.has("CAREERS") && (path.includes("career") || path.includes("job") || path.includes("join-our-team"))) {
        discovered.set("CAREERS", { url: resolved.toString(), type: "CAREERS" });
      }
    } catch {}
  }

  return discovered;
}

/**
 * Safely fetches a single page with timeout and SSRF guard.
 */
async function fetchPageSafely(pageUrl: string, timeoutMs: number = 4000): Promise<{ ok: boolean; status: number; html: string; loadTimeMs: number; error?: string }> {
  const ssrf = await validateSsrfSafeUrl(pageUrl);
  if (!ssrf.safe || !ssrf.parsedUrl) {
    return { ok: false, status: 0, html: "", loadTimeMs: 0, error: ssrf.error };
  }

  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(ssrf.parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (LeadIntelligenceBot/2.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    const loadTimeMs = Date.now() - start;
    const htmlText = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      html: htmlText.slice(0, 1.5 * 1024 * 1024),
      loadTimeMs,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: err.name === "AbortError" ? 408 : 0,
      html: "",
      loadTimeMs: Date.now() - start,
      error: err.message,
    };
  }
}

/**
 * Deep multi-page website inspection and technical evidence synthesis.
 */
export async function auditCompanyWebsite(targetUrl: string | null | undefined): Promise<WebsiteAuditReport> {
  if (!targetUrl || targetUrl.trim().length === 0) {
    const emptyEvidence: EvidenceItem[] = [
      {
        observation: "No dedicated registered website URL exists for this business.",
        evidence: "Company records contain no verified domain or web endpoint.",
        impact: "Severe loss of high-intent search traffic and lack of digital conversion authority in the UAE market.",
        recommendedSolution: "Deploy a modern greenfield business website with structured SEO and instant enquiry capture.",
        confidence: 95,
        truthTier: "VERIFIED",
        category: "PRESENCE",
      },
    ];

    return {
      url: "",
      websiteStatus: "NO_WEBSITE",
      isReachable: false,
      hasHttps: false,
      hasMobileViewport: false,
      overallAuditScore: 0,
      detectedTechnologies: [],
      ctaElements: [],
      contactInfoFound: {
        emails: [],
        phones: [],
        socialLinks: [],
        hasContactForm: false,
        hasBookingEngine: false,
      },
      qualitySignals: {
        hasPortfolioSection: false,
        hasTestimonials: false,
        hasClearPricing: false,
        isOutdatedVisualDesign: false,
        hasBrokenElementsNotice: false,
      },
      identifiedIssues: ["No dedicated website URL provided for this company"],
      truthTiers: {
        websiteStatus: "VERIFIED",
        overallAuditScore: "VERIFIED",
      },
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
        seoSignals: {
          hasMetaDescription: false,
          hasOpenGraph: false,
          hasH1: false,
        },
      },
      evidenceMatrix: emptyEvidence,
    };
  }

  const ssrfCheck = await validateSsrfSafeUrl(targetUrl);
  if (!ssrfCheck.safe || !ssrfCheck.parsedUrl) {
    const errorEvidence: EvidenceItem[] = [
      {
        observation: "Website domain could not be safely resolved or reached.",
        evidence: ssrfCheck.error || "DNS resolution failed or destination is restricted.",
        impact: "Prospective corporate clients attempting to visit the URL encounter broken DNS or offline errors.",
        recommendedSolution: "Fix DNS configuration or establish a reliable, high-performance web presence.",
        confidence: 95,
        truthTier: "VERIFIED",
        category: "INFRASTRUCTURE",
      },
    ];

    return {
      url: targetUrl,
      websiteStatus: ssrfCheck.error?.includes("DNS") ? "NOT_FOUND" : "BLOCKED",
      isReachable: false,
      hasHttps: targetUrl.startsWith("https://"),
      hasMobileViewport: false,
      overallAuditScore: 10,
      detectedTechnologies: [],
      ctaElements: [],
      contactInfoFound: {
        emails: [],
        phones: [],
        socialLinks: [],
        hasContactForm: false,
        hasBookingEngine: false,
      },
      qualitySignals: {
        hasPortfolioSection: false,
        hasTestimonials: false,
        hasClearPricing: false,
        isOutdatedVisualDesign: true,
        hasBrokenElementsNotice: true,
      },
      identifiedIssues: [ssrfCheck.error || "URL could not be safely reached"],
      truthTiers: {
        websiteStatus: "VERIFIED",
        identifiedIssues: "VERIFIED",
      },
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
        hasHttps: targetUrl.startsWith("https://"),
        hasMobileViewport: false,
        hasContactForm: false,
        hasBooking: false,
        hasPortfolio: false,
        ctaQuality: "NONE",
        seoSignals: {
          hasMetaDescription: false,
          hasOpenGraph: false,
          hasH1: false,
        },
      },
      evidenceMatrix: errorEvidence,
    };
  }

  // 1. Fetch Homepage
  const homeResult = await fetchPageSafely(ssrfCheck.parsedUrl.toString(), 6000);
  const homeUrl = ssrfCheck.parsedUrl;
  const loadTimeMs = homeResult.loadTimeMs;
  const hasHttps = homeUrl.protocol === "https:";

  if (!homeResult.ok || !homeResult.html) {
    const unreachableEvidence: EvidenceItem[] = [
      {
        observation: `Website server returned HTTP ${homeResult.status || "Connection Error"}.`,
        evidence: `Direct request to ${targetUrl} failed with status code ${homeResult.status}.`,
        impact: "Commercial prospects cannot access company information, resulting in immediate bounce.",
        recommendedSolution: "Restore server uptime and migrate to modern high-availability web infrastructure.",
        confidence: 90,
        truthTier: "VERIFIED",
        category: "UPTIME",
      },
    ];

    return {
      url: targetUrl,
      finalUrl: targetUrl,
      httpStatus: homeResult.status,
      websiteStatus: homeResult.status === 404 ? "NOT_FOUND" : "OFFLINE",
      isReachable: false,
      hasHttps,
      hasMobileViewport: false,
      loadTimeMs,
      overallAuditScore: 15,
      detectedTechnologies: [],
      ctaElements: [],
      contactInfoFound: {
        emails: [],
        phones: [],
        socialLinks: [],
        hasContactForm: false,
        hasBookingEngine: false,
      },
      qualitySignals: {
        hasPortfolioSection: false,
        hasTestimonials: false,
        hasClearPricing: false,
        isOutdatedVisualDesign: true,
        hasBrokenElementsNotice: true,
      },
      identifiedIssues: [`HTTP ${homeResult.status || "Error"} returned from server (${homeResult.error || "Offline"})`],
      truthTiers: {
        websiteStatus: "VERIFIED",
        httpStatus: "VERIFIED",
        loadTimeMs: "VERIFIED",
      },
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
        hasHttps,
        hasMobileViewport: false,
        hasContactForm: false,
        hasBooking: false,
        hasPortfolio: false,
        ctaQuality: "NONE",
        seoSignals: {
          hasMetaDescription: false,
          hasOpenGraph: false,
          hasH1: false,
        },
      },
      evidenceMatrix: unreachableEvidence,
    };
  }

  const html = homeResult.html;

  // 2. Discover and politely crawl up to 4 key subpages
  const discoveredSubpages = discoverSubpages(html, homeUrl);
  const subPagesAudited: SubPageAudit[] = [
    {
      url: homeUrl.toString(),
      pageType: "HOMEPAGE",
      statusCode: homeResult.status,
      title: (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "Homepage").trim(),
      loadTimeMs: homeResult.loadTimeMs,
      isReachable: true,
      keySignalsFound: [],
    },
  ];

  // Concatenate HTML across pages for deep signal extraction
  let aggregatedHtml = html;
  const subPageEntries = Array.from(discoveredSubpages.entries()).slice(0, 4);

  for (const [type, item] of subPageEntries) {
    const subRes = await fetchPageSafely(item.url, 3500);
    const pageTitle = subRes.html
      ? (subRes.html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || type).trim()
      : type;

    subPagesAudited.push({
      url: item.url,
      pageType: item.type,
      statusCode: subRes.status,
      title: pageTitle,
      loadTimeMs: subRes.loadTimeMs,
      isReachable: subRes.ok,
      keySignalsFound: subRes.ok ? [`Discovered ${type} page`] : ["Page unreachable"],
    });

    if (subRes.ok && subRes.html) {
      aggregatedHtml += " " + subRes.html;
    }
  }

  // 3. Technical & Commercial Signal Extraction across aggregated content
  const hasMobileViewport = /<meta[^>]*name=["']viewport["'][^>]*content=["'][^"']*width=device-width/i.test(html);
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : undefined;
  const hasOpenGraph = /<meta[^>]*property=["']og:/i.test(html);
  const hasH1 = /<h1[^>]*>/i.test(html);

  // Social Links Extraction
  const socialLinksMap: Record<string, string> = {};
  const socialLinksList: string[] = [];

  const igMatch = aggregatedHtml.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+)\/?["']/i);
  if (igMatch) {
    socialLinksMap.instagram = igMatch[1];
    socialLinksList.push("Instagram");
  }

  const liMatch = aggregatedHtml.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+)\/?["']/i);
  if (liMatch) {
    socialLinksMap.linkedin = liMatch[1];
    socialLinksList.push("LinkedIn");
  }

  const fbMatch = aggregatedHtml.match(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.]+)\/?["']/i);
  if (fbMatch) {
    socialLinksMap.facebook = fbMatch[1];
    socialLinksList.push("Facebook");
  }

  const xMatch = aggregatedHtml.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+)\/?["']/i);
  if (xMatch) {
    socialLinksMap.twitter = xMatch[1];
    socialLinksList.push("Twitter/X");
  }

  const ytMatch = aggregatedHtml.match(/href=["'](https?:\/\/(?:www\.)?youtube\.com\/[a-zA-Z0-9_@]+)\/?["']/i);
  if (ytMatch) {
    socialLinksMap.youtube = ytMatch[1];
    socialLinksList.push("YouTube");
  }

  const ttMatch = aggregatedHtml.match(/href=["'](https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+)\/?["']/i);
  if (ttMatch) {
    socialLinksMap.tiktok = ttMatch[1];
    socialLinksList.push("TikTok");
  }

  // Contact info extraction
  const emailMatches = Array.from(
    new Set(
      (aggregatedHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).filter(
        (e) => !e.endsWith(".png") && !e.endsWith(".jpg") && !e.endsWith(".svg") && !e.includes("example.com") && !e.includes("sentry")
      )
    )
  ).slice(0, 5);

  const phoneMatches = Array.from(
    new Set(
      (aggregatedHtml.match(/(?:\+971|00971|0)(?:2|3|4|6|7|9|50|51|52|54|55|56|58)\d{7}/g) || []).map((p) => p.trim())
    )
  ).slice(0, 5);

  // WhatsApp detection
  const hasWhatsappLink = /(?:wa\.me\/\d+|api\.whatsapp\.com\/send|whatsapp\.com\/channel)/i.test(aggregatedHtml);
  if (hasWhatsappLink) {
    const waMatch = aggregatedHtml.match(/href=["'](https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send)[^"']+)["']/i);
    if (waMatch) socialLinksMap.whatsapp = waMatch[1];
  }

  // Chat Widgets Detection
  const chatWidgets: string[] = [];
  if (hasWhatsappLink) chatWidgets.push("WhatsApp Direct Button");
  if (/intercom\.io|widget\.intercom\.io/i.test(aggregatedHtml)) chatWidgets.push("Intercom");
  if (/crisp\.chat|client\.crisp\.chat/i.test(aggregatedHtml)) chatWidgets.push("Crisp");
  if (/tidio\.co|code\.tidio\.co/i.test(aggregatedHtml)) chatWidgets.push("Tidio");
  if (/static\.zdassets\.com|zopim/i.test(aggregatedHtml)) chatWidgets.push("Zendesk");
  if (/livechatinc\.com|cdn\.livechatinc\.com/i.test(aggregatedHtml)) chatWidgets.push("LiveChat");
  if (/embed\.tawk\.to/i.test(aggregatedHtml)) chatWidgets.push("Tawk.to");
  if (/js\.driftt\.com/i.test(aggregatedHtml)) chatWidgets.push("Drift");
  if (/js\.hs-scripts\.com/i.test(aggregatedHtml)) chatWidgets.push("HubSpot Chat");

  // Booking Platforms Detection
  const bookingEngines: string[] = [];
  if (/calendly\.com/i.test(aggregatedHtml)) bookingEngines.push("Calendly");
  if (/booksy\.com/i.test(aggregatedHtml)) bookingEngines.push("Booksy");
  if (/fresha\.com/i.test(aggregatedHtml)) bookingEngines.push("Fresha");
  if (/acuityscheduling\.com/i.test(aggregatedHtml)) bookingEngines.push("Acuity Scheduling");
  if (/simplybook\.me/i.test(aggregatedHtml)) bookingEngines.push("SimplyBook");
  if (/setmore\.com/i.test(aggregatedHtml)) bookingEngines.push("Setmore");
  if (/cal\.com/i.test(aggregatedHtml)) bookingEngines.push("Cal.com");

  const hasBooking = bookingEngines.length > 0 || /(book-now|schedule-appointment|book-consultation|make-appointment)/i.test(aggregatedHtml);

  // Forms detection
  const hasContactForm = /<form[^>]*>/i.test(aggregatedHtml) && /(contact|message|submit|enquiry|email|name|phone)/i.test(aggregatedHtml);

  // CMS & Frameworks Detection
  const cms: string[] = [];
  const frameworks: string[] = [];
  const ecommerce: string[] = [];

  if (/wp-content|wordpress/i.test(aggregatedHtml)) cms.push("WordPress");
  if (/shopify\.com|cdn\.shopify\.com/i.test(aggregatedHtml)) {
    cms.push("Shopify");
    ecommerce.push("Shopify Store");
  }
  if (/woocommerce/i.test(aggregatedHtml)) ecommerce.push("WooCommerce");
  if (/webflow\.com|wf-page/i.test(aggregatedHtml)) cms.push("Webflow");
  if (/wix\.com|wix-site/i.test(aggregatedHtml)) cms.push("Wix");
  if (/squarespace\.com/i.test(aggregatedHtml)) cms.push("Squarespace");
  if (/framer\.com|framer-content/i.test(aggregatedHtml)) cms.push("Framer");
  if (/ghost\.org|ghost-theme/i.test(aggregatedHtml)) cms.push("Ghost");
  if (/drupal/i.test(aggregatedHtml)) cms.push("Drupal");

  if (/_next\/static|__NEXT_DATA__/i.test(aggregatedHtml)) frameworks.push("Next.js");
  if (/react/i.test(aggregatedHtml)) frameworks.push("React");
  if (/vue/i.test(aggregatedHtml)) frameworks.push("Vue.js");
  if (/nuxt/i.test(aggregatedHtml)) frameworks.push("Nuxt.js");
  if (/angular/i.test(aggregatedHtml)) frameworks.push("Angular");
  if (/tailwind/i.test(aggregatedHtml)) frameworks.push("Tailwind CSS");

  // Analytics & Tracking Detection
  const analytics: string[] = [];
  if (/googletagmanager\.com|gtm\.js/i.test(aggregatedHtml)) analytics.push("Google Tag Manager");
  if (/google-analytics\.com|gtag\/js/i.test(aggregatedHtml)) analytics.push("Google Analytics (GA4)");
  if (/connect\.facebook\.net\/.*\/fbevents\.js/i.test(aggregatedHtml)) analytics.push("Meta Pixel");
  if (/hotjar\.com|static\.hotjar\.com/i.test(aggregatedHtml)) analytics.push("Hotjar");
  if (/clarity\.ms/i.test(aggregatedHtml)) analytics.push("Microsoft Clarity");
  if (/posthog/i.test(aggregatedHtml)) analytics.push("PostHog");
  if (/analytics\.js|cdn\.segment\.com/i.test(aggregatedHtml)) analytics.push("Segment");
  if (/plausible\.io/i.test(aggregatedHtml)) analytics.push("Plausible Analytics");

  // Quality signals
  const hasPortfolioSection =
    discoveredSubpages.has("PORTFOLIO") ||
    /(portfolio|projects|case-studies|gallery|our-work|works|completed-projects)/i.test(aggregatedHtml);
  const hasTestimonials = /(testimonials|reviews|what-clients-say|feedback|client-stories)/i.test(aggregatedHtml);
  const hasClearPricing = /(pricing|packages|rates|plans|aed\s*\d+|\$\s*\d+|dirhams)/i.test(aggregatedHtml);
  const isOutdatedVisualDesign = !hasMobileViewport || /<table[^>]*layout|<frame|<font[^>]*size/i.test(html) || loadTimeMs > 4000;

  // CTA Quality Assessment
  let ctaQuality: DigitalPresence["ctaQuality"] = "NONE";
  if (hasBooking || (hasContactForm && hasWhatsappLink)) {
    ctaQuality = "STRONG";
  } else if (hasContactForm || hasWhatsappLink) {
    ctaQuality = "AVERAGE";
  } else if (/mailto:|tel:/i.test(aggregatedHtml)) {
    ctaQuality = "POOR";
  }

  // 4. Evidence Matrix Construction (Observation -> Evidence -> Impact -> Solution -> Confidence)
  const evidenceMatrix: EvidenceItem[] = [];
  const identifiedIssues: string[] = [];
  let auditScore = 100;

  // Evidence 1: SSL & Security
  if (!hasHttps) {
    identifiedIssues.push("Missing SSL certificate (Plain HTTP in use)");
    auditScore -= 20;
    evidenceMatrix.push({
      observation: "Website operates over insecure HTTP without active SSL encryption.",
      evidence: `Target URL protocol is ${homeUrl.protocol}, triggering browser 'Not Secure' warnings.`,
      impact: "Commercial clients abandon the site immediately due to security warnings, harming brand trust.",
      recommendedSolution: "Deploy full HTTPS encryption with automated SSL certificate renewal.",
      confidence: 100,
      truthTier: "VERIFIED",
      category: "SECURITY",
    });
  }

  // Evidence 2: Mobile Viewport & Responsiveness
  if (!hasMobileViewport) {
    identifiedIssues.push("No responsive mobile viewport meta tag detected");
    auditScore -= 25;
    evidenceMatrix.push({
      observation: "Website lacks mobile viewport configuration.",
      evidence: "HTML source does not contain <meta name='viewport' content='width=device-width'>.",
      impact: "Over 70% of UAE traffic accesses web via mobile; non-responsive viewports cause 60%+ visitor bounce.",
      recommendedSolution: "Rebuild frontend with mobile-first responsive architecture.",
      confidence: 100,
      truthTier: "VERIFIED",
      category: "MOBILE",
    });
  }

  // Evidence 3: Conversion & CTA Pathways
  if (!hasContactForm && !hasBooking) {
    identifiedIssues.push("No structured enquiry form or online booking mechanism");
    auditScore -= 20;
    evidenceMatrix.push({
      observation: "Website has no direct enquiry form or booking flow on landing pages.",
      evidence: "No <form> element or appointment scheduler detected across audited pages.",
      impact: "Interested prospects must manually copy email/phone, resulting in high conversion friction.",
      recommendedSolution: "Integrate high-converting lead capture forms and automated booking mechanisms.",
      confidence: 95,
      truthTier: "VERIFIED",
      category: "CONVERSION",
    });
  }

  // Evidence 4: WhatsApp Automation & Instant Response
  if (hasWhatsappLink && chatWidgets.length === 1) {
    evidenceMatrix.push({
      observation: "Business promotes direct WhatsApp contact but lacks automated qualification.",
      evidence: `WhatsApp direct URL (${socialLinksMap.whatsapp || "wa.me link"}) detected without conversational qualification layer.`,
      impact: "Leads arriving during off-hours or busy periods wait hours for manual responses, risking lost deals.",
      recommendedSolution: "Deploy a 24/7 AI WhatsApp Qualification Bot that answers FAQs and schedules appointments instantly.",
      confidence: 90,
      truthTier: "INFERRED",
      category: "AI_AUTOMATION",
    });
  }

  // Evidence 5: Portfolio & Case Study Discovery
  if (!hasPortfolioSection) {
    identifiedIssues.push("Project portfolio is difficult to discover or absent");
    auditScore -= 15;
    evidenceMatrix.push({
      observation: "Portfolio or case studies are difficult to discover on primary navigation.",
      evidence: "No dedicated portfolio, gallery, or project links discovered across homepage navigation.",
      impact: "High-ticket commercial clients cannot verify past project quality, lengthening sales cycles.",
      recommendedSolution: "Build a prominent, visually compelling portfolio showcase with project metrics.",
      confidence: 88,
      truthTier: "INFERRED",
      category: "PORTFOLIO",
    });
  }

  // Evidence 6: Speed & Performance
  if (loadTimeMs > 3000) {
    identifiedIssues.push(`Slow initial page response time (${loadTimeMs}ms)`);
    auditScore -= 15;
    evidenceMatrix.push({
      observation: `Website initial response is slow (${loadTimeMs}ms).`,
      evidence: `Server round-trip and document retrieval took ${loadTimeMs}ms.`,
      impact: "Slow loading speeds directly degrade Google SEO rankings and increase mobile bounce rates.",
      recommendedSolution: "Implement server caching, CDN delivery, and Next.js static asset optimization.",
      confidence: 92,
      truthTier: "VERIFIED",
      category: "PERFORMANCE",
    });
  }

  // Evidence 7: Analytics & Tracking Visibility
  if (analytics.length === 0) {
    identifiedIssues.push("No digital analytics or conversion tracking detected");
    evidenceMatrix.push({
      observation: "Website operates with zero analytics or conversion tracking scripts.",
      evidence: "No Google Analytics GA4, Tag Manager, or Meta Pixel snippets detected in page headers.",
      impact: "Business has no visibility into visitor sources, drop-off points, or campaign ROI.",
      recommendedSolution: "Configure Google Tag Manager with GA4 custom conversion events.",
      confidence: 90,
      truthTier: "VERIFIED",
      category: "ANALYTICS",
    });
  }

  auditScore = Math.max(15, Math.min(100, auditScore));

  const digitalPresence: DigitalPresence = {
    cms,
    frameworks,
    ecommerce,
    analytics,
    chatWidgets,
    bookingEngines,
    socialLinks: socialLinksMap,
    hasWhatsapp: hasWhatsappLink,
    hasHttps,
    hasMobileViewport,
    hasContactForm,
    hasBooking,
    hasPortfolio: hasPortfolioSection,
    ctaQuality,
    seoSignals: {
      hasMetaDescription: Boolean(metaDescription),
      hasOpenGraph,
      hasH1,
    },
  };

  const detectedTechnologies = Array.from(new Set([...cms, ...frameworks, ...ecommerce, ...analytics, ...chatWidgets, ...bookingEngines]));

  return {
    url: targetUrl,
    finalUrl: homeUrl.toString(),
    httpStatus: homeResult.status,
    websiteStatus: "ONLINE",
    isReachable: true,
    hasHttps,
    hasMobileViewport,
    loadTimeMs,
    pageTitle,
    metaDescription,
    detectedTechnologies,
    ctaElements: hasContactForm ? ["Contact Form"] : [],
    contactInfoFound: {
      emails: emailMatches,
      phones: phoneMatches,
      socialLinks: socialLinksList,
      hasContactForm,
      hasBookingEngine: hasBooking,
    },
    qualitySignals: {
      hasPortfolioSection,
      hasTestimonials,
      hasClearPricing,
      isOutdatedVisualDesign,
      hasBrokenElementsNotice: false,
    },
    overallAuditScore: auditScore,
    identifiedIssues,
    truthTiers: {
      websiteStatus: "VERIFIED",
      hasHttps: "VERIFIED",
      hasMobileViewport: "VERIFIED",
      loadTimeMs: "VERIFIED",
      overallAuditScore: "VERIFIED",
      hasPortfolioSection: hasPortfolioSection ? "VERIFIED" : "INFERRED",
      hasContactForm: "VERIFIED",
      hasWhatsapp: hasWhatsappLink ? "VERIFIED" : "UNKNOWN",
    },
    subPages: subPagesAudited,
    digitalPresence,
    evidenceMatrix,
  };
}
