import {
  OpportunityAnalysis,
  GeneratedMessagePayload,
  ReplyClassification,
} from "@leadintel/types";
import { AiProvider } from "./base";
import { CompanyAnalysisPromptInput, buildOpportunityAnalysisPrompt } from "../prompts/opportunity";
import { OutreachPromptInput, buildOutreachPrompt } from "../prompts/outreach";
import { RuleEngineAiProvider } from "./rule-engine";

export class GeminiProvider implements AiProvider {
  public name = "Google Gemini Provider";
  private apiKey: string;
  private model: string;
  private fallback: RuleEngineAiProvider;

  constructor(apiKey?: string, model = "gemini-2.0-flash") {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text);
      return {
        companyId: "00000000-0000-0000-0000-000000000000",
        ...parsed,
      };
    } catch (err) {
      console.warn("Gemini API call failed, falling back to rule engine:", err);
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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(text);
    } catch (err) {
      console.warn("Gemini API call failed, falling back to rule engine:", err);
      return this.fallback.generatePersonalizedOutreach(input);
    }
  }

  public async classifyReply(
    rawText: string
  ): Promise<{ classification: ReplyClassification; sentiment: string; reasoning: string }> {
    return this.fallback.classifyReply(rawText);
  }
}
