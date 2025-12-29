import { createServerFn } from "@tanstack/react-start";
import type {
  NewAlertRule,
  NewAlertHistory,
  AlertConditions,
  AlertChannels,
} from "@/database/schema/alerts";

// ============================================================================
// Alert Rules CRUD
// ============================================================================

/**
 * Get all alert rules for the current user
 */
export const getAlertRules = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, desc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { alertRules } = await import("@/database/schema/alerts");

  const session = await getOptionalSession();
  if (!session) return { alertRules: [] };

  const db = await getDb();
  const rules = await db.query.alertRules.findMany({
    where: eq(alertRules.userId, session.user.id),
    orderBy: [desc(alertRules.createdAt)],
    with: {
      app: true,
      integration: true,
    },
  });

  return { alertRules: rules };
});

/**
 * Get a single alert rule by ID
 */
export const getAlertRule = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertRules } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    const [rule] = await db
      .select()
      .from(alertRules)
      .where(and(eq(alertRules.id, ctx.data.id), eq(alertRules.userId, session.user.id)))
      .limit(1);

    if (!rule) throw new Error("Alert rule not found");

    return { alertRule: rule };
  }
);

type CreateAlertRuleData = {
  data: {
    name: string;
    description?: string | null;
    enabled?: boolean;
    triggerType: "status_change" | "consecutive_failures" | "response_time" | "integration_status";
    appId?: string | null;
    integrationId?: string | null;
    conditions?: AlertConditions;
    severity?: "info" | "warning" | "critical";
    channels?: AlertChannels;
    cooldownMinutes?: number;
  };
};

/**
 * Create a new alert rule
 */
export const createAlertRule = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateAlertRuleData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertRules } = await import("@/database/schema/alerts");
    const { apps } = await import("@/database/schema/apps");
    const { integrations } = await import("@/database/schema/integrations");

    const session = await getAuthenticatedSession();

    const { data } = ctx;

    const db = await getDb();

    // Verify app belongs to user if specified
    if (data.appId) {
      const [app] = await db
        .select()
        .from(apps)
        .where(and(eq(apps.id, data.appId), eq(apps.userId, session.user.id)))
        .limit(1);

      if (!app) throw new Error("App not found");
    }

    // Verify integration belongs to user if specified
    if (data.integrationId) {
      const [integration] = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.id, data.integrationId), eq(integrations.userId, session.user.id)))
        .limit(1);

      if (!integration) throw new Error("Integration not found");
    }

    const [newRule] = await db
      .insert(alertRules)
      .values({
        userId: session.user.id,
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? true,
        triggerType: data.triggerType,
        appId: data.appId,
        integrationId: data.integrationId,
        conditions: data.conditions ?? {},
        severity: data.severity ?? "warning",
        channels: data.channels ?? { inApp: true },
        cooldownMinutes: data.cooldownMinutes ?? 15,
      })
      .returning();

    return newRule;
  }
);

type UpdateAlertRuleData = {
  data: {
    id: string;
    data: Partial<Omit<NewAlertRule, "id" | "userId" | "createdAt">>;
  };
};

/**
 * Update an existing alert rule
 */
export const updateAlertRule = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateAlertRuleData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertRules } = await import("@/database/schema/alerts");
    const { apps } = await import("@/database/schema/apps");
    const { integrations } = await import("@/database/schema/integrations");

    const session = await getAuthenticatedSession();

    const { id, data } = ctx.data;

    const db = await getDb();

    // Verify app belongs to user if being updated
    if (data.appId) {
      const [app] = await db
        .select()
        .from(apps)
        .where(and(eq(apps.id, data.appId), eq(apps.userId, session.user.id)))
        .limit(1);

      if (!app) throw new Error("App not found");
    }

    // Verify integration belongs to user if being updated
    if (data.integrationId) {
      const [integration] = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.id, data.integrationId), eq(integrations.userId, session.user.id)))
        .limit(1);

      if (!integration) throw new Error("Integration not found");
    }

    const [updatedRule] = await db
      .update(alertRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(alertRules.id, id), eq(alertRules.userId, session.user.id)))
      .returning();

    if (!updatedRule) throw new Error("Alert rule not found");

    return updatedRule;
  }
);

/**
 * Delete an alert rule
 */
export const deleteAlertRule = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertRules } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    await db.delete(alertRules).where(
      and(eq(alertRules.id, ctx.data.id), eq(alertRules.userId, session.user.id))
    );

    return { success: true };
  }
);

/**
 * Toggle alert rule enabled/disabled
 */
export const toggleAlertRule = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string; enabled: boolean } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertRules } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    const [updatedRule] = await db
      .update(alertRules)
      .set({
        enabled: ctx.data.enabled,
        updatedAt: new Date(),
      })
      .where(and(eq(alertRules.id, ctx.data.id), eq(alertRules.userId, session.user.id)))
      .returning();

    if (!updatedRule) throw new Error("Alert rule not found");

    return updatedRule;
  }
);

// ============================================================================
// Alert History
// ============================================================================

/**
 * Get alert history for the current user
 */
export const getAlertHistory = createServerFn({ method: "POST" }).handler(
  async (ctx: { data?: { limit?: number; status?: string; appId?: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, desc } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { alertHistory } = await import("@/database/schema/alerts");

    const session = await getOptionalSession();
    if (!session) return { alertHistory: [], total: 0 };

    const limit = ctx.data?.limit ?? 50;
    const conditions = [eq(alertHistory.userId, session.user.id)];

    if (ctx.data?.status) {
      conditions.push(eq(alertHistory.status, ctx.data.status as any));
    }

    if (ctx.data?.appId) {
      conditions.push(eq(alertHistory.appId, ctx.data.appId));
    }

    const db = await getDb();
    const history = await db.query.alertHistory.findMany({
      where: and(...conditions),
      orderBy: [desc(alertHistory.triggeredAt)],
      limit,
      with: {
        app: true,
        integration: true,
        alertRule: true,
      },
    });

    return { alertHistory: history, total: history.length };
  }
);

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertHistory } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    const [updated] = await db
      .update(alertHistory)
      .set({
        status: "acknowledged",
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(alertHistory.id, ctx.data.id), eq(alertHistory.userId, session.user.id)))
      .returning();

    if (!updated) throw new Error("Alert not found");

    return updated;
  }
);

/**
 * Resolve an alert
 */
export const resolveAlert = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertHistory } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    const [updated] = await db
      .update(alertHistory)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(and(eq(alertHistory.id, ctx.data.id), eq(alertHistory.userId, session.user.id)))
      .returning();

    if (!updated) throw new Error("Alert not found");

    return updated;
  }
);

/**
 * Bulk resolve alerts
 */
export const bulkResolveAlerts = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[] } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertHistory } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    if (!ctx.data.ids.length) return { resolved: 0 };

    const db = await getDb();
    const result = await db
      .update(alertHistory)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(alertHistory.id, ctx.data.ids),
          eq(alertHistory.userId, session.user.id)
        )
      )
      .returning();

    return { resolved: result.length };
  }
);

/**
 * Clear old alert history (keep last N days)
 */
export const clearOldAlertHistory = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { daysToKeep?: number } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, gte } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { alertHistory } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const daysToKeep = ctx.data.daysToKeep ?? 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const db = await getDb();
    const deleted = await db
      .delete(alertHistory)
      .where(
        and(
          eq(alertHistory.userId, session.user.id),
          eq(alertHistory.status, "resolved"),
          gte(alertHistory.triggeredAt, cutoffDate)
        )
      )
      .returning();

    return { deleted: deleted.length };
  }
);

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * Get notification preferences for the current user
 */
export const getNotificationPreferences = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { notificationPreferences } = await import("@/database/schema/alerts");

  const session = await getOptionalSession();
  if (!session) return { preferences: null };

  const db = await getDb();
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.user.id))
    .limit(1);

  return { preferences: prefs ?? null };
});

type UpdateNotificationPreferencesData = {
  data: {
    globalEnabled?: boolean;
    emailEnabled?: boolean;
    emailAddress?: string | null;
    webhookEnabled?: boolean;
    webhookUrl?: string | null;
    webhookSecret?: string | null;
    webhookHeaders?: Record<string, string> | null;
    inAppEnabled?: boolean;
    inAppSound?: boolean;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    timezone?: string;
    digestEnabled?: boolean;
    digestFrequency?: string;
  };
};

/**
 * Update notification preferences (creates if doesn't exist)
 */
export const updateNotificationPreferences = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateNotificationPreferencesData) => {
    const { getDb } = await import("./get-db");
    const { eq } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { notificationPreferences } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const { data } = ctx;

    const db = await getDb();

    // Check if preferences exist
    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.user.id))
      .limit(1);

    if (existing) {
      // Update
      const [updated] = await db
        .update(notificationPreferences)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, session.user.id))
        .returning();

      return updated;
    } else {
      // Insert
      const [created] = await db
        .insert(notificationPreferences)
        .values({
          userId: session.user.id,
          ...data,
        })
        .returning();

      return created;
    }
  }
);

/**
 * Test webhook configuration
 */
export const testWebhook = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { webhookUrl: string; webhookSecret?: string; webhookHeaders?: Record<string, string> } }) => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");

    const session = await getAuthenticatedSession();

    const { webhookUrl, webhookSecret, webhookHeaders } = ctx.data;

    try {
      const testPayload = {
        type: "test",
        timestamp: new Date().toISOString(),
        message: "This is a test notification from AppMap",
        user: {
          id: session.user.id,
          name: session.user.name,
        },
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "AppMap-Alerts/1.0",
        ...webhookHeaders,
      };

      // Add signature if secret is provided
      if (webhookSecret) {
        const signature = await generateWebhookSignature(JSON.stringify(testPayload), webhookSecret);
        headers["X-AppMap-Signature"] = signature;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        success: response.ok,
        statusCode: response.status,
        message: response.ok ? "Webhook test successful" : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        message: error instanceof Error ? error.message : "Webhook test failed",
      };
    }
  }
);

// ============================================================================
// In-App Notifications
// ============================================================================

/**
 * Get in-app notifications for the current user
 */
export const getInAppNotifications = createServerFn({ method: "POST" }).handler(
  async (ctx: { data?: { unreadOnly?: boolean; limit?: number } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, desc } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const session = await getOptionalSession();
    if (!session) return { notifications: [], unreadCount: 0 };

    const conditions = [
      eq(inAppNotifications.userId, session.user.id),
      eq(inAppNotifications.dismissed, false),
    ];

    if (ctx.data?.unreadOnly) {
      conditions.push(eq(inAppNotifications.read, false));
    }

    const limit = ctx.data?.limit ?? 50;

    const db = await getDb();
    const notifications = await db
      .select()
      .from(inAppNotifications)
      .where(and(...conditions))
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(limit);

    // Get unread count
    const unreadNotifications = await db
      .select()
      .from(inAppNotifications)
      .where(
        and(
          eq(inAppNotifications.userId, session.user.id),
          eq(inAppNotifications.read, false),
          eq(inAppNotifications.dismissed, false)
        )
      );

    return { notifications, unreadCount: unreadNotifications.length };
  }
);

/**
 * Mark a notification as read
 */
export const markNotificationRead = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    const [updated] = await db
      .update(inAppNotifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(and(eq(inAppNotifications.id, ctx.data.id), eq(inAppNotifications.userId, session.user.id)))
      .returning();

    if (!updated) throw new Error("Notification not found");

    return updated;
  }
);

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = createServerFn({ method: "POST" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { getAuthenticatedSession } = await import("./auth-utils.server");
  const { inAppNotifications } = await import("@/database/schema/alerts");

  const session = await getAuthenticatedSession();

  const db = await getDb();
  const result = await db
    .update(inAppNotifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(inAppNotifications.userId, session.user.id),
        eq(inAppNotifications.read, false)
      )
    )
    .returning();

  return { marked: result.length };
});

/**
 * Dismiss a notification
 */
export const dismissNotification = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    const [updated] = await db
      .update(inAppNotifications)
      .set({
        dismissed: true,
      })
      .where(and(eq(inAppNotifications.id, ctx.data.id), eq(inAppNotifications.userId, session.user.id)))
      .returning();

    if (!updated) throw new Error("Notification not found");

    return updated;
  }
);

/**
 * Clear all notifications
 */
export const clearAllNotifications = createServerFn({ method: "POST" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { getAuthenticatedSession } = await import("./auth-utils.server");
  const { inAppNotifications } = await import("@/database/schema/alerts");

  const session = await getAuthenticatedSession();

  const db = await getDb();
  const result = await db
    .delete(inAppNotifications)
    .where(eq(inAppNotifications.userId, session.user.id))
    .returning();

  return { cleared: result.length };
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate HMAC signature for webhook payloads
 */
async function generateWebhookSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Get enabled alert rules for evaluation
 * Used internally by the alert evaluation service
 */
export async function getEnabledAlertRulesForUser(userId: string) {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { alertRules } = await import("@/database/schema/alerts");

  const db = await getDb();
  return db.query.alertRules.findMany({
    where: and(
      eq(alertRules.userId, userId),
      eq(alertRules.enabled, true)
    ),
    with: {
      app: true,
      integration: true,
    },
  });
}

/**
 * Create alert history entry
 * Used internally by the alert evaluation service
 */
export async function createAlertHistoryEntry(entry: NewAlertHistory) {
  const { getDb } = await import("./get-db");
  const { alertHistory } = await import("@/database/schema/alerts");

  const db = await getDb();
  const [created] = await db
    .insert(alertHistory)
    .values(entry)
    .returning();
  return created;
}

/**
 * Create in-app notification
 * Used internally by the notification delivery service
 */
export async function createInAppNotificationEntry(notification: {
  userId: string;
  alertHistoryId?: string;
  title: string;
  message: string;
  severity?: "info" | "warning" | "critical";
  linkType?: string;
  linkId?: string;
}) {
  const { getDb } = await import("./get-db");
  const { inAppNotifications } = await import("@/database/schema/alerts");

  const db = await getDb();
  const [created] = await db
    .insert(inAppNotifications)
    .values(notification)
    .returning();
  return created;
}

/**
 * Update alert rule last triggered timestamp
 */
export async function updateAlertRuleLastTriggered(ruleId: string) {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { alertRules } = await import("@/database/schema/alerts");

  const db = await getDb();
  await db
    .update(alertRules)
    .set({
      lastTriggeredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(alertRules.id, ruleId));
}

/**
 * Get user notification preferences
 * Used internally by the notification delivery service
 */
export async function getUserNotificationPreferences(userId: string) {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { notificationPreferences } = await import("@/database/schema/alerts");

  const db = await getDb();
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return prefs ?? null;
}

/**
 * Get integrations for alert rule form
 * This is a simpler version that doesn't test connectivity
 */
export const getIntegrationsForAlerts = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, asc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { integrations } = await import("@/database/schema/integrations");

  const session = await getOptionalSession();
  if (!session) return { integrations: [] };

  const db = await getDb();
  const userIntegrations = await db.query.integrations.findMany({
    where: eq(integrations.userId, session.user.id),
    orderBy: [asc(integrations.name)],
    columns: {
      id: true,
      name: true,
      type: true,
      enabled: true,
    },
  });

  return { integrations: userIntegrations };
});

/**
 * Auto-resolve alerts when conditions are no longer met
 */
export async function autoResolveAlertsForApp(appId: string, userId: string) {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { alertHistory } = await import("@/database/schema/alerts");

  const db = await getDb();
  const result = await db
    .update(alertHistory)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: "auto",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(alertHistory.appId, appId),
        eq(alertHistory.userId, userId),
        eq(alertHistory.status, "active")
      )
    )
    .returning();

  return result.length;
}
