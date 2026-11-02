import { sql, eq, and, isNotNull, desc, asc } from "drizzle-orm";
import { db } from "./db/client";
import { contexts, phrases } from "./db/schema";
import { getLlmProvider } from "./llm";
import { buildSuggestPrompt, parseJsonResponse } from "./llm/prompts";

const CANDIDATE_LIMIT = 15;
const RECENT_EXCLUDE_LIMIT = 10;
const RECENT_EXCLUDE_DAYS = 2;
const CONTEXT_MATCH_THRESHOLD = 0.3;

async function findClosestContext(
  input: string
): Promise<{ id: string; name: string } | null> {
  const rows = await db
    .select({
      id: contexts.id,
      name: contexts.name,
      score: sql<number>`similarity(${contexts.name}, ${input})`,
    })
    .from(contexts)
    .orderBy(sql`similarity(${contexts.name}, ${input}) desc`)
    .limit(1);

  const top = rows[0];
  if (!top || top.score < CONTEXT_MATCH_THRESHOLD) return null;
  return { id: top.id, name: top.name };
}

export async function suggestPhrase(params: {
  context: string;
  recentlyUsed?: string[];
}): Promise<{
  suggestion: string;
  reused: boolean;
  matchedContext: string | null;
  candidatesConsidered: number;
}> {
  const contextInput = params.context.trim();
  const matched = await findClosestContext(contextInput);

  let candidates: string[] = [];
  let autoExcluded: string[] = [];

  if (matched) {
    const candidateRows = await db
      .select({ text: phrases.text })
      .from(phrases)
      .where(eq(phrases.contextId, matched.id))
      .orderBy(asc(phrases.usageCount), asc(phrases.lastUsedAt))
      .limit(CANDIDATE_LIMIT);
    candidates = candidateRows.map((r) => r.text);

    const cutoff = new Date(Date.now() - RECENT_EXCLUDE_DAYS * 86_400_000);
    const recentRows = await db
      .select({ text: phrases.text })
      .from(phrases)
      .where(
        and(
          eq(phrases.contextId, matched.id),
          isNotNull(phrases.lastUsedAt),
          sql`${phrases.lastUsedAt} > ${cutoff}`
        )
      )
      .orderBy(desc(phrases.lastUsedAt))
      .limit(RECENT_EXCLUDE_LIMIT);
    autoExcluded = recentRows.map((r) => r.text);
  }

  const excluded = Array.from(
    new Set([...(params.recentlyUsed ?? []), ...autoExcluded])
  );

  const llm = getLlmProvider();
  const { system, prompt } = buildSuggestPrompt({
    context: contextInput,
    candidates,
    excluded,
  });
  const raw = await llm.complete({ system, prompt, maxTokens: 512 });
  const result = parseJsonResponse<{ suggestion: string; reused: boolean }>(
    raw
  );

  return {
    suggestion: result.suggestion,
    reused: Boolean(result.reused),
    matchedContext: matched?.name ?? null,
    candidatesConsidered: candidates.length,
  };
}

export async function markPhraseUsed(params: {
  text: string;
  contextName: string | null;
}): Promise<void> {
  const text = params.text.trim();

  const existing = await db
    .select({ id: phrases.id })
    .from(phrases)
    .where(eq(phrases.text, text))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(phrases)
      .set({
        usageCount: sql`${phrases.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(phrases.id, existing[0].id));
    return;
  }

  let contextId: string | null = null;
  if (params.contextName) {
    const name = params.contextName.trim().toLowerCase();
    const existingContext = await db
      .select({ id: contexts.id })
      .from(contexts)
      .where(eq(contexts.name, name))
      .limit(1);
    if (existingContext.length > 0) {
      contextId = existingContext[0].id;
    } else {
      const inserted = await db
        .insert(contexts)
        .values({ name })
        .onConflictDoNothing()
        .returning({ id: contexts.id });
      contextId = inserted[0]?.id ?? null;
    }
  }

  await db.insert(phrases).values({
    text,
    contextId,
    source: "generated",
    usageCount: 1,
    lastUsedAt: new Date(),
  });
}
