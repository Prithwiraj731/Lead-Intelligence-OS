import crypto from "crypto";
import { prisma } from "@leadintel/database";
import { DeliveryPayload, DeliveryResult, OutreachChannel } from "@leadintel/types";
import { evaluateDeliverySafety } from "./safety-gate";
import { getDeliveryProvider } from "./providers";

export interface ExecuteDeliveryOptions {
  messageId: string;
  channel?: OutreachChannel;
  destinationOverride?: string;
  forceDryRun?: boolean;
  hasReviewedConfirmation?: boolean;
}

export function generateDeliveryIdempotencyKey(
  messageId: string,
  recipient: string,
  channel: string
): string {
  return crypto
    .createHash("sha256")
    .update(`${messageId}:${recipient.toLowerCase().trim()}:${channel}`)
    .digest("hex");
}

export async function executeMessageDelivery(
  options: ExecuteDeliveryOptions
): Promise<DeliveryResult> {
  const message = await prisma.message.findUnique({
    where: { id: options.messageId },
    include: {
      company: true,
      contact: true,
    },
  });

  if (!message) {
    throw new Error(`Message ${options.messageId} not found.`);
  }

  const channel: OutreachChannel = (options.channel || message.channel || "EMAIL") as OutreachChannel;
  const isEmail = channel === "EMAIL";

  // Resolve recipient destination
  const rawRecipient =
    options.destinationOverride ||
    (isEmail ? message.contact?.email : message.contact?.phone || message.company.phone) ||
    "";
  const recipient = rawRecipient.trim();

  // 1. Compute Idempotency Key
  const idempotencyKey = generateDeliveryIdempotencyKey(message.id, recipient, channel);

  // 2. Check Existing Delivery Record (Idempotency Guard)
  const existingDelivery = await prisma.delivery.findUnique({
    where: { idempotencyKey },
  });

  if (existingDelivery) {
    return {
      success: existingDelivery.status === "SENT" || existingDelivery.status === "DRY_RUN",
      deliveryId: existingDelivery.id,
      idempotencyKey: existingDelivery.idempotencyKey,
      status: existingDelivery.status as any,
      provider: existingDelivery.provider,
      providerMessageId: existingDelivery.providerMessageId || undefined,
      isDryRun: existingDelivery.isDryRun,
      safetyCheck: (existingDelivery.safetyCheckReport as any) || {
        passed: true,
        destination: existingDelivery.recipient,
        channel,
        failedChecks: [],
      },
      timestamp: existingDelivery.updatedAt.toISOString(),
    };
  }

  // 3. Execute Delivery Safety Gate
  const safetyReport = await evaluateDeliverySafety({
    messageId: message.id,
    companyId: message.companyId,
    contactId: message.contactId,
    channel,
    destinationOverride: recipient,
    hasReviewedConfirmation: options.hasReviewedConfirmation,
  });

  // 4. Handle Safety Gate Failure (Blocked Delivery)
  if (!safetyReport.passed) {
    // Record audit and event for blocked delivery
    await prisma.$transaction(async (tx) => {
      await tx.messageEvent.create({
        data: {
          messageId: message.id,
          eventType: "DELIVERY_BLOCKED",
          metadata: {
            failedChecks: safetyReport.failedChecks,
            reason: safetyReport.reason,
            destination: recipient,
            channel,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: message.companyId,
          action: "DELIVERY_BLOCKED",
          actor: "DELIVERY_SAFETY_GATE",
          details: {
            messageId: message.id,
            failedChecks: safetyReport.failedChecks,
            reason: safetyReport.reason,
            destination: recipient,
            channel,
          },
        },
      });
    });

    return {
      success: false,
      deliveryId: idempotencyKey,
      idempotencyKey,
      status: "FAILED",
      provider: "SAFETY_GATE",
      isDryRun: safetyReport.isDryRun,
      safetyCheck: safetyReport,
      error: safetyReport.reason || "Delivery blocked by safety gate.",
      timestamp: new Date().toISOString(),
    };
  }

  // 5. Prepare Delivery Payload
  const deliveryPayload: DeliveryPayload = {
    messageId: message.id,
    companyId: message.companyId,
    contactId: message.contactId,
    recipient,
    channel: channel as any,
    subject: isEmail ? message.emailSubject : null,
    body: (isEmail ? message.emailBody : message.whatsappBody) || "",
    idempotencyKey,
    isDryRun: safetyReport.isDryRun || options.forceDryRun === true,
  };

  // 6. Resolve Provider (Dry-Run by default)
  const provider = getDeliveryProvider(channel as any);

  // 7. Dispatch (Simulated in Dry-Run Mode)
  const result = await provider.send(deliveryPayload, safetyReport);

  // 8. Persist Delivery Record & Audit Event
  await prisma.$transaction(async (tx) => {
    await tx.delivery.create({
      data: {
        messageId: message.id,
        companyId: message.companyId,
        contactId: message.contactId,
        channel,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        idempotencyKey,
        status: result.status,
        recipient,
        subject: deliveryPayload.subject,
        body: deliveryPayload.body,
        safetyCheckReport: safetyReport as any,
        isDryRun: result.isDryRun,
        sentAt: result.isDryRun ? null : new Date(),
        deliveredAt: result.isDryRun ? null : new Date(),
      },
    });

    const eventType = result.isDryRun ? "DELIVERY_DRY_RUN" : "DELIVERY_SENT";
    const auditAction = result.isDryRun ? "DELIVERY_DRY_RUN" : "DELIVERY_SENT";

    await tx.messageEvent.create({
      data: {
        messageId: message.id,
        eventType,
        metadata: {
          deliveryId: result.deliveryId,
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          recipient,
          channel,
          isDryRun: result.isDryRun,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        companyId: message.companyId,
        action: auditAction as any,
        actor: "DELIVERY_DISPATCHER",
        details: {
          messageId: message.id,
          deliveryId: result.deliveryId,
          recipient,
          channel,
          isDryRun: result.isDryRun,
        },
      },
    });
  });

  return result;
}
