import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, offersTable, categoriesTable, brandsTable, blogPostsTable, indexingQueueTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [
    offerStats,
    totalCategories,
    totalBrands,
    blogStats,
    indexingStats,
    topOffers,
    recentOffers,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${offersTable.isActive} = true)::int`,
        featured: sql<number>`count(*) filter (where ${offersTable.isFeatured} = true)::int`,
        totalClicks: sql<number>`coalesce(sum(${offersTable.clickCount}), 0)::int`,
      })
      .from(offersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(categoriesTable).where(eq(categoriesTable.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(brandsTable).where(eq(brandsTable.isActive, true)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        published: sql<number>`count(*) filter (where ${blogPostsTable.isPublished} = true)::int`,
      })
      .from(blogPostsTable),
    db
      .select({
        pending: sql<number>`count(*) filter (where ${indexingQueueTable.status} = 'pending')::int`,
        failed: sql<number>`count(*) filter (where ${indexingQueueTable.status} = 'failed')::int`,
      })
      .from(indexingQueueTable),
    db
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
      .leftJoin(brandsTable, eq(offersTable.brandId, brandsTable.id))
      .where(eq(offersTable.isActive, true))
      .orderBy(desc(offersTable.clickCount))
      .limit(5),
    db
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
      .leftJoin(brandsTable, eq(offersTable.brandId, brandsTable.id))
      .orderBy(desc(offersTable.createdAt))
      .limit(5),
  ]);

  res.json({
    totalOffers: offerStats[0]?.total ?? 0,
    activeOffers: offerStats[0]?.active ?? 0,
    featuredOffers: offerStats[0]?.featured ?? 0,
    totalCategories: totalCategories[0]?.count ?? 0,
    totalBrands: totalBrands[0]?.count ?? 0,
    totalBlogPosts: blogStats[0]?.total ?? 0,
    publishedBlogPosts: blogStats[0]?.published ?? 0,
    totalClicks: offerStats[0]?.totalClicks ?? 0,
    pendingIndexing: indexingStats[0]?.pending ?? 0,
    failedIndexing: indexingStats[0]?.failed ?? 0,
    topOffers,
    recentOffers,
  });
});

export default router;
