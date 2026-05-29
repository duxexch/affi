import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, brandsTable, offersTable } from "@workspace/db";
import { GetBrandParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/brands", async (_req, res): Promise<void> => {
  const brands = await db
    .select({
      id: brandsTable.id,
      name: brandsTable.name,
      slug: brandsTable.slug,
      description: brandsTable.description,
      logoUrl: brandsTable.logoUrl,
      websiteUrl: brandsTable.websiteUrl,
      isActive: brandsTable.isActive,
      offerCount: sql<number>`count(${offersTable.id})::int`,
    })
    .from(brandsTable)
    .leftJoin(offersTable, eq(offersTable.brandId, brandsTable.id))
    .where(eq(brandsTable.isActive, true))
    .groupBy(brandsTable.id)
    .orderBy(brandsTable.name);

  res.json(brands);
});

router.get("/brands/:slug", async (req, res): Promise<void> => {
  const params = GetBrandParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [brand] = await db
    .select({
      id: brandsTable.id,
      name: brandsTable.name,
      slug: brandsTable.slug,
      description: brandsTable.description,
      logoUrl: brandsTable.logoUrl,
      websiteUrl: brandsTable.websiteUrl,
      isActive: brandsTable.isActive,
      offerCount: sql<number>`count(${offersTable.id})::int`,
    })
    .from(brandsTable)
    .leftJoin(offersTable, eq(offersTable.brandId, brandsTable.id))
    .where(eq(brandsTable.slug, params.data.slug))
    .groupBy(brandsTable.id)
    .limit(1);

  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }

  res.json(brand);
});

export default router;
