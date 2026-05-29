import { pgTable, serial, text, boolean, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  description: text("description"),
  discountPercent: integer("discount_percent"),
  originalPrice: numeric("original_price", { precision: 12, scale: 2 }),
  currentPrice: numeric("current_price", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  clickCount: integer("click_count").notNull().default(0),
  categoryId: integer("category_id"),
  brandId: integer("brand_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastmod: timestamp("lastmod", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, clickCount: true, createdAt: true, updatedAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;
