import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rules } from "@/lib/db/schema";

const patchSchema = z.object({
  text: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    );
  }

  try {
    const [row] = await db
      .update(rules)
      .set(parsed.data)
      .where(eq(rules.id, id))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    return NextResponse.json({ rule: row });
  } catch (err) {
    console.error("rules PATCH failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.delete(rules).where(eq(rules.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("rules DELETE failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete rule" },
      { status: 500 }
    );
  }
}
