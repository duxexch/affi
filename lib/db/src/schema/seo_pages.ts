import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seoPagesTable = pgTable("seo_pages", {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),

    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull(),

    excerptAr: text("excerpt_ar"),
    excerptEn: text("excerpt_en"),

    // HTML content edited from Admin (Textarea)
    contentAr: text("content_ar"),
    contentEn: text("content_en"),

    // Optional: allow disabling individual pages
    isPublished: boolean("is_published").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSeoPageSchema = createInsertSchema(seoPagesTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export type InsertSeoPage = z.infer<typeof insertSeoPageSchema>;

export type SeoPage = typeof seoPagesTable.$inferSelect;
