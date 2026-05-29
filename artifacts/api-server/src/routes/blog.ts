import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, blogPostsTable } from "@workspace/db";
import { GetBlogPostParams, ListBlogPostsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/blog", async (req, res): Promise<void> => {
  const parsed = ListBlogPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 12 } = parsed.data;
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.isPublished, true))
      .orderBy(desc(blogPostsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.isPublished, true)),
  ]);

  res.json({ items, total: countResult[0]?.count ?? 0, page, limit });
});

router.get("/blog/:slug", async (req, res): Promise<void> => {
  const params = GetBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.slug, params.data.slug))
    .limit(1);

  if (!post || !post.isPublished) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(post);
});

export default router;
