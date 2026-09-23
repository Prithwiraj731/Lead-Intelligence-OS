import { DeliveryPayload, DeliveryResult, DeliveryStatus } from "@leadintel/types";

export interface DeliveryStatusResult {
  status: DeliveryStatus;
  providerMessageId: string;
  deliveredAt?: Date;
  bouncedAt?: Date;
  failureReason?: string;
  rawEvent?: any;
}

export interface DeliveryProvider {
  name: string;
  channel: "EMAIL" | "WHATSAPP";
  isDryRun: boolean;
  validateConfiguration(): Promise<{ isValid: boolean; error?: string }>;
  send(payload: DeliveryPayload, safetyCheck?: any): Promise<DeliveryResult>;
  getDeliveryStatus(providerMessageId: string): Promise<DeliveryStatusResult>;
}
