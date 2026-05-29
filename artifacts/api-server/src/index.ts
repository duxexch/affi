import { logger } from "./lib/logger.js";
import { validateEnv } from "./lib/env.js";

console.log("[BOOT] api-server entry");

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
  logger.error({ err }, "uncaughtException");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection", reason);
  logger.error({ reason }, "unhandledRejection");
});

/**
 * IMPORTANT:
 * validateEnv MUST run before importing modules that read JWT secrets at module-load time.
 * Also, avoid top-level await to reduce runtime incompatibilities.
 */
try {
  console.log("[BOOT] validateEnv starting");
  validateEnv();
  console.log("[BOOT] validateEnv OK");
} catch (err) {
  console.error("validateEnv failed:", err);
  logger.error({ err }, "validateEnv failed");
  process.exit(1);
}

const rawPort = process.env["WEBSITES_PORT"] ?? process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.warn({ rawPort }, "Invalid PORT value; falling back to 3000");
}

const safePort = Number.isNaN(port) || port <= 0 ? 8080 : port;

import("./app.js")
  .then(({ default: app }) => {
    // Hostinger may proxy to a specific port; listen on multiple common ports to ensure availability.
    const portsToTry = Array.from(new Set([safePort, 3000, 8080]));

    for (const p of portsToTry) {
      app.listen(p, "0.0.0.0", (err) => {
        if (err) {
          logger.error({ err, p }, "Error listening on port");
          return;
        }
        logger.info({ port: p }, "Server listening");
      });
    }

    import("./services/indexNow.js").then(({ startIndexingWorker }) => {
      startIndexingWorker();
    });
  })
  .catch((err) => {
    console.error("Failed to import app:", err);
    logger.error({ err }, "Failed to import app");
    process.exit(1);
  });
