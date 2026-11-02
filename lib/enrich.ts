import { db } from "./db/client";
import { contexts, phrases } from "./db/schema";
import { getLlmProvider } from "./llm";
import { buildEnrichPrompt, parseJsonResponse } from "./llm/prompts";
import type { InferredContextPhrase } from "./llm/types";
import { eq } from "drizzle-orm";

/** Splits pasted text into non-empty phrase lines, trimming bullets/numbering. */
export function splitPastedPhrases(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((l) => l.length > 0);
}

async function getOrCreateContext(name: string): Promise<string> {
  const existing = await db
    .select()
    .from(contexts)
    .where(eq(contexts.name, name))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const inserted = await db
    .insert(contexts)
    .values({ name })
    .onConflictDoNothing()
    .returning();

  if (inserted.length > 0) return inserted[0].id;

  // Race: another request created it between select and insert.
  const retry = await db
    .select()
    .from(contexts)
    .where(eq(contexts.name, name))
    .limit(1);
  return retry[0].id;
}

export async function enrichAndStorePhrases(rawText: string): Promise<{
  imported: number;
  contexts: string[];
}> {
  const lines = splitPastedPhrases(rawText);
  if (lines.length === 0) {
    return { imported: 0, contexts: [] };
  }

  const llm = getLlmProvider();
  const { system, prompt } = buildEnrichPrompt(lines);
  const raw = await llm.complete({ system, prompt, maxTokens: 4096 });
  const tagged = parseJsonResponse<InferredContextPhrase[]>(raw);

  const contextNames = Array.from(
    new Set(tagged.map((t) => t.context.trim().toLowerCase()).filter(Boolean))
  );
  const contextIdByName = new Map<string, string>();
  for (const name of contextNames) {
    contextIdByName.set(name, await getOrCreateContext(name));
  }

  const rows = tagged
    .filter((t) => t.text && t.text.trim().length > 0)
    .map((t) => ({
      text: t.text.trim(),
      contextId: contextIdByName.get(t.context.trim().toLowerCase()) ?? null,
      source: "import" as const,
    }));

  if (rows.length > 0) {
    await db.insert(phrases).values(rows);
  }

  return { imported: rows.length, contexts: contextNames };
}
