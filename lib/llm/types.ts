export interface LlmProvider {
  /** Sends a prompt and returns raw text output. */
  complete(params: {
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string>;
}

export interface InferredContextPhrase {
  text: string;
  context: string;
}
