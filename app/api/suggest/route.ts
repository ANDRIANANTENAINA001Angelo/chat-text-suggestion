import { NextResponse } from "next/server";
import { z } from "zod";
import { suggestPhrase } from "@/lib/suggest";

const bodySchema = z.object({
  context: z.string().min(1, "context is required"),
  recentlyUsed: z.array(z.string()).optional(),
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
    const result = await suggestPhrase(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("suggest failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Suggestion failed" },
      { status: 500 }
    );
  }
}
