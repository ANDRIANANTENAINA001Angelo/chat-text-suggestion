"use client";

import { useState } from "react";

export function ImportPanel() {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    { imported: number; contexts: string[] } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/phrases/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur inconnue");
      setResult(data);
      setRawText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Colle une liste de phrases (une par ligne). Le contexte de chacune
        sera déduit automatiquement par l&apos;IA.
      </p>
      <textarea
        className="min-h-[180px] resize-y rounded-lg border border-border bg-surface p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder={"Salut, ça va ?\nTu fais quoi de beau ce soir ?\n..."}
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        disabled={loading}
      />
      <button
        className="self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleImport}
        disabled={loading || rawText.trim().length === 0}
      >
        {loading ? "Analyse en cours..." : "Enrichir"}
      </button>
      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {result && (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          {result.imported} phrase(s) importée(s) — contextes :{" "}
          {result.contexts.join(", ") || "aucun"}
        </p>
      )}
    </div>
  );
}
