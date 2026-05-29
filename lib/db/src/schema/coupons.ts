import { pgTable, serial, integer, varchar, boolean, timestamp, text, numeric, pgEnum } from "drizzle-orm/pg-core";
import { offersTable } from "./offers";

export const couponTypeEnum = pgEnum("coupon_type", ["percentage", "fixed", "free_shipping"]);

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").references(() => offersTable.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 100 }).notNull(),
  description: text("description"),
  type: couponTypeEnum("type").notNull().default("percentage"),
  value: numeric("value", { precision: 10, scale: 2 }),
  minimumPurchase: numeric("minimum_purchase", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
