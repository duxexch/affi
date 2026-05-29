import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, offersTable } from "@workspace/db";
import {
  CreateOfferBody,
  UpdateOfferParams,
  UpdateOfferBody,
  DeleteOfferParams,
} from "@workspace/api-zod";

function toSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const router: IRouter = Router();

router.post("/admin/offers", async (req, res): Promise<void> => {
  const parsed = CreateOfferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const slug = data.slug || toSlug(data.title);

  const [offer] = await db
    .insert(offersTable)
    .values({
      ...data,
      slug,
      originalPrice: data.originalPrice != null ? String(data.originalPrice) : null,
      currentPrice: data.currentPrice != null ? String(data.currentPrice) : null,
      lastmod: new Date(),
    })
    .returning();

  res.status(201).json(offer);
});

router.put("/admin/offers/:id", async (req, res): Promise<void> => {
  const params = UpdateOfferParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOfferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = { ...data, lastmod: new Date() };
  if (data.originalPrice != null) updates.originalPrice = String(data.originalPrice);
  if (data.currentPrice != null) updates.currentPrice = String(data.currentPrice);
  if (data.title && !data.slug) updates.slug = toSlug(data.title);

  const [offer] = await db
    .update(offersTable)
    .set(updates)
    .where(eq(offersTable.id, params.data.id))
    .returning();

  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }

  res.json(offer);
});

router.delete("/admin/offers/:id", async (req, res): Promise<void> => {
  const params = DeleteOfferParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [offer] = await db
    .delete(offersTable)
    .where(eq(offersTable.id, params.data.id))
    .returning();

  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
