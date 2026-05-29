import { sql } from "drizzle-orm";
import {
  mysqlTable,
  serial,
  varchar,
  boolean,
  datetime,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const usersTable = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "editor", "viewer"])
    .notNull()
    .default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: datetime("last_login_at"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});
