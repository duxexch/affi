import { pgTable, serial, integer, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { offersTable } from "./offers";

export const clicksTable = pgTable("clicks", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull().references(() => offersTable.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referer: text("referer"),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  utmContent: varchar("utm_content", { length: 100 }),
  country: varchar("country", { length: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
