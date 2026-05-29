import { sql } from "drizzle-orm";
import {
  mysqlTable,
  serial,
  int,
  varchar,
  datetime,
  text,
} from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const sessionsTable = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  refreshTokenHash: varchar("refresh_token_hash", { length: 255 })
    .notNull()
    .unique(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
