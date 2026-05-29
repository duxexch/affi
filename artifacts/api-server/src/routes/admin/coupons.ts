import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, couponsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const CreateCouponBody = z.object({
  offerId: z.number().int().optional(),
  code: z.string().min(1).max(100).toUpperCase(),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed", "free_shipping"]).default("percentage"),
  value: z.number().positive().optional(),
  minimumPurchase: z.number().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

router.get("/admin/coupons", async (_req, res): Promise<void> => {
  const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
  res.json(coupons);
});

router.post("/admin/coupons", async (req, res): Promise<void> => {
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { value, minimumPurchase, expiresAt, ...rest } = parsed.data;
  const [coupon] = await db.insert(couponsTable).values({
    ...rest,
    value: value != null ? String(value) : null,
    minimumPurchase: minimumPurchase != null ? String(minimumPurchase) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  }).returning();
  res.status(201).json(coupon);
});

router.delete("/admin/coupons/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(couponsTable).where(eq(couponsTable.id, id));
  res.sendStatus(204);
});

// Public: get coupons for an offer
router.get("/offers/:offerId/coupons", async (req, res): Promise<void> => {
  const offerId = parseInt(req.params.offerId, 10);
  const now = new Date();
  const coupons = await db
    .select({ id: couponsTable.id, code: couponsTable.code, description: couponsTable.description, type: couponsTable.type, value: couponsTable.value, expiresAt: couponsTable.expiresAt })
    .from(couponsTable)
    .where(eq(couponsTable.offerId, offerId));
  res.json(coupons.filter((c: { expiresAt: Date | null }) => !c.expiresAt || c.expiresAt > now));
});

export default router;
