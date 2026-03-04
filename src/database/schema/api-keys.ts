import { pgTable, text, boolean, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

// API key scopes - define what actions are allowed
export const apiKeyScopeEnum = pgEnum("api_key_scope", [
  "read:apps",           // Read app list and details
  "read:health",         // Read health check results
  "write:apps",          // Create/update/delete apps
  "read:categories",     // Read categories
  "write:categories",    // Create/update/delete categories
  "read:integrations",   // Read integration configs
  "write:integrations",  // Create/update/delete integrations
  "trigger:health",      // Trigger health checks
  "read:analytics",      // Read analytics data
  "admin",               // Full access (all permissions)
]);

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  // The key prefix is stored for display (first 8 chars)
  keyPrefix: text("key_prefix").notNull(),
  // The full key is hashed and stored for verification
  keyHash: text("key_hash").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Scopes as a comma-separated string (simpler than array for queries)
  scopes: text("scopes").notNull().default("read:apps,read:health"),
  // Rate limiting
  rateLimitPerMinute: integer("rate_limit_per_minute").default(60),
  rateLimitPerHour: integer("rate_limit_per_hour").default(1000),
  // Status and tracking
  enabled: boolean("enabled").default(true),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  lastUsedIp: text("last_used_ip"),
  usageCount: integer("usage_count").default(0),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// Rate limit tracking table - for in-memory or persistent rate limiting
export const apiRateLimits = pgTable("api_rate_limits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  apiKeyId: text("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  windowStart: timestamp("window_start").notNull(),
  windowType: text("window_type").notNull(), // "minute" or "hour"
  requestCount: integer("request_count").default(0),
});

export const apiRateLimitsRelations = relations(apiRateLimits, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiRateLimits.apiKeyId],
    references: [apiKeys.id],
  }),
}));

// API request logs for auditing
export const apiRequestLogs = pgTable("api_request_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  apiKeyId: text("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // in milliseconds
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiRequestLogsRelations = relations(apiRequestLogs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiRequestLogs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiRateLimit = typeof apiRateLimits.$inferSelect;
export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;

// Helper type for scope checking
export type ApiKeyScope =
  | "read:apps"
  | "read:health"
  | "write:apps"
  | "read:categories"
  | "write:categories"
  | "read:integrations"
  | "write:integrations"
  | "trigger:health"
  | "read:analytics"
  | "admin";
