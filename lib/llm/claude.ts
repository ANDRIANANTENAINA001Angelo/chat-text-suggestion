import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider } from "./types";

// Switch LLM_PROVIDER=claude once an ANTHROPIC_API_KEY is available.
// See https://docs.claude.com for model details.
const DEFAULT_MODEL = "claude-sonnet-5-5";

export class ClaudeProvider implements LlmProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.model = model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  }

  async complete(params: {
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: params.maxTokens ?? 1024,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude response missing text content");
    }
    return textBlock.text;
  }
}
