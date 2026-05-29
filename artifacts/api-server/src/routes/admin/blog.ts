import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, blogPostsTable } from "@workspace/db";
import {
  CreateBlogPostBody,
  UpdateBlogPostParams,
  UpdateBlogPostBody,
  DeleteBlogPostParams,
} from "@workspace/api-zod";

function toSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const router: IRouter = Router();

router.post("/admin/blog", async (req, res): Promise<void> => {
  const parsed = CreateBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const slug = data.slug || toSlug(data.title);

  const [post] = await db
    .insert(blogPostsTable)
    .values({ ...data, slug })
    .returning();

  res.status(201).json(post);
});

router.put("/admin/blog/:id", async (req, res): Promise<void> => {
  const params = UpdateBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = { ...data };
  if (data.title && !data.slug) updates.slug = toSlug(data.title);

  const [post] = await db
    .update(blogPostsTable)
    .set(updates)
    .where(eq(blogPostsTable.id, params.data.id))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }

  res.json(post);
});

router.delete("/admin/blog/:id", async (req, res): Promise<void> => {
  const params = DeleteBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .delete(blogPostsTable)
    .where(eq(blogPostsTable.id, params.data.id))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
