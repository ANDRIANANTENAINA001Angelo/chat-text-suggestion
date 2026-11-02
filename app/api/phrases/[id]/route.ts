import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { phrases } from "@/lib/db/schema";

const patchSchema = z.object({
  text: z.string().min(1).optional(),
  contextId: z.string().uuid().nullable().optional(),
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
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const values: Partial<typeof phrases.$inferInsert> = {};
    if (parsed.data.text !== undefined) values.text = parsed.data.text.trim();
    if (parsed.data.contextId !== undefined)
      values.contextId = parsed.data.contextId;

    const [row] = await db
      .update(phrases)
      .set(values)
      .where(eq(phrases.id, id))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }
    return NextResponse.json({ phrase: row });
  } catch (err) {
    console.error("phrases PATCH failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update phrase" },
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
    await db.delete(phrases).where(eq(phrases.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("phrases DELETE failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete phrase" },
      { status: 500 }
    );
  }
}
