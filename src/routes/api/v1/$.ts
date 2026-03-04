/**
 * REST API v1 Endpoint Handler
 *
 * This file handles all /api/v1/* routes for external integrations.
 * Authentication is done via API keys with scope-based permissions.
 *
 * Supported endpoints:
 * - GET /api/v1/apps - List all apps
 * - GET /api/v1/apps/:id - Get a specific app
 * - POST /api/v1/apps - Create an app
 * - PATCH /api/v1/apps/:id - Update an app
 * - DELETE /api/v1/apps/:id - Delete an app
 * - GET /api/v1/health - Get all health statuses
 * - GET /api/v1/health/:appId - Get health for a specific app
 * - POST /api/v1/health/:appId/refresh - Trigger a health check
 * - GET /api/v1/categories - List categories
 * - GET /api/v1/status - API status and info
 */

import { createFileRoute } from "@tanstack/react-router";
import { serverLogger } from "@/lib/server/logger";

const log = serverLogger.child({ module: "api-v1" });

type RouteParams = {
  _splat: string;
};

async function handleApiRequest(request: Request, splat: string): Promise<Response> {
  const { authenticateApiRequest, hasScope, jsonResponse, errorResponse, logApiRequest, getRateLimitHeaders } =
    await import("@/lib/server/api-auth.server");

  const startTime = Date.now();
  const method = request.method;
  const pathParts = splat.split("/").filter(Boolean);

  // Handle status endpoint (no auth required)
  if (pathParts[0] === "status" && method === "GET") {
    return jsonResponse({
      status: "ok",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      endpoints: [
        "GET /api/v1/apps",
        "GET /api/v1/apps/:id",
        "POST /api/v1/apps",
        "PATCH /api/v1/apps/:id",
        "DELETE /api/v1/apps/:id",
        "GET /api/v1/health",
        "GET /api/v1/health/:appId",
        "POST /api/v1/health/:appId/refresh",
        "GET /api/v1/categories",
        "GET /api/v1/status",
      ],
    });
  }

  // Authenticate the request
  const authResult = await authenticateApiRequest(request);
  if (!authResult.success) {
    return errorResponse(authResult.error, authResult.statusCode, "AUTH_ERROR");
  }

  const { apiKeyId, userId, scopes } = authResult;
  const rateLimitHeaders = getRateLimitHeaders(apiKeyId);

  let response: Response;

  try {
    // Route to the appropriate handler
    const resource = pathParts[0];

    switch (resource) {
      case "apps":
        response = await handleAppsEndpoint(request, pathParts, userId, scopes);
        break;
      case "health":
        response = await handleHealthEndpoint(request, pathParts, userId, scopes);
        break;
      case "categories":
        response = await handleCategoriesEndpoint(request, pathParts, userId, scopes);
        break;
      default:
        response = errorResponse(`Unknown endpoint: /api/v1/${resource}`, 404, "NOT_FOUND");
    }

    // Log the request
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    // Add rate limit headers to response
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      headers.set(key, value);
    }

    // Log request asynchronously
    logApiRequest(apiKeyId, `/api/v1/${splat}`, method, statusCode, responseTime, request).catch((err) =>
      log.logError(err, "Failed to log API request")
    );

    return new Response(response.body, {
      status: statusCode,
      headers,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    log.logError(error, "API request error", { endpoint: `/api/v1/${splat}`, method });
    logApiRequest(apiKeyId, `/api/v1/${splat}`, method, 500, responseTime, request).catch((err) =>
      log.logError(err, "Failed to log API request")
    );

    return errorResponse(errorMessage, 500, "INTERNAL_ERROR");
  }
}

// Apps endpoint handlers
async function handleAppsEndpoint(
  request: Request,
  pathParts: string[],
  userId: string,
  scopes: string[]
): Promise<Response> {
  const { hasScope, jsonResponse, errorResponse } = await import("@/lib/server/api-auth.server");
  const { getDb } = await import("@/lib/server/get-db");
  const { eq, and, asc } = await import("drizzle-orm");
  const { apps, categories, tags, appTags } = await import("@/database/schema");

  const db = await getDb();
  const method = request.method;
  const appId = pathParts[1];

  // GET /api/v1/apps - List all apps
  if (method === "GET" && !appId) {
    if (!hasScope(scopes as any, "read:apps")) {
      return errorResponse("Insufficient permissions. Required scope: read:apps", 403, "FORBIDDEN");
    }

    const userApps = await db.query.apps.findMany({
      where: eq(apps.userId, userId),
      orderBy: [asc(apps.sortOrder), asc(apps.name)],
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return jsonResponse({
      data: userApps.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        icon: app.icon,
        localUrl: app.localUrl,
        remoteUrl: app.remoteUrl,
        categoryId: app.categoryId,
        category: app.category ? { id: app.category.id, name: app.category.name } : null,
        tags: app.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
        healthCheckEnabled: app.healthCheckEnabled,
        healthCheckType: app.healthCheckType,
        pinned: app.pinned,
        sortOrder: app.sortOrder,
        notes: app.notes,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
      })),
      meta: {
        total: userApps.length,
      },
    });
  }

  // GET /api/v1/apps/:id - Get a specific app
  if (method === "GET" && appId) {
    if (!hasScope(scopes as any, "read:apps")) {
      return errorResponse("Insufficient permissions. Required scope: read:apps", 403, "FORBIDDEN");
    }

    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, appId), eq(apps.userId, userId)),
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!app) {
      return errorResponse("App not found", 404, "NOT_FOUND");
    }

    return jsonResponse({
      data: {
        id: app.id,
        name: app.name,
        description: app.description,
        icon: app.icon,
        localUrl: app.localUrl,
        remoteUrl: app.remoteUrl,
        categoryId: app.categoryId,
        category: app.category ? { id: app.category.id, name: app.category.name } : null,
        tags: app.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
        healthCheckEnabled: app.healthCheckEnabled,
        healthCheckType: app.healthCheckType,
        healthCheckUrl: app.healthCheckUrl,
        healthCheckTTL: app.healthCheckTTL,
        pinned: app.pinned,
        sortOrder: app.sortOrder,
        notes: app.notes,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
      },
    });
  }

  // POST /api/v1/apps - Create an app
  if (method === "POST" && !appId) {
    if (!hasScope(scopes as any, "write:apps")) {
      return errorResponse("Insufficient permissions. Required scope: write:apps", 403, "FORBIDDEN");
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400, "INVALID_REQUEST");
    }

    if (!body.name) {
      return errorResponse("Name is required", 400, "VALIDATION_ERROR");
    }

    const [newApp] = await db
      .insert(apps)
      .values({
        name: body.name,
        description: body.description || null,
        icon: body.icon || null,
        localUrl: body.localUrl || null,
        remoteUrl: body.remoteUrl || null,
        categoryId: body.categoryId || null,
        userId,
        healthCheckEnabled: body.healthCheckEnabled ?? false,
        healthCheckType: body.healthCheckType || "http",
        healthCheckUrl: body.healthCheckUrl || null,
        healthCheckTTL: body.healthCheckTTL || 60,
        pinned: body.pinned ?? false,
        sortOrder: body.sortOrder ?? 0,
        notes: body.notes || null,
      })
      .returning();

    return jsonResponse(
      {
        data: {
          id: newApp.id,
          name: newApp.name,
          description: newApp.description,
          createdAt: newApp.createdAt.toISOString(),
        },
        message: "App created successfully",
      },
      201
    );
  }

  // PATCH /api/v1/apps/:id - Update an app
  if (method === "PATCH" && appId) {
    if (!hasScope(scopes as any, "write:apps")) {
      return errorResponse("Insufficient permissions. Required scope: write:apps", 403, "FORBIDDEN");
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400, "INVALID_REQUEST");
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      "name",
      "description",
      "icon",
      "localUrl",
      "remoteUrl",
      "categoryId",
      "healthCheckEnabled",
      "healthCheckType",
      "healthCheckUrl",
      "healthCheckTTL",
      "pinned",
      "sortOrder",
      "notes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const [updatedApp] = await db
      .update(apps)
      .set(updateData)
      .where(and(eq(apps.id, appId), eq(apps.userId, userId)))
      .returning();

    if (!updatedApp) {
      return errorResponse("App not found", 404, "NOT_FOUND");
    }

    return jsonResponse({
      data: {
        id: updatedApp.id,
        name: updatedApp.name,
        updatedAt: updatedApp.updatedAt.toISOString(),
      },
      message: "App updated successfully",
    });
  }

  // DELETE /api/v1/apps/:id - Delete an app
  if (method === "DELETE" && appId) {
    if (!hasScope(scopes as any, "write:apps")) {
      return errorResponse("Insufficient permissions. Required scope: write:apps", 403, "FORBIDDEN");
    }

    const deletedApps = await db
      .delete(apps)
      .where(and(eq(apps.id, appId), eq(apps.userId, userId)))
      .returning();

    if (deletedApps.length === 0) {
      return errorResponse("App not found", 404, "NOT_FOUND");
    }

    return jsonResponse({
      message: "App deleted successfully",
    });
  }

  return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED");
}

// Health endpoint handlers
async function handleHealthEndpoint(
  request: Request,
  pathParts: string[],
  userId: string,
  scopes: string[]
): Promise<Response> {
  const { hasScope, jsonResponse, errorResponse } = await import("@/lib/server/api-auth.server");
  const { getDb } = await import("@/lib/server/get-db");
  const { eq, and } = await import("drizzle-orm");
  const { apps, healthCache } = await import("@/database/schema");

  const db = await getDb();
  const method = request.method;
  const appId = pathParts[1];
  const action = pathParts[2];

  // GET /api/v1/health - Get all health statuses
  if (method === "GET" && !appId) {
    if (!hasScope(scopes as any, "read:health")) {
      return errorResponse("Insufficient permissions. Required scope: read:health", 403, "FORBIDDEN");
    }

    const userApps = await db.query.apps.findMany({
      where: eq(apps.userId, userId),
    });

    const appIds = userApps.map((a) => a.id);

    // Get cached health results
    const cachedResults = await db.query.healthCache.findMany({
      where: eq(healthCache.userId, userId),
    });

    const healthMap = new Map(cachedResults.map((r) => [r.appId, r]));

    const healthStatuses = userApps.map((app) => {
      const cached = healthMap.get(app.id);
      return {
        appId: app.id,
        appName: app.name,
        healthCheckEnabled: app.healthCheckEnabled,
        status: cached?.status || "unknown",
        responseTime: cached?.responseTime,
        lastChecked: cached?.lastChecked?.toISOString() || null,
        error: cached?.error,
      };
    });

    return jsonResponse({
      data: healthStatuses,
      meta: {
        total: healthStatuses.length,
        online: healthStatuses.filter((h) => h.status === "online").length,
        offline: healthStatuses.filter((h) => h.status === "offline").length,
        unknown: healthStatuses.filter((h) => h.status === "unknown").length,
      },
    });
  }

  // GET /api/v1/health/:appId - Get health for a specific app
  if (method === "GET" && appId && !action) {
    if (!hasScope(scopes as any, "read:health")) {
      return errorResponse("Insufficient permissions. Required scope: read:health", 403, "FORBIDDEN");
    }

    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, appId), eq(apps.userId, userId)),
    });

    if (!app) {
      return errorResponse("App not found", 404, "NOT_FOUND");
    }

    const cached = await db.query.healthCache.findFirst({
      where: and(eq(healthCache.appId, appId), eq(healthCache.userId, userId)),
    });

    return jsonResponse({
      data: {
        appId: app.id,
        appName: app.name,
        healthCheckEnabled: app.healthCheckEnabled,
        healthCheckType: app.healthCheckType,
        healthCheckUrl: app.healthCheckUrl || app.localUrl || app.remoteUrl,
        status: cached?.status || "unknown",
        responseTime: cached?.responseTime,
        lastChecked: cached?.lastChecked?.toISOString() || null,
        error: cached?.error,
        ttl: app.healthCheckTTL,
      },
    });
  }

  // POST /api/v1/health/:appId/refresh - Trigger a health check
  if (method === "POST" && appId && action === "refresh") {
    if (!hasScope(scopes as any, "trigger:health")) {
      return errorResponse("Insufficient permissions. Required scope: trigger:health", 403, "FORBIDDEN");
    }

    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, appId), eq(apps.userId, userId)),
    });

    if (!app) {
      return errorResponse("App not found", 404, "NOT_FOUND");
    }

    // Perform health check
    const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;

    if (!checkUrl) {
      return jsonResponse({
        data: {
          appId: app.id,
          status: "unknown",
          error: "No URL configured for health check",
        },
      });
    }

    // Use centralized performHealthCheck from http-client.server.ts
    const { performHealthCheck } = await import("@/lib/server/http-client.server");
    const checkResult = await performHealthCheck(checkUrl, {
      timeout: 5000,
      method: "HEAD",
    });

    const status = checkResult.online ? "online" : "offline";

    // Update cache
    const { cacheHealthResult } = await import("@/lib/server/health-cache.server");
    await cacheHealthResult(
      appId,
      userId,
      {
        appId,
        status,
        responseTime: checkResult.responseTime,
        lastChecked: new Date().toISOString(),
        error: checkResult.error,
      },
      app.healthCheckTTL ?? 60
    );

    return jsonResponse({
      data: {
        appId: app.id,
        appName: app.name,
        status,
        responseTime: checkResult.responseTime,
        lastChecked: new Date().toISOString(),
        ...(checkResult.error && { error: checkResult.error }),
      },
      message: checkResult.online ? "Health check completed" : "Health check completed (offline)",
    });
  }

  return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED");
}

// Categories endpoint handlers
async function handleCategoriesEndpoint(
  request: Request,
  pathParts: string[],
  userId: string,
  scopes: string[]
): Promise<Response> {
  const { hasScope, jsonResponse, errorResponse } = await import("@/lib/server/api-auth.server");
  const { getDb } = await import("@/lib/server/get-db");
  const { eq, asc, sql } = await import("drizzle-orm");
  const { categories, apps } = await import("@/database/schema");

  const db = await getDb();
  const method = request.method;

  // GET /api/v1/categories - List all categories
  if (method === "GET") {
    if (!hasScope(scopes as any, "read:categories")) {
      return errorResponse("Insufficient permissions. Required scope: read:categories", 403, "FORBIDDEN");
    }

    const userCategories = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: [asc(categories.sortOrder), asc(categories.name)],
    });

    // Count apps per category
    const appCounts = await db
      .select({
        categoryId: apps.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(apps)
      .where(eq(apps.userId, userId))
      .groupBy(apps.categoryId);

    const countMap = new Map(appCounts.map((c) => [c.categoryId, c.count]));

    return jsonResponse({
      data: userCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
        appCount: countMap.get(cat.id) || 0,
        createdAt: cat.createdAt.toISOString(),
      })),
      meta: {
        total: userCategories.length,
      },
    });
  }

  return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED");
}

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        return handleApiRequest(request, (params as RouteParams)._splat);
      },
      POST: async ({ request, params }) => {
        return handleApiRequest(request, (params as RouteParams)._splat);
      },
      PATCH: async ({ request, params }) => {
        return handleApiRequest(request, (params as RouteParams)._splat);
      },
      DELETE: async ({ request, params }) => {
        return handleApiRequest(request, (params as RouteParams)._splat);
      },
      PUT: async ({ request, params }) => {
        return handleApiRequest(request, (params as RouteParams)._splat);
      },
    },
  },
});
