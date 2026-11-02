"use client";

import { useState } from "react";

type SuggestResult = {
  suggestion: string;
  reused: boolean;
  matchedContext: string | null;
  candidatesConsidered: number;
};

export function SuggestPanel() {
  const [context, setContext] = useState("");
  const [recentlyUsedRaw, setRecentlyUsedRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSuggest() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const recentlyUsed = recentlyUsedRaw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, recentlyUsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur inconnue");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handleUseSuggestion() {
    if (!result) return;
    setMarking(true);
    try {
      await fetch("/api/phrases/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.suggestion,
          contextName: result.matchedContext ?? context,
        }),
      });
      await navigator.clipboard?.writeText(result.suggestion).catch(() => {});
      setCopied(true);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="context">
          Contexte de la discussion
        </label>
        <input
          id="context"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-offset-1 transition-shadow focus:ring-2 focus:ring-ring"
          placeholder="ex: relance, rapprochement sur ses hobbies..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="recently-used">
          Phrases déjà envoyées récemment{" "}
          <span className="text-muted-foreground">(optionnel, une par ligne)</span>
        </label>
        <textarea
          id="recently-used"
          className="min-h-[80px] resize-y rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          value={recentlyUsedRaw}
          onChange={(e) => setRecentlyUsedRaw(e.target.value)}
          disabled={loading}
        />
      </div>

      <button
        className="self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleSuggest}
        disabled={loading || context.trim().length === 0}
      >
        {loading ? "Génération..." : "Suggérer une phrase"}
      </button>

      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-base leading-relaxed">{result.suggestion}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${
                result.reused
                  ? "bg-accent/15 text-accent"
                  : "bg-primary/15 text-primary"
              }`}
            >
              {result.reused ? "Réutilisée" : "Générée"}
            </span>
            <span>contexte : {result.matchedContext ?? "nouveau"}</span>
            <span>·</span>
            <span>{result.candidatesConsidered} candidate(s) considérée(s)</span>
          </div>
          <button
            className="self-start rounded-lg border border-border px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-surface disabled:opacity-50"
            onClick={handleUseSuggestion}
            disabled={marking}
          >
            {marking ? "..." : copied ? "Copiée ✓" : "Copier et marquer comme utilisée"}
          </button>
        </div>
      )}
    </div>
  );
}
