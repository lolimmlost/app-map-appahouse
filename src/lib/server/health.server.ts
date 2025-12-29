import { createServerFn } from "@tanstack/react-start";
import type { apps } from "@/database/schema/apps";

export type HealthStatus = "online" | "offline" | "unknown" | "checking";

export type HealthCheckResult = {
  appId: string;
  status: HealthStatus;
  responseTime?: number;
  lastChecked: string;
  error?: string;
  cached?: boolean; // Indicates if result came from cache
};

// Connection pool configuration
const CONNECTION_POOL_CONFIG = {
  maxConnectionsPerHost: 6, // Maximum concurrent connections per host
  keepAliveTimeout: 60000, // Keep connections alive for 60 seconds
  requestTimeout: 5000, // Default request timeout
};

// Connection pool to reuse HTTP connections
// Uses a Map to track active connections per host
const connectionPool = new Map<string, {
  activeConnections: number;
  lastUsed: number;
}>();

// Cleanup stale connections periodically
function cleanupConnectionPool() {
  const now = Date.now();
  for (const [host, state] of connectionPool.entries()) {
    if (now - state.lastUsed > CONNECTION_POOL_CONFIG.keepAliveTimeout) {
      connectionPool.delete(host);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== "undefined") {
  setInterval(cleanupConnectionPool, 60000);
}

// Extract host from URL for connection pooling
function getHostFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    return url;
  }
}

// Acquire a connection slot from the pool
async function acquireConnection(host: string): Promise<boolean> {
  const state = connectionPool.get(host) || { activeConnections: 0, lastUsed: Date.now() };

  if (state.activeConnections >= CONNECTION_POOL_CONFIG.maxConnectionsPerHost) {
    // Wait for a connection to become available (simple polling)
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const currentState = connectionPool.get(host);
      if (!currentState || currentState.activeConnections < CONNECTION_POOL_CONFIG.maxConnectionsPerHost) {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // Timeout waiting for connection, proceed anyway
      return false;
    }
  }

  // Increment active connections
  connectionPool.set(host, {
    activeConnections: (connectionPool.get(host)?.activeConnections || 0) + 1,
    lastUsed: Date.now(),
  });

  return true;
}

// Release a connection slot back to the pool
function releaseConnection(host: string): void {
  const state = connectionPool.get(host);
  if (state) {
    connectionPool.set(host, {
      activeConnections: Math.max(0, state.activeConnections - 1),
      lastUsed: Date.now(),
    });
  }
}

// Perform HTTP health check with connection pooling
async function httpHealthCheck(url: string, timeoutMs = CONNECTION_POOL_CONFIG.requestTimeout): Promise<{ online: boolean; responseTime?: number; error?: string }> {
  const host = getHostFromUrl(url);
  const startTime = Date.now();

  // Acquire connection from pool
  await acquireConnection(host);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "AppMap-HealthCheck/1.0",
        "Connection": "keep-alive", // Request connection reuse
      },
      // Enable keep-alive for connection reuse
      keepalive: true,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Consider 2xx and 3xx as online
    return {
      online: response.status >= 200 && response.status < 400,
      responseTime,
    };
  } catch (error) {
    return {
      online: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    // Release connection back to pool
    releaseConnection(host);
  }
}

// Perform TCP health check (simplified - just try HTTP)
async function tcpHealthCheck(url: string, timeoutMs = CONNECTION_POOL_CONFIG.requestTimeout): Promise<{ online: boolean; responseTime?: number; error?: string }> {
  // For now, TCP check is the same as HTTP but we try to just connect
  return httpHealthCheck(url, timeoutMs);
}

// Perform actual health check for an app (internal function)
async function performHealthCheck(
  app: typeof apps.$inferSelect
): Promise<{ online: boolean; responseTime?: number; error?: string }> {
  const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;

  if (!checkUrl) {
    return { online: false, error: "No URL configured for health check" };
  }

  switch (app.healthCheckType) {
    case "http":
      return httpHealthCheck(checkUrl);
    case "tcp":
      return tcpHealthCheck(checkUrl);
    case "uptime_kuma":
      return { online: false, error: "Uptime Kuma integration not configured" };
    default:
      return httpHealthCheck(checkUrl);
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
    ).catch(console.error);

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
    ).catch(console.error);

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
          ).catch(console.error);

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
