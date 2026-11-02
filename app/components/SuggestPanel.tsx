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

  async function handleSuggest() {
    setLoading(true);
    setError(null);
    setResult(null);
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
    } finally {
      setMarking(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Demander une suggestion</h2>
      <label className="text-sm font-medium" htmlFor="context">
        Contexte de la discussion
      </label>
      <input
        id="context"
        className="rounded-lg border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        placeholder="ex: relance, rapprochement sur ses hobbies..."
        value={context}
        onChange={(e) => setContext(e.target.value)}
        disabled={loading}
      />
      <label className="text-sm font-medium" htmlFor="recently-used">
        Phrases déjà envoyées récemment (optionnel, une par ligne)
      </label>
      <textarea
        id="recently-used"
        className="min-h-[80px] rounded-lg border border-zinc-300 bg-transparent p-2 font-mono text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        value={recentlyUsedRaw}
        onChange={(e) => setRecentlyUsedRaw(e.target.value)}
        disabled={loading}
      />
      <button
        className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
        onClick={handleSuggest}
        disabled={loading || context.trim().length === 0}
      >
        {loading ? "Génération..." : "Suggérer une phrase"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="flex flex-col gap-2 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="text-base">{result.suggestion}</p>
          <p className="text-xs text-zinc-500">
            {result.reused ? "Réutilisée depuis la banque" : "Générée"} ·
            contexte: {result.matchedContext ?? "nouveau"} ·{" "}
            {result.candidatesConsidered} candidate(s) considérée(s)
          </p>
          <button
            className="self-start rounded-full border border-zinc-400 px-4 py-1.5 text-xs font-medium disabled:opacity-50"
            onClick={handleUseSuggestion}
            disabled={marking}
          >
            {marking ? "..." : "Copier et marquer comme utilisée"}
          </button>
        </div>
      )}
    </section>
  );
}
