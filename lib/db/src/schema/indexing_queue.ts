import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const indexingQueueTable = pgTable("indexing_queue", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  provider: text("provider").notNull().default("indexnow"),
  attempts: integer("attempts").notNull().default(0),
  errorMessage: text("error_message"),
  idempotencyKey: text("idempotency_key").unique(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIndexingQueueSchema = createInsertSchema(indexingQueueTable).omit({ id: true, createdAt: true });
export type InsertIndexingQueueItem = z.infer<typeof insertIndexingQueueSchema>;
export type IndexingQueueItem = typeof indexingQueueTable.$inferSelect;
