import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contexts, phrases } from "@/lib/db/schema";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: contexts.id,
        name: contexts.name,
        phraseCount: sql<number>`count(${phrases.id})`,
      })
      .from(contexts)
      .leftJoin(phrases, sql`${phrases.contextId} = ${contexts.id}`)
      .groupBy(contexts.id, contexts.name)
      .orderBy(contexts.name);

    return NextResponse.json({ contexts: rows });
  } catch (err) {
    console.error("contexts GET failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list contexts" },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  name: z.string().min(1, "name is required"),
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
      .insert(contexts)
      .values({ name: parsed.data.name.trim().toLowerCase() })
      .onConflictDoNothing()
      .returning();

    if (!row) {
      return NextResponse.json(
        { error: "Ce contexte existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json({ context: row }, { status: 201 });
  } catch (err) {
    console.error("contexts POST failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create context" },
      { status: 500 }
    );
  }
}
