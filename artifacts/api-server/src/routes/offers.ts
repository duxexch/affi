import { Router, type IRouter } from "express";
import { eq, desc, ilike, and, sql, isNull, or, gt } from "drizzle-orm";
import { db, offersTable, categoriesTable, brandsTable } from "@workspace/db";
import { queueUrlForIndexing } from "../services/indexNow.js";
import {
  GetOfferParams,
  TrackOfferClickParams,
  ListOffersQueryParams,
} from "@workspace/api-zod";

const SITE_URL = process.env.SITE_URL ?? "https://affiliatedeals.replit.app";

const router: IRouter = Router();

function buildOfferSelect() {
  return db
    .select({
      id: offersTable.id,
      title: offersTable.title,
      slug: offersTable.slug,
      shortDescription: offersTable.shortDescription,
      discountPercent: offersTable.discountPercent,
      originalPrice: offersTable.originalPrice,
      currentPrice: offersTable.currentPrice,
      currency: offersTable.currency,
      imageUrl: offersTable.imageUrl,
      affiliateUrl: offersTable.affiliateUrl,
      isActive: offersTable.isActive,
      isFeatured: offersTable.isFeatured,
      clickCount: offersTable.clickCount,
      categoryId: offersTable.categoryId,
      brandId: offersTable.brandId,
      categorySlug: categoriesTable.slug,
      brandSlug: brandsTable.slug,
      categoryName: categoriesTable.name,
      brandName: brandsTable.name,
      createdAt: offersTable.createdAt,
      updatedAt: offersTable.updatedAt,
    })
    .from(offersTable)
    .leftJoin(categoriesTable, eq(offersTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(offersTable.brandId, brandsTable.id));
}

router.get("/offers", async (req, res): Promise<void> => {
  const parsed = ListOffersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 20, categorySlug, brandSlug, featured, q } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [
    eq(offersTable.isActive, true),
    sql`(${offersTable.expiresAt} IS NULL OR ${offersTable.expiresAt} > now())`,
  ];
  if (categorySlug) conditions.push(eq(categoriesTable.slug, categorySlug));
  if (brandSlug) conditions.push(eq(brandsTable.slug, brandSlug));
  if (featured) conditions.push(eq(offersTable.isFeatured, true));
  if (q) {
    if (q.trim().length >= 3) {
      const tsQuery = q.trim().split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(" & ");
      conditions.push(sql`to_tsvector('english', coalesce(${offersTable.title}, '') || ' ' || coalesce(${offersTable.shortDescription}, '')) @@ to_tsquery('english', ${tsQuery})`);
    } else {
      conditions.push(ilike(offersTable.title, `%${q}%`));
    }
  }

  const where = and(...conditions);

  const [items, countResult] = await Promise.all([
    buildOfferSelect()
      .where(where)
      .orderBy(desc(offersTable.isFeatured), desc(offersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(offersTable)
      .leftJoin(categoriesTable, eq(offersTable.categoryId, categoriesTable.id))
      .leftJoin(brandsTable, eq(offersTable.brandId, brandsTable.id))
      .where(where),
  ]);

  res.json({ items, total: countResult[0]?.count ?? 0, page, limit });
});

router.get("/offers/:slug", async (req, res): Promise<void> => {
  const params = GetOfferParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [offer] = await db
    .select({
      id: offersTable.id,
      title: offersTable.title,
      slug: offersTable.slug,
      shortDescription: offersTable.shortDescription,
      description: offersTable.description,
      discountPercent: offersTable.discountPercent,
      originalPrice: offersTable.originalPrice,
      currentPrice: offersTable.currentPrice,
      currency: offersTable.currency,
      imageUrl: offersTable.imageUrl,
      affiliateUrl: offersTable.affiliateUrl,
      isActive: offersTable.isActive,
      isFeatured: offersTable.isFeatured,
      clickCount: offersTable.clickCount,
      categoryId: offersTable.categoryId,
      brandId: offersTable.brandId,
      categorySlug: categoriesTable.slug,
      brandSlug: brandsTable.slug,
      categoryName: categoriesTable.name,
      brandName: brandsTable.name,
      brandLogoUrl: brandsTable.logoUrl,
      createdAt: offersTable.createdAt,
      updatedAt: offersTable.updatedAt,
    })
    .from(offersTable)
    .leftJoin(categoriesTable, eq(offersTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(offersTable.brandId, brandsTable.id))
    .where(eq(offersTable.slug, params.data.slug))
    .limit(1);

  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }

  const relatedOffers = await buildOfferSelect()
    .where(
      and(
        eq(offersTable.isActive, true),
        offer.categoryId ? eq(offersTable.categoryId, offer.categoryId) : sql`true`,
        sql`${offersTable.id} != ${offer.id}`
      )
    )
    .orderBy(desc(offersTable.isFeatured))
    .limit(6);

  res.json({ ...offer, relatedOffers });
});

router.post("/offers/:slug/track", async (req, res): Promise<void> => {
  const params = TrackOfferClickParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [offer] = await db
    .select({ id: offersTable.id, affiliateUrl: offersTable.affiliateUrl })
    .from(offersTable)
    .where(eq(offersTable.slug, params.data.slug))
    .limit(1);

  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }

  await db
    .update(offersTable)
    .set({ clickCount: sql`${offersTable.clickCount} + 1` })
    .where(eq(offersTable.id, offer.id));

  res.json({ affiliateUrl: offer.affiliateUrl });
});

export default router;
