import { logger } from "./lib/logger.js";
import { validateEnv } from "./lib/env.js";
import { startIndexingWorker } from "./services/indexNow.js";

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
  logger.error({ err }, "uncaughtException");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection", reason);
  logger.error({ reason }, "unhandledRejection");
});

// IMPORTANT:
// validateEnv MUST run before importing modules that read JWT secrets at module-load time.
validateEnv();

const { default: app } = await import("./app.js");

const rawPort = process.env["WEBSITES_PORT"] ?? process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.warn({ rawPort }, "Invalid PORT value; falling back to 3000");
}

const safePort = Number.isNaN(port) || port <= 0 ? 3000 : port;

app.listen(safePort, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err, safePort }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port: safePort }, "Server listening");
  startIndexingWorker();
});
