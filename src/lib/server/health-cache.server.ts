import { createServerFn } from "@tanstack/react-start";
import type { HealthCacheEntry } from "@/database/schema/health-cache";
import type { HealthCheckResult } from "./health.server";

// Default TTL values in seconds
export const DEFAULT_TTL = 60; // 1 minute
export const MIN_TTL = 10; // 10 seconds
export const MAX_TTL = 3600; // 1 hour

// In-memory cache for fast access (fallback when DB is not available)
const memoryCache = new Map<string, {
  entry: HealthCacheEntry;
  expiresAt: number;
}>();

// Cleanup stale entries from memory cache periodically
function cleanupMemoryCache() {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now >= value.expiresAt) {
      memoryCache.delete(key);
    }
  }
}

// Run cleanup every 30 seconds
if (typeof setInterval !== "undefined") {
  setInterval(cleanupMemoryCache, 30000);
}

/**
 * Get cached health check result for an app
 * Returns null if cache miss or expired
 */
export async function getCachedHealthResult(
  appId: string,
  userId: string
): Promise<HealthCacheEntry | null> {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();
  const now = new Date();

  // First check memory cache for faster access
  const memoryKey = `${userId}:${appId}`;
  const memoryCached = memoryCache.get(memoryKey);
  if (memoryCached && memoryCached.expiresAt > Date.now()) {
    return memoryCached.entry;
  }

  // Check database cache
  try {
    const [cached] = await db
      .select()
      .from(healthCache)
      .where(
        and(
          eq(healthCache.appId, appId),
          eq(healthCache.userId, userId)
        )
      )
      .limit(1);

    if (cached && cached.expiresAt > now) {
      // Update memory cache
      memoryCache.set(memoryKey, {
        entry: cached,
        expiresAt: cached.expiresAt.getTime(),
      });
      return cached;
    }

    return null;
  } catch (error) {
    console.error("Error fetching cached health result:", error);
    return null;
  }
}

/**
 * Get all cached health results for a user
 * Only returns non-expired entries
 */
export async function getAllCachedHealthResults(
  userId: string
): Promise<HealthCacheEntry[]> {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();
  const now = new Date();

  try {
    const cachedEntries = await db
      .select()
      .from(healthCache)
      .where(eq(healthCache.userId, userId));

    // Filter to only non-expired entries
    return cachedEntries.filter(entry => entry.expiresAt > now);
  } catch (error) {
    console.error("Error fetching all cached health results:", error);
    return [];
  }
}

/**
 * Cache a health check result
 */
export async function cacheHealthResult(
  appId: string,
  userId: string,
  result: HealthCheckResult,
  ttlSeconds: number = DEFAULT_TTL
): Promise<HealthCacheEntry | null> {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  try {
    // Upsert the cache entry
    const [existing] = await db
      .select()
      .from(healthCache)
      .where(
        and(
          eq(healthCache.appId, appId),
          eq(healthCache.userId, userId)
        )
      )
      .limit(1);

    let entry: HealthCacheEntry;

    if (existing) {
      // Update existing entry
      const metadata = existing.metadata || {};
      const checksCount = (metadata.checksCount || 0) + 1;
      const consecutiveFailures = result.status === "offline"
        ? (metadata.consecutiveFailures || 0) + 1
        : 0;

      const [updated] = await db
        .update(healthCache)
        .set({
          status: result.status,
          responseTime: result.responseTime,
          error: result.error,
          lastChecked: now,
          expiresAt,
          metadata: {
            ...metadata,
            checksCount,
            consecutiveFailures,
          },
          updatedAt: now,
        })
        .where(eq(healthCache.id, existing.id))
        .returning();

      entry = updated;
    } else {
      // Insert new entry
      const [newEntry] = await db
        .insert(healthCache)
        .values({
          appId,
          userId,
          status: result.status,
          responseTime: result.responseTime,
          error: result.error,
          lastChecked: now,
          expiresAt,
          metadata: {
            checksCount: 1,
            consecutiveFailures: result.status === "offline" ? 1 : 0,
          },
        })
        .returning();

      entry = newEntry;
    }

    // Update memory cache
    const memoryKey = `${userId}:${appId}`;
    memoryCache.set(memoryKey, {
      entry,
      expiresAt: expiresAt.getTime(),
    });

    return entry;
  } catch (error) {
    console.error("Error caching health result:", error);
    return null;
  }
}

/**
 * Invalidate cache for a specific app
 * Called when app health check settings change
 */
export async function invalidateAppCache(
  appId: string,
  userId: string
): Promise<boolean> {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();

  try {
    await db
      .delete(healthCache)
      .where(
        and(
          eq(healthCache.appId, appId),
          eq(healthCache.userId, userId)
        )
      );

    // Remove from memory cache
    const memoryKey = `${userId}:${appId}`;
    memoryCache.delete(memoryKey);

    return true;
  } catch (error) {
    console.error("Error invalidating app cache:", error);
    return false;
  }
}

/**
 * Invalidate cache for multiple apps
 */
export async function invalidateMultipleAppCaches(
  appIds: string[],
  userId: string
): Promise<boolean> {
  const { getDb } = await import("./get-db");
  const { eq, and, inArray } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  if (appIds.length === 0) return true;

  const db = await getDb();

  try {
    await db
      .delete(healthCache)
      .where(
        and(
          inArray(healthCache.appId, appIds),
          eq(healthCache.userId, userId)
        )
      );

    // Remove from memory cache
    for (const appId of appIds) {
      const memoryKey = `${userId}:${appId}`;
      memoryCache.delete(memoryKey);
    }

    return true;
  } catch (error) {
    console.error("Error invalidating multiple app caches:", error);
    return false;
  }
}

/**
 * Invalidate all cache entries for a user
 * Called on manual refresh
 */
export async function invalidateAllUserCache(userId: string): Promise<boolean> {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();

  try {
    await db
      .delete(healthCache)
      .where(eq(healthCache.userId, userId));

    // Clear memory cache for this user
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        memoryCache.delete(key);
      }
    }

    return true;
  } catch (error) {
    console.error("Error invalidating all user cache:", error);
    return false;
  }
}

/**
 * Cleanup expired cache entries from the database
 * Should be run periodically (e.g., via cron job or on startup)
 */
export async function cleanupExpiredCache(): Promise<number> {
  const { getDb } = await import("./get-db");
  const { lt } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();

  try {
    const now = new Date();
    const result = await db
      .delete(healthCache)
      .where(lt(healthCache.expiresAt, now))
      .returning();

    return result.length;
  } catch (error) {
    console.error("Error cleaning up expired cache:", error);
    return 0;
  }
}

/**
 * Get cache statistics for debugging/monitoring
 */
export async function getCacheStats(userId: string): Promise<{
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  memoryCacheSize: number;
}> {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { healthCache } = await import("@/database/schema/health-cache");

  const db = await getDb();

  try {
    const now = new Date();
    const allEntries = await db
      .select()
      .from(healthCache)
      .where(eq(healthCache.userId, userId));

    const validEntries = allEntries.filter(e => e.expiresAt > now);
    const expiredEntries = allEntries.filter(e => e.expiresAt <= now);

    let memoryCacheSize = 0;
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        memoryCacheSize++;
      }
    }

    return {
      totalEntries: allEntries.length,
      validEntries: validEntries.length,
      expiredEntries: expiredEntries.length,
      memoryCacheSize,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return {
      totalEntries: 0,
      validEntries: 0,
      expiredEntries: 0,
      memoryCacheSize: 0,
    };
  }
}

// ============================================================================
// Server Functions (API endpoints)
// ============================================================================

/**
 * Manually invalidate cache for a specific app
 */
export const invalidateAppHealthCache = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    // Verify the app belongs to the user
    const [app] = await db
      .select()
      .from(apps)
      .where(
        and(
          eq(apps.id, ctx.data.appId),
          eq(apps.userId, session.user.id)
        )
      )
      .limit(1);

    if (!app) {
      throw new Error("App not found");
    }

    const success = await invalidateAppCache(ctx.data.appId, session.user.id);

    return { success, appId: ctx.data.appId };
  }
);

/**
 * Manually invalidate cache for multiple apps
 */
export const invalidateMultipleAppsHealthCache = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appIds: string[] } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    if (!ctx.data.appIds.length) {
      return { success: true, invalidated: 0 };
    }

    // Verify all apps belong to the user
    const userApps = await db
      .select()
      .from(apps)
      .where(
        and(
          inArray(apps.id, ctx.data.appIds),
          eq(apps.userId, session.user.id)
        )
      );

    const validAppIds = userApps.map(a => a.id);
    const success = await invalidateMultipleAppCaches(validAppIds, session.user.id);

    return { success, invalidated: validAppIds.length };
  }
);

/**
 * Manually invalidate all health cache for the current user
 */
export const invalidateAllHealthCache = createServerFn({ method: "POST" }).handler(
  async () => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");

    const session = await getAuthenticatedSession();

    const success = await invalidateAllUserCache(session.user.id);

    return { success };
  }
);

/**
 * Get cache statistics for debugging
 */
export const getHealthCacheStats = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getOptionalSession } = await import("./auth-utils.server");

    const session = await getOptionalSession();
    if (!session) {
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        memoryCacheSize: 0,
      };
    }

    return getCacheStats(session.user.id);
  }
);
