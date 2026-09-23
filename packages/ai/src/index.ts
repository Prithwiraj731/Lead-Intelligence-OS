import { AiProvider } from "./providers/base";
import { RuleEngineAiProvider } from "./providers/rule-engine";
import { OpenAiProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";

export * from "./providers/base";
export * from "./providers/rule-engine";
export * from "./providers/openai";
export * from "./providers/gemini";
export * from "./prompts/opportunity";
export * from "./prompts/outreach";
export * from "./evaluation/quality-scorer";

export function getAiProvider(providerType?: string): AiProvider {
  const provider = (providerType || process.env.AI_PROVIDER || "rule-engine").toLowerCase();

  switch (provider) {
    case "openai":
      return new OpenAiProvider(process.env.OPENAI_API_KEY, process.env.AI_MODEL || "gpt-4o");
    case "gemini":
      return new GeminiProvider(process.env.GEMINI_API_KEY, process.env.AI_MODEL || "gemini-2.0-flash");
    case "rule-engine":
    case "mock":
    default:
      return new RuleEngineAiProvider();
  }
}
