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
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `DATABASE_URL missing; and DB_* variables incomplete. Missing: ${missing.join(", ")}`,
    );
  }

  // postgres URI needs URL-encoded credentials
  const safeUser = encodeURIComponent(user as string);
  const safePassword = encodeURIComponent(password as string);

  return `postgresql://${safeUser}:${safePassword}@${host}:${port}/${database}`;
}

export function validateEnv(): void {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  // Ensure DATABASE_URL is available (either directly or from DB_* vars)
  const databaseUrl = getDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;

  // Ensure JWT secrets exist; fall back to SESSION_SECRET if not provided
  if (!process.env.JWT_ACCESS_SECRET) {
    process.env.JWT_ACCESS_SECRET = sessionSecret;
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = sessionSecret;
  }

  const missingFinal = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "SESSION_SECRET"].filter(
    (k) => !process.env[k],
  );

  if (missingFinal.length > 0) {
    throw new Error(`Missing required environment variables: ${missingFinal.join(", ")}`);
  }
}
