import { pgTable, text, timestamp, integer, real, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { apps } from "./apps";
import { users } from "./auth";

/**
 * App access log - tracks individual app access events for analytics
 * Used to calculate access frequency and last accessed time
 */
export const appAccessLog = pgTable("app_access_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  appId: text("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  accessType: text("access_type", { enum: ["click", "open_local", "open_remote"] }).default("click"),
}, (table) => ({
  appIdIdx: index("app_access_log_app_id_idx").on(table.appId),
  userIdIdx: index("app_access_log_user_id_idx").on(table.userId),
  accessedAtIdx: index("app_access_log_accessed_at_idx").on(table.accessedAt),
  userAppIdx: index("app_access_log_user_app_idx").on(table.userId, table.appId),
}));

/**
 * App usage metrics - aggregated daily/hourly metrics for each app
 * Stores rolled-up data for efficient analytics queries
 */
export const appUsageMetrics = pgTable("app_usage_metrics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  appId: text("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // The day this metric represents (truncated to midnight)

  // Access metrics
  accessCount: integer("access_count").default(0).notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),

  // Health metrics (aggregated from health checks)
  totalHealthChecks: integer("total_health_checks").default(0),
  successfulHealthChecks: integer("successful_health_checks").default(0),
  failedHealthChecks: integer("failed_health_checks").default(0),
  totalResponseTime: integer("total_response_time").default(0), // Sum of response times in ms
  minResponseTime: integer("min_response_time"),
  maxResponseTime: integer("max_response_time"),

  // Computed uptime percentage (stored for efficiency)
  uptimePercentage: real("uptime_percentage"),

  // Additional metadata
  metadata: jsonb("metadata").$type<{
    hourlyAccess?: number[]; // Array of 24 elements representing hourly access counts
    accessByType?: { click?: number; open_local?: number; open_remote?: number };
  }>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  appIdIdx: index("app_usage_metrics_app_id_idx").on(table.appId),
  userIdIdx: index("app_usage_metrics_user_id_idx").on(table.userId),
  dateIdx: index("app_usage_metrics_date_idx").on(table.date),
  userDateIdx: index("app_usage_metrics_user_date_idx").on(table.userId, table.date),
  appDateIdx: index("app_usage_metrics_app_date_idx").on(table.appId, table.date),
}));

/**
 * Health history - stores historical health check data for trend analysis
 * More detailed than the cache, kept for longer periods
 */
export const healthHistory = pgTable("health_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  appId: text("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["online", "offline", "unknown"] }).notNull(),
  responseTime: integer("response_time"), // in milliseconds
  error: text("error"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
}, (table) => ({
  appIdIdx: index("health_history_app_id_idx").on(table.appId),
  userIdIdx: index("health_history_user_id_idx").on(table.userId),
  checkedAtIdx: index("health_history_checked_at_idx").on(table.checkedAt),
  appCheckedAtIdx: index("health_history_app_checked_at_idx").on(table.appId, table.checkedAt),
}));

// Relations
export const appAccessLogRelations = relations(appAccessLog, ({ one }) => ({
  app: one(apps, {
    fields: [appAccessLog.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [appAccessLog.userId],
    references: [users.id],
  }),
}));

export const appUsageMetricsRelations = relations(appUsageMetrics, ({ one }) => ({
  app: one(apps, {
    fields: [appUsageMetrics.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [appUsageMetrics.userId],
    references: [users.id],
  }),
}));

export const healthHistoryRelations = relations(healthHistory, ({ one }) => ({
  app: one(apps, {
    fields: [healthHistory.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [healthHistory.userId],
    references: [users.id],
  }),
}));

// Types
export type AppAccessLog = typeof appAccessLog.$inferSelect;
export type NewAppAccessLog = typeof appAccessLog.$inferInsert;
export type AppUsageMetrics = typeof appUsageMetrics.$inferSelect;
export type NewAppUsageMetrics = typeof appUsageMetrics.$inferInsert;
export type HealthHistory = typeof healthHistory.$inferSelect;
export type NewHealthHistory = typeof healthHistory.$inferInsert;
