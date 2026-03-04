/**
 * Alert Validation Schemas
 *
 * Defines Zod schemas for alert-related operations.
 */

import { z } from "zod";
import { uuid, optionalUuid, requiredString, optionalString, optionalUrl } from "./common";

// ============================================================================
// Constants
// ============================================================================

export const TRIGGER_TYPES = [
  "status_change",
  "consecutive_failures",
  "response_time",
  "integration_status",
] as const;

export const SEVERITY_LEVELS = ["info", "warning", "critical"] as const;

export const ALERT_STATUSES = ["pending", "triggered", "acknowledged", "resolved"] as const;

export const DIGEST_FREQUENCIES = ["hourly", "daily", "weekly"] as const;

// ============================================================================
// Alert Rule Schemas
// ============================================================================

/**
 * Alert conditions schema
 */
export const alertConditionsSchema = z.object({
  type: z.enum(["status_change", "response_time", "downtime_duration"]).optional(),
  operator: z.enum(["gt", "lt", "eq", "gte", "lte"]).optional(),
  value: z.number().optional(),
  fromStatus: z.string().optional(),
  toStatus: z.string().optional(),
  consecutiveCount: z.number().int().positive().optional(),
  thresholdMs: z.number().int().positive().optional(),
  durationMinutes: z.number().int().positive().optional(),
}).default({});

/**
 * Alert channels schema
 */
export const alertChannelsSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  webhook: z.object({
    url: z.string().url(),
    headers: z.record(z.string(), z.string()).optional(),
  }).optional(),
  integration: z.object({
    id: z.string().uuid(),
    type: z.string(),
  }).optional(),
}).default({ inApp: true });

/**
 * Schema for creating a new alert rule
 */
export const createAlertRuleSchema = z.object({
  name: requiredString.pipe(
    z.string().max(100, "Name must be 100 characters or less")
  ),
  description: optionalString.pipe(
    z.string().max(500, "Description must be 500 characters or less").nullable()
  ).optional(),
  enabled: z.boolean().default(true),
  triggerType: z.enum(TRIGGER_TYPES),
  appId: optionalUuid.optional(),
  integrationId: optionalUuid.optional(),
  conditions: alertConditionsSchema.optional(),
  severity: z.enum(SEVERITY_LEVELS).default("warning"),
  channels: alertChannelsSchema.optional(),
  cooldownMinutes: z.number().int().positive().max(1440).default(15),
});

/**
 * Schema for updating an existing alert rule
 */
export const updateAlertRuleSchema = z.object({
  id: uuid,
  data: z.object({
    name: requiredString.pipe(
      z.string().max(100, "Name must be 100 characters or less")
    ).optional(),
    description: optionalString.optional(),
    enabled: z.boolean().optional(),
    triggerType: z.enum(TRIGGER_TYPES).optional(),
    appId: optionalUuid.optional(),
    integrationId: optionalUuid.optional(),
    conditions: alertConditionsSchema.optional(),
    severity: z.enum(SEVERITY_LEVELS).optional(),
    channels: alertChannelsSchema.optional(),
    cooldownMinutes: z.number().int().positive().max(1440).optional(),
  }),
});

/**
 * Schema for deleting an alert rule
 */
export const deleteAlertRuleSchema = z.object({
  id: uuid,
});

/**
 * Schema for toggling an alert rule
 */
export const toggleAlertRuleSchema = z.object({
  id: uuid,
  enabled: z.boolean(),
});

// ============================================================================
// Alert History Schemas
// ============================================================================

/**
 * Schema for getting alert history
 */
export const getAlertHistorySchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  status: z.string().optional(),
  appId: z.string().uuid().optional(),
});

/**
 * Schema for acknowledging an alert
 */
export const acknowledgeAlertSchema = z.object({
  id: uuid,
});

/**
 * Schema for resolving an alert
 */
export const resolveAlertSchema = z.object({
  id: uuid,
});

/**
 * Schema for bulk resolving alerts
 */
export const bulkResolveAlertsSchema = z.object({
  ids: z.array(uuid).min(1, "At least one alert must be selected"),
});

/**
 * Schema for clearing old alert history
 */
export const clearOldAlertHistorySchema = z.object({
  daysToKeep: z.number().int().positive().max(365).default(30),
});

// ============================================================================
// Notification Preferences Schemas
// ============================================================================

/**
 * Schema for updating notification preferences
 */
export const updateNotificationPreferencesSchema = z.object({
  globalEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  emailAddress: z.string().email().or(z.literal("")).nullable().optional(),
  webhookEnabled: z.boolean().optional(),
  webhookUrl: optionalUrl.optional(),
  webhookSecret: optionalString.optional(),
  webhookHeaders: z.record(z.string(), z.string()).nullable().optional(),
  inAppEnabled: z.boolean().optional(),
  inAppSound: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be in HH:MM format").nullable().optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be in HH:MM format").nullable().optional(),
  timezone: z.string().optional(),
  digestEnabled: z.boolean().optional(),
  digestFrequency: z.enum(DIGEST_FREQUENCIES).optional(),
});

/**
 * Schema for testing webhook
 */
export const testWebhookSchema = z.object({
  webhookUrl: z.string().url("Must be a valid URL"),
  webhookSecret: z.string().optional(),
  webhookHeaders: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// In-App Notification Schemas
// ============================================================================

/**
 * Schema for getting in-app notifications
 */
export const getInAppNotificationsSchema = z.object({
  unreadOnly: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
});

/**
 * Schema for marking a notification as read
 */
export const markNotificationReadSchema = z.object({
  id: uuid,
});

/**
 * Schema for dismissing a notification
 */
export const dismissNotificationSchema = z.object({
  id: uuid,
});

// ============================================================================
// Type Exports
// ============================================================================

export type AlertConditions = z.infer<typeof alertConditionsSchema>;
export type AlertChannels = z.infer<typeof alertChannelsSchema>;
export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;
export type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;
export type DeleteAlertRuleInput = z.infer<typeof deleteAlertRuleSchema>;
export type ToggleAlertRuleInput = z.infer<typeof toggleAlertRuleSchema>;
export type GetAlertHistoryInput = z.infer<typeof getAlertHistorySchema>;
export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>;
export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;
export type BulkResolveAlertsInput = z.infer<typeof bulkResolveAlertsSchema>;
export type ClearOldAlertHistoryInput = z.infer<typeof clearOldAlertHistorySchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type TestWebhookInput = z.infer<typeof testWebhookSchema>;
export type GetInAppNotificationsInput = z.infer<typeof getInAppNotificationsSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type DismissNotificationInput = z.infer<typeof dismissNotificationSchema>;
