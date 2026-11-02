import type { LlmProvider } from "./types";
import { OpenRouterProvider } from "./openrouter";
import { ClaudeProvider } from "./claude";

let cached: LlmProvider | undefined;

/** Picks the LLM backend from LLM_PROVIDER ("openrouter" | "claude"). Defaults to openrouter. */
export function getLlmProvider(): LlmProvider {
  if (cached) return cached;

  const provider = process.env.LLM_PROVIDER ?? "openrouter";
  if (provider === "claude") {
    cached = new ClaudeProvider();
  } else if (provider === "openrouter") {
    cached = new OpenRouterProvider();
  } else {
    throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
  }
  return cached;
}

export type { LlmProvider, InferredContextPhrase } from "./types";
