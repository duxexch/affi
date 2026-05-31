import { pgTable, serial, integer, timestamp, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const footballPredictionRequestsTable = pgTable("football_prediction_requests", {
  id: serial("id").primaryKey(),

  // Auth user (JWT sub)
  userId: integer("user_id").notNull(),

  // Team selection (store ids to join later)
  teamAId: integer("team_a_id").notNull(),
  teamBId: integer("team_b_id").notNull(),

  // Predicted outcomes (MVP)
  predictedScoreA: integer("predicted_score_a").notNull(),
  predictedScoreB: integer("predicted_score_b").notNull(),

  expectedGoalsA: numeric("expected_goals_a", { precision: 10, scale: 3 }).notNull(),
  expectedGoalsB: numeric("expected_goals_b", { precision: 10, scale: 3 }).notNull(),

  winAProb: numeric("win_a_prob", { precision: 6, scale: 4 }).notNull(),
  drawProb: numeric("draw_prob", { precision: 6, scale: 4 }).notNull(),
  winBProb: numeric("win_b_prob", { precision: 6, scale: 4 }).notNull(),

  // Flow control for admin
  status: text("status").notNull().default("pending"), // pending | resolved
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),

  // Optional actual score (set by admin)
  actualScoreA: integer("actual_score_a"),
  actualScoreB: integer("actual_score_b"),

  // Debug/audit input key (derived)
  inputKey: text("input_key").notNull(),

  isSuccess: integer("is_success").notNull().default(1), // 1/0
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFootballPredictionRequestSchema = createInsertSchema(
  footballPredictionRequestsTable,
).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type InsertFootballPredictionRequest = z.infer<typeof insertFootballPredictionRequestSchema>;
export type FootballPredictionRequest = typeof footballPredictionRequestsTable.$inferSelect;
