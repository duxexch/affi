import { logger } from "../lib/logger.js";

const SITE_URL = process.env.SITE_URL ?? "https://affiliatedeals.replit.app";
const INDEX_NOW_KEY = process.env.INDEX_NOW_KEY ?? "";

// TEMP NOTE:
// Our current MySQL-only DB layer does not export indexingQueueTable yet.
// To keep the app buildable/runnable on Hostinger, we disable all DB-backed queue operations.
export async function queueUrlForIndexing(url: string, type: string): Promise<void> {
  logger.warn({ url, type }, "Indexing queue disabled (indexingQueueTable not available in MySQL-only DB layer)");
}

export async function processIndexingQueue(): Promise<void> {
  // no-op
}

let workerInterval: ReturnType<typeof setInterval> | null = null;

// Keep worker but processIndexingQueue is a no-op until DB schema exports indexingQueueTable.
export function startIndexingWorker(): void {
  if (workerInterval) return;
  workerInterval = setInterval(async () => {
    try {
      await processIndexingQueue();
    } catch (err) {
      logger.error({ err }, "Indexing worker error");
    }
  }, 2 * 60 * 1000);
  logger.info("Indexing worker started");
}

export function stopIndexingWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}

export async function submitUrlsToIndexNow(urls: string[]): Promise<void> {
  if (!INDEX_NOW_KEY || urls.length === 0) return;

  const body = {
    host: new URL(SITE_URL).hostname,
    key: INDEX_NOW_KEY,
    keyLocation: `${SITE_URL}/${INDEX_NOW_KEY}.txt`,
    urlList: urls.slice(0, 10000),
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "IndexNow submission failed");
    } else {
      logger.info({ count: urls.length }, "IndexNow URLs submitted");
    }
  } catch (err) {
    logger.error({ err }, "IndexNow fetch error");
  }
}
