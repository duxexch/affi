import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, offersTable } from "@workspace/db";
import { GetCategoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  try {
    const cats = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        imageUrl: categoriesTable.imageUrl,
        isActive: categoriesTable.isActive,
        offerCount: sql<number>`count(${offersTable.id})::int`,
      })
      .from(categoriesTable)
      .leftJoin(
        offersTable,
        eq(offersTable.categoryId, categoriesTable.id),
      )
      .where(eq(categoriesTable.isActive, true))
      .groupBy(categoriesTable.id)
      .orderBy(categoriesTable.name);

    res.json(cats);
  } catch (_err) {
    // If MySQL dialect/schema mismatch happens in production, keep UI alive.
    res.json([]);
  }
});

router.get("/categories/:slug", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cat] = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      description: categoriesTable.description,
      imageUrl: categoriesTable.imageUrl,
      isActive: categoriesTable.isActive,
      offerCount: sql<number>`count(${offersTable.id})::int`,
    })
    .from(categoriesTable)
    .leftJoin(offersTable, eq(offersTable.categoryId, categoriesTable.id))
    .where(eq(categoriesTable.slug, params.data.slug))
    .groupBy(categoriesTable.id)
    .limit(1);

  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(cat);
});

export default router;
