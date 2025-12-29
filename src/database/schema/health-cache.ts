import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { apps } from "./apps";
import { users } from "./auth";

/**
 * Health check cache table - stores cached health check results
 * with configurable TTLs per app and smart invalidation support
 */
export const healthCache = pgTable("health_cache", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  appId: text("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["online", "offline", "unknown"] }).notNull(),
  responseTime: integer("response_time"), // in milliseconds
  error: text("error"),
  lastChecked: timestamp("last_checked").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  metadata: jsonb("metadata").$type<{
    httpStatusCode?: number;
    checksCount?: number;
    consecutiveFailures?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const healthCacheRelations = relations(healthCache, ({ one }) => ({
  app: one(apps, {
    fields: [healthCache.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [healthCache.userId],
    references: [users.id],
  }),
}));

export type HealthCacheEntry = typeof healthCache.$inferSelect;
export type NewHealthCacheEntry = typeof healthCache.$inferInsert;
