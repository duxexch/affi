import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function getDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL;
  if (direct) return direct;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = process.env.DB_PORT ?? "5432";

  const missing = [
    ["DB_HOST", host],
    ["DB_USER", user],
    ["DB_PASSWORD", password],
    ["DB_NAME", database],
  ].filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `DATABASE_URL missing and DB_* variables incomplete. Missing: ${missing.join(", ")}`,
    );
  }

  const safeUser = encodeURIComponent(user as string);
  const safePassword = encodeURIComponent(password as string);

  return `postgresql://${safeUser}:${safePassword}@${host}:${port}/${database}`;
}

export const pool = new Pool({ connectionString: getDatabaseUrl() });
export const db = drizzle(pool, { schema });

export * from "./schema";
