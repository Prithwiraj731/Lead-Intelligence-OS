import {
  OpportunityAnalysis,
  GeneratedMessagePayload,
  ReplyClassification,
} from "@leadintel/types";
import { AiProvider } from "./base";
import { CompanyAnalysisPromptInput, buildOpportunityAnalysisPrompt } from "../prompts/opportunity";
import { OutreachPromptInput, buildOutreachPrompt } from "../prompts/outreach";
import { RuleEngineAiProvider } from "./rule-engine";

export class OpenAiProvider implements AiProvider {
  public name = "OpenAI Provider";
  private apiKey: string;
  private model: string;
  private fallback: RuleEngineAiProvider;

  constructor(apiKey?: string, model = "gpt-4o") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model;
    this.fallback = new RuleEngineAiProvider();
  }

  public async analyzeCompanyOpportunity(
    input: CompanyAnalysisPromptInput
  ): Promise<OpportunityAnalysis> {
    if (!this.apiKey) {
      return this.fallback.analyzeCompanyOpportunity(input);
    }

    try {
      const prompt = buildOpportunityAnalysisPrompt(input);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are an elite B2B tech opportunity and research analyst. Output purely valid JSON.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.statusText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      return {
        companyId: "00000000-0000-0000-0000-000000000000",
        ...parsed,
      };
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to rule engine:", err);
      return this.fallback.analyzeCompanyOpportunity(input);
    }
  }

  public async generatePersonalizedOutreach(
    input: OutreachPromptInput
  ): Promise<GeneratedMessagePayload> {
    if (!this.apiKey) {
      return this.fallback.generatePersonalizedOutreach(input);
    }

    try {
      const prompt = buildOutreachPrompt(input);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are a master B2B outreach copywriter who avoids all corporate jargon and AI cliches. Output purely valid JSON.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.statusText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      return JSON.parse(content);
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to rule engine:", err);
      return this.fallback.generatePersonalizedOutreach(input);
    }
  }

  public async classifyReply(
    rawText: string
  ): Promise<{ classification: ReplyClassification; sentiment: string; reasoning: string }> {
    return this.fallback.classifyReply(rawText);
  }
}
