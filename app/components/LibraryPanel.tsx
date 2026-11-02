"use client";

import { useEffect, useState, useCallback } from "react";

type ContextRow = { id: string; name: string; phraseCount: number };
type PhraseRow = {
  id: string;
  text: string;
  contextId: string | null;
  contextName: string | null;
  usageCount: number;
  lastUsedAt: string | null;
};

const PAGE_SIZE = 10;
const NEW_CONTEXT_VALUE = "__new__";

export function LibraryPanel() {
  const [contexts, setContexts] = useState<ContextRow[]>([]);
  const [phrases, setPhrases] = useState<PhraseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [contextFilter, setContextFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingCell, setEditingCell] = useState<
    { id: string; field: "text" | "context" } | null
  >(null);
  const [editingValue, setEditingValue] = useState("");

  const [newPhraseText, setNewPhraseText] = useState("");
  const [newPhraseContext, setNewPhraseContext] = useState("");
  const [creating, setCreating] = useState(false);

  const loadContexts = useCallback(async () => {
    const res = await fetch("/api/contexts");
    const data = await res.json();
    if (res.ok) setContexts(data.contexts);
  }, []);

  const loadPhrases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (q.trim()) params.set("q", q.trim());
      if (contextFilter) params.set("contextId", contextFilter);

      const res = await fetch(`/api/phrases?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur inconnue");
      setPhrases(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [page, q, contextFilter]);

  useEffect(() => {
    // Initial data fetch on mount, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContexts();
  }, [loadContexts]);

  useEffect(() => {
    // Refetch when page/search/filter changes, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPhrases();
  }, [loadPhrases]);

  async function createContext(name: string): Promise<string | null> {
    const res = await fetch("/api/contexts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Impossible de créer le contexte");
      return null;
    }
    await loadContexts();
    return data.context.id as string;
  }

  function startEdit(row: PhraseRow, field: "text" | "context") {
    setEditingCell({ id: row.id, field });
    setEditingValue(field === "text" ? row.text : row.contextId ?? "");
  }

  async function saveTextEdit(row: PhraseRow) {
    const text = editingValue.trim();
    setEditingCell(null);
    if (!text || text === row.text) return;
    setPhrases((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, text } : p))
    );
    await fetch(`/api/phrases/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }

  async function saveContextEdit(row: PhraseRow, value: string) {
    setEditingCell(null);
    let contextId: string | null = value || null;

    if (value === NEW_CONTEXT_VALUE) {
      const name = window.prompt("Nom du nouveau contexte :");
      if (!name?.trim()) return;
      contextId = await createContext(name.trim());
      if (!contextId) return;
    }

    if (contextId === row.contextId) return;
    const contextName =
      contexts.find((c) => c.id === contextId)?.name ?? null;
    setPhrases((prev) =>
      prev.map((p) =>
        p.id === row.id ? { ...p, contextId, contextName } : p
      )
    );
    await fetch(`/api/phrases/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contextId }),
    });
  }

  async function handleCreatePhrase() {
    if (!newPhraseText.trim()) return;
    setCreating(true);
    try {
      let contextId: string | null = newPhraseContext || null;
      if (newPhraseContext === NEW_CONTEXT_VALUE) {
        const name = window.prompt("Nom du nouveau contexte :");
        if (!name?.trim()) {
          setCreating(false);
          return;
        }
        contextId = await createContext(name.trim());
        if (!contextId) {
          setCreating(false);
          return;
        }
      }

      const res = await fetch("/api/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newPhraseText.trim(), contextId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur inconnue");
      setNewPhraseText("");
      setNewPhraseContext("");
      await loadPhrases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePhrase(id: string) {
    setPhrases((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/phrases/${id}`, { method: "DELETE" });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Double-clique sur une phrase ou un contexte pour le modifier
        directement.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[180px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Rechercher une phrase..."
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <select
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={contextFilter}
          onChange={(e) => {
            setPage(1);
            setContextFilter(e.target.value);
          }}
        >
          <option value="">Tous les contextes</option>
          {contexts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phraseCount})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-border p-3">
        <input
          className="min-w-[180px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Nouvelle phrase..."
          value={newPhraseText}
          onChange={(e) => setNewPhraseText(e.target.value)}
        />
        <select
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={newPhraseContext}
          onChange={(e) => setNewPhraseContext(e.target.value)}
        >
          <option value="">Sans contexte</option>
          {contexts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NEW_CONTEXT_VALUE}>+ Nouveau contexte...</option>
        </select>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          onClick={handleCreatePhrase}
          disabled={creating || !newPhraseText.trim()}
        >
          Ajouter
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Phrase</th>
              <th className="px-3 py-2 font-medium">Contexte</th>
              <th className="px-3 py-2 font-medium">Usages</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : phrases.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Aucune phrase.
                </td>
              </tr>
            ) : (
              phrases.map((row) => (
                <tr key={row.id} className="border-t border-border bg-surface">
                  <td className="px-3 py-2">
                    {editingCell?.id === row.id && editingCell.field === "text" ? (
                      <input
                        autoFocus
                        className="w-full rounded border border-border bg-surface px-2 py-1 outline-none focus:ring-2 focus:ring-ring"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => saveTextEdit(row)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTextEdit(row);
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => startEdit(row, "text")}
                        className="cursor-text"
                        title="Double-clic pour modifier"
                      >
                        {row.text}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editingCell?.id === row.id && editingCell.field === "context" ? (
                      <select
                        autoFocus
                        className="rounded border border-border bg-surface px-2 py-1 outline-none focus:ring-2 focus:ring-ring"
                        defaultValue={row.contextId ?? ""}
                        onChange={(e) => saveContextEdit(row, e.target.value)}
                        onBlur={() => setEditingCell(null)}
                      >
                        <option value="">Sans contexte</option>
                        {contexts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value={NEW_CONTEXT_VALUE}>
                          + Nouveau contexte...
                        </option>
                      </select>
                    ) : (
                      <span
                        onDoubleClick={() => startEdit(row, "context")}
                        className="cursor-text rounded-full bg-surface-muted px-2 py-0.5 text-xs"
                        title="Double-clic pour modifier"
                      >
                        {row.contextName ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.usageCount}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDeletePhrase(row.id)}
                      aria-label="Supprimer"
                      className="rounded p-1 text-muted-foreground transition-colors hover:text-danger"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7h12Z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} phrase(s) — page {page}/{totalPages}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Précédent
          </button>
          <button
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
