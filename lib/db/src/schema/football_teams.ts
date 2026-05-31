import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const footballTeamsTable = pgTable("football_teams", {
  id: serial("id").primaryKey(),

  // MVP: soccer only, but we keep sport column for future expansion
  sport: text("sport").notNull(), // e.g. "football"

  slug: text("slug").notNull().unique(), // unique key from mock dataset

  name: text("name").notNull(),
  countryCode: text("country_code").notNull(), // e.g. "EG"

  // Strength/Elo-like value used to compute probabilities
  strengthRating: integer("strength_rating").notNull().default(1500),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFootballTeamSchema = createInsertSchema(footballTeamsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFootballTeam = z.infer<typeof insertFootballTeamSchema>;
export type FootballTeam = typeof footballTeamsTable.$inferSelect;
