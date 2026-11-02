import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

function getClient() {
  if (globalThis.__dbClient) return globalThis.__dbClient;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env.local (see .env.example)."
    );
  }

  const client = postgres(url, { max: 1, prepare: false });
  if (process.env.NODE_ENV !== "production") {
    globalThis.__dbClient = client;
  }
  return client;
}

// Lazy proxy so importing this module never requires DATABASE_URL at
// module-load time (e.g. during `next build`) — only when a query runs.
export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = drizzle(getClient(), { schema });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (instance as any)[prop];
    },
  }
) as ReturnType<typeof drizzle<typeof schema>>;
