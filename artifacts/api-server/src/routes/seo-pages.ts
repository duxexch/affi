import { Router, type IRouter } from "express";
import { and, eq, desc, or, sql } from "drizzle-orm";
import { db, seoPagesTable } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAuth.js";
import { z } from "zod";

const router: IRouter = Router();

const SEO_SLUGS = [
  "about",
  "contact",
  "privacy-policy",
  "terms-of-service",
  "faq",
  "how-it-works",
  "refund-policy",
  "advertising",
  "support",
  "careers",
] as const;

type SeoSlug = (typeof SEO_SLUGS)[number];

const DefaultTemplates: Record<
  SeoSlug,
  {
    titleAr: string;
    titleEn: string;
    excerptAr: string;
    excerptEn: string;
    contentAr: string;
    contentEn: string;
  }
> = {
  about: {
    titleAr: "من نحن",
    titleEn: "About Us",
    excerptAr: "منصة تجمع أفضل العروض والخصومات من العلامات التجارية الرائدة.",
    excerptEn: "A platform that curates the best deals and discounts from top brands.",
    contentAr:
      "<p>مرحبًا بك في AffiliateDeals.</p><p>نحن نبحث يوميًا عن أفضل العروض والخصومات لتوفير وقتك وميزانيتك.</p><p>نحن ملتزمون بتقديم معلومات واضحة وروابط آمنة قدر الإمكان.</p>",
    contentEn:
      "<p>Welcome to AffiliateDeals.</p><p>We review offers daily to save your time and budget.</p><p>We aim to keep information clear and links as safe as possible.</p>",
  },
  contact: {
    titleAr: "اتصل بنا",
    titleEn: "Contact Us",
    excerptAr: "تواصل معنا بخصوص أي استفسار أو اقتراح.",
    excerptEn: "Reach out for questions, partnerships, or suggestions.",
    contentAr:
      "<p>لأي استفسار، اكتب لنا عبر البريد الإلكتروني المناسب ضمن هذه الصفحة.</p><p>سنقوم بالرد في أقرب وقت ممكن.</p>",
    contentEn:
      "<p>For any question, email us using the address provided on this page.</p><p>We will reply as soon as possible.</p>",
  },
  "privacy-policy": {
    titleAr: "سياسة الخصوصية",
    titleEn: "Privacy Policy",
    excerptAr: "نوضح كيفية جمع واستخدام بياناتك بشكل شفاف.",
    excerptEn: "How we collect and use your data—clearly and transparently.",
    contentAr:
      "<p>نحن نقدر خصوصيتك.</p><p>قد نجمع بيانات أساسية لتحسين تجربة المستخدم.</p><p>لا نبيع بياناتك لأي طرف.</p>",
    contentEn:
      "<p>We respect your privacy.</p><p>We may collect basic data to improve user experience.</p><p>We do not sell your data.</p>",
  },
  "terms-of-service": {
    titleAr: "شروط الخدمة",
    titleEn: "Terms of Service",
    excerptAr: "هذه شروط استخدام المنصة بشكل واضح.",
    excerptEn: "Clear rules for using our platform.",
    contentAr:
      "<p>باستخدام المنصة، فإنك توافق على هذه الشروط.</p><p>قد نحدث الشروط من وقت لآخر.</p>",
    contentEn:
      "<p>By using the platform, you agree to these terms.</p><p>We may update terms from time to time.</p>",
  },
  faq: {
    titleAr: "الأسئلة الشائعة",
    titleEn: "Frequently Asked Questions",
    excerptAr: "إجابات مختصرة على أكثر الأسئلة شيوعًا.",
    excerptEn: "Short answers to the most common questions.",
    contentAr:
      "<p><strong>كيف تعمل?</strong> نقوم بتجميع العروض ثم نقودك للرابط الرسمي للحصول على الخصم.</p><p><strong>هل الروابط آمنة؟</strong> نحرص على تحديث المحتوى قدر الإمكان.</p>",
    contentEn:
      "<p><strong>How does it work?</strong> We curate offers and send you to the official link to claim the discount.</p><p><strong>Are links safe?</strong> We keep content updated as much as possible.</p>",
  },
  "how-it-works": {
    titleAr: "كيف تعمل المنصة؟",
    titleEn: "How It Works",
    excerptAr: "خطوات بسيطة للحصول على أفضل العروض.",
    excerptEn: "Simple steps to get the best deals.",
    contentAr:
      "<p>1) نعرض أفضل العروض.</p><p>2) تختار العرض المناسب.</p><p>3) نرسلّك للمتجر/الجهة الرسمية.</p>",
    contentEn:
      "<p>1) Browse the best deals.</p><p>2) Choose the deal you like.</p><p>3) We redirect you to the official store.</p>",
  },
  "refund-policy": {
    titleAr: "سياسة الاسترجاع",
    titleEn: "Refund Policy",
    excerptAr: "توضيح سياسة الاسترجاع بشكل واضح.",
    excerptEn: "Clear refund policy details.",
    contentAr:
      "<p>عادةً، الاسترجاع يعتمد على الجهة/المتجر الذي يتم التحويل إليه.</p><p>سنوضح التفاصيل عند الحاجة.</p>",
    contentEn:
      "<p>Refunds typically depend on the merchant you are redirected to.</p><p>We will share details when applicable.</p>",
  },
  advertising: {
    titleAr: "الإعلانات",
    titleEn: "Advertising",
    excerptAr: "معلومات حول الإعلانات والشراكات.",
    excerptEn: "Advertising and partnership information.",
    contentAr:
      "<p>قد نعرض محتوى ممولًا أو شراكات تابعة.</p><p>نحاول أن تكون التجربة شفافة قدر الإمكان.</p>",
    contentEn:
      "<p>We may show sponsored content or affiliate partnerships.</p><p>We aim for transparency.</p>",
  },
  support: {
    titleAr: "الدعم",
    titleEn: "Support",
    excerptAr: "نساعدك في أي مشكلة أو استفسار.",
    excerptEn: "We help with issues and questions.",
    contentAr:
      "<p>إذا واجهت أي مشكلة، تواصل معنا عبر صفحة الاتصال.</p><p>نستهدف حل المشكلات بسرعة.</p>",
    contentEn:
      "<p>If you face an issue, contact us via the Contact page.</p><p>We aim to resolve quickly.</p>",
  },
  careers: {
    titleAr: "الوظائف",
    titleEn: "Careers",
    excerptAr: "انضم لفريقنا إذا كنت تحب العمل معنا.",
    excerptEn: "Join our team if you’d like to work with us.",
    contentAr:
      "<p>نبحث دائمًا عن أشخاص يشاركوننا شغف تحسين تجربة المستخدم.</p><p>راسلنا عبر البريد المناسب.</p>",
    contentEn:
      "<p>We’re always looking for people who care about improving user experience.</p><p>Send us a message through the appropriate channel.</p>",
  },
};

const GetSeoPageParams = z.object({ slug: z.string() });

const UpdateSeoPageBody = z.object({
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  excerptAr: z.string().optional().nullable(),
  excerptEn: z.string().optional().nullable(),
  contentAr: z.string().optional().nullable(),
  contentEn: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

type UpdateSeoPageBody = z.infer<typeof UpdateSeoPageBody>;

async function ensureSeoPage(slug: SeoSlug) {
  const tpl = DefaultTemplates[slug];

  const [row] = await db
    .select()
    .from(seoPagesTable)
    .where(eq(seoPagesTable.slug, slug))
    .limit(1);

  if (row) return row;

  const [created] = await db
    .insert(seoPagesTable)
    .values({
      slug,
      titleAr: tpl.titleAr,
      titleEn: tpl.titleEn,
      excerptAr: tpl.excerptAr,
      excerptEn: tpl.excerptEn,
      contentAr: tpl.contentAr,
      contentEn: tpl.contentEn,
      isPublished: true,
      // createdAt/updatedAt defaults
    })
    .returning();

  return created;
}

function isAllowedSlug(slug: string): slug is SeoSlug {
  return (SEO_SLUGS as readonly string[]).includes(slug);
}

// Public: fetch by slug (auto-creates defaults if missing)
router.get("/seo-pages/:slug", async (req, res) => {
  const params = GetSeoPageParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: params.error.message });

  const slug = params.data.slug;

  if (!isAllowedSlug(slug)) return res.status(404).json({ error: "Page not found" });

  try {
    const row = await ensureSeoPage(slug);
    if (!row.isPublished) return res.status(404).json({ error: "Page not published" });
    return res.json(row);
  } catch (_err) {
    return res.status(404).json({ error: "Page not found" });
  }
});

// Admin: list all SEO pages (ensures all defaults exist)
router.get("/admin/seo-pages", requireAdmin, async (_req, res) => {
  try {
    const results = await Promise.all(
      SEO_SLUGS.map(async (slug) => {
        const row = await ensureSeoPage(slug);
        return row;
      }),
    );

    res.json({ items: results, total: results.length });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load seo pages" });
  }
});

// Admin: update a single page by slug
router.put("/admin/seo-pages/:slug", requireAdmin, async (req, res) => {
  const params = GetSeoPageParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: params.error.message });

  const body = UpdateSeoPageBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const slug = params.data.slug;
  if (!isAllowedSlug(slug)) return res.status(404).json({ error: "Page not found" });

  const data: UpdateSeoPageBody = body.data;

  try {
    const updates = {
      titleAr: data.titleAr,
      titleEn: data.titleEn,
      excerptAr: data.excerptAr ?? null,
      excerptEn: data.excerptEn ?? null,
      contentAr: data.contentAr ?? null,
      contentEn: data.contentEn ?? null,
      isPublished: data.isPublished ?? true,
    };

    const [updated] = await db
      .update(seoPagesTable)
      .set(updates)
      .where(eq(seoPagesTable.slug, slug))
      .returning();

    if (!updated) {
      const created = await ensureSeoPage(slug);
      return res.json(created);
    }

    return res.json(updated);
  } catch (_err) {
    return res.status(500).json({ error: "Failed to update seo page" });
  }
});

export default router;
