import { createServerFn } from "@tanstack/react-start";
import type {
  AppAccessLog,
  AppUsageMetrics,
} from "@/database/schema/app-analytics";

// ============================================================================
// Types
// ============================================================================

export type AccessType = "click" | "open_local" | "open_remote";

export type AppAnalyticsSummary = {
  appId: string;
  appName: string;
  appIcon: string | null;
  totalAccesses: number;
  lastAccessedAt: string | null;
  averageResponseTime: number | null;
  uptimePercentage: number | null;
  healthCheckCount: number;
  onlineCount: number;
  offlineCount: number;
};

export type DailyMetric = {
  date: string;
  accessCount: number;
  uptimePercentage: number | null;
  averageResponseTime: number | null;
};

export type TimeRange = "7d" | "30d" | "90d" | "all";

// ============================================================================
// Helper Functions
// ============================================================================

function getDateRange(range: TimeRange): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "all":
      start.setFullYear(2020, 0, 1); // Effectively all time
      break;
  }

  return { start, end };
}

function truncateToDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================================
// Data Collection Functions (internal use)
// ============================================================================

/**
 * Log an app access event
 */
export async function logAppAccess(
  appId: string,
  userId: string,
  accessType: AccessType = "click"
): Promise<void> {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { appAccessLog, appUsageMetrics } = await import("@/database/schema/app-analytics");

  const db = await getDb();

  try {
    const now = new Date();
    const today = truncateToDay(now);

    // Insert access log entry
    await db.insert(appAccessLog).values({
      appId,
      userId,
      accessedAt: now,
      accessType,
    });

    // Update or create daily metrics
    const [existingMetrics] = await db
      .select()
      .from(appUsageMetrics)
      .where(
        and(
          eq(appUsageMetrics.appId, appId),
          eq(appUsageMetrics.userId, userId),
          eq(appUsageMetrics.date, today)
        )
      )
      .limit(1);

    if (existingMetrics) {
      // Update existing metrics
      const metadata = existingMetrics.metadata || { hourlyAccess: Array(24).fill(0), accessByType: {} };
      const hourlyAccess = metadata.hourlyAccess || Array(24).fill(0);
      const accessByType = metadata.accessByType || {};

      hourlyAccess[now.getHours()] = (hourlyAccess[now.getHours()] || 0) + 1;
      accessByType[accessType] = (accessByType[accessType] || 0) + 1;

      await db
        .update(appUsageMetrics)
        .set({
          accessCount: existingMetrics.accessCount + 1,
          lastAccessedAt: now,
          metadata: { ...metadata, hourlyAccess, accessByType },
          updatedAt: now,
        })
        .where(eq(appUsageMetrics.id, existingMetrics.id));
    } else {
      // Create new metrics entry
      const hourlyAccess = Array(24).fill(0);
      hourlyAccess[now.getHours()] = 1;

      await db.insert(appUsageMetrics).values({
        appId,
        userId,
        date: today,
        accessCount: 1,
        lastAccessedAt: now,
        metadata: {
          hourlyAccess,
          accessByType: { [accessType]: 1 },
        },
      });
    }
  } catch (error) {
    console.error("Error logging app access:", error);
    // Don't throw - analytics should not break the main flow
  }
}

/**
 * Record a health check result in history
 */
export async function recordHealthCheck(
  appId: string,
  userId: string,
  status: "online" | "offline" | "unknown",
  responseTime?: number,
  error?: string
): Promise<void> {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { appUsageMetrics, healthHistory } = await import("@/database/schema/app-analytics");

  const db = await getDb();

  try {
    const now = new Date();
    const today = truncateToDay(now);

    // Insert health history entry
    await db.insert(healthHistory).values({
      appId,
      userId,
      status,
      responseTime,
      error,
      checkedAt: now,
    });

    // Update daily metrics
    const [existingMetrics] = await db
      .select()
      .from(appUsageMetrics)
      .where(
        and(
          eq(appUsageMetrics.appId, appId),
          eq(appUsageMetrics.userId, userId),
          eq(appUsageMetrics.date, today)
        )
      )
      .limit(1);

    const isOnline = status === "online";
    const isOffline = status === "offline";

    if (existingMetrics) {
      const newTotalChecks = (existingMetrics.totalHealthChecks || 0) + 1;
      const newSuccessfulChecks = (existingMetrics.successfulHealthChecks || 0) + (isOnline ? 1 : 0);
      const newFailedChecks = (existingMetrics.failedHealthChecks || 0) + (isOffline ? 1 : 0);
      const newTotalResponseTime = (existingMetrics.totalResponseTime || 0) + (responseTime || 0);

      // Calculate uptime percentage
      const uptimePercentage = newTotalChecks > 0
        ? (newSuccessfulChecks / newTotalChecks) * 100
        : null;

      await db
        .update(appUsageMetrics)
        .set({
          totalHealthChecks: newTotalChecks,
          successfulHealthChecks: newSuccessfulChecks,
          failedHealthChecks: newFailedChecks,
          totalResponseTime: newTotalResponseTime,
          minResponseTime: responseTime
            ? Math.min(existingMetrics.minResponseTime || Infinity, responseTime)
            : existingMetrics.minResponseTime,
          maxResponseTime: responseTime
            ? Math.max(existingMetrics.maxResponseTime || 0, responseTime)
            : existingMetrics.maxResponseTime,
          uptimePercentage,
          updatedAt: now,
        })
        .where(eq(appUsageMetrics.id, existingMetrics.id));
    } else {
      // Create new metrics entry
      const uptimePercentage = isOnline ? 100 : isOffline ? 0 : null;

      await db.insert(appUsageMetrics).values({
        appId,
        userId,
        date: today,
        accessCount: 0,
        totalHealthChecks: 1,
        successfulHealthChecks: isOnline ? 1 : 0,
        failedHealthChecks: isOffline ? 1 : 0,
        totalResponseTime: responseTime || 0,
        minResponseTime: responseTime,
        maxResponseTime: responseTime,
        uptimePercentage,
      });
    }
  } catch (error) {
    console.error("Error recording health check:", error);
    // Don't throw - analytics should not break the main flow
  }
}

// ============================================================================
// Server Functions (API endpoints)
// ============================================================================

/**
 * Track an app access event from the client
 */
export const trackAppAccess = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string; accessType?: AccessType } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    const { appId, accessType = "click" } = ctx.data;

    // Verify app belongs to user
    const [app] = await db
      .select()
      .from(apps)
      .where(and(eq(apps.id, appId), eq(apps.userId, session.user.id)))
      .limit(1);

    if (!app) {
      throw new Error("App not found");
    }

    await logAppAccess(appId, session.user.id, accessType);

    return { success: true };
  }
);

/**
 * Get analytics summary for all apps
 */
export const getAnalyticsSummary = createServerFn({ method: "GET" }).handler(
  async (ctx: { data?: { range?: TimeRange } } = {}) => {
    const { getDb } = await import("./get-db");
    const { eq, and, sql, gte, lte } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { appUsageMetrics } = await import("@/database/schema/app-analytics");

    const db = await getDb();
    const session = await getOptionalSession();
    if (!session) {
      return { apps: [] as AppAnalyticsSummary[], totals: null };
    }

    const range = ctx?.data?.range || "30d";
    const { start, end } = getDateRange(range);

    // Get all user apps with aggregated metrics
    const userApps = await db.query.apps.findMany({
      where: eq(apps.userId, session.user.id),
    });

    const appSummaries: AppAnalyticsSummary[] = [];

    for (const app of userApps) {
      // Get aggregated metrics for this app
      const metrics = await db
        .select({
          totalAccesses: sql<number>`COALESCE(SUM(${appUsageMetrics.accessCount}), 0)`,
          lastAccessedAt: sql<string>`MAX(${appUsageMetrics.lastAccessedAt})`,
          totalResponseTime: sql<number>`COALESCE(SUM(${appUsageMetrics.totalResponseTime}), 0)`,
          totalHealthChecks: sql<number>`COALESCE(SUM(${appUsageMetrics.totalHealthChecks}), 0)`,
          successfulChecks: sql<number>`COALESCE(SUM(${appUsageMetrics.successfulHealthChecks}), 0)`,
          failedChecks: sql<number>`COALESCE(SUM(${appUsageMetrics.failedHealthChecks}), 0)`,
        })
        .from(appUsageMetrics)
        .where(
          and(
            eq(appUsageMetrics.appId, app.id),
            eq(appUsageMetrics.userId, session.user.id),
            gte(appUsageMetrics.date, start),
            lte(appUsageMetrics.date, end)
          )
        );

      const m = metrics[0];
      const totalChecks = Number(m?.totalHealthChecks) || 0;
      const successfulChecks = Number(m?.successfulChecks) || 0;
      const totalResponseTime = Number(m?.totalResponseTime) || 0;

      appSummaries.push({
        appId: app.id,
        appName: app.name,
        appIcon: app.icon,
        totalAccesses: Number(m?.totalAccesses) || 0,
        lastAccessedAt: m?.lastAccessedAt || null,
        averageResponseTime: totalChecks > 0 ? Math.round(totalResponseTime / totalChecks) : null,
        uptimePercentage: totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : null,
        healthCheckCount: totalChecks,
        onlineCount: successfulChecks,
        offlineCount: Number(m?.failedChecks) || 0,
      });
    }

    // Sort by total accesses (most used first)
    appSummaries.sort((a, b) => b.totalAccesses - a.totalAccesses);

    // Calculate totals
    const totals = {
      totalApps: appSummaries.length,
      totalAccesses: appSummaries.reduce((sum, a) => sum + a.totalAccesses, 0),
      averageUptime: appSummaries.filter(a => a.uptimePercentage !== null).length > 0
        ? appSummaries.reduce((sum, a) => sum + (a.uptimePercentage || 0), 0) /
          appSummaries.filter(a => a.uptimePercentage !== null).length
        : null,
      averageResponseTime: appSummaries.filter(a => a.averageResponseTime !== null).length > 0
        ? Math.round(
            appSummaries.reduce((sum, a) => sum + (a.averageResponseTime || 0), 0) /
            appSummaries.filter(a => a.averageResponseTime !== null).length
          )
        : null,
    };

    return { apps: appSummaries, totals };
  }
);

/**
 * Get daily metrics for trend charts
 */
export const getDailyMetrics = createServerFn({ method: "GET" }).handler(
  async (ctx: { data?: { range?: TimeRange; appId?: string } } = {}) => {
    const { getDb } = await import("./get-db");
    const { eq, and, sql, gte, lte, asc } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { appUsageMetrics } = await import("@/database/schema/app-analytics");

    const db = await getDb();
    const session = await getOptionalSession();
    if (!session) {
      return { metrics: [] as DailyMetric[] };
    }

    const range = ctx?.data?.range || "30d";
    const appId = ctx?.data?.appId;
    const { start, end } = getDateRange(range);

    // Build where clause
    const conditions = [
      eq(appUsageMetrics.userId, session.user.id),
      gte(appUsageMetrics.date, start),
      lte(appUsageMetrics.date, end),
    ];

    if (appId) {
      conditions.push(eq(appUsageMetrics.appId, appId));
    }

    // Get daily aggregated metrics
    const dailyData = await db
      .select({
        date: appUsageMetrics.date,
        accessCount: sql<number>`SUM(${appUsageMetrics.accessCount})`,
        totalHealthChecks: sql<number>`SUM(${appUsageMetrics.totalHealthChecks})`,
        successfulHealthChecks: sql<number>`SUM(${appUsageMetrics.successfulHealthChecks})`,
        totalResponseTime: sql<number>`SUM(${appUsageMetrics.totalResponseTime})`,
      })
      .from(appUsageMetrics)
      .where(and(...conditions))
      .groupBy(appUsageMetrics.date)
      .orderBy(asc(appUsageMetrics.date));

    const metrics: DailyMetric[] = dailyData.map((d) => {
      const totalChecks = Number(d.totalHealthChecks) || 0;
      const successfulChecks = Number(d.successfulHealthChecks) || 0;
      const totalResponseTime = Number(d.totalResponseTime) || 0;

      return {
        date: d.date.toISOString().split("T")[0],
        accessCount: Number(d.accessCount) || 0,
        uptimePercentage: totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : null,
        averageResponseTime: totalChecks > 0 ? Math.round(totalResponseTime / totalChecks) : null,
      };
    });

    return { metrics };
  }
);

/**
 * Get most used apps
 */
export const getMostUsedApps = createServerFn({ method: "GET" }).handler(
  async (ctx: { data?: { range?: TimeRange; limit?: number } } = {}) => {
    const { getDb } = await import("./get-db");
    const { eq, and, desc, sql, gte, lte } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { appUsageMetrics } = await import("@/database/schema/app-analytics");

    const db = await getDb();
    const session = await getOptionalSession();
    if (!session) {
      return { apps: [] };
    }

    const range = ctx?.data?.range || "30d";
    const limit = ctx?.data?.limit || 10;
    const { start, end } = getDateRange(range);

    const result = await db
      .select({
        appId: appUsageMetrics.appId,
        totalAccesses: sql<number>`SUM(${appUsageMetrics.accessCount})`,
      })
      .from(appUsageMetrics)
      .where(
        and(
          eq(appUsageMetrics.userId, session.user.id),
          gte(appUsageMetrics.date, start),
          lte(appUsageMetrics.date, end)
        )
      )
      .groupBy(appUsageMetrics.appId)
      .orderBy(desc(sql`SUM(${appUsageMetrics.accessCount})`))
      .limit(limit);

    // Get app details
    const appDetails = await Promise.all(
      result.map(async (r) => {
        const [app] = await db
          .select({ id: apps.id, name: apps.name, icon: apps.icon })
          .from(apps)
          .where(eq(apps.id, r.appId))
          .limit(1);

        return app ? { ...app, totalAccesses: Number(r.totalAccesses) || 0 } : null;
      })
    );

    return { apps: appDetails.filter((a): a is NonNullable<typeof a> => a !== null) };
  }
);

/**
 * Get least used apps
 */
export const getLeastUsedApps = createServerFn({ method: "GET" }).handler(
  async (ctx: { data?: { range?: TimeRange; limit?: number } } = {}) => {
    const { getDb } = await import("./get-db");
    const { eq, and, sql, gte, lte } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { appUsageMetrics } = await import("@/database/schema/app-analytics");

    const db = await getDb();
    const session = await getOptionalSession();
    if (!session) {
      return { apps: [] };
    }

    const range = ctx?.data?.range || "30d";
    const limit = ctx?.data?.limit || 10;
    const { start, end } = getDateRange(range);

    // Get all user apps
    const userApps = await db.query.apps.findMany({
      where: eq(apps.userId, session.user.id),
    });

    // Get access counts for all apps
    const accessCounts = await db
      .select({
        appId: appUsageMetrics.appId,
        totalAccesses: sql<number>`COALESCE(SUM(${appUsageMetrics.accessCount}), 0)`,
      })
      .from(appUsageMetrics)
      .where(
        and(
          eq(appUsageMetrics.userId, session.user.id),
          gte(appUsageMetrics.date, start),
          lte(appUsageMetrics.date, end)
        )
      )
      .groupBy(appUsageMetrics.appId);

    const accessMap = new Map(accessCounts.map((a) => [a.appId, Number(a.totalAccesses) || 0]));

    // Map all apps with their access counts (including 0 for never accessed)
    const appsWithCounts = userApps.map((app) => ({
      id: app.id,
      name: app.name,
      icon: app.icon,
      totalAccesses: accessMap.get(app.id) || 0,
    }));

    // Sort by least accessed first
    appsWithCounts.sort((a, b) => a.totalAccesses - b.totalAccesses);

    return { apps: appsWithCounts.slice(0, limit) };
  }
);

/**
 * Get least reliable apps (lowest uptime)
 */
export const getLeastReliableApps = createServerFn({ method: "GET" }).handler(
  async (ctx: { data?: { range?: TimeRange; limit?: number } } = {}) => {
    const { getDb } = await import("./get-db");
    const { eq, and, sql, gte, lte } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { appUsageMetrics } = await import("@/database/schema/app-analytics");

    const db = await getDb();
    const session = await getOptionalSession();
    if (!session) {
      return { apps: [] };
    }

    const range = ctx?.data?.range || "30d";
    const limit = ctx?.data?.limit || 10;
    const { start, end } = getDateRange(range);

    // Get all user apps with health checks enabled
    const userApps = await db.query.apps.findMany({
      where: and(
        eq(apps.userId, session.user.id),
        eq(apps.healthCheckEnabled, true)
      ),
    });

    // Get health metrics for all apps
    const healthMetrics = await db
      .select({
        appId: appUsageMetrics.appId,
        totalChecks: sql<number>`COALESCE(SUM(${appUsageMetrics.totalHealthChecks}), 0)`,
        successfulChecks: sql<number>`COALESCE(SUM(${appUsageMetrics.successfulHealthChecks}), 0)`,
        failedChecks: sql<number>`COALESCE(SUM(${appUsageMetrics.failedHealthChecks}), 0)`,
      })
      .from(appUsageMetrics)
      .where(
        and(
          eq(appUsageMetrics.userId, session.user.id),
          gte(appUsageMetrics.date, start),
          lte(appUsageMetrics.date, end)
        )
      )
      .groupBy(appUsageMetrics.appId);

    const metricsMap = new Map(healthMetrics.map((m) => [m.appId, m]));

    // Map apps with their uptime percentages
    const appsWithUptime = userApps.map((app) => {
      const metrics = metricsMap.get(app.id);
      const totalChecks = Number(metrics?.totalChecks) || 0;
      const successfulChecks = Number(metrics?.successfulChecks) || 0;
      const failedChecks = Number(metrics?.failedChecks) || 0;

      return {
        id: app.id,
        name: app.name,
        icon: app.icon,
        uptimePercentage: totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : null,
        totalChecks,
        failedChecks,
      };
    });

    // Filter apps with health data and sort by lowest uptime
    const appsWithData = appsWithUptime.filter((a) => a.uptimePercentage !== null);
    appsWithData.sort((a, b) => (a.uptimePercentage || 0) - (b.uptimePercentage || 0));

    return { apps: appsWithData.slice(0, limit) };
  }
);

/**
 * Get app details analytics
 */
export const getAppAnalytics = createServerFn({ method: "GET" }).handler(
  async (ctx: { data: { appId: string; range?: TimeRange } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, desc, gte, lte, asc } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { appUsageMetrics, healthHistory } = await import("@/database/schema/app-analytics");

    const db = await getDb();
    const session = await getOptionalSession();
    if (!session) {
      return null;
    }

    const { appId, range = "30d" } = ctx.data;
    const { start, end } = getDateRange(range);

    // Verify app belongs to user
    const [app] = await db
      .select()
      .from(apps)
      .where(and(eq(apps.id, appId), eq(apps.userId, session.user.id)))
      .limit(1);

    if (!app) {
      throw new Error("App not found");
    }

    // Get daily metrics for the app
    const dailyMetrics = await db
      .select()
      .from(appUsageMetrics)
      .where(
        and(
          eq(appUsageMetrics.appId, appId),
          eq(appUsageMetrics.userId, session.user.id),
          gte(appUsageMetrics.date, start),
          lte(appUsageMetrics.date, end)
        )
      )
      .orderBy(asc(appUsageMetrics.date));

    // Calculate totals
    const totals = dailyMetrics.reduce(
      (acc, m) => ({
        totalAccesses: acc.totalAccesses + m.accessCount,
        totalHealthChecks: acc.totalHealthChecks + (m.totalHealthChecks || 0),
        successfulChecks: acc.successfulChecks + (m.successfulHealthChecks || 0),
        failedChecks: acc.failedChecks + (m.failedHealthChecks || 0),
        totalResponseTime: acc.totalResponseTime + (m.totalResponseTime || 0),
      }),
      { totalAccesses: 0, totalHealthChecks: 0, successfulChecks: 0, failedChecks: 0, totalResponseTime: 0 }
    );

    // Get recent health history
    const recentHealth = await db
      .select()
      .from(healthHistory)
      .where(
        and(
          eq(healthHistory.appId, appId),
          eq(healthHistory.userId, session.user.id),
          gte(healthHistory.checkedAt, start)
        )
      )
      .orderBy(desc(healthHistory.checkedAt))
      .limit(100);

    return {
      app: { id: app.id, name: app.name, icon: app.icon },
      totals: {
        ...totals,
        averageResponseTime: totals.totalHealthChecks > 0
          ? Math.round(totals.totalResponseTime / totals.totalHealthChecks)
          : null,
        uptimePercentage: totals.totalHealthChecks > 0
          ? (totals.successfulChecks / totals.totalHealthChecks) * 100
          : null,
      },
      dailyMetrics: dailyMetrics.map((m) => ({
        date: m.date.toISOString().split("T")[0],
        accessCount: m.accessCount,
        uptimePercentage: m.uptimePercentage,
        averageResponseTime: m.totalHealthChecks
          ? Math.round((m.totalResponseTime || 0) / m.totalHealthChecks)
          : null,
      })),
      recentHealth: recentHealth.map((h) => ({
        status: h.status,
        responseTime: h.responseTime,
        error: h.error,
        checkedAt: h.checkedAt.toISOString(),
      })),
    };
  }
);

/**
 * Cleanup old analytics data (keep last 90 days by default)
 */
export async function cleanupOldAnalyticsData(daysToKeep = 90): Promise<{ accessLogs: number; healthHistory: number }> {
  const { getDb } = await import("./get-db");
  const { lte } = await import("drizzle-orm");
  const { appAccessLog, healthHistory } = await import("@/database/schema/app-analytics");

  const db = await getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    // Clean up access logs
    const accessLogResult = await db
      .delete(appAccessLog)
      .where(lte(appAccessLog.accessedAt, cutoffDate))
      .returning();

    // Clean up health history
    const healthHistoryResult = await db
      .delete(healthHistory)
      .where(lte(healthHistory.checkedAt, cutoffDate))
      .returning();

    return {
      accessLogs: accessLogResult.length,
      healthHistory: healthHistoryResult.length,
    };
  } catch (error) {
    console.error("Error cleaning up old analytics data:", error);
    return { accessLogs: 0, healthHistory: 0 };
  }
}
