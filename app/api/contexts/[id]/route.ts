import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contexts } from "@/lib/db/schema";

const patchSchema = z.object({
  name: z.string().min(1, "name is required"),
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

  try {
    const [row] = await db
      .update(contexts)
      .set({ name: parsed.data.name.trim().toLowerCase() })
      .where(eq(contexts.id, id))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Context not found" }, { status: 404 });
    }
    return NextResponse.json({ context: row });
  } catch (err) {
    console.error("contexts PATCH failed", err);
    if (err instanceof Error && /unique/i.test(err.message)) {
      return NextResponse.json(
        { error: "Ce nom de contexte existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update context" },
      { status: 500 }
    );
  }
}
