CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS phrases_text_trgm_idx ON "phrases" USING gin ("text" gin_trgm_ops);
