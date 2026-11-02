# Chat Text Suggestion

Outil interne pour une agence de tchating : suggère des phrases adaptées à un
contexte de discussion donné, en évitant la redondance avec ce qui a déjà été
envoyé, et permet d'enrichir la base de phrases du client par simple
copier-coller.

## Stack

- Next.js (App Router, TypeScript) — front + API routes, déployable gratuitement sur Vercel.
- Postgres (Neon/Supabase free tier) via Drizzle ORM, extension `pg_trgm` pour la similarité texte.
- LLM interchangeable : OpenRouter (modèle gratuit, défaut démo) ou Claude (`claude-sonnet-5-5`), via `LLM_PROVIDER`.

## Comment ça marche

- **Enrichir** (`POST /api/phrases/import`) : on colle une liste de phrases
  (une par ligne), le LLM infère un contexte court par phrase (relance,
  rapprochement, ...), tout est stocké en base.
- **Suggérer** (`POST /api/suggest`) : on donne un contexte libre, l'app
  retrouve le contexte le plus proche en base (similarité trigram), prend les
  phrases les moins récemment utilisées de ce contexte, exclut celles
  utilisées récemment (automatiquement + liste fournie par l'utilisateur), et
  demande au LLM de choisir/adapter une phrase qui n'est pas redondante.
- **Marquer comme utilisée** (`POST /api/phrases/use`) : incrémente le
  compteur d'usage et la date de dernière utilisation, pour que la phrase
  redescende dans le classement des suggestions futures.

## Setup local

```bash
npm install
cp .env.example .env.local   # renseigner DATABASE_URL + OPENROUTER_API_KEY
npm run db:generate          # régénère les migrations si le schéma change
npm run db:migrate           # applique les migrations (crée les tables + pg_trgm)
npm run dev
```

Base de données gratuite : créer un projet sur [Neon](https://neon.tech) ou
[Supabase](https://supabase.com), récupérer la connection string Postgres.

Clé LLM gratuite : créer une clé sur [OpenRouter](https://openrouter.ai/keys)
et choisir un modèle `:free` actuel sur
[openrouter.ai/models?max_price=0](https://openrouter.ai/models?max_price=0)
(la liste des modèles gratuits change souvent).

## Switch vers Claude

Mettre `LLM_PROVIDER=claude` et `ANTHROPIC_API_KEY` dans les variables d'env
(local ou Vercel). Aucune autre modification nécessaire — toute la logique
métier passe par l'abstraction `lib/llm/index.ts`.

## Déploiement

1. Push sur GitHub (déjà configuré).
2. Importer le repo sur [Vercel](https://vercel.com/new).
3. Renseigner les variables d'env (`DATABASE_URL`, `OPENROUTER_API_KEY`, etc.) dans les settings du projet Vercel.
4. Lancer `npm run db:migrate` une fois (localement, pointé vers la base de prod) pour créer les tables.
