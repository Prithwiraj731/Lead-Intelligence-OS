import { prisma } from "@leadintel/database";
import { DeliverySafetyCheckReport, OutreachChannel } from "@leadintel/types";

export interface SafetyCheckInput {
  messageId: string;
  companyId: string;
  contactId?: string | null;
  channel: OutreachChannel;
  destinationOverride?: string;
  hasReviewedConfirmation?: boolean;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
]);

export const RATE_LIMIT_MAX_PER_HOUR = Number(process.env.RATE_LIMIT_MAX_PER_HOUR || 20);
export const RATE_LIMIT_MAX_PER_DAY = Number(process.env.RATE_LIMIT_MAX_PER_DAY || 100);
export const DUPLICATE_WINDOW_DAYS = 14;
export const PILOT_MAX_REAL_RECIPIENTS = 5;

export async function evaluateDeliverySafety(
  input: SafetyCheckInput
): Promise<DeliverySafetyCheckReport> {
  const failedChecks: string[] = [];

  // 1. Fetch message and relations
  const message = await prisma.message.findUnique({
    where: { id: input.messageId },
    include: {
      company: true,
      contact: true,
    },
  });

  if (!message) {
    return {
      passed: false,
      isMessageApproved: false,
      hasValidDestination: false,
      isContactSuppressed: false,
      isCompanySuppressed: false,
      isDuplicateOutreach: false,
      isRateLimitPermitted: false,
      isKillSwitchActive: process.env.OUTBOUND_DELIVERY_ENABLED !== "true",
      isDryRun: process.env.OUTBOUND_DRY_RUN !== "false",
      destination: "",
      channel: input.channel,
      failedChecks: ["MESSAGE_RECORD_NOT_FOUND"],
      reason: "Message record does not exist in the database.",
    };
  }

  // 2. Check Approval Gate
  const isMessageApproved = message.status === "APPROVED";
  if (!isMessageApproved) {
    failedChecks.push(
      `MESSAGE_NOT_APPROVED: Message status is '${message.status}'. Delivery requires human approval status 'APPROVED'.`
    );
  }

  // 3. Resolve Destination
  let destination = input.destinationOverride || "";
  if (!destination) {
    if (input.channel === "EMAIL") {
      destination = message.contact?.email || "";
    } else {
      destination = message.contact?.phone || message.company.phone || "";
    }
  }
  destination = destination.trim();

  // 4. Validate Destination Syntax & Safety
  let hasValidDestination = false;
  if (input.channel === "EMAIL") {
    if (destination && EMAIL_REGEX.test(destination)) {
      const domain = destination.split("@")[1]?.toLowerCase();
      if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
        failedChecks.push(`DISPOSABLE_EMAIL_BLOCKED: Domain '${domain}' is a known temporary/disposable provider.`);
      } else {
        hasValidDestination = true;
      }
    } else {
      failedChecks.push(`INVALID_EMAIL_DESTINATION: '${destination || "MISSING"}' is not a valid email format.`);
    }
  } else {
    failedChecks.push("WHATSAPP_DISABLED_IN_PILOT: WhatsApp outreach is strictly disabled during the controlled email pilot.");
  }

  // 5. Check Human Review Confirmation
  if (input.hasReviewedConfirmation === false) {
    failedChecks.push(
      "CONFIRMATION_REQUIRED: Reviewer must confirm 'I have reviewed this recipient, evidence, and message' prior to delivery."
    );
  }

  // 6. Check Suppression System (Global Opt-Out & Bounces)
  const contactEmail = message.contact?.email?.toLowerCase().trim();
  const contactPhone = message.contact?.phone?.trim();
  const companyDomain = message.company.normalizedDomain?.toLowerCase().trim();
  const companyPhone = message.company.normalizedPhone?.trim();

  const suppressions = await prisma.suppression.findMany({
    where: {
      OR: [
        ...(contactEmail ? [{ email: contactEmail }] : []),
        ...(contactPhone ? [{ phone: contactPhone }] : []),
        ...(companyDomain ? [{ domain: companyDomain }] : []),
        ...(companyPhone ? [{ phone: companyPhone }] : []),
        ...(destination && input.channel === "EMAIL" ? [{ email: destination.toLowerCase() }] : []),
        ...(destination && input.channel === "WHATSAPP" ? [{ phone: destination }] : []),
      ],
    },
  });

  const isContactSuppressed = Boolean(
    suppressions.find((s) => (contactEmail && s.email === contactEmail) || (contactPhone && s.phone === contactPhone))
  );
  const isCompanySuppressed = Boolean(
    suppressions.find((s) => (companyDomain && s.domain === companyDomain) || (companyPhone && s.phone === companyPhone))
  );

  if (isContactSuppressed || isCompanySuppressed || suppressions.length > 0) {
    const reason = suppressions[0]?.reason || "SUPPRESSED";
    failedChecks.push(
      `RECIPIENT_SUPPRESSED: Target contact or company is globally suppressed (Reason: ${reason}).`
    );
  }

  // 7. Check Duplicate Outreach (Within 14 Days)
  const duplicateWindowStart = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recentDelivery = await prisma.delivery.findFirst({
    where: {
      companyId: message.companyId,
      channel: input.channel,
      status: { in: ["SENT", "DELIVERED"] },
      createdAt: { gte: duplicateWindowStart },
      id: { not: message.id },
    },
  });

  const isDuplicateOutreach = Boolean(recentDelivery);
  if (isDuplicateOutreach) {
    failedChecks.push(
      `DUPLICATE_OUTREACH_DETECTED: A message was already sent to this company on channel ${input.channel} within the last ${DUPLICATE_WINDOW_DAYS} days.`
    );
  }

  // 8. Check Rate Limits (Deliveries in last 1 hour & 24 hours) & Pilot Cap
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [hourlyCount, dailyCount, realDeliveriesCount] = await Promise.all([
    prisma.delivery.count({
      where: {
        createdAt: { gte: oneHourAgo },
        status: { in: ["SENT", "DELIVERED", "PROCESSING"] },
      },
    }),
    prisma.delivery.count({
      where: {
        createdAt: { gte: oneDayAgo },
        status: { in: ["SENT", "DELIVERED", "PROCESSING"] },
      },
    }),
    prisma.delivery.count({
      where: {
        isDryRun: false,
        status: { in: ["SENT", "DELIVERED", "BOUNCED", "FAILED", "PROCESSING"] },
      },
    }),
  ]);

  let isRateLimitPermitted = true;
  if (hourlyCount >= RATE_LIMIT_MAX_PER_HOUR) {
    isRateLimitPermitted = false;
    failedChecks.push(`RATE_LIMIT_HOURLY_EXCEEDED: ${hourlyCount}/${RATE_LIMIT_MAX_PER_HOUR} messages sent in the last hour.`);
  }
  if (dailyCount >= RATE_LIMIT_MAX_PER_DAY) {
    isRateLimitPermitted = false;
    failedChecks.push(`RATE_LIMIT_DAILY_EXCEEDED: ${dailyCount}/${RATE_LIMIT_MAX_PER_DAY} messages sent in the last 24 hours.`);
  }

  // 9. Global Kill Switch & Dry-Run flags
  const isKillSwitchActive = process.env.OUTBOUND_DELIVERY_ENABLED !== "true";
  const isDryRun = process.env.OUTBOUND_DRY_RUN !== "false" || isKillSwitchActive;

  if (!isDryRun && realDeliveriesCount >= PILOT_MAX_REAL_RECIPIENTS) {
    isRateLimitPermitted = false;
    failedChecks.push(
      `PILOT_CAP_REACHED: Hard limit of ${PILOT_MAX_REAL_RECIPIENTS} real email recipients in pilot campaign has been reached.`
    );
  }

  const passed =
    isMessageApproved &&
    hasValidDestination &&
    !isContactSuppressed &&
    !isCompanySuppressed &&
    !isDuplicateOutreach &&
    isRateLimitPermitted &&
    input.channel === "EMAIL" &&
    input.hasReviewedConfirmation !== false;

  return {
    passed,
    isMessageApproved,
    hasValidDestination,
    isContactSuppressed,
    isCompanySuppressed,
    isDuplicateOutreach,
    isRateLimitPermitted,
    isKillSwitchActive,
    isDryRun,
    destination,
    channel: input.channel,
    failedChecks,
    reason: failedChecks.length > 0 ? failedChecks.join(" | ") : undefined,
  };
}
