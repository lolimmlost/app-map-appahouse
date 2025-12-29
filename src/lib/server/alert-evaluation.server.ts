import type {
  AlertRule,
  AlertConditions,
  AlertDetails,
} from "@/database/schema/alerts";

export type HealthStatus = "online" | "offline" | "unknown";

interface HealthCheckResult {
  appId: string;
  status: HealthStatus;
  previousStatus?: HealthStatus;
  responseTime?: number;
  error?: string;
  consecutiveFailures?: number;
}

interface AlertEvaluationResult {
  triggered: boolean;
  alertRule?: AlertRule;
  message?: string;
  details?: AlertDetails;
}

/**
 * Main entry point for alert evaluation
 * Called after each health check to evaluate if any alerts should be triggered
 */
export async function evaluateAlertsForHealthCheck(
  userId: string,
  healthResult: HealthCheckResult
): Promise<void> {
  const {
    getEnabledAlertRulesForUser,
    autoResolveAlertsForApp,
  } = await import("./alerts.server");

  try {
    // Get all enabled alert rules for this user
    const rules = await getEnabledAlertRulesForUser(userId);

    // Filter rules that apply to this app or all apps
    const applicableRules = rules.filter(
      (rule) => !rule.appId || rule.appId === healthResult.appId
    );

    // Evaluate each rule
    for (const rule of applicableRules) {
      const result = await evaluateRule(rule, healthResult, userId);

      if (result.triggered && result.alertRule) {
        await triggerAlert(result.alertRule, healthResult, result.message!, result.details!, userId);
      }
    }

    // Auto-resolve alerts if status is now online
    if (healthResult.status === "online") {
      await autoResolveAlertsForApp(healthResult.appId, userId);
    }
  } catch (error) {
    console.error("Error evaluating alerts:", error);
  }
}

/**
 * Evaluate a single alert rule against a health check result
 */
async function evaluateRule(
  rule: AlertRule,
  healthResult: HealthCheckResult,
  userId: string
): Promise<AlertEvaluationResult> {
  // Check cooldown
  if (rule.lastTriggeredAt) {
    const cooldownMs = (rule.cooldownMinutes ?? 15) * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - rule.lastTriggeredAt.getTime();
    if (timeSinceLastTrigger < cooldownMs) {
      return { triggered: false };
    }
  }

  const conditions = (rule.conditions as AlertConditions) ?? {};

  switch (rule.triggerType) {
    case "status_change":
      return evaluateStatusChange(rule, healthResult, conditions);

    case "consecutive_failures":
      return evaluateConsecutiveFailures(rule, healthResult, conditions);

    case "response_time":
      return evaluateResponseTime(rule, healthResult, conditions);

    case "integration_status":
      // Integration status is handled separately
      return { triggered: false };

    default:
      return { triggered: false };
  }
}

/**
 * Evaluate status change alerts (online→offline or offline→online)
 */
function evaluateStatusChange(
  rule: AlertRule,
  healthResult: HealthCheckResult,
  conditions: AlertConditions
): AlertEvaluationResult {
  if (!healthResult.previousStatus || healthResult.previousStatus === healthResult.status) {
    return { triggered: false };
  }

  // Check if this transition matches the configured conditions
  const fromStatus = conditions.fromStatus;
  const toStatus = conditions.toStatus;

  // If specific statuses are configured, check if they match
  if (fromStatus && healthResult.previousStatus !== fromStatus) {
    return { triggered: false };
  }
  if (toStatus && healthResult.status !== toStatus) {
    return { triggered: false };
  }

  // Default: alert on any status change involving offline
  if (!fromStatus && !toStatus) {
    // Only alert on transitions to/from offline
    if (healthResult.previousStatus !== "offline" && healthResult.status !== "offline") {
      return { triggered: false };
    }
  }

  const message = `Status changed from ${healthResult.previousStatus} to ${healthResult.status}`;

  return {
    triggered: true,
    alertRule: rule,
    message,
    details: {
      previousStatus: healthResult.previousStatus,
      currentStatus: healthResult.status,
      error: healthResult.error,
    },
  };
}

/**
 * Evaluate consecutive failures alerts
 */
function evaluateConsecutiveFailures(
  rule: AlertRule,
  healthResult: HealthCheckResult,
  conditions: AlertConditions
): AlertEvaluationResult {
  const threshold = conditions.failureThreshold ?? 3;
  const failures = healthResult.consecutiveFailures ?? 0;

  if (failures < threshold) {
    return { triggered: false };
  }

  // Only trigger when we first hit the threshold
  if (failures !== threshold) {
    return { triggered: false };
  }

  const message = `${failures} consecutive failures detected`;

  return {
    triggered: true,
    alertRule: rule,
    message,
    details: {
      consecutiveFailures: failures,
      currentStatus: healthResult.status,
      error: healthResult.error,
    },
  };
}

/**
 * Evaluate response time alerts
 */
function evaluateResponseTime(
  rule: AlertRule,
  healthResult: HealthCheckResult,
  conditions: AlertConditions
): AlertEvaluationResult {
  const threshold = conditions.responseTimeThreshold ?? 5000; // Default 5 seconds
  const responseTime = healthResult.responseTime;

  if (!responseTime || responseTime < threshold) {
    return { triggered: false };
  }

  const message = `Response time (${responseTime}ms) exceeded threshold (${threshold}ms)`;

  return {
    triggered: true,
    alertRule: rule,
    message,
    details: {
      responseTime,
      currentStatus: healthResult.status,
    },
  };
}

/**
 * Trigger an alert - create history entry and send notifications
 */
async function triggerAlert(
  rule: AlertRule,
  healthResult: HealthCheckResult,
  message: string,
  details: AlertDetails,
  userId: string
): Promise<void> {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { apps } = await import("@/database/schema");
  const {
    createAlertHistoryEntry,
    updateAlertRuleLastTriggered,
  } = await import("./alerts.server");
  const { deliverNotifications } = await import("./notification-delivery.server");

  const db = await getDb();

  try {
    // Get app name for the alert
    let appName: string | undefined;
    if (healthResult.appId) {
      const [app] = await db
        .select()
        .from(apps)
        .where(eq(apps.id, healthResult.appId))
        .limit(1);
      appName = app?.name;
    }

    // Create alert history entry
    const historyEntry = await createAlertHistoryEntry({
      userId,
      alertRuleId: rule.id,
      alertName: rule.name,
      triggerType: rule.triggerType,
      severity: rule.severity ?? "warning",
      appId: healthResult.appId,
      appName,
      message,
      details,
      status: "active",
    });

    // Update rule last triggered timestamp
    await updateAlertRuleLastTriggered(rule.id);

    // Deliver notifications based on configured channels
    const channels = rule.channels as { email?: boolean; webhook?: boolean; inApp?: boolean } ?? {};

    await deliverNotifications({
      userId,
      alertHistoryId: historyEntry.id,
      rule,
      channels,
      appName,
      message,
      details,
    });
  } catch (error) {
    console.error("Error triggering alert:", error);
  }
}

/**
 * Evaluate integration status alerts
 * Called when an integration connection status changes
 */
export async function evaluateIntegrationStatusAlerts(
  userId: string,
  integrationId: string,
  integrationName: string,
  previousStatus: "online" | "offline",
  currentStatus: "online" | "offline",
  error?: string
): Promise<void> {
  const {
    getEnabledAlertRulesForUser,
    createAlertHistoryEntry,
    updateAlertRuleLastTriggered,
  } = await import("./alerts.server");
  const { deliverNotifications } = await import("./notification-delivery.server");

  try {
    const rules = await getEnabledAlertRulesForUser(userId);

    // Filter to integration status rules
    const integrationRules = rules.filter(
      (rule) =>
        rule.triggerType === "integration_status" &&
        (!rule.integrationId || rule.integrationId === integrationId)
    );

    for (const rule of integrationRules) {
      // Check cooldown
      if (rule.lastTriggeredAt) {
        const cooldownMs = (rule.cooldownMinutes ?? 15) * 60 * 1000;
        const timeSinceLastTrigger = Date.now() - rule.lastTriggeredAt.getTime();
        if (timeSinceLastTrigger < cooldownMs) {
          continue;
        }
      }

      const conditions = (rule.conditions as AlertConditions) ?? {};

      // Check if transition matches conditions
      if (conditions.fromStatus && previousStatus !== conditions.fromStatus) continue;
      if (conditions.toStatus && currentStatus !== conditions.toStatus) continue;

      // Default: only alert on transitions to offline
      if (!conditions.fromStatus && !conditions.toStatus && currentStatus !== "offline") {
        continue;
      }

      const message = `Integration status changed from ${previousStatus} to ${currentStatus}`;
      const details: AlertDetails = {
        previousStatus,
        currentStatus,
        error,
      };

      // Create alert history entry
      const historyEntry = await createAlertHistoryEntry({
        userId,
        alertRuleId: rule.id,
        alertName: rule.name,
        triggerType: rule.triggerType,
        severity: rule.severity ?? "warning",
        integrationId,
        integrationName,
        message,
        details,
        status: "active",
      });

      // Update rule last triggered timestamp
      await updateAlertRuleLastTriggered(rule.id);

      // Deliver notifications
      const channels = rule.channels as { email?: boolean; webhook?: boolean; inApp?: boolean } ?? {};

      await deliverNotifications({
        userId,
        alertHistoryId: historyEntry.id,
        rule,
        channels,
        integrationName,
        message,
        details,
      });
    }
  } catch (error) {
    console.error("Error evaluating integration status alerts:", error);
  }
}

/**
 * Get previous health status for an app from cache
 */
export async function getPreviousHealthStatus(
  appId: string,
  userId: string
): Promise<HealthStatus | undefined> {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();

  try {
    const [cached] = await db
      .select()
      .from(healthCache)
      .where(and(eq(healthCache.appId, appId), eq(healthCache.userId, userId)))
      .limit(1);

    return cached?.status as HealthStatus | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get consecutive failures for an app from cache metadata
 */
export async function getConsecutiveFailures(
  appId: string,
  userId: string
): Promise<number> {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();

  try {
    const [cached] = await db
      .select()
      .from(healthCache)
      .where(and(eq(healthCache.appId, appId), eq(healthCache.userId, userId)))
      .limit(1);

    const metadata = cached?.metadata as { consecutiveFailures?: number } | null;
    return metadata?.consecutiveFailures ?? 0;
  } catch {
    return 0;
  }
}
