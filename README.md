# Chat Text Suggestion

Outil interne pour une agence de tchating : suggère des phrases adaptées à un
contexte de discussion donné, en évitant la redondance avec ce qui a déjà été
envoyé, et permet d'enrichir la base de phrases du client par simple
copier-coller.

## Stack

- Next.js (App Router, TypeScript) — front + API routes, déployable gratuitement sur Vercel.
- Postgres (Neon, projet `spring-heart-53730620`) via Drizzle ORM, extension `pg_trgm` pour la similarité texte.
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
neon deploy                  # provisionne/relie Neon et écrit DATABASE_URL(_UNPOOLED) dans .env
npm run db:generate          # régénère les migrations si le schéma change
npm run db:migrate           # applique les migrations (crée les tables + pg_trgm)
npm run dev
```

Base de données : projet Neon `spring-heart-53730620` (org `org-snowy-cell-16603821`),
géré via `neon.ts` + le CLI `neon`. `neon deploy` pull les variables
(`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, ...) dans `.env`. Les migrations
utilisent `DATABASE_URL_UNPOOLED` (connexion directe, requise par Neon pour
les opérations de session) — voir `.env.example`.

Neon Auth, Object Storage et Functions sont provisionnés (cf. `neon.ts`)
mais pas utilisés par l'app, qui n'a besoin que de Postgres.

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
3. Renseigner les variables d'env (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `OPENROUTER_API_KEY`, etc. — copier depuis `.env` local) dans les settings du projet Vercel.
4. `npm run db:migrate` a déjà été exécuté contre la base Neon de prod ; relancer uniquement après un `npm run db:generate` (nouvelle migration).
