import { Router, type IRouter } from "express";
import { ilike, or } from "drizzle-orm";
import { db, offersTable, categoriesTable, brandsTable, blogPostsTable } from "@workspace/db";
import { SearchQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const parsed = SearchQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, page = 1 } = parsed.data;
  const pattern = `%${q}%`;

  const [offerResults, categoryResults, brandResults, blogResults] = await Promise.all([
    db
      .select({
        id: offersTable.id,
        title: offersTable.title,
        slug: offersTable.slug,
        imageUrl: offersTable.imageUrl,
        description: offersTable.shortDescription,
      })
      .from(offersTable)
      .where(or(ilike(offersTable.title, pattern), ilike(offersTable.shortDescription, pattern)))
      .limit(8),
    db
      .select({
        id: categoriesTable.id,
        title: categoriesTable.name,
        slug: categoriesTable.slug,
        imageUrl: categoriesTable.imageUrl,
        description: categoriesTable.description,
      })
      .from(categoriesTable)
      .where(ilike(categoriesTable.name, pattern))
      .limit(4),
    db
      .select({
        id: brandsTable.id,
        title: brandsTable.name,
        slug: brandsTable.slug,
        imageUrl: brandsTable.logoUrl,
        description: brandsTable.description,
      })
      .from(brandsTable)
      .where(ilike(brandsTable.name, pattern))
      .limit(4),
    db
      .select({
        id: blogPostsTable.id,
        title: blogPostsTable.title,
        slug: blogPostsTable.slug,
        imageUrl: blogPostsTable.imageUrl,
        description: blogPostsTable.excerpt,
      })
      .from(blogPostsTable)
      .where(or(ilike(blogPostsTable.title, pattern), ilike(blogPostsTable.excerpt, pattern)))
      .limit(4),
  ]);

  const items = [
    ...offerResults.map((r) => ({ ...r, type: "offer" as const })),
    ...categoryResults.map((r) => ({ ...r, type: "category" as const })),
    ...brandResults.map((r) => ({ ...r, type: "brand" as const })),
    ...blogResults.map((r) => ({ ...r, type: "blog" as const })),
  ];

  res.json({ items, total: items.length, page, query: q });
});

export default router;
