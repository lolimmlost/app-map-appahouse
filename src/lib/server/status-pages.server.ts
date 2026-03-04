/**
 * Status Pages Server Module
 *
 * This module manages public-facing status pages that display health information
 * for selected apps. It provides CRUD operations for status pages and health
 * monitoring specifically for public consumption.
 *
 * MONITORING ARCHITECTURE:
 * ------------------------
 * Status pages share the same health cache as the main app monitoring system:
 *
 * 1. `getPublicStatusPageHealth`:
 *    - Reads from the `healthCache` table (shared with main app)
 *    - If cache is valid (not expired), returns cached results
 *    - If cache is expired/empty, returns "unknown" status
 *    - Also retrieves uptime statistics from `healthHistory` table
 *
 * 2. `refreshPublicStatusPageHealth`:
 *    - Uses centralized HttpClient for health checks
 *    - Updates the shared `healthCache` table with fresh results
 *    - Called automatically by the status page UI when:
 *      a) All services show "unknown" (no cached data)
 *      b) User clicks the "Refresh" button
 *
 * WHY STATUS PAGES HAVE THEIR OWN REFRESH:
 * - Public status pages are accessed by unauthenticated users
 * - They can't rely on the user's dashboard to populate the cache
 * - When cache is empty/expired, they need to trigger their own checks
 * - This ensures accurate status even when the owner hasn't visited recently
 *
 * CACHE SHARING:
 * - Both systems use the same cache key: (appId, userId)
 * - If the app owner views their dashboard, cache is populated
 * - If a visitor views the status page, same cache is used
 * - No duplicate health checks when both systems have fresh cache
 *
 * @see health.server.ts for the main app health monitoring system
 * @see http-client.server.ts for the centralized HttpClient used here
 */

import { createServerFn } from "@tanstack/react-start";
import type {
  NewStatusPage,
  NewStatusPageApp,
  StatusPageBranding,
  StatusPageDisplayOptions,
} from "@/database/schema/status-pages";
import { serverLogger } from "./logger";
import { performHealthCheck } from "./http-client.server";

// Create a child logger for status pages module
const log = serverLogger.child({ module: "status-pages" });

// Default TTL for health checks (60 seconds)
const DEFAULT_TTL = 60;

/**
 * Get all status pages for the current user
 */
export const getStatusPages = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, asc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { statusPages, statusPageApps } = await import("@/database/schema");

  const session = await getOptionalSession();
  if (!session) return { statusPages: [] };

  const db = await getDb();

  const pages = await db.query.statusPages.findMany({
    where: eq(statusPages.userId, session.user.id),
    orderBy: [asc(statusPages.title)],
    with: {
      apps: {
        orderBy: [asc(statusPageApps.sortOrder)],
        with: {
          app: true,
        },
      },
    },
  });

  return { statusPages: pages };
});

/**
 * Get a single status page by ID (for editing)
 */
export const getStatusPage = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, asc } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageApps, statusPageIncidents } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const page = await db.query.statusPages.findFirst({
      where: and(eq(statusPages.id, ctx.data.id), eq(statusPages.userId, session.user.id)),
      with: {
        apps: {
          orderBy: [asc(statusPageApps.sortOrder)],
          with: {
            app: {
              with: {
                category: true,
              },
            },
          },
        },
        incidents: {
          orderBy: [asc(statusPageIncidents.createdAt)],
          limit: 10,
        },
      },
    });

    if (!page) {
      throw new Error("Status page not found");
    }

    return page;
  }
);

/**
 * Get public status page by slug or access token (no auth required)
 */
export const getPublicStatusPage = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { slug?: string; accessToken?: string; password?: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, or, and, asc, desc } = await import("drizzle-orm");
    const { statusPages, statusPageApps, statusPageIncidents } = await import("@/database/schema");

    const db = await getDb();
    const { slug, accessToken, password } = ctx.data;

    if (!slug && !accessToken) {
      throw new Error("Slug or access token required");
    }

    // Build query based on slug or access token
    const page = await db.query.statusPages.findFirst({
      where: slug
        ? and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true))
        : eq(statusPages.accessToken, accessToken!),
      with: {
        apps: {
          where: eq(statusPageApps.visible, true),
          orderBy: [asc(statusPageApps.sortOrder)],
          with: {
            app: {
              columns: {
                id: true,
                name: true,
                description: true,
                icon: true,
                healthCheckEnabled: true,
                healthCheckType: true,
                healthCheckUrl: true,
                healthCheckTTL: true,
                localUrl: true,
                remoteUrl: true,
                categoryId: true,
              },
              with: {
                category: {
                  columns: {
                    id: true,
                    name: true,
                    color: true,
                    icon: true,
                  },
                },
              },
            },
          },
        },
        incidents: {
          where: or(
            eq(statusPageIncidents.status, "investigating"),
            eq(statusPageIncidents.status, "identified"),
            eq(statusPageIncidents.status, "monitoring")
          ),
          orderBy: [desc(statusPageIncidents.startedAt)],
          limit: 10,
        },
      },
    });

    if (!page) {
      throw new Error("Status page not found");
    }

    // Check password if required
    if (page.password) {
      if (!password) {
        return {
          requiresPassword: true,
          title: page.title,
          branding: page.branding,
        };
      }
      // Simple password comparison (in production, use proper hashing)
      if (password !== page.password) {
        throw new Error("Invalid password");
      }
    }

    // Return public data (remove sensitive fields)
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      description: page.description,
      branding: page.branding,
      displayOptions: page.displayOptions,
      apps: page.apps.map((spa) => ({
        id: spa.id,
        displayName: spa.displayName || spa.app.name,
        publicDescription: spa.publicDescription || spa.app.description,
        icon: spa.app.icon,
        groupName: spa.groupName,
        categoryName: spa.app.category?.name,
        categoryColor: spa.app.category?.color,
        appId: spa.appId,
        healthCheckEnabled: spa.app.healthCheckEnabled,
      })),
      incidents: page.incidents.map((inc) => ({
        id: inc.id,
        title: inc.title,
        message: inc.message,
        severity: inc.severity,
        status: inc.status,
        startedAt: inc.startedAt,
        updates: inc.updates,
      })),
      requiresPassword: false,
    };
  }
);

/**
 * Get health status for all apps on a public status page
 */
export const getPublicStatusPageHealth = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { statusPageId: string; accessToken?: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, asc, inArray, gte } = await import("drizzle-orm");
    const { statusPages, statusPageApps, healthCache, apps, healthHistory } = await import("@/database/schema");

    const db = await getDb();
    const { statusPageId, accessToken } = ctx.data;

    // Verify the status page exists and is accessible
    const page = await db.query.statusPages.findFirst({
      where: accessToken
        ? eq(statusPages.accessToken, accessToken)
        : and(eq(statusPages.id, statusPageId), eq(statusPages.isPublic, true)),
      with: {
        apps: {
          where: eq(statusPageApps.visible, true),
          with: {
            app: true,
          },
        },
      },
    });

    if (!page) {
      throw new Error("Status page not found");
    }

    // Get app IDs for this status page
    const appIds = page.apps.map((spa) => spa.appId);
    if (appIds.length === 0) {
      return { healthResults: [], uptimeStats: {} };
    }

    // Get health cache entries for these apps (owned by the status page owner)
    const healthResults = await db.query.healthCache.findMany({
      where: and(
        inArray(healthCache.appId, appIds),
        eq(healthCache.userId, page.userId),
        gte(healthCache.expiresAt, new Date())
      ),
    });

    // Create a map of app health
    const healthMap = new Map(healthResults.map((h) => [h.appId, h]));

    // Calculate uptime stats from health history (last 30 days by default)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historyResults = await db.query.healthHistory.findMany({
      where: and(
        inArray(healthHistory.appId, appIds),
        eq(healthHistory.userId, page.userId),
        gte(healthHistory.checkedAt, thirtyDaysAgo)
      ),
      orderBy: [asc(healthHistory.checkedAt)],
    });

    // Calculate uptime percentage for each app
    const uptimeStats: Record<string, { uptime: number; checks: number; avgResponseTime: number }> = {};
    const appHistoryMap = new Map<string, typeof historyResults>();

    for (const entry of historyResults) {
      const existing = appHistoryMap.get(entry.appId) || [];
      existing.push(entry);
      appHistoryMap.set(entry.appId, existing);
    }

    for (const appId of appIds) {
      const history = appHistoryMap.get(appId) || [];
      const totalChecks = history.length;
      const onlineChecks = history.filter((h) => h.status === "online").length;
      const responseTimes = history.filter((h) => h.responseTime).map((h) => h.responseTime!);

      uptimeStats[appId] = {
        uptime: totalChecks > 0 ? (onlineChecks / totalChecks) * 100 : 0,
        checks: totalChecks,
        avgResponseTime: responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
      };
    }

    // Build health result array
    const results = page.apps.map((spa) => {
      const health = healthMap.get(spa.appId);
      const app = spa.app;

      // If app doesn't have health check enabled, return unknown
      if (!app.healthCheckEnabled) {
        return {
          appId: spa.appId,
          status: "unknown" as const,
          lastChecked: new Date().toISOString(),
        };
      }

      if (health) {
        return {
          appId: spa.appId,
          status: health.status as "online" | "offline" | "unknown",
          responseTime: health.responseTime ?? undefined,
          lastChecked: health.lastChecked.toISOString(),
          error: health.error ?? undefined,
        };
      }

      // No cached result, need to perform a fresh check
      return {
        appId: spa.appId,
        status: "unknown" as const,
        lastChecked: new Date().toISOString(),
      };
    });

    return {
      healthResults: results,
      uptimeStats,
    };
  }
);

/**
 * Perform live health checks for a public status page (triggers fresh checks)
 */
export const refreshPublicStatusPageHealth = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { statusPageId: string; accessToken?: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { statusPages, statusPageApps, healthCache, apps } = await import("@/database/schema");

    const db = await getDb();
    const { statusPageId, accessToken } = ctx.data;

    // Verify the status page exists and is accessible
    const page = await db.query.statusPages.findFirst({
      where: accessToken
        ? eq(statusPages.accessToken, accessToken)
        : and(eq(statusPages.id, statusPageId), eq(statusPages.isPublic, true)),
      with: {
        apps: {
          where: eq(statusPageApps.visible, true),
          with: {
            app: true,
          },
        },
      },
    });

    if (!page) {
      throw new Error("Status page not found");
    }

    // Get apps that need health checks
    const appsToCheck = page.apps
      .filter((spa) => spa.app.healthCheckEnabled)
      .map((spa) => spa.app);

    if (appsToCheck.length === 0) {
      return { healthResults: [] };
    }

    // Perform health checks using centralized HttpClient
    const results = await Promise.allSettled(
      appsToCheck.map(async (app) => {
        const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;
        if (!checkUrl) {
          return {
            appId: app.id,
            status: "unknown" as const,
            lastChecked: new Date().toISOString(),
            error: "No URL configured",
          };
        }

        // Use centralized performHealthCheck from http-client.server.ts
        const checkResult = await performHealthCheck(checkUrl, {
          timeout: 5000,
          method: "HEAD",
        });

        const result = {
          appId: app.id,
          status: checkResult.online ? ("online" as const) : ("offline" as const),
          responseTime: checkResult.responseTime,
          lastChecked: new Date().toISOString(),
          error: checkResult.error,
        };

        // Update the cache
        const expiresAt = new Date(Date.now() + (app.healthCheckTTL || DEFAULT_TTL) * 1000);
        await db
          .insert(healthCache)
          .values({
            appId: app.id,
            userId: page.userId,
            status: result.status,
            responseTime: result.responseTime,
            lastChecked: new Date(),
            expiresAt,
          })
          .onConflictDoUpdate({
            target: [healthCache.appId, healthCache.userId],
            set: {
              status: result.status,
              responseTime: result.responseTime,
              lastChecked: new Date(),
              expiresAt,
              updatedAt: new Date(),
            },
          });

        return result;
      })
    );

    return {
      healthResults: results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map((r) => r.value),
    };
  }
);

type CreateStatusPageData = {
  data: {
    title: string;
    slug: string;
    description?: string;
    isPublic?: boolean;
    password?: string;
    branding?: StatusPageBranding;
    displayOptions?: StatusPageDisplayOptions;
    appIds?: string[];
  };
};

/**
 * Create a new status page
 */
export const createStatusPage = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateStatusPageData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageApps, apps } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { title, slug, description, isPublic, password, branding, displayOptions, appIds } = ctx.data;

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
    }

    // Check for duplicate slug
    const existing = await db.query.statusPages.findFirst({
      where: and(eq(statusPages.userId, session.user.id), eq(statusPages.slug, slug)),
    });

    if (existing) {
      throw new Error("A status page with this slug already exists");
    }

    // Create the status page
    const [newPage] = await db
      .insert(statusPages)
      .values({
        title,
        slug,
        description,
        userId: session.user.id,
        isPublic: isPublic ?? true,
        password: password || null,
        branding: branding || {},
        displayOptions: displayOptions || {},
      })
      .returning();

    // Add apps if provided
    if (appIds?.length) {
      log.debug("Creating status page with apps", { appIds });

      // Verify apps belong to user
      const userApps = await db.query.apps.findMany({
        where: eq(apps.userId, session.user.id),
      });
      log.debug("User's apps found", { count: userApps.length });

      const validAppIds = userApps.map((a) => a.id);
      const filteredAppIds = appIds.filter((id) => validAppIds.includes(id));
      log.debug("Filtered valid appIds", { filteredAppIds });

      if (filteredAppIds.length === 0 && appIds.length > 0) {
        throw new Error(`No valid apps found. Requested: ${appIds.join(", ")}`);
      }

      if (filteredAppIds.length > 0) {
        log.debug("Inserting apps into status page", { pageId: newPage.id, appCount: filteredAppIds.length });
        try {
          await db.insert(statusPageApps).values(
            filteredAppIds.map((appId, index) => ({
              statusPageId: newPage.id,
              appId,
              sortOrder: index,
            }))
          );
          log.debug("Successfully inserted apps into status page");
        } catch (error) {
          log.logError(error, "Error inserting apps into status page", { pageId: newPage.id });
          throw new Error(`Failed to add apps to status page: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return newPage;
  }
);

type UpdateStatusPageData = {
  data: {
    id: string;
    title?: string;
    slug?: string;
    description?: string;
    isPublic?: boolean;
    password?: string | null;
    branding?: StatusPageBranding;
    displayOptions?: StatusPageDisplayOptions;
    appIds?: string[];
  };
};

/**
 * Update a status page
 */
export const updateStatusPage = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateStatusPageData) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageApps, apps } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { id, slug, appIds, ...updateData } = ctx.data;

    // Validate slug format if provided
    if (slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
      }

      // Check for duplicate slug (excluding current page)
      const existing = await db.query.statusPages.findFirst({
        where: and(
          eq(statusPages.userId, session.user.id),
          eq(statusPages.slug, slug)
        ),
      });

      if (existing && existing.id !== id) {
        throw new Error("A status page with this slug already exists");
      }
    }

    const [updatedPage] = await db
      .update(statusPages)
      .set({
        ...updateData,
        ...(slug && { slug }),
        updatedAt: new Date(),
      })
      .where(and(eq(statusPages.id, id), eq(statusPages.userId, session.user.id)))
      .returning();

    if (!updatedPage) {
      throw new Error("Status page not found");
    }

    // Update apps if appIds are provided
    if (appIds !== undefined) {
      log.debug("Updating status page apps", { pageId: id, appIds });

      // Verify apps belong to user
      const userApps = await db.query.apps.findMany({
        where: eq(apps.userId, session.user.id),
      });
      log.debug("User's apps found for update", { count: userApps.length });

      const validAppIds = userApps.map((a) => a.id);
      const filteredAppIds = appIds.filter((appId) => validAppIds.includes(appId));
      log.debug("Filtered valid appIds for update", { filteredAppIds });

      if (filteredAppIds.length === 0 && appIds.length > 0) {
        throw new Error(`No valid apps found. Requested: ${appIds.join(", ")}`);
      }

      // Delete all existing app associations
      log.debug("Deleting existing app associations", { pageId: id });
      await db
        .delete(statusPageApps)
        .where(eq(statusPageApps.statusPageId, id));

      // Add new app associations
      if (filteredAppIds.length > 0) {
        log.debug("Inserting new app associations", { pageId: id, appCount: filteredAppIds.length });
        try {
          await db.insert(statusPageApps).values(
            filteredAppIds.map((appId, index) => ({
              statusPageId: id,
              appId,
              sortOrder: index,
            }))
          );
          log.debug("Successfully inserted apps into status page");
        } catch (error) {
          log.logError(error, "Error inserting apps into status page", { pageId: id });
          throw new Error(`Failed to add apps to status page: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return updatedPage;
  }
);

/**
 * Delete a status page
 */
export const deleteStatusPage = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    await db
      .delete(statusPages)
      .where(and(eq(statusPages.id, ctx.data.id), eq(statusPages.userId, session.user.id)));

    return { success: true };
  }
);

/**
 * Regenerate access token for a status page
 */
export const regenerateAccessToken = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const newToken = crypto.randomUUID();

    const [updatedPage] = await db
      .update(statusPages)
      .set({
        accessToken: newToken,
        updatedAt: new Date(),
      })
      .where(and(eq(statusPages.id, ctx.data.id), eq(statusPages.userId, session.user.id)))
      .returning();

    if (!updatedPage) {
      throw new Error("Status page not found");
    }

    return { accessToken: newToken };
  }
);

/**
 * Add an app to a status page
 */
export const addAppToStatusPage = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { statusPageId: string; appId: string; displayName?: string; publicDescription?: string; groupName?: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, count } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageApps, apps } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { statusPageId, appId, displayName, publicDescription, groupName } = ctx.data;

    // Verify status page belongs to user
    const page = await db.query.statusPages.findFirst({
      where: and(eq(statusPages.id, statusPageId), eq(statusPages.userId, session.user.id)),
    });

    if (!page) {
      throw new Error("Status page not found");
    }

    // Verify app belongs to user
    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, appId), eq(apps.userId, session.user.id)),
    });

    if (!app) {
      throw new Error("App not found");
    }

    // Get next sort order
    const [{ value: existingCount }] = await db
      .select({ value: count() })
      .from(statusPageApps)
      .where(eq(statusPageApps.statusPageId, statusPageId));

    const [newEntry] = await db
      .insert(statusPageApps)
      .values({
        statusPageId,
        appId,
        displayName,
        publicDescription,
        groupName,
        sortOrder: Number(existingCount) || 0,
      })
      .returning();

    return newEntry;
  }
);

/**
 * Remove an app from a status page
 */
export const removeAppFromStatusPage = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { statusPageId: string; appId: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageApps } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    // Verify status page belongs to user
    const page = await db.query.statusPages.findFirst({
      where: and(eq(statusPages.id, ctx.data.statusPageId), eq(statusPages.userId, session.user.id)),
    });

    if (!page) {
      throw new Error("Status page not found");
    }

    await db
      .delete(statusPageApps)
      .where(
        and(
          eq(statusPageApps.statusPageId, ctx.data.statusPageId),
          eq(statusPageApps.appId, ctx.data.appId)
        )
      );

    return { success: true };
  }
);

/**
 * Update app display settings on a status page
 */
export const updateStatusPageApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string; displayName?: string; publicDescription?: string; groupName?: string; visible?: boolean; sortOrder?: number } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageApps } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { id, ...updateData } = ctx.data;

    // Get the status page app entry
    const entry = await db.query.statusPageApps.findFirst({
      where: eq(statusPageApps.id, id),
      with: {
        statusPage: true,
      },
    });

    if (!entry || entry.statusPage.userId !== session.user.id) {
      throw new Error("Status page app not found");
    }

    const [updated] = await db
      .update(statusPageApps)
      .set(updateData)
      .where(eq(statusPageApps.id, id))
      .returning();

    return updated;
  }
);

/**
 * Reorder apps on a status page
 */
export const reorderStatusPageApps = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { statusPageId: string; orderedAppIds: string[] } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageApps } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { statusPageId, orderedAppIds } = ctx.data;

    // Verify status page belongs to user
    const page = await db.query.statusPages.findFirst({
      where: and(eq(statusPages.id, statusPageId), eq(statusPages.userId, session.user.id)),
    });

    if (!page) {
      throw new Error("Status page not found");
    }

    // Update sort order for each app
    await db.transaction(async (tx) => {
      await Promise.all(
        orderedAppIds.map((appId, index) =>
          tx
            .update(statusPageApps)
            .set({ sortOrder: index })
            .where(
              and(
                eq(statusPageApps.statusPageId, statusPageId),
                eq(statusPageApps.appId, appId)
              )
            )
        )
      );
    });

    return { success: true };
  }
);

/**
 * Create an incident for a status page
 */
export const createIncident = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { statusPageId: string; appId?: string; title: string; message?: string; severity?: "minor" | "major" | "critical" } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageIncidents } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { statusPageId, appId, title, message, severity } = ctx.data;

    // Verify status page belongs to user
    const page = await db.query.statusPages.findFirst({
      where: and(eq(statusPages.id, statusPageId), eq(statusPages.userId, session.user.id)),
    });

    if (!page) {
      throw new Error("Status page not found");
    }

    const [incident] = await db
      .insert(statusPageIncidents)
      .values({
        statusPageId,
        appId: appId || null,
        title,
        message,
        severity: severity || "minor",
        status: "investigating",
        updates: [{
          id: crypto.randomUUID(),
          message: message || "We are investigating this issue.",
          status: "investigating",
          createdAt: new Date().toISOString(),
        }],
      })
      .returning();

    return incident;
  }
);

/**
 * Update an incident status
 */
export const updateIncident = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string; status: "investigating" | "identified" | "monitoring" | "resolved"; message?: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { statusPages, statusPageIncidents } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { id, status, message } = ctx.data;

    // Get the incident
    const incident = await db.query.statusPageIncidents.findFirst({
      where: eq(statusPageIncidents.id, id),
      with: {
        statusPage: true,
      },
    });

    if (!incident || incident.statusPage.userId !== session.user.id) {
      throw new Error("Incident not found");
    }

    // Add update to history
    const updates = [...(incident.updates || []), {
      id: crypto.randomUUID(),
      message: message || `Status updated to ${status}`,
      status,
      createdAt: new Date().toISOString(),
    }];

    const [updated] = await db
      .update(statusPageIncidents)
      .set({
        status,
        updates,
        ...(status === "resolved" && { resolvedAt: new Date() }),
        updatedAt: new Date(),
      })
      .where(eq(statusPageIncidents.id, id))
      .returning();

    return updated;
  }
);
