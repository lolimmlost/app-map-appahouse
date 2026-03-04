/**
 * Alert Repository
 *
 * Provides data access operations for alerts including:
 * - Alert rules (conditions that trigger alerts)
 * - Alert history (triggered alerts)
 * - Notification preferences
 * - In-app notifications
 */

import { eq, and, asc, desc, inArray, gte } from "drizzle-orm";
import { BaseRepository, type DatabaseInstance } from "./BaseRepository";
import type {
  AlertRule,
  NewAlertRule,
  AlertHistory,
  NewAlertHistory,
  NotificationPreferences,
  NewNotificationPreferences,
  InAppNotification,
  NewInAppNotification,
} from "@/database/schema/alerts";
import type { App } from "@/database/schema/apps";
import type { Integration } from "@/database/schema/integrations";

// Alert rule with relations
export interface AlertRuleWithRelations extends AlertRule {
  app: App | null;
  integration: Integration | null;
}

// Alert history with relations
export interface AlertHistoryWithRelations extends AlertHistory {
  app: App | null;
  integration: Integration | null;
  alertRule: AlertRule | null;
}

export class AlertRepository {
  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  // ============================================================================
  // Alert Rules
  // ============================================================================

  /**
   * Get all alert rules for a user
   */
  async findAllRules(userId: string): Promise<AlertRuleWithRelations[]> {
    const db = await this.getDb();
    const { alertRules } = await import("@/database/schema/alerts");

    return db.query.alertRules.findMany({
      where: eq(alertRules.userId, userId),
      orderBy: [desc(alertRules.createdAt)],
      with: {
        app: true,
        integration: true,
      },
    });
  }

  /**
   * Get a single alert rule by ID
   */
  async findRuleById(id: string, userId: string): Promise<AlertRule | null> {
    const db = await this.getDb();
    const { alertRules } = await import("@/database/schema/alerts");

    const [rule] = await db
      .select()
      .from(alertRules)
      .where(and(eq(alertRules.id, id), eq(alertRules.userId, userId)))
      .limit(1);

    return rule ?? null;
  }

  /**
   * Get all enabled alert rules for a user
   */
  async findEnabledRules(userId: string): Promise<AlertRuleWithRelations[]> {
    const db = await this.getDb();
    const { alertRules } = await import("@/database/schema/alerts");

    return db.query.alertRules.findMany({
      where: and(eq(alertRules.userId, userId), eq(alertRules.enabled, true)),
      with: {
        app: true,
        integration: true,
      },
    });
  }

  /**
   * Create a new alert rule
   */
  async createRule(data: Omit<NewAlertRule, "id" | "createdAt" | "updatedAt">): Promise<AlertRule> {
    const db = await this.getDb();
    const { alertRules } = await import("@/database/schema/alerts");

    const [created] = await db
      .insert(alertRules)
      .values(data)
      .returning();

    return created;
  }

  /**
   * Update an alert rule
   */
  async updateRule(
    id: string,
    userId: string,
    data: Partial<Omit<NewAlertRule, "id" | "userId" | "createdAt">>
  ): Promise<AlertRule | null> {
    const db = await this.getDb();
    const { alertRules } = await import("@/database/schema/alerts");

    const [updated] = await db
      .update(alertRules)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(alertRules.id, id), eq(alertRules.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Delete an alert rule
   */
  async deleteRule(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const { alertRules } = await import("@/database/schema/alerts");

    const result = await db
      .delete(alertRules)
      .where(and(eq(alertRules.id, id), eq(alertRules.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Toggle alert rule enabled status
   */
  async toggleRuleEnabled(id: string, userId: string, enabled: boolean): Promise<AlertRule | null> {
    return this.updateRule(id, userId, { enabled });
  }

  /**
   * Update last triggered timestamp for a rule
   */
  async updateRuleLastTriggered(id: string): Promise<void> {
    const db = await this.getDb();
    const { alertRules } = await import("@/database/schema/alerts");

    await db
      .update(alertRules)
      .set({ lastTriggeredAt: new Date(), updatedAt: new Date() })
      .where(eq(alertRules.id, id));
  }

  // ============================================================================
  // Alert History
  // ============================================================================

  /**
   * Get alert history for a user
   */
  async findHistory(
    userId: string,
    options?: { limit?: number; status?: string; appId?: string }
  ): Promise<AlertHistoryWithRelations[]> {
    const db = await this.getDb();
    const { alertHistory } = await import("@/database/schema/alerts");

    const conditions = [eq(alertHistory.userId, userId)];

    if (options?.status) {
      conditions.push(eq(alertHistory.status, options.status as any));
    }

    if (options?.appId) {
      conditions.push(eq(alertHistory.appId, options.appId));
    }

    return db.query.alertHistory.findMany({
      where: and(...conditions),
      orderBy: [desc(alertHistory.triggeredAt)],
      limit: options?.limit ?? 50,
      with: {
        app: true,
        integration: true,
        alertRule: true,
      },
    });
  }

  /**
   * Create an alert history entry
   */
  async createHistoryEntry(data: NewAlertHistory): Promise<AlertHistory> {
    const db = await this.getDb();
    const { alertHistory } = await import("@/database/schema/alerts");

    const [created] = await db
      .insert(alertHistory)
      .values(data)
      .returning();

    return created;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string, userId: string): Promise<AlertHistory | null> {
    const db = await this.getDb();
    const { alertHistory } = await import("@/database/schema/alerts");

    const [updated] = await db
      .update(alertHistory)
      .set({
        status: "acknowledged",
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(alertHistory.id, id), eq(alertHistory.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, userId: string): Promise<AlertHistory | null> {
    const db = await this.getDb();
    const { alertHistory } = await import("@/database/schema/alerts");

    const [updated] = await db
      .update(alertHistory)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        resolvedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(alertHistory.id, id), eq(alertHistory.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Bulk resolve alerts
   */
  async bulkResolveAlerts(ids: string[], userId: string): Promise<number> {
    if (ids.length === 0) return 0;

    const db = await this.getDb();
    const { alertHistory } = await import("@/database/schema/alerts");

    const result = await db
      .update(alertHistory)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        resolvedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(inArray(alertHistory.id, ids), eq(alertHistory.userId, userId)))
      .returning();

    return result.length;
  }

  /**
   * Auto-resolve active alerts for an app
   */
  async autoResolveAlertsForApp(appId: string, userId: string): Promise<number> {
    const db = await this.getDb();
    const { alertHistory } = await import("@/database/schema/alerts");

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

  /**
   * Clear old resolved alert history
   */
  async clearOldHistory(userId: string, daysToKeep: number = 30): Promise<number> {
    const db = await this.getDb();
    const { alertHistory } = await import("@/database/schema/alerts");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(alertHistory)
      .where(
        and(
          eq(alertHistory.userId, userId),
          eq(alertHistory.status, "resolved"),
          gte(alertHistory.triggeredAt, cutoffDate)
        )
      )
      .returning();

    return result.length;
  }

  // ============================================================================
  // Notification Preferences
  // ============================================================================

  /**
   * Get notification preferences for a user
   */
  async findPreferences(userId: string): Promise<NotificationPreferences | null> {
    const db = await this.getDb();
    const { notificationPreferences } = await import("@/database/schema/alerts");

    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    return prefs ?? null;
  }

  /**
   * Update or create notification preferences
   */
  async upsertPreferences(
    userId: string,
    data: Partial<Omit<NewNotificationPreferences, "id" | "userId" | "createdAt">>
  ): Promise<NotificationPreferences> {
    const db = await this.getDb();
    const { notificationPreferences } = await import("@/database/schema/alerts");

    const existing = await this.findPreferences(userId);

    if (existing) {
      const [updated] = await db
        .update(notificationPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, userId))
        .returning();

      return updated;
    } else {
      const [created] = await db
        .insert(notificationPreferences)
        .values({ userId, ...data })
        .returning();

      return created;
    }
  }

  // ============================================================================
  // In-App Notifications
  // ============================================================================

  /**
   * Get in-app notifications for a user
   */
  async findNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<InAppNotification[]> {
    const db = await this.getDb();
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const conditions = [
      eq(inAppNotifications.userId, userId),
      eq(inAppNotifications.dismissed, false),
    ];

    if (options?.unreadOnly) {
      conditions.push(eq(inAppNotifications.read, false));
    }

    return db
      .select()
      .from(inAppNotifications)
      .where(and(...conditions))
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(options?.limit ?? 50);
  }

  /**
   * Get unread notification count
   */
  async countUnreadNotifications(userId: string): Promise<number> {
    const db = await this.getDb();
    const { inAppNotifications } = await import("@/database/schema/alerts");
    const { sql } = await import("drizzle-orm");

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inAppNotifications)
      .where(
        and(
          eq(inAppNotifications.userId, userId),
          eq(inAppNotifications.read, false),
          eq(inAppNotifications.dismissed, false)
        )
      );

    return Number(result?.count ?? 0);
  }

  /**
   * Create an in-app notification
   */
  async createNotification(data: Omit<NewInAppNotification, "id" | "createdAt">): Promise<InAppNotification> {
    const db = await this.getDb();
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const [created] = await db
      .insert(inAppNotifications)
      .values(data)
      .returning();

    return created;
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(id: string, userId: string): Promise<InAppNotification | null> {
    const db = await this.getDb();
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const [updated] = await db
      .update(inAppNotifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(inAppNotifications.id, id), eq(inAppNotifications.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(userId: string): Promise<number> {
    const db = await this.getDb();
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const result = await db
      .update(inAppNotifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.read, false)))
      .returning();

    return result.length;
  }

  /**
   * Dismiss a notification
   */
  async dismissNotification(id: string, userId: string): Promise<InAppNotification | null> {
    const db = await this.getDb();
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const [updated] = await db
      .update(inAppNotifications)
      .set({ dismissed: true })
      .where(and(eq(inAppNotifications.id, id), eq(inAppNotifications.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Clear all notifications for a user
   */
  async clearAllNotifications(userId: string): Promise<number> {
    const db = await this.getDb();
    const { inAppNotifications } = await import("@/database/schema/alerts");

    const result = await db
      .delete(inAppNotifications)
      .where(eq(inAppNotifications.userId, userId))
      .returning();

    return result.length;
  }
}

// Singleton instance
let alertRepository: AlertRepository | null = null;

export function getAlertRepository(): AlertRepository {
  if (!alertRepository) {
    alertRepository = new AlertRepository();
  }
  return alertRepository;
}
