import { MessageQualityReport, CONTACT_IDENTITY_THRESHOLD } from "@leadintel/types";

export interface QualityScorerInput {
  companyName: string;
  contactName?: string | null;
  isContactVerified?: boolean;
  contactIdentityConfidence?: number;
  emailSubject?: string | null;
  emailBody?: string | null;
  whatsappBody?: string | null;
  callToAction?: string | null;
  evidenceUsed?: string[];
  primaryPainPoint?: string;
  recommendedService?: string;
}

const BANNED_BUZZWORDS = [
  "i hope this email finds you well",
  "hope this finds you well",
  "revolutionize",
  "cutting-edge",
  "take your business to the next level",
  "next level",
  "transform your business",
  "synergy",
  "ai-powered solutions",
  "game changer",
  "game-changer",
  "groundbreaking",
  "seamlessly",
  "elevate your game",
  "dear sir",
  "dear madam",
  "to whom it may concern",
  "best in class",
  "world class",
];

const UNSUPPORTED_NUMERICAL_CLAIMS = /\b(15[–-]30|100%|10[- ]second|double\b|50%\+|60%\+|40%|30-40%|guaranteed|guarantee)\b/i;

export function evaluateMessageQuality(input: QualityScorerInput): MessageQualityReport {
  const detectedIssues: string[] = [];
  const suggestions: string[] = [];

  const emailText = `${input.emailSubject || ""} ${input.emailBody || ""}`.toLowerCase();
  const whatsappText = `${input.whatsappBody || ""}`.toLowerCase();
  const fullText = `${emailText} ${whatsappText} ${input.callToAction || ""}`.toLowerCase();

  // 1. Claim Safety (25 pts)
  let claimSafetyScore = 100;
  if (UNSUPPORTED_NUMERICAL_CLAIMS.test(fullText)) {
    claimSafetyScore = 20;
    detectedIssues.push("Contains unsupported numerical prediction or guarantee (e.g. percentages, speed claims, or double metrics).");
    suggestions.push("Replace specific numbers with qualified outcomes (e.g. 'faster automated response' instead of '10-second response').");
  }

  // 2. Contact Identity Guard & Greeting Safety
  const isVerified = Boolean(
    input.isContactVerified &&
      (input.contactIdentityConfidence ?? 0) >= CONTACT_IDENTITY_THRESHOLD &&
      input.contactName &&
      input.contactName.trim().length > 0
  );

  const emailBodyTrimmed = (input.emailBody || "").trim();
  const firstLine = emailBodyTrimmed.split("\n")[0]?.trim() || "";

  if (!isVerified) {
    // If unverified, it must NOT address an invented or unverified person's name (e.g. "Hi Tariq,", "Hi John,")
    // It should use a company-level greeting like "Hi [Company] team,"
    const companyFirstWord = input.companyName.trim().split(/\s+/)[0]?.toLowerCase() || "";
    const lowerFirstLine = firstLine.toLowerCase();

    // Check if it used generic placeholder or unverified name
    if (lowerFirstLine.startsWith("hi there") || lowerFirstLine.startsWith("hey there") || lowerFirstLine.startsWith("hello there")) {
      claimSafetyScore = Math.max(0, claimSafetyScore - 25);
      detectedIssues.push("Used impersonal generic greeting ('Hi there'). Use company team greeting (e.g. 'Hi " + input.companyName + " team,').");
      suggestions.push("Address the company team directly when no verified contact is confirmed.");
    } else if (
      lowerFirstLine.startsWith("hi ") ||
      lowerFirstLine.startsWith("hey ") ||
      lowerFirstLine.startsWith("dear ")
    ) {
      // Check if greeting contains company name or 'team'
      const hasCompanyOrTeam = lowerFirstLine.includes("team") || (companyFirstWord && lowerFirstLine.includes(companyFirstWord));
      if (!hasCompanyOrTeam && input.contactName && lowerFirstLine.includes(input.contactName.toLowerCase().split(" ")[0])) {
        claimSafetyScore = Math.max(0, claimSafetyScore - 40);
        detectedIssues.push("UNVERIFIED_CONTACT_NAME_USED: Outreach addresses an unverified person by name without a verified contact record (confidence < 80%).");
        suggestions.push("Use a neutral company team greeting like 'Hi " + input.companyName + " team,' when contact identity is not verified.");
      }
    }
  }

  // 3. Naturalness & Anti-Jargon (25 pts)
  let naturalnessScore = 100;
  for (const banned of BANNED_BUZZWORDS) {
    if (fullText.includes(banned)) {
      naturalnessScore = Math.max(0, naturalnessScore - 30);
      detectedIssues.push(`Contains banned sales cliché or buzzword: "${banned}"`);
      suggestions.push(`Remove corporate jargon like "${banned}" and speak directly peer-to-peer.`);
    }
  }

  // 4. Evidence Grounding (25 pts)
  let evidenceScore = 75;
  const pain = (input.primaryPainPoint || "").toLowerCase();
  const evidenceList = (input.evidenceUsed || []).map((e) => e.toLowerCase());

  let hasGrounding = false;
  if (
    pain &&
    (emailText.includes(pain.slice(0, 20)) ||
      fullText.includes("portfolio") ||
      fullText.includes("mobile") ||
      fullText.includes("whatsapp") ||
      fullText.includes("security") ||
      fullText.includes("ssl") ||
      fullText.includes("booking") ||
      fullText.includes("showcase") ||
      fullText.includes("website"))
  ) {
    hasGrounding = true;
  }

  if (evidenceList.length >= 2) {
    evidenceScore = 95;
  } else if (evidenceList.length === 1) {
    evidenceScore = 88;
  } else if (hasGrounding) {
    evidenceScore = 72;
  } else {
    evidenceScore = 45;
    detectedIssues.push("Message does not clearly cite an observed technical or digital presence gap.");
    suggestions.push("Anchor the opening line directly to a verified observation from the research audit.");
  }

  // 5. Brevity (15 pts)
  let brevityScore = 95;
  const emailWords = (input.emailBody || "").trim().split(/\s+/).filter(Boolean).length;
  const whatsappWords = (input.whatsappBody || "").trim().split(/\s+/).filter(Boolean).length;

  if (emailWords > 130) {
    brevityScore -= 30;
    detectedIssues.push(`Email body is too long (${emailWords} words). Target: 40–110 words.`);
    suggestions.push("Shorten the email body so it can be read in under 20 seconds on a smartphone.");
  } else if (emailWords < 25 && emailWords > 0) {
    brevityScore -= 20;
    detectedIssues.push(`Email body is too sparse (${emailWords} words).`);
  }

  if (whatsappWords > 70) {
    brevityScore -= 20;
    detectedIssues.push(`WhatsApp message is too lengthy (${whatsappWords} words). Target: 15–50 words.`);
    suggestions.push("Keep WhatsApp messages brief, direct, and conversational.");
  }

  // 6. Specificity (10 pts)
  let specificityScore = 85;
  const company = (input.companyName || "").toLowerCase();
  const companyWords = company.split(" ").filter(Boolean);
  const mentionsCompany = companyWords.some((w) => w.length > 2 && fullText.includes(w));

  if (mentionsCompany) {
    specificityScore = 92;
    if (fullText.includes("dubai") || fullText.includes("uae") || fullText.includes("al ain") || fullText.includes("abu dhabi")) {
      specificityScore = 96;
    }
  } else {
    specificityScore = 45;
    detectedIssues.push("Message does not reference the company name directly.");
    suggestions.push("Personalize with the target company's business name.");
  }

  // Calculate Weighted Overall Score
  const overallScore = Math.round(
    claimSafetyScore * 0.25 +
    naturalnessScore * 0.25 +
    evidenceScore * 0.25 +
    brevityScore * 0.15 +
    specificityScore * 0.10
  );

  const passed = overallScore >= 80 && claimSafetyScore >= 70 && naturalnessScore >= 70;

  let qualityTier: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "WEAK" = "GOOD";
  if (overallScore >= 90) {
    qualityTier = "EXCELLENT";
  } else if (overallScore >= 80) {
    qualityTier = "GOOD";
  } else if (overallScore >= 70) {
    qualityTier = "ACCEPTABLE";
  } else {
    qualityTier = "WEAK";
  }

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    evidenceScore: Math.min(100, Math.max(0, evidenceScore)),
    brevityScore: Math.min(100, Math.max(0, brevityScore)),
    naturalnessScore: Math.min(100, Math.max(0, naturalnessScore)),
    claimSafetyScore: Math.min(100, Math.max(0, claimSafetyScore)),
    specificityScore: Math.min(100, Math.max(0, specificityScore)),
    qualityTier,
    passed,
    detectedIssues,
    suggestions,
  };
}
