import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

function getMysqlConfig(): mysql.PoolOptions {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT ?? "3306");

  const missing = [
    ["DB_HOST", host],
    ["DB_USER", user],
    ["DB_PASSWORD", password],
    ["DB_NAME", database],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `DB_* variables incomplete. Missing: ${missing.join(", ")}`,
    );
  }

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid DB_PORT: "${process.env.DB_PORT ?? ""}"`);
  }

  return {
    host,
    user,
    password,
    database,
    port,
  };
}

export const pool = mysql.createPool(getMysqlConfig());
export const db = drizzle(pool, { schema, mode: "default" as const });

export * from "./schema";
