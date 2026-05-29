import { Router, type IRouter } from "express";
import { sql, and, eq } from "drizzle-orm";
import { db, offersTable, categoriesTable, brandsTable, blogPostsTable } from "@workspace/db";
import { SearchQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function buildTsQuery(q: string): string {
  return q.trim().split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(" & ");
}

function ftsVector(...cols: string[]): string {
  return cols.map(c => `coalesce(${c}, '')`).join(" || ' ' || ");
}

router.get("/search", async (req, res): Promise<void> => {
  const parsed = SearchQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, page = 1 } = parsed.data;
  const useFullText = q.trim().length >= 3;
  const tsQuery = useFullText ? buildTsQuery(q) : null;
  const pattern = `%${q}%`;

  const [offerResults, categoryResults, brandResults, blogResults] = await Promise.all([
    // Offers: FTS or ilike, active + not expired only
    db
      .select({
        id: offersTable.id,
        title: offersTable.title,
        slug: offersTable.slug,
        imageUrl: offersTable.imageUrl,
        description: offersTable.shortDescription,
      })
      .from(offersTable)
      .where(
        and(
          eq(offersTable.isActive, true),
          sql`(${offersTable.expiresAt} IS NULL OR ${offersTable.expiresAt} > now())`,
          tsQuery
            ? sql`to_tsvector('english', coalesce(${offersTable.title},'') || ' ' || coalesce(${offersTable.shortDescription},'')) @@ to_tsquery('english', ${tsQuery})`
            : sql`(${offersTable.title} ilike ${pattern} OR ${offersTable.shortDescription} ilike ${pattern})`
        )
      )
      .orderBy(
        tsQuery
          ? sql`ts_rank(to_tsvector('english', coalesce(${offersTable.title},'') || ' ' || coalesce(${offersTable.shortDescription},'')), to_tsquery('english', ${tsQuery})) desc`
          : sql`${offersTable.createdAt} desc`
      )
      .limit(8),

    // Categories
    db
      .select({
        id: categoriesTable.id,
        title: categoriesTable.name,
        slug: categoriesTable.slug,
        imageUrl: categoriesTable.imageUrl,
        description: categoriesTable.description,
      })
      .from(categoriesTable)
      .where(
        tsQuery
          ? sql`to_tsvector('english', coalesce(${categoriesTable.name},'') || ' ' || coalesce(${categoriesTable.description},'')) @@ to_tsquery('english', ${tsQuery})`
          : sql`${categoriesTable.name} ilike ${pattern}`
      )
      .limit(4),

    // Brands
    db
      .select({
        id: brandsTable.id,
        title: brandsTable.name,
        slug: brandsTable.slug,
        imageUrl: brandsTable.logoUrl,
        description: brandsTable.description,
      })
      .from(brandsTable)
      .where(
        tsQuery
          ? sql`to_tsvector('english', coalesce(${brandsTable.name},'') || ' ' || coalesce(${brandsTable.description},'')) @@ to_tsquery('english', ${tsQuery})`
          : sql`${brandsTable.name} ilike ${pattern}`
      )
      .limit(4),

    // Blog posts
    db
      .select({
        id: blogPostsTable.id,
        title: blogPostsTable.title,
        slug: blogPostsTable.slug,
        imageUrl: blogPostsTable.imageUrl,
        description: blogPostsTable.excerpt,
      })
      .from(blogPostsTable)
      .where(
        tsQuery
          ? sql`to_tsvector('english', coalesce(${blogPostsTable.title},'') || ' ' || coalesce(${blogPostsTable.excerpt},'')) @@ to_tsquery('english', ${tsQuery})`
          : sql`(${blogPostsTable.title} ilike ${pattern} OR ${blogPostsTable.excerpt} ilike ${pattern})`
      )
      .limit(4),
  ]);

  type OfferResult = {
    id: number;
    title: string;
    slug: string;
    imageUrl: string | null;
    description: string | null;
  };

  type CategoryResult = {
    id: number;
    title: string;
    slug: string;
    imageUrl: string | null;
    description: string | null;
  };

  type BrandResult = {
    id: number;
    title: string;
    slug: string;
    imageUrl: string | null;
    description: string | null;
  };

  type BlogResult = {
    id: number;
    title: string;
    slug: string;
    imageUrl: string | null;
    description: string | null;
  };

  const items = [
    ...offerResults.map((r: OfferResult) => ({ ...r, type: "offer" as const })),
    ...categoryResults.map((r: CategoryResult) => ({ ...r, type: "category" as const })),
    ...brandResults.map((r: BrandResult) => ({ ...r, type: "brand" as const })),
    ...blogResults.map((r: BlogResult) => ({ ...r, type: "blog" as const })),
  ];

  res.json({ items, total: items.length, page, query: q });
});

export default router;
