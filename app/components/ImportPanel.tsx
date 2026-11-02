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
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Enrichir la base</h2>
      <p className="text-sm text-zinc-500">
        Colle une liste de phrases (une par ligne). Le contexte de chacune
        sera déduit automatiquement.
      </p>
      <textarea
        className="min-h-[160px] rounded-lg border border-zinc-300 bg-transparent p-3 font-mono text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        placeholder={"Salut, ça va ?\nTu fais quoi de beau ce soir ?\n..."}
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        disabled={loading}
      />
      <button
        className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
        onClick={handleImport}
        disabled={loading || rawText.trim().length === 0}
      >
        {loading ? "Analyse en cours..." : "Enrichir"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-emerald-600">
          {result.imported} phrase(s) importée(s) — contextes:{" "}
          {result.contexts.join(", ") || "aucun"}
        </p>
      )}
    </section>
  );
}
