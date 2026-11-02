import { NextResponse } from "next/server";
import { z } from "zod";
import { enrichAndStorePhrases } from "@/lib/enrich";

const bodySchema = z.object({
  rawText: z.string().min(1, "rawText is required"),
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
    const result = await enrichAndStorePhrases(parsed.data.rawText);
    return NextResponse.json(result);
  } catch (err) {
    console.error("phrases/import failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
