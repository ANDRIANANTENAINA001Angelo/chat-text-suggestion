import { NextResponse } from "next/server";
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
