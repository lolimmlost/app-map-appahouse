import { createServerFn } from "@tanstack/react-start";
import type { ApiKey, ApiKeyScope, NewApiKey } from "@/database/schema/api-keys";

// Generate a secure random API key
function generateApiKey(): string {
  const prefix = "apmap"; // App Map prefix
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const key = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}_${key}`;
}

// Hash the API key for storage
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Get all API keys for the current user
export const getApiKeys = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, desc } = await import("drizzle-orm");
  const { getAuthenticatedSession } = await import("./auth-utils.server");
  const { apiKeys } = await import("@/database/schema");

  const db = await getDb();
  const session = await getAuthenticatedSession();

  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, session.user.id),
    orderBy: [desc(apiKeys.createdAt)],
  });

  // Don't return the hash, only the prefix for display
  return {
    apiKeys: keys.map((key) => ({
      id: key.id,
      name: key.name,
      description: key.description,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes.split(",") as ApiKeyScope[],
      rateLimitPerMinute: key.rateLimitPerMinute,
      rateLimitPerHour: key.rateLimitPerHour,
      enabled: key.enabled,
      expiresAt: key.expiresAt?.toISOString() ?? null,
      lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
      lastUsedIp: key.lastUsedIp,
      usageCount: key.usageCount,
      createdAt: key.createdAt.toISOString(),
      updatedAt: key.updatedAt.toISOString(),
    })),
  };
});

// Create a new API key
export const createApiKey = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    data: {
      name: string;
      description?: string;
      scopes: ApiKeyScope[];
      rateLimitPerMinute?: number;
      rateLimitPerHour?: number;
      expiresAt?: string;
    };
  }) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apiKeys } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    const { name, description, scopes, rateLimitPerMinute, rateLimitPerHour, expiresAt } = ctx.data;

    // Generate the API key
    const plainKey = generateApiKey();
    const keyHash = await hashApiKey(plainKey);
    const keyPrefix = plainKey.substring(0, 12); // Store first 12 chars as prefix

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        name,
        description,
        keyPrefix,
        keyHash,
        userId: session.user.id,
        scopes: scopes.join(","),
        rateLimitPerMinute: rateLimitPerMinute ?? 60,
        rateLimitPerHour: rateLimitPerHour ?? 1000,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    // Return the plain key ONLY on creation (it cannot be retrieved later)
    return {
      apiKey: {
        id: newKey.id,
        name: newKey.name,
        description: newKey.description,
        keyPrefix: newKey.keyPrefix,
        scopes: scopes,
        rateLimitPerMinute: newKey.rateLimitPerMinute,
        rateLimitPerHour: newKey.rateLimitPerHour,
        enabled: newKey.enabled,
        expiresAt: newKey.expiresAt?.toISOString() ?? null,
        createdAt: newKey.createdAt.toISOString(),
      },
      // The plain key - shown only once!
      plainKey,
    };
  }
);

// Update an API key
export const updateApiKey = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    data: {
      id: string;
      name?: string;
      description?: string;
      scopes?: ApiKeyScope[];
      rateLimitPerMinute?: number;
      rateLimitPerHour?: number;
      enabled?: boolean;
      expiresAt?: string | null;
    };
  }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apiKeys } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    const { id, name, description, scopes, rateLimitPerMinute, rateLimitPerHour, enabled, expiresAt } = ctx.data;

    const updateData: Partial<NewApiKey> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (scopes !== undefined) updateData.scopes = scopes.join(",");
    if (rateLimitPerMinute !== undefined) updateData.rateLimitPerMinute = rateLimitPerMinute;
    if (rateLimitPerHour !== undefined) updateData.rateLimitPerHour = rateLimitPerHour;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const [updatedKey] = await db
      .update(apiKeys)
      .set(updateData)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, session.user.id)))
      .returning();

    if (!updatedKey) {
      throw new Error("API key not found");
    }

    return {
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        description: updatedKey.description,
        keyPrefix: updatedKey.keyPrefix,
        scopes: updatedKey.scopes.split(",") as ApiKeyScope[],
        rateLimitPerMinute: updatedKey.rateLimitPerMinute,
        rateLimitPerHour: updatedKey.rateLimitPerHour,
        enabled: updatedKey.enabled,
        expiresAt: updatedKey.expiresAt?.toISOString() ?? null,
        lastUsedAt: updatedKey.lastUsedAt?.toISOString() ?? null,
        usageCount: updatedKey.usageCount,
        createdAt: updatedKey.createdAt.toISOString(),
        updatedAt: updatedKey.updatedAt.toISOString(),
      },
    };
  }
);

// Delete an API key
export const deleteApiKey = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apiKeys } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, ctx.data.id), eq(apiKeys.userId, session.user.id)));

    return { success: true };
  }
);

// Regenerate an API key (creates a new key with the same settings)
export const regenerateApiKey = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apiKeys } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    // First, get the existing key
    const existingKey = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, ctx.data.id), eq(apiKeys.userId, session.user.id)),
    });

    if (!existingKey) {
      throw new Error("API key not found");
    }

    // Generate new key
    const plainKey = generateApiKey();
    const keyHash = await hashApiKey(plainKey);
    const keyPrefix = plainKey.substring(0, 12);

    // Update the key
    const [updatedKey] = await db
      .update(apiKeys)
      .set({
        keyPrefix,
        keyHash,
        usageCount: 0, // Reset usage count
        lastUsedAt: null, // Reset last used
        lastUsedIp: null,
        updatedAt: new Date(),
      })
      .where(and(eq(apiKeys.id, ctx.data.id), eq(apiKeys.userId, session.user.id)))
      .returning();

    return {
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        keyPrefix: updatedKey.keyPrefix,
        scopes: updatedKey.scopes.split(",") as ApiKeyScope[],
      },
      plainKey,
    };
  }
);

// Get API key usage statistics
export const getApiKeyStats = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, desc, gte } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apiKeys, apiRequestLogs } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    // Verify ownership
    const key = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, ctx.data.id), eq(apiKeys.userId, session.user.id)),
    });

    if (!key) {
      throw new Error("API key not found");
    }

    // Get recent logs (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await db.query.apiRequestLogs.findMany({
      where: and(
        eq(apiRequestLogs.apiKeyId, ctx.data.id),
        gte(apiRequestLogs.createdAt, oneDayAgo)
      ),
      orderBy: [desc(apiRequestLogs.createdAt)],
      limit: 100,
    });

    // Calculate stats
    const totalRequests = recentLogs.length;
    const successfulRequests = recentLogs.filter((log) => log.statusCode && log.statusCode < 400).length;
    const failedRequests = recentLogs.filter((log) => log.statusCode && log.statusCode >= 400).length;
    const avgResponseTime =
      recentLogs.length > 0
        ? Math.round(
            recentLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / recentLogs.length
          )
        : 0;

    // Endpoint breakdown
    const endpointCounts: Record<string, number> = {};
    for (const log of recentLogs) {
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
    }

    return {
      stats: {
        totalRequests,
        successfulRequests,
        failedRequests,
        avgResponseTime,
        endpointBreakdown: Object.entries(endpointCounts).map(([endpoint, count]) => ({
          endpoint,
          count,
        })),
        recentLogs: recentLogs.slice(0, 20).map((log) => ({
          endpoint: log.endpoint,
          method: log.method,
          statusCode: log.statusCode,
          responseTime: log.responseTime,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt.toISOString(),
        })),
      },
    };
  }
);

// Available scopes for UI display
export const API_KEY_SCOPES: { value: ApiKeyScope; label: string; description: string }[] = [
  { value: "read:apps", label: "Read Apps", description: "View app list and details" },
  { value: "read:health", label: "Read Health", description: "View health check results" },
  { value: "write:apps", label: "Write Apps", description: "Create, update, and delete apps" },
  { value: "read:categories", label: "Read Categories", description: "View categories" },
  { value: "write:categories", label: "Write Categories", description: "Manage categories" },
  { value: "read:integrations", label: "Read Integrations", description: "View integration configs" },
  { value: "write:integrations", label: "Write Integrations", description: "Manage integrations" },
  { value: "trigger:health", label: "Trigger Health Checks", description: "Force health check refresh" },
  { value: "read:analytics", label: "Read Analytics", description: "View analytics data" },
  { value: "admin", label: "Admin", description: "Full access to all API endpoints" },
];
