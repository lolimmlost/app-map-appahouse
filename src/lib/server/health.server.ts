/**
 * Health Check Server Module
 *
 * This module provides app-level health monitoring for authenticated users.
 * It performs HTTP/TCP health checks against configured app URLs and caches
 * results in the database for performance optimization.
 *
 * ARCHITECTURE OVERVIEW:
 * ----------------------
 * 1. App-Level Monitoring (this file):
 *    - Used by authenticated users to monitor their apps from the dashboard
 *    - Uses the `healthCache` table to store results per user/app
 *    - Leverages the centralized HttpClient for connection pooling and timeout handling
 *    - Triggered by `useHealthStatus` hook in the main app
 *
 * 2. Status Page Monitoring (status-pages.server.ts):
 *    - Public status pages have their OWN health checking mechanism
 *    - `getPublicStatusPageHealth` reads from the SAME `healthCache` table
 *    - `refreshPublicStatusPageHealth` performs LIVE checks for status pages
 *    - Both systems share the same cache, keyed by (appId, userId)
 *
 * CACHE STRATEGY:
 * - Results are cached with a TTL (configurable per-app, default 60s)
 * - Cache is shared between app dashboard and status pages
 * - When cache expires or is empty, a live check is performed
 * - Status pages can trigger their own refresh via `refreshPublicStatusPageHealth`
 *
 * NO DUPLICATE CHECKS:
 * - The cache is shared, so if the main app checks health, status pages
 *   will use the same cached result (and vice versa)
 * - TTL ensures fresh data while preventing excessive API calls
 *
 * @see http-client.server.ts for the centralized HttpClient used here
 */

import { createServerFn } from "@tanstack/react-start";
import { serverLogger } from "./logger";
import { performHealthCheck as httpClientHealthCheck } from "./http-client.server";

// Create a child logger for health module
const log = serverLogger.child({ module: "health" });

export type HealthStatus = "online" | "offline" | "unknown" | "checking";

// Local type to avoid importing from schema which pulls in drizzle-orm/pg-core
type AppForHealthCheck = {
  healthCheckUrl: string | null;
  localUrl: string | null;
  remoteUrl: string | null;
  healthCheckType: "http" | "tcp" | "uptime_kuma" | null;
};

export type HealthCheckResult = {
  appId: string;
  status: HealthStatus;
  responseTime?: number;
  lastChecked: string;
  error?: string;
  cached?: boolean; // Indicates if result came from cache
};

// Default request timeout for health checks
const DEFAULT_HEALTH_CHECK_TIMEOUT = 5000;

// Perform actual health check for an app using centralized HttpClient
async function performHealthCheck(
  app: AppForHealthCheck
): Promise<{ online: boolean; responseTime?: number; error?: string }> {
  const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;

  if (!checkUrl) {
    return { online: false, error: "No URL configured for health check" };
  }

  switch (app.healthCheckType) {
    case "http":
    case "tcp":
      // Use centralized HttpClient for health checks
      // TCP checks use the same HTTP logic (attempt connection via HTTP HEAD)
      return httpClientHealthCheck(checkUrl, {
        timeout: DEFAULT_HEALTH_CHECK_TIMEOUT,
        method: "HEAD",
      });
    case "uptime_kuma":
      return { online: false, error: "Uptime Kuma integration not configured" };
    default:
      return httpClientHealthCheck(checkUrl, {
        timeout: DEFAULT_HEALTH_CHECK_TIMEOUT,
        method: "HEAD",
      });
  }
}

// Check health of a single app (with caching support)
export const checkAppHealth = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string; forceRefresh?: boolean } }) => {
    const { getDb } = await import("./get-db");
    const { eq } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { getCachedHealthResult, cacheHealthResult, invalidateAppCache, DEFAULT_TTL } = await import("./health-cache.server");
    const { recordHealthCheck } = await import("./analytics.server");

    const session = await getAuthenticatedSession();
    const db = await getDb();
    const { appId, forceRefresh = false } = ctx.data;

    const [app] = await db
      .select()
      .from(apps)
      .where(eq(apps.id, appId))
      .limit(1);

    if (!app || app.userId !== session.user.id) {
      throw new Error("App not found");
    }

    if (!app.healthCheckEnabled) {
      return {
        appId: app.id,
        status: "unknown" as HealthStatus,
        lastChecked: new Date().toISOString(),
        cached: false,
      };
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedHealthResult(appId, session.user.id);
      if (cached) {
        return {
          appId: app.id,
          status: cached.status as HealthStatus,
          responseTime: cached.responseTime ?? undefined,
          lastChecked: cached.lastChecked.toISOString(),
          error: cached.error ?? undefined,
          cached: true,
        } as HealthCheckResult;
      }
    } else {
      // Invalidate cache if force refresh
      await invalidateAppCache(appId, session.user.id);
    }

    // No cache hit or force refresh - perform actual check
    const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;

    if (!checkUrl) {
      const result: HealthCheckResult = {
        appId: app.id,
        status: "unknown" as HealthStatus,
        lastChecked: new Date().toISOString(),
        error: "No URL configured for health check",
        cached: false,
      };
      return result;
    }

    const checkResult = await performHealthCheck(app);
    const healthResult: HealthCheckResult = {
      appId: app.id,
      status: checkResult.online ? "online" : "offline",
      responseTime: checkResult.responseTime,
      lastChecked: new Date().toISOString(),
      error: checkResult.error,
      cached: false,
    };

    // Cache the result with the app's configured TTL
    const ttl = app.healthCheckTTL ?? DEFAULT_TTL;
    await cacheHealthResult(appId, session.user.id, healthResult, ttl);

    // Record health check for analytics (non-blocking)
    recordHealthCheck(
      appId,
      session.user.id,
      healthResult.status as "online" | "offline" | "unknown",
      healthResult.responseTime,
      healthResult.error
    ).catch((error) => log.logError(error, "Failed to record health check for analytics"));

    return healthResult;
  }
);

// Force refresh health check for a single app (always bypasses cache)
export const forceRefreshAppHealth = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { cacheHealthResult, invalidateAppCache, DEFAULT_TTL } = await import("./health-cache.server");
    const { recordHealthCheck } = await import("./analytics.server");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [app] = await db
      .select()
      .from(apps)
      .where(and(eq(apps.id, ctx.data.appId), eq(apps.userId, session.user.id)))
      .limit(1);

    if (!app) {
      throw new Error("App not found");
    }

    // Invalidate the cache entry
    await invalidateAppCache(ctx.data.appId, session.user.id);

    if (!app.healthCheckEnabled) {
      return {
        appId: app.id,
        status: "unknown" as HealthStatus,
        lastChecked: new Date().toISOString(),
        cached: false,
      };
    }

    const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;

    if (!checkUrl) {
      return {
        appId: app.id,
        status: "unknown" as HealthStatus,
        lastChecked: new Date().toISOString(),
        error: "No URL configured for health check",
        cached: false,
      };
    }

    const checkResult = await performHealthCheck(app);
    const healthResult: HealthCheckResult = {
      appId: app.id,
      status: checkResult.online ? "online" : "offline",
      responseTime: checkResult.responseTime,
      lastChecked: new Date().toISOString(),
      error: checkResult.error,
      cached: false,
    };

    // Cache the result
    const ttl = app.healthCheckTTL ?? DEFAULT_TTL;
    await cacheHealthResult(ctx.data.appId, session.user.id, healthResult, ttl);

    // Record health check for analytics (non-blocking)
    recordHealthCheck(
      ctx.data.appId,
      session.user.id,
      healthResult.status as "online" | "offline" | "unknown",
      healthResult.responseTime,
      healthResult.error
    ).catch((error) => log.logError(error, "Failed to record health check for analytics"));

    return healthResult;
  }
);

// Check health of all apps for the current user (with caching)
export const checkAllAppsHealth = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getDb } = await import("./get-db");
    const { eq } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { getAllCachedHealthResults, cacheHealthResult, DEFAULT_TTL } = await import("./health-cache.server");
    const { recordHealthCheck } = await import("./analytics.server");

    const session = await getOptionalSession();
    if (!session) {
      return { results: [], cacheStats: { hits: 0, misses: 0 } };
    }

    const db = await getDb();

    const userApps = await db
      .select()
      .from(apps)
      .where(eq(apps.userId, session.user.id));

    const results: HealthCheckResult[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // Get all cached results first
    const cachedResults = await getAllCachedHealthResults(session.user.id);
    const cachedMap = new Map(cachedResults.map(r => [r.appId, r]));

    // Process each app
    const healthCheckPromises = userApps
      .filter((app) => app.healthCheckEnabled)
      .map(async (app) => {
        // Check cache first
        const cached = cachedMap.get(app.id);
        if (cached) {
          cacheHits++;
          return {
            appId: app.id,
            status: cached.status as HealthStatus,
            responseTime: cached.responseTime ?? undefined,
            lastChecked: cached.lastChecked.toISOString(),
            error: cached.error ?? undefined,
            cached: true,
          } as HealthCheckResult;
        }

        cacheMisses++;
        const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;

        if (!checkUrl) {
          return {
            appId: app.id,
            status: "unknown" as HealthStatus,
            lastChecked: new Date().toISOString(),
            error: "No URL configured",
            cached: false,
          };
        }

        try {
          const checkResult = await performHealthCheck(app);
          const healthResult: HealthCheckResult = {
            appId: app.id,
            status: checkResult.online ? "online" : "offline",
            responseTime: checkResult.responseTime,
            lastChecked: new Date().toISOString(),
            error: checkResult.error,
            cached: false,
          };

          // Cache the result
          const ttl = app.healthCheckTTL ?? DEFAULT_TTL;
          await cacheHealthResult(app.id, session.user.id, healthResult, ttl);

          // Record health check for analytics (non-blocking)
          recordHealthCheck(
            app.id,
            session.user.id,
            healthResult.status as "online" | "offline" | "unknown",
            healthResult.responseTime,
            healthResult.error
          ).catch((err) => log.logError(err, "Failed to record health check for analytics"));

          return healthResult;
        } catch (error) {
          return {
            appId: app.id,
            status: "offline" as HealthStatus,
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
            cached: false,
          };
        }
      });

    const healthResults = await Promise.allSettled(healthCheckPromises);

    for (const result of healthResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }

    // Add unknown status for apps without health check enabled
    for (const app of userApps) {
      if (!app.healthCheckEnabled) {
        results.push({
          appId: app.id,
          status: "unknown" as HealthStatus,
          lastChecked: new Date().toISOString(),
          cached: false,
        });
      }
    }

    return {
      results,
      cacheStats: { hits: cacheHits, misses: cacheMisses },
    };
  }
);
