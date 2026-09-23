import { OpportunityAnalysis, OutreachPromptInput, CONTACT_IDENTITY_THRESHOLD } from "@leadintel/types";

export type { OutreachPromptInput };

export function resolveOutreachGreeting(input: OutreachPromptInput): {
  isVerified: boolean;
  greeting: string;
  recipientName: string;
} {
  const isVerified = Boolean(
    input.isContactVerified &&
      (input.contactIdentityConfidence ?? 0) >= CONTACT_IDENTITY_THRESHOLD &&
      input.contactName &&
      input.contactName.trim().length > 0
  );

  if (isVerified && input.contactName) {
    const firstName = input.contactName.trim().split(/\s+/)[0];
    return {
      isVerified: true,
      greeting: `Hi ${firstName},`,
      recipientName: input.contactName.trim(),
    };
  }

  // Strictly neutral company-level greeting
  return {
    isVerified: false,
    greeting: `Hi ${input.companyName} team,`,
    recipientName: `${input.companyName} Team`,
  };
}

export function buildOutreachPrompt(input: OutreachPromptInput): string {
  const { isVerified, greeting, recipientName } = resolveOutreachGreeting(input);

  return `
You are a senior technical founder and master copywriter writing highly targeted, personalized, human B2B outreach.

RECIPIENT & IDENTITY GUARD:
- Company: ${input.companyName}
- Addressed To: ${recipientName}
- Identity Verified: ${isVerified ? "YES (Verified record)" : "NO (Use company team greeting)"}
- Mandatory Opening Greeting: "${greeting}"
- Industry: ${input.industry || "Business"}
- Location: ${input.location || "UAE"}

DIAGNOSED OPPORTUNITY:
- Recommended Service: ${input.opportunity.recommendedServiceName}
- Primary Pain Point: ${input.opportunity.primaryPainPoint}
- Potential Impact: ${input.opportunity.potentialBusinessImpact}
- Strategic Pitch Angle: ${input.opportunity.pitchAngle}
- Verified Observations: ${input.verifiedDetails?.join(", ") || input.opportunity.primaryPainPoint}

STRICT ANTI-JARGON & CONTACT IDENTITY RULES:
1. MANDATORY GREETING & CONTACT IDENTITY GUARD:
   - You MUST use the opening greeting: "${greeting}"
   - NEVER invent a person's name, guess from an email username, or address an unverified person.
   - If identity is unverified, address the company team (e.g. "${greeting}").
2. BANNED CLICHES & PHRASES (NEVER USE ANY OF THESE):
   - "Dear Sir/Madam"
   - "I hope this email finds you well"
   - "I came across your company"
   - "Revolutionize your business"
   - "Take your business to the next level"
   - "Cutting-edge solutions"
   - "Synergy"
   - "AI-powered transformation"
   - "Game-changing"
   - "Unlock your potential"
3. NO UNSUPPORTED NUMERICAL PREDICTIONS:
   - Do NOT claim "100%", "10-second response", "15-30 leads", "double revenue", or "50%+ increase".
   - Use qualified commercial language (e.g. "create a clearer inbound path", "enable faster automated responses").
4. STRUCTURE (Keep it concise, under 90 words for email, under 60 words for WhatsApp):
   - Opening: "${greeting}"
   - Verified Observation: Exactly ONE factual observation regarding their current digital presence or operations.
   - Specific Outcome: Exactly ONE concrete technical or commercial improvement tailored to their specific niche.
   - Low-Friction CTA: Zero-pressure offer (e.g. "Would you like me to send a 2-minute video mockup of how this would look?").
5. TONE: Calm, observant, expert peer-to-peer. Never pretend you've spoken before. Never sound desperate or spammy.

Generate the output ONLY as a valid JSON object:
{
  "emailSubject": string (Short, lowercase or natural casing, e.g. "quick note regarding tawam portfolio", "mobile booking for tawam"),
  "emailBody": string (Clean markdown with linebreaks, max 80 words, starting with "${greeting}"),
  "whatsappBody": string (Concise chat format, direct, professional, max 50 words, starting with "${greeting}"),
  "followupBody": string (Natural follow-up 4 days later, referencing the initial idea without guilt-tripping, max 40 words, starting with "${greeting}"),
  "verifiedObservation": string (The exact single factual observation used),
  "proposedSolution": string (The exact single solution proposed),
  "callToAction": string (The exact low-friction CTA used),
  "channel": "${input.opportunity.recommendedChannel}"
}
`.trim();
}
