/// <reference types="node" />
import { defineConfig } from "drizzle-kit";
import path from "path";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = process.env.DB_PORT ?? "3306";
  const missing = [
    ["DB_HOST", host],
    ["DB_USER", user],
    ["DB_PASSWORD", password],
    ["DB_NAME", database],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `DATABASE_URL missing; and DB_* variables incomplete. Missing: ${missing.join(", ")}`,
    );
  }

  const safeUser = encodeURIComponent(user as string);
  const safePassword = encodeURIComponent(password as string);
  return `mysql://${safeUser}:${safePassword}@${host}:${port}/${database}`;
}

const databaseUrl = getDatabaseUrl();

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl,
  },
});
