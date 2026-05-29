import { Router, type IRouter } from "express";
import { eq, and, isNull, or, gt } from "drizzle-orm";
import { db, offersTable, clicksTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// Outbound affiliate redirect with UTM tracking
router.get("/go/:slug", async (req, res): Promise<void> => {
  const { slug } = req.params;

  const [offer] = await db
    .select({
      id: offersTable.id,
      affiliateUrl: offersTable.affiliateUrl,
      isActive: offersTable.isActive,
      expiresAt: offersTable.expiresAt,
    })
    .from(offersTable)
    .where(eq(offersTable.slug, slug))
    .limit(1);

  if (!offer || !offer.isActive) {
    res.status(404).send("Offer not found");
    return;
  }

  if (offer.expiresAt && offer.expiresAt < new Date()) {
    res.status(410).send("This offer has expired");
    return;
  }

  // Build UTM-tracked URL
  const utmSource = (req.query.utm_source as string) || "affiliatedeals";
  const utmMedium = (req.query.utm_medium as string) || "referral";
  const utmCampaign = (req.query.utm_campaign as string) || slug;
  const utmContent = req.query.utm_content as string | undefined;

  const targetUrl = new URL(offer.affiliateUrl);
  targetUrl.searchParams.set("utm_source", utmSource);
  targetUrl.searchParams.set("utm_medium", utmMedium);
  targetUrl.searchParams.set("utm_campaign", utmCampaign);
  if (utmContent) targetUrl.searchParams.set("utm_content", utmContent);

  // Record click (async, non-blocking)
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress ?? null;
  db.insert(clicksTable).values({
    offerId: offer.id,
    ipAddress: ip,
    userAgent: req.headers["user-agent"] ?? null,
    referer: req.headers.referer ?? null,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent: utmContent ?? null,
  }).catch(() => {});

  // Increment click counter (async, non-blocking)
  db.update(offersTable)
    .set({ clickCount: sql`${offersTable.clickCount} + 1` })
    .where(eq(offersTable.id, offer.id))
    .catch(() => {});

  res.redirect(302, targetUrl.toString());
});

export default router;
