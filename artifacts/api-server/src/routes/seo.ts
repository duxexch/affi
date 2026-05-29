import { Router, type IRouter } from "express";
import { eq, desc, and, isNull, or, gt } from "drizzle-orm";
import { db, offersTable, categoriesTable, brandsTable, blogPostsTable } from "@workspace/db";

const router: IRouter = Router();
const BASE_URL = process.env.SITE_URL ?? "https://affiliatedeals.com";

function xmlEscape(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sitemapUrl(loc: string, lastmod?: Date | null, priority = 0.7, changefreq = "weekly") {
  return `  <url>
    <loc>${xmlEscape(`${BASE_URL}${loc}`)}</loc>
    ${lastmod ? `<lastmod>${lastmod.toISOString().split("T")[0]}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// Robots.txt
router.get("/robots.txt", (_req, res): void => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: ${BASE_URL}/api/sitemap.xml\n`,
  );
});

// Sitemap index
router.get("/sitemap.xml", (_req, res): void => {
  const now = new Date().toISOString().split("T")[0];
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/api/sitemap-static.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/api/sitemap-offers.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/api/sitemap-categories.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/api/sitemap-brands.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/api/sitemap-blog.xml</loc><lastmod>${now}</lastmod></sitemap>
</sitemapindex>`);
});

// Static pages sitemap
router.get("/sitemap-static.xml", (_req, res): void => {
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  const urls = [
    sitemapUrl("/", new Date(), 1.0, "daily"),
    sitemapUrl("/offers", new Date(), 0.9, "daily"),
    sitemapUrl("/categories", new Date(), 0.8, "weekly"),
    sitemapUrl("/brands", new Date(), 0.8, "weekly"),
    sitemapUrl("/blog", new Date(), 0.7, "daily"),
    sitemapUrl("/search", new Date(), 0.5, "monthly"),
  ].join("\n");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// Offers sitemap
router.get("/sitemap-offers.xml", async (_req, res): Promise<void> => {
  const now = new Date();
  const offers = await db
    .select({ slug: offersTable.slug, lastmod: offersTable.lastmod, isFeatured: offersTable.isFeatured })
    .from(offersTable)
    .where(
      and(
        eq(offersTable.isActive, true),
        or(isNull(offersTable.expiresAt), gt(offersTable.expiresAt, now))
      )
    )
    .orderBy(desc(offersTable.isFeatured), desc(offersTable.lastmod));

  type OfferRow = { slug: string; lastmod: Date; isFeatured: boolean };

  const urls = offers.map((o: OfferRow) =>
    sitemapUrl(`/offers/${o.slug}`, o.lastmod, o.isFeatured ? 0.9 : 0.7, "weekly")
  ).join("\n");

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// Categories sitemap
router.get("/sitemap-categories.xml", async (_req, res): Promise<void> => {
  const cats = await db
    .select({ slug: categoriesTable.slug, createdAt: categoriesTable.createdAt })
    .from(categoriesTable)
    .where(eq(categoriesTable.isActive, true));

  type CategoryRow = { slug: string; createdAt: Date };

  const urls = cats.map((c: CategoryRow) => sitemapUrl(`/categories/${c.slug}`, c.createdAt, 0.8, "weekly")).join("\n");
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// Brands sitemap
router.get("/sitemap-brands.xml", async (_req, res): Promise<void> => {
  const brands = await db
    .select({ slug: brandsTable.slug, createdAt: brandsTable.createdAt })
    .from(brandsTable)
    .where(eq(brandsTable.isActive, true));

  type BrandRow = { slug: string; createdAt: Date };

  const urls = brands.map((b: BrandRow) => sitemapUrl(`/brands/${b.slug}`, b.createdAt, 0.7, "weekly")).join("\n");
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// Blog sitemap
router.get("/sitemap-blog.xml", async (_req, res): Promise<void> => {
  const posts = await db
    .select({ slug: blogPostsTable.slug, updatedAt: blogPostsTable.updatedAt })
    .from(blogPostsTable)
    .where(eq(blogPostsTable.isPublished, true))
    .orderBy(desc(blogPostsTable.updatedAt));

  type BlogPostRow = { slug: string; updatedAt: Date };

  const urls = posts.map((p: BlogPostRow) => sitemapUrl(`/blog/${p.slug}`, p.updatedAt, 0.7, "monthly")).join("\n");
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

export default router;
