import { pgTable, text, boolean, timestamp, integer, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { apps } from "./apps";
import { integrations } from "./integrations";

// Alert trigger types
export const alertTriggerTypeEnum = pgEnum("alert_trigger_type", [
  "status_change",      // online→offline or offline→online
  "consecutive_failures", // After N consecutive failures
  "response_time",      // Response time exceeds threshold
  "integration_status", // Integration goes offline/online
]);

// Alert severity levels
export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical",
]);

// Notification channel types
export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "webhook",
  "in_app",
]);

// Alert status
export const alertStatusEnum = pgEnum("alert_status", [
  "active",
  "resolved",
  "acknowledged",
  "silenced",
]);

/**
 * Alert rules - defines what conditions trigger an alert
 */
export const alertRules = pgTable("alert_rules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true),

  // Trigger configuration
  triggerType: alertTriggerTypeEnum("trigger_type").notNull(),

  // What to monitor - can be specific app, integration, or null for all
  appId: text("app_id").references(() => apps.id, { onDelete: "cascade" }),
  integrationId: text("integration_id").references(() => integrations.id, { onDelete: "cascade" }),

  // Trigger conditions (varies by trigger type)
  conditions: jsonb("conditions").$type<{
    // For status_change
    fromStatus?: "online" | "offline" | "unknown";
    toStatus?: "online" | "offline" | "unknown";

    // For consecutive_failures
    failureThreshold?: number;

    // For response_time
    responseTimeThreshold?: number; // in ms

    // For integration_status
    integrationTypes?: string[];
  }>().default({}),

  severity: alertSeverityEnum("severity").default("warning"),

  // Notification settings
  channels: jsonb("channels").$type<{
    email?: boolean;
    webhook?: boolean;
    inApp?: boolean;
  }>().default({ inApp: true }),

  // Cooldown period (avoid spamming)
  cooldownMinutes: integer("cooldown_minutes").default(15),

  // Last triggered timestamp (for cooldown)
  lastTriggeredAt: timestamp("last_triggered_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("alert_rules_user_id_idx").on(table.userId),
  appIdIdx: index("alert_rules_app_id_idx").on(table.appId),
  enabledIdx: index("alert_rules_enabled_idx").on(table.enabled),
}));

/**
 * Alert history - stores triggered alert events
 */
export const alertHistory = pgTable("alert_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  alertRuleId: text("alert_rule_id").references(() => alertRules.id, { onDelete: "set null" }),

  // Snapshot of what triggered the alert
  alertName: text("alert_name").notNull(),
  triggerType: alertTriggerTypeEnum("trigger_type").notNull(),
  severity: alertSeverityEnum("severity").notNull(),

  // What triggered it
  appId: text("app_id").references(() => apps.id, { onDelete: "set null" }),
  appName: text("app_name"), // Snapshot in case app is deleted
  integrationId: text("integration_id").references(() => integrations.id, { onDelete: "set null" }),
  integrationName: text("integration_name"), // Snapshot

  // Alert details
  status: alertStatusEnum("status").default("active"),
  message: text("message").notNull(),
  details: jsonb("details").$type<{
    previousStatus?: string;
    currentStatus?: string;
    consecutiveFailures?: number;
    responseTime?: number;
    error?: string;
  }>(),

  // Resolution info
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"), // "auto" or user ID
  acknowledgedAt: timestamp("acknowledged_at"),

  // Notification delivery status
  notificationsSent: jsonb("notifications_sent").$type<{
    email?: { sent: boolean; sentAt?: string; error?: string };
    webhook?: { sent: boolean; sentAt?: string; error?: string; statusCode?: number };
    inApp?: { sent: boolean; sentAt?: string };
  }>(),

  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("alert_history_user_id_idx").on(table.userId),
  alertRuleIdIdx: index("alert_history_alert_rule_id_idx").on(table.alertRuleId),
  statusIdx: index("alert_history_status_idx").on(table.status),
  triggeredAtIdx: index("alert_history_triggered_at_idx").on(table.triggeredAt),
}));

/**
 * Notification preferences - per-user notification settings
 */
export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),

  // Global notification settings
  globalEnabled: boolean("global_enabled").default(true),

  // Email notification settings
  emailEnabled: boolean("email_enabled").default(false),
  emailAddress: text("email_address"),
  emailVerified: boolean("email_verified").default(false),

  // Webhook settings
  webhookEnabled: boolean("webhook_enabled").default(false),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"), // For signing payloads
  webhookHeaders: jsonb("webhook_headers").$type<Record<string, string>>(),

  // In-app notification settings
  inAppEnabled: boolean("in_app_enabled").default(true),
  inAppSound: boolean("in_app_sound").default(true),

  // Quiet hours (don't send notifications during these times)
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false),
  quietHoursStart: text("quiet_hours_start"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end"), // HH:MM format
  timezone: text("timezone").default("UTC"),

  // Digest settings (batch notifications)
  digestEnabled: boolean("digest_enabled").default(false),
  digestFrequency: text("digest_frequency").default("daily"), // hourly, daily, weekly
  lastDigestSentAt: timestamp("last_digest_sent_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * In-app notifications - stored notifications for display in the UI
 */
export const inAppNotifications = pgTable("in_app_notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  alertHistoryId: text("alert_history_id").references(() => alertHistory.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: alertSeverityEnum("severity").default("info"),

  // Link to relevant resource
  linkType: text("link_type"), // "app", "integration", "alert"
  linkId: text("link_id"),

  // Status
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  dismissed: boolean("dismissed").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("in_app_notifications_user_id_idx").on(table.userId),
  readIdx: index("in_app_notifications_read_idx").on(table.read),
  createdAtIdx: index("in_app_notifications_created_at_idx").on(table.createdAt),
}));

// Relations
export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  user: one(users, {
    fields: [alertRules.userId],
    references: [users.id],
  }),
  app: one(apps, {
    fields: [alertRules.appId],
    references: [apps.id],
  }),
  integration: one(integrations, {
    fields: [alertRules.integrationId],
    references: [integrations.id],
  }),
  history: many(alertHistory),
}));

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  user: one(users, {
    fields: [alertHistory.userId],
    references: [users.id],
  }),
  alertRule: one(alertRules, {
    fields: [alertHistory.alertRuleId],
    references: [alertRules.id],
  }),
  app: one(apps, {
    fields: [alertHistory.appId],
    references: [apps.id],
  }),
  integration: one(integrations, {
    fields: [alertHistory.integrationId],
    references: [integrations.id],
  }),
  inAppNotifications: one(inAppNotifications, {
    fields: [alertHistory.id],
    references: [inAppNotifications.alertHistoryId],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const inAppNotificationsRelations = relations(inAppNotifications, ({ one }) => ({
  user: one(users, {
    fields: [inAppNotifications.userId],
    references: [users.id],
  }),
  alertHistory: one(alertHistory, {
    fields: [inAppNotifications.alertHistoryId],
    references: [alertHistory.id],
  }),
}));

// Types
export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
export type AlertHistory = typeof alertHistory.$inferSelect;
export type NewAlertHistory = typeof alertHistory.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type NewInAppNotification = typeof inAppNotifications.$inferInsert;

// Condition types for type safety
export type AlertConditions = {
  fromStatus?: "online" | "offline" | "unknown";
  toStatus?: "online" | "offline" | "unknown";
  failureThreshold?: number;
  responseTimeThreshold?: number;
  integrationTypes?: string[];
};

export type AlertChannels = {
  email?: boolean;
  webhook?: boolean;
  inApp?: boolean;
};

export type NotificationsSent = {
  email?: { sent: boolean; sentAt?: string; error?: string };
  webhook?: { sent: boolean; sentAt?: string; error?: string; statusCode?: number };
  inApp?: { sent: boolean; sentAt?: string };
};

export type AlertDetails = {
  previousStatus?: string;
  currentStatus?: string;
  consecutiveFailures?: number;
  responseTime?: number;
  error?: string;
};
