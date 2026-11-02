import "./prefer-ipv4";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// `tsx` (unlike `next dev`) doesn't load .env files on its own.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file missing, ignore
  }
}

async function main() {
  // Migrations need a direct (non-pooled) connection: Neon's pooled
  // DATABASE_URL goes through PgBouncer in transaction mode, which doesn't
  // support the session-level operations drizzle-kit's migrator relies on.
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Done.");

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
