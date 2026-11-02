import { NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rules } from "@/lib/db/schema";

export async function GET() {
  try {
    const rows = await db.select().from(rules).orderBy(desc(rules.createdAt));
    return NextResponse.json({ rules: rows });
  } catch (err) {
    console.error("rules GET failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list rules" },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  text: z.string().min(1, "text is required"),
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
      .insert(rules)
      .values({ text: parsed.data.text.trim() })
      .returning();
    return NextResponse.json({ rule: row }, { status: 201 });
  } catch (err) {
    console.error("rules POST failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create rule" },
      { status: 500 }
    );
  }
}
