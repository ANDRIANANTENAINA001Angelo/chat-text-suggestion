"use client";

import { useEffect, useState } from "react";

type Rule = {
  id: string;
  text: string;
  active: boolean;
  createdAt: string;
};

export function RulesPanel() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur inconnue");
      setRules(data.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial data fetch on mount, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleCreate() {
    if (!newText.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur inconnue");
      setRules((prev) => [data.rule, ...prev]);
      setNewText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(rule: Rule) {
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r))
    );
    await fetch(`/api/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    });
  }

  function startEdit(rule: Rule) {
    setEditingId(rule.id);
    setEditingText(rule.text);
  }

  async function saveEdit(id: string) {
    const text = editingText.trim();
    if (!text) {
      setEditingId(null);
      return;
    }
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, text } : r)));
    setEditingId(null);
    await fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }

  async function handleDelete(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Règles appliquées à chaque suggestion générée (ex: &quot;pas
        d&apos;émoji&quot;, &quot;rester vouvoyant&quot;). Désactive une règle
        sans la supprimer avec le bouton à bascule.
      </p>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="ex: ne jamais utiliser d'émoji"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          disabled={creating}
        />
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          onClick={handleCreate}
          disabled={creating || !newText.trim()}
        >
          Ajouter
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune règle pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <button
                role="switch"
                aria-checked={rule.active}
                onClick={() => toggleActive(rule)}
                title={rule.active ? "Désactiver" : "Activer"}
                className={`h-5 w-9 flex-shrink-0 rounded-full p-0.5 transition-colors ${
                  rule.active ? "bg-primary" : "bg-surface-muted"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                    rule.active ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>

              {editingId === rule.id ? (
                <input
                  autoFocus
                  className="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={() => saveEdit(rule.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(rule.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(rule)}
                  className={`flex-1 cursor-text text-sm ${
                    rule.active ? "" : "text-muted-foreground line-through"
                  }`}
                  title="Double-clic pour modifier"
                >
                  {rule.text}
                </span>
              )}

              <button
                onClick={() => handleDelete(rule.id)}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
