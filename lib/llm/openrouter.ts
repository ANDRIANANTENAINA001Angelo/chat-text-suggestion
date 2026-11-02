import type { LlmProvider } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider implements LlmProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey ?? process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }
    this.apiKey = key;
    this.model = model ?? process.env.OPENROUTER_MODEL ?? "openrouter/auto";
  }

  async complete(params: {
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string> {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        // Optional but recommended by OpenRouter for routing/analytics.
        "X-Title": "chat-text-suggestion",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.prompt },
        ],
        max_tokens: params.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `OpenRouter request failed (${res.status}): ${body.slice(0, 500)}`
      );
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("OpenRouter response missing message content");
    }
    return content;
  }
}
