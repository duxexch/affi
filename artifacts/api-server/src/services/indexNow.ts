import { logger } from "../lib/logger.js";
import { db, indexingQueueTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";

const SITE_URL = process.env.SITE_URL ?? "https://affiliatedeals.replit.app";
const INDEX_NOW_KEY = process.env.INDEX_NOW_KEY ?? "";

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

export async function queueUrlForIndexing(url: string, type: string): Promise<void> {
  try {
    await db
      .insert(indexingQueueTable)
      .values({ url, type, status: "pending", provider: "indexnow", scheduledAt: new Date() })
      .onConflictDoNothing();
  } catch (err) {
    logger.error({ err }, "Failed to queue URL for indexing");
  }
}

export async function processIndexingQueue(): Promise<void> {
  const now = new Date();

  const pending = await db
    .select()
    .from(indexingQueueTable)
    .where(and(eq(indexingQueueTable.status, "pending"), lte(indexingQueueTable.scheduledAt, now)))
    .limit(50);

  if (pending.length === 0) return;

  const urls = pending.map((item) => item.url);
  await submitUrlsToIndexNow(urls);

  for (const item of pending) {
    await db
      .update(indexingQueueTable)
      .set({ status: "submitted", sentAt: new Date(), attempts: item.attempts + 1 })
      .where(eq(indexingQueueTable.id, item.id));
  }

  logger.info({ count: pending.length }, "Processed indexing queue batch");
}

let workerInterval: ReturnType<typeof setInterval> | null = null;

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
