/**
 * API Authentication and Rate Limiting Module
 *
 * This module provides authentication via API keys for the REST API endpoints.
 * It supports:
 * - API key validation
 * - Scope-based permissions
 * - Rate limiting (per-minute and per-hour)
 * - Request logging for auditing
 */

import type { ApiKeyScope } from "@/database/schema/api-keys";
import { serverLogger } from "./logger";

// Create a child logger for API auth module
const log = serverLogger.child({ module: "api-auth" });

export type ApiAuthResult = {
  success: true;
  apiKeyId: string;
  userId: string;
  scopes: ApiKeyScope[];
} | {
  success: false;
  error: string;
  statusCode: number;
};

// In-memory rate limit cache (cleared on server restart)
// For production, consider using Redis
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

// Hash the API key for comparison
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Authenticate an API request using the Authorization header
 */
export async function authenticateApiRequest(request: Request): Promise<ApiAuthResult> {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { apiKeys } = await import("@/database/schema");

  // Extract API key from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return {
      success: false,
      error: "Missing Authorization header. Use 'Authorization: Bearer <api_key>'",
      statusCode: 401,
    };
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return {
      success: false,
      error: "Invalid Authorization header format. Use 'Authorization: Bearer <api_key>'",
      statusCode: 401,
    };
  }

  // Validate the API key format
  if (!token.startsWith("apmap_")) {
    return {
      success: false,
      error: "Invalid API key format",
      statusCode: 401,
    };
  }

  const db = await getDb();

  // Hash the provided key
  const keyHash = await hashApiKey(token);

  // Find the API key in the database
  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });

  if (!apiKey) {
    return {
      success: false,
      error: "Invalid API key",
      statusCode: 401,
    };
  }

  // Check if the key is enabled
  if (!apiKey.enabled) {
    return {
      success: false,
      error: "API key is disabled",
      statusCode: 403,
    };
  }

  // Check expiration
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return {
      success: false,
      error: "API key has expired",
      statusCode: 403,
    };
  }

  // Rate limiting check
  const rateLimitResult = await checkRateLimit(apiKey.id, apiKey.rateLimitPerMinute ?? 60, apiKey.rateLimitPerHour ?? 1000);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds`,
      statusCode: 429,
    };
  }

  // Update usage stats (non-blocking)
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                   request.headers.get("x-real-ip") ||
                   "unknown";

  updateApiKeyUsage(apiKey.id, clientIp).catch((error) => log.logError(error, "Failed to update API key usage"));

  return {
    success: true,
    apiKeyId: apiKey.id,
    userId: apiKey.userId,
    scopes: apiKey.scopes.split(",") as ApiKeyScope[],
  };
}

/**
 * Check if the API key has the required scope
 */
export function hasScope(scopes: ApiKeyScope[], requiredScope: ApiKeyScope): boolean {
  // Admin scope has access to everything
  if (scopes.includes("admin")) {
    return true;
  }
  return scopes.includes(requiredScope);
}

/**
 * Check if the API key has any of the required scopes
 */
export function hasAnyScope(scopes: ApiKeyScope[], requiredScopes: ApiKeyScope[]): boolean {
  if (scopes.includes("admin")) {
    return true;
  }
  return requiredScopes.some((scope) => scopes.includes(scope));
}

/**
 * Rate limit check using in-memory cache
 */
async function checkRateLimit(
  apiKeyId: string,
  limitPerMinute: number,
  limitPerHour: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const minuteKey = `${apiKeyId}:minute`;
  const hourKey = `${apiKeyId}:hour`;

  // Check minute limit
  const minuteData = rateLimitCache.get(minuteKey);
  if (minuteData) {
    if (now < minuteData.resetAt) {
      if (minuteData.count >= limitPerMinute) {
        return { allowed: false, retryAfter: Math.ceil((minuteData.resetAt - now) / 1000) };
      }
      minuteData.count++;
    } else {
      rateLimitCache.set(minuteKey, { count: 1, resetAt: now + 60000 });
    }
  } else {
    rateLimitCache.set(minuteKey, { count: 1, resetAt: now + 60000 });
  }

  // Check hour limit
  const hourData = rateLimitCache.get(hourKey);
  if (hourData) {
    if (now < hourData.resetAt) {
      if (hourData.count >= limitPerHour) {
        return { allowed: false, retryAfter: Math.ceil((hourData.resetAt - now) / 1000) };
      }
      hourData.count++;
    } else {
      rateLimitCache.set(hourKey, { count: 1, resetAt: now + 3600000 });
    }
  } else {
    rateLimitCache.set(hourKey, { count: 1, resetAt: now + 3600000 });
  }

  return { allowed: true };
}

/**
 * Update API key usage statistics
 */
async function updateApiKeyUsage(apiKeyId: string, ipAddress: string): Promise<void> {
  const { getDb } = await import("./get-db");
  const { eq, sql } = await import("drizzle-orm");
  const { apiKeys } = await import("@/database/schema");

  const db = await getDb();

  await db
    .update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      lastUsedIp: ipAddress,
      usageCount: sql`${apiKeys.usageCount} + 1`,
    })
    .where(eq(apiKeys.id, apiKeyId));
}

/**
 * Log an API request for auditing
 */
export async function logApiRequest(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  request: Request
): Promise<void> {
  const { getDb } = await import("./get-db");
  const { apiRequestLogs } = await import("@/database/schema");

  const db = await getDb();

  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    request.headers.get("x-real-ip") ||
                    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  await db.insert(apiRequestLogs).values({
    apiKeyId,
    endpoint,
    method,
    statusCode,
    responseTime,
    ipAddress,
    userAgent,
  });
}

/**
 * Create a JSON response with proper headers
 */
export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status: number, code?: string): Response {
  return jsonResponse(
    {
      error: {
        message,
        code: code || "ERROR",
        status,
      },
    },
    status
  );
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(apiKeyId: string): Record<string, string> {
  const minuteKey = `${apiKeyId}:minute`;
  const minuteData = rateLimitCache.get(minuteKey);

  const headers: Record<string, string> = {};

  if (minuteData) {
    const remaining = Math.max(0, 60 - minuteData.count);
    headers["X-RateLimit-Limit"] = "60";
    headers["X-RateLimit-Remaining"] = String(remaining);
    headers["X-RateLimit-Reset"] = String(Math.ceil(minuteData.resetAt / 1000));
  }

  return headers;
}
