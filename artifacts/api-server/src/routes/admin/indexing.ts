import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, indexingQueueTable } from "@workspace/db";
import { ListIndexingQueueQueryParams, RetryIndexingItemParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/indexing", async (req, res): Promise<void> => {
  const parsed = ListIndexingQueueQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, status } = parsed.data;
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = status ? eq(indexingQueueTable.status, status) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(indexingQueueTable)
      .where(where)
      .orderBy(desc(indexingQueueTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(indexingQueueTable)
      .where(where),
  ]);

  res.json({ items, total: countResult[0]?.count ?? 0, page });
});

router.post("/admin/indexing/:id/retry", async (req, res): Promise<void> => {
  const params = RetryIndexingItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db
    .update(indexingQueueTable)
    .set({ status: "pending", attempts: 0, errorMessage: null, scheduledAt: new Date() })
    .where(eq(indexingQueueTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Indexing item not found" });
    return;
  }

  res.json(item);
});

export default router;
