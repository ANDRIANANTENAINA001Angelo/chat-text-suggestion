import { NextResponse } from "next/server";
import { z } from "zod";
import { markPhraseUsed } from "@/lib/suggest";

const bodySchema = z.object({
  text: z.string().min(1, "text is required"),
  contextName: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await markPhraseUsed({
      text: parsed.data.text,
      contextName: parsed.data.contextName ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("phrases/use failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mark used" },
      { status: 500 }
    );
  }
}
