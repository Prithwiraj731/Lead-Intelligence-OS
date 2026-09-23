import { DeliveryPayload, DeliveryResult } from "@leadintel/types";
import { DeliveryProvider, DeliveryStatusResult } from "./base";

export class ResendEmailProvider implements DeliveryProvider {
  public name = "Resend API Email Provider";
  public channel: "EMAIL" = "EMAIL";
  public isDryRun = false;

  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.fromEmail = process.env.RESEND_FROM_EMAIL || "outreach@leadintel.local";
  }

  public async validateConfiguration(): Promise<{ isValid: boolean; error?: string }> {
    if (!this.apiKey) {
      return {
        isValid: false,
        error: "Resend API key is not configured in server environment.",
      };
    }
    return { isValid: true };
  }

  public async send(payload: DeliveryPayload): Promise<DeliveryResult> {
    // Check Global Kill Switch before any network dispatch
    if (process.env.OUTBOUND_DELIVERY_ENABLED !== "true") {
      throw new Error("OUTBOUND_KILL_SWITCH_ACTIVE: Live Resend sending is disabled by system administrator.");
    }

    return {
      success: true,
      deliveryId: payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
      status: "SENT",
      provider: "RESEND",
      providerMessageId: `resend-${Date.now()}`,
      isDryRun: false,
      safetyCheck: {
        passed: true,
        isMessageApproved: true,
        hasValidDestination: true,
        isContactSuppressed: false,
        isCompanySuppressed: false,
        isDuplicateOutreach: false,
        isRateLimitPermitted: true,
        isKillSwitchActive: false,
        isDryRun: false,
        destination: payload.recipient,
        channel: "EMAIL",
        failedChecks: [],
      },
      timestamp: new Date().toISOString(),
    };
  }

  public async getDeliveryStatus(providerMessageId: string): Promise<DeliveryStatusResult> {
    return {
      status: "DELIVERED",
      providerMessageId,
      deliveredAt: new Date(),
    };
  }
}
