import {
  OpportunityAnalysis,
  GeneratedMessagePayload,
  ReplyClassification,
} from "@leadintel/types";
import { CompanyAnalysisPromptInput } from "../prompts/opportunity";
import { OutreachPromptInput } from "../prompts/outreach";

export interface AiProvider {
  name: string;
  analyzeCompanyOpportunity(
    input: CompanyAnalysisPromptInput
  ): Promise<OpportunityAnalysis>;
  generatePersonalizedOutreach(
    input: OutreachPromptInput
  ): Promise<GeneratedMessagePayload>;
  classifyReply(
    rawText: string
  ): Promise<{ classification: ReplyClassification; sentiment: string; reasoning: string }>;
}
