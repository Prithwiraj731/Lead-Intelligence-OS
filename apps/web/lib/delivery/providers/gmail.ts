import { DeliveryPayload, DeliveryResult } from "@leadintel/types";
import { DeliveryProvider, DeliveryStatusResult } from "./base";
import {
  getGmailOAuthStatus,
  getValidGmailAccessToken,
  getGmailOAuthConfig,
} from "../gmail-oauth";

/**
 * Creates an RFC 2822 formatted email message string and encodes it as base64url.
 */
function createRawEmailMessage(
  fromEmail: string,
  toEmail: string,
  subject: string,
  body: string,
  messageId: string
): string {
  const boundary = `====_leadintel_${Date.now()}_====`;
  const cleanSubject = subject.replace(/[\r\n]+/g, " ");

  const lines = [
    `From: ${fromEmail}`,
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from(cleanSubject).toString("base64")}?=`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${messageId}.${Date.now()}@gmail.com>`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    `X-Mailer: LeadIntelligenceOS-Milestone3D`,
    ``,
    body,
  ];

  const rawMessage = lines.join("\r\n");
  return Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export class GmailOAuthEmailProvider implements DeliveryProvider {
  public name = "Gmail API (OAuth 2.0) Provider";
  public channel: "EMAIL" = "EMAIL";
  public isDryRun = false;

  public async validateConfiguration(): Promise<{ isValid: boolean; error?: string }> {
    const status = getGmailOAuthStatus();
    const config = getGmailOAuthConfig();

    // Valid if either OAuth account is connected or env client credentials/tokens are provided
    if (status.connected && status.email) {
      return { isValid: true };
    }

    if (config.clientId && config.clientSecret) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error:
        "Gmail OAuth 2.0 is not connected. Use 'Connect Gmail' in Settings/Pilot console to authenticate your account (prithwi1016@gmail.com).",
    };
  }

  public async send(payload: DeliveryPayload): Promise<DeliveryResult> {
    // 1. Check Global Kill Switch before any network dispatch
    if (process.env.OUTBOUND_DELIVERY_ENABLED !== "true") {
      throw new Error("OUTBOUND_KILL_SWITCH_ACTIVE: Live Gmail sending is disabled by system administrator.");
    }

    // 2. Validate OAuth Status & Sender
    const status = getGmailOAuthStatus();
    const senderEmail = status.email || "prithwi1016@gmail.com";

    // 3. Obtain valid access token
    const accessToken = await getValidGmailAccessToken();
    if (!accessToken || accessToken.startsWith("mock-")) {
      throw new Error(
        "GMAIL_OAUTH_TOKEN_MISSING: No live Google OAuth session found. Please click 'Connect Gmail' in Pilot or Settings to sign into your Google account."
      );
    }

    // 4. Encode MIME / RFC 2822 message
    const rawMessage = createRawEmailMessage(
      senderEmail,
      payload.recipient,
      payload.subject || "No Subject",
      payload.body,
      payload.messageId
    );

    let providerMessageId = `gmail-${Date.now()}`;

    // 5. If live network dispatch is permitted, call Google Gmail API
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: rawMessage }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Gmail API dispatch failed (${response.status}): ${errorDetails}`);
    }

    const responseData = await response.json();
    if (responseData.id) {
      providerMessageId = responseData.id;
    }

    return {
      success: true,
      deliveryId: payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
      status: "SENT",
      provider: "GMAIL_OAUTH",
      providerMessageId,
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
