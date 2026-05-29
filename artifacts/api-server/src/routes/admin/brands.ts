import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, brandsTable } from "@workspace/db";
import {
  CreateBrandBody,
  UpdateBrandParams,
  UpdateBrandBody,
  DeleteBrandParams,
} from "@workspace/api-zod";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const router: IRouter = Router();

router.post("/admin/brands", async (req, res): Promise<void> => {
  const parsed = CreateBrandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const slug = data.slug || toSlug(data.name);

  const [brand] = await db
    .insert(brandsTable)
    .values({ ...data, slug })
    .returning();

  res.status(201).json({ ...brand, offerCount: 0 });
});

router.put("/admin/brands/:id", async (req, res): Promise<void> => {
  const params = UpdateBrandParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBrandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = { ...data };
  if (data.name && !data.slug) updates.slug = toSlug(data.name);

  const [brand] = await db
    .update(brandsTable)
    .set(updates)
    .where(eq(brandsTable.id, params.data.id))
    .returning();

  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }

  res.json({ ...brand, offerCount: 0 });
});

router.delete("/admin/brands/:id", async (req, res): Promise<void> => {
  const params = DeleteBrandParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [brand] = await db
    .delete(brandsTable)
    .where(eq(brandsTable.id, params.data.id))
    .returning();

  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
