import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { usersTable } from "./schema/users";
import { sessionsTable } from "./schema/sessions";

// نُسند drizzle schema فقط لـ users/sessions عشان auth يشتغل
// (باقي الجداول ممكن تكون لسه Postgres-core وتسبب crash/503 لو دخلت في schema الخاص بـ drizzle)
const drizzleSchema = {
  usersTable,
  sessionsTable,
};

function getMysqlConfig(): mysql.PoolOptions {
  const rawHost = process.env.DB_HOST;
  const host =
    rawHost === "localhost" || rawHost === "::1" || rawHost === undefined || rawHost === ""
      ? "127.0.0.1"
      : rawHost;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT ?? "3306");

  const missing = [
    ["DB_HOST", host],
    ["DB_USER", user],
    ["DB_PASSWORD", password],
    ["DB_NAME", database],
  ].filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(`DB_* variables incomplete. Missing: ${missing.join(", ")}`);
  }

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid DB_PORT: "${process.env.DB_PORT ?? ""}"`);
  }

  return { host, user, password, database, port };
}

export const pool = mysql.createPool(getMysqlConfig());
export const db = drizzle(pool, { schema: drizzleSchema, mode: "default" as const }) as any;

export { usersTable } from "./schema/users";
export { sessionsTable } from "./schema/sessions";

// Re-export remaining schema tables for TypeScript.
// We intentionally do NOT include them in `drizzleSchema` (MySQL runtime/auth compatibility),
// but exporting fixes `api-server` compile-time imports.
export * from "./schema";
