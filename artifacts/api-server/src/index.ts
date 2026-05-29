import app from "./app.js";
import { logger } from "./lib/logger.js";
import { startIndexingWorker } from "./services/indexNow.js";

const rawPort = process.env["WEBSITES_PORT"] ?? process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.warn({ rawPort }, "Invalid PORT value; falling back to 3000");
}

const safePort = Number.isNaN(port) || port <= 0 ? 3000 : port;

app.listen(safePort, (err) => {
  if (err) {
    logger.error({ err, safePort }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port: safePort }, "Server listening");
  startIndexingWorker();
});
