/** Strips markdown code fences the model sometimes wraps JSON in, then parses it. */
export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as T;
}

export function buildEnrichPrompt(lines: string[]): {
  system: string;
  prompt: string;
} {
  const system = [
    "Tu catégorises des phrases utilisées dans des conversations de chat (agence de tchating).",
    "Pour chaque phrase, déduis un contexte court en français (2-3 mots, ex: 'relance', 'rapprochement', 'compliment', 'proposition').",
    "Réutilise un contexte déjà vu dans la liste quand c'est pertinent, pour limiter le nombre de contextes distincts.",
    "Réponds UNIQUEMENT avec un tableau JSON, sans texte autour, au format:",
    '[{"text": "<phrase exacte>", "context": "<contexte>"}, ...]',
  ].join("\n");

  const prompt = lines.map((l, i) => `${i + 1}. ${l}`).join("\n");

  return { system, prompt };
}

export function buildSuggestPrompt(params: {
  context: string;
  candidates: string[];
  excluded: string[];
}): { system: string; prompt: string } {
  const system = [
    "Tu aides un chatteur d'agence OnlyFans à relancer une conversation sans se répéter.",
    "On te donne un contexte de discussion, une banque de phrases déjà écrites par le client pour ce contexte,",
    "et une liste de phrases à éviter (déjà utilisées récemment, pour ne pas être redondant).",
    "Choisis ou adapte légèrement UNE phrase de la banque qui n'est pas proche des phrases à éviter.",
    "Si toute la banque est trop proche des phrases à éviter, génère une nouvelle phrase dans le même ton/style que la banque.",
    "Réponds UNIQUEMENT avec un objet JSON: {\"suggestion\": \"<phrase>\", \"reused\": true|false}.",
  ].join("\n");

  const prompt = [
    `Contexte: ${params.context}`,
    "",
    "Banque de phrases disponibles:",
    params.candidates.length
      ? params.candidates.map((c) => `- ${c}`).join("\n")
      : "(aucune)",
    "",
    "Phrases à éviter (déjà utilisées récemment):",
    params.excluded.length
      ? params.excluded.map((c) => `- ${c}`).join("\n")
      : "(aucune)",
  ].join("\n");

  return { system, prompt };
}
