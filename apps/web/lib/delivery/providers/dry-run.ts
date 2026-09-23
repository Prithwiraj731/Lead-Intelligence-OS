import { DeliveryPayload, DeliveryResult, DeliverySafetyCheckReport } from "@leadintel/types";
import { DeliveryProvider, DeliveryStatusResult } from "./base";

export class DryRunEmailProvider implements DeliveryProvider {
  public name = "Dry-Run / Simulated Email Engine";
  public channel: "EMAIL" = "EMAIL";
  public isDryRun = true;

  public async validateConfiguration(): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  public async send(payload: DeliveryPayload, safetyCheck?: DeliverySafetyCheckReport): Promise<DeliveryResult> {
    const mockProviderMessageId = `dryrun-em-${payload.messageId.slice(0, 8)}-${Date.now()}`;

    return {
      success: true,
      deliveryId: payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
      status: "DRY_RUN",
      provider: "DRY_RUN_EMAIL",
      providerMessageId: mockProviderMessageId,
      isDryRun: true,
      safetyCheck: safetyCheck || {
        passed: true,
        isMessageApproved: true,
        hasValidDestination: true,
        isContactSuppressed: false,
        isCompanySuppressed: false,
        isDuplicateOutreach: false,
        isRateLimitPermitted: true,
        isKillSwitchActive: false,
        isDryRun: true,
        destination: payload.recipient,
        channel: "EMAIL",
        failedChecks: [],
      },
      timestamp: new Date().toISOString(),
    };
  }

  public async getDeliveryStatus(providerMessageId: string): Promise<DeliveryStatusResult> {
    return {
      status: "DRY_RUN",
      providerMessageId,
      deliveredAt: new Date(),
    };
  }
}

export class DryRunWhatsAppProvider implements DeliveryProvider {
  public name = "Dry-Run / Simulated WhatsApp Engine";
  public channel: "WHATSAPP" = "WHATSAPP";
  public isDryRun = true;

  public async validateConfiguration(): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  public async send(payload: DeliveryPayload, safetyCheck?: DeliverySafetyCheckReport): Promise<DeliveryResult> {
    const mockProviderMessageId = `dryrun-wa-${payload.messageId.slice(0, 8)}-${Date.now()}`;

    return {
      success: true,
      deliveryId: payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
      status: "DRY_RUN",
      provider: "DRY_RUN_WHATSAPP",
      providerMessageId: mockProviderMessageId,
      isDryRun: true,
      safetyCheck: safetyCheck || {
        passed: true,
        isMessageApproved: true,
        hasValidDestination: true,
        isContactSuppressed: false,
        isCompanySuppressed: false,
        isDuplicateOutreach: false,
        isRateLimitPermitted: true,
        isKillSwitchActive: false,
        isDryRun: true,
        destination: payload.recipient,
        channel: "WHATSAPP",
        failedChecks: [],
      },
      timestamp: new Date().toISOString(),
    };
  }

  public async getDeliveryStatus(providerMessageId: string): Promise<DeliveryStatusResult> {
    return {
      status: "DRY_RUN",
      providerMessageId,
      deliveredAt: new Date(),
    };
  }
}
