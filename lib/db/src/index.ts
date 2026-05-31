import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { usersTable } from "./schema/users";
import { sessionsTable } from "./schema/sessions";

// CONTENT APIs (offers/categories/brands/blog/search/seo) require these tables
// to be present in the drizzle schema instance used by runtime queries.
import { offersTable } from "./schema/offers";
import { categoriesTable } from "./schema/categories";
import { brandsTable } from "./schema/brands";
import { blogPostsTable } from "./schema/blog_posts";
import { seoPagesTable } from "./schema/seo_pages";
import { footballTeamsTable } from "./schema/football_teams";
import { footballPredictionRequestsTable } from "./schema/football_prediction_requests";
import { couponsTable } from "./schema/coupons";
import { clicksTable } from "./schema/clicks";

// NOTE:
// If any of these tables are still defined via Postgres-core types,
// MySQL runtime may throw when building SQL. This step is to make
// sure /api/* routes no longer fail due to missing schema registration;
// if dialect mismatch errors appear, we then port the schemas to mysql-core.
const drizzleSchema = {
  usersTable,
  sessionsTable,
  offersTable,
  categoriesTable,
  brandsTable,
  blogPostsTable,
  seoPagesTable,
  footballTeamsTable,
  footballPredictionRequestsTable,
  couponsTable,
  clicksTable,
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

/**
 * Explicit named exports for TS consumers (prevents “missing export member” issues).
 * We keep these in sync with the new MVP tables to avoid typecheck drift.
 */
export { seoPagesTable } from "./schema/seo_pages";
export { footballTeamsTable } from "./schema/football_teams";
export { footballPredictionRequestsTable } from "./schema/football_prediction_requests";

// Re-export remaining schema tables for TypeScript.
// We intentionally do NOT include them in `drizzleSchema` (MySQL runtime/auth compatibility),
// but exporting fixes `api-server` compile-time imports.
export * from "./schema";
