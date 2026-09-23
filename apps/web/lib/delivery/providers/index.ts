import { DeliveryProvider } from "./base";
import { DryRunEmailProvider, DryRunWhatsAppProvider } from "./dry-run";
import { SmtpEmailProvider } from "./smtp";
import { ResendEmailProvider } from "./resend";
import { GmailOAuthEmailProvider } from "./gmail";
import { WhatsAppBusinessCloudApiProvider } from "./whatsapp-cloud";

export * from "./base";
export * from "./dry-run";
export * from "./smtp";
export * from "./resend";
export * from "./gmail";
export * from "./whatsapp-cloud";

export function getDeliveryProvider(channel: "EMAIL" | "WHATSAPP", providerName?: string): DeliveryProvider {
  const isOutboundEnabled = process.env.OUTBOUND_DELIVERY_ENABLED === "true";
  const isDryRun = process.env.OUTBOUND_DRY_RUN !== "false" || !isOutboundEnabled;

  // In dry run or if outbound delivery is disabled, always return the DryRun provider
  if (isDryRun) {
    return channel === "EMAIL" ? new DryRunEmailProvider() : new DryRunWhatsAppProvider();
  }

  const requested = (providerName || process.env.EMAIL_PROVIDER || "dry-run").toLowerCase();

  if (channel === "WHATSAPP") {
    // WhatsApp is strictly disabled during the controlled email pilot
    return new DryRunWhatsAppProvider();
  }

  switch (requested) {
    case "gmail":
    case "gmail-oauth":
    case "google":
      return new GmailOAuthEmailProvider();
    case "smtp":
      return new SmtpEmailProvider();
    case "resend":
      return new ResendEmailProvider();
    case "dry-run":
    case "mock":
    default:
      return new DryRunEmailProvider();
  }
}
