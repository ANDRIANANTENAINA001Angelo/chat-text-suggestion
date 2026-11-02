import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql, and, ilike } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contexts, phrases } from "@/lib/db/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? "20") || 20)
  );
  const contextId = url.searchParams.get("contextId");
  const q = url.searchParams.get("q")?.trim();

  const conditions = [
    contextId ? eq(phrases.contextId, contextId) : undefined,
    q ? ilike(phrases.text, `%${q}%`) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(phrases)
      .where(where);

    const rows = await db
      .select({
        id: phrases.id,
        text: phrases.text,
        contextId: phrases.contextId,
        contextName: contexts.name,
        source: phrases.source,
        usageCount: phrases.usageCount,
        lastUsedAt: phrases.lastUsedAt,
        createdAt: phrases.createdAt,
      })
      .from(phrases)
      .leftJoin(contexts, eq(phrases.contextId, contexts.id))
      .where(where)
      .orderBy(sql`${phrases.createdAt} desc`)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      items: rows,
      total: Number(count),
      page,
      pageSize,
    });
  } catch (err) {
    console.error("phrases GET failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list phrases" },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  text: z.string().min(1, "text is required"),
  contextId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const [row] = await db
      .insert(phrases)
      .values({
        text: parsed.data.text.trim(),
        contextId: parsed.data.contextId ?? null,
        source: "manual",
      })
      .returning();
    return NextResponse.json({ phrase: row }, { status: 201 });
  } catch (err) {
    console.error("phrases POST failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create phrase" },
      { status: 500 }
    );
  }
}
