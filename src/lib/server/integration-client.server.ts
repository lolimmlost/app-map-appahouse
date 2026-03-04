/**
 * Integration Client - HTTP Client for External Integrations
 *
 * This module provides a unified interface for making HTTP requests to external
 * integrations (TrueNAS, Docker, Sonarr, Radarr, Jellyfin, etc.) with:
 *
 * - Extends HttpClient for connection pooling and timeout handling
 * - Integration-specific authentication headers
 * - Request building with proper headers per integration type
 * - Standardized error handling
 * - Response validation and transformation
 *
 * USAGE:
 * ```typescript
 * const client = new IntegrationClient(integration, { timeout: 15000 });
 * const data = await client.get('/api/v2.0/app');
 * ```
 *
 * @see http-client.server.ts for the base HttpClient class
 */

import type { Integration } from "@/types/database";
import {
  HttpClient,
  type HttpClientConfig,
  type HttpRequestResult,
  type HttpMethod,
  // Re-export utility functions
  fetchWithTimeout,
  fetchJsonWithTimeout,
  ensureArray,
} from "./http-client.server";

// Re-export utility functions for backward compatibility
export { fetchWithTimeout, fetchJsonWithTimeout, ensureArray };

// ============================================================================
// TYPES
// ============================================================================

// Re-export HttpMethod for backward compatibility
export type { HttpMethod };

export type RequestOptions = {
  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;
  /** Additional headers to include */
  headers?: Record<string, string>;
  /** Query parameters to append to URL */
  params?: Record<string, string>;
  /** Request body (will be JSON stringified if object) */
  body?: unknown;
  /** Whether to skip JSON parsing of response */
  rawResponse?: boolean;
  /** Override the base URL for this request */
  baseUrl?: string;
};

export type IntegrationClientConfig = HttpClientConfig;

export type IntegrationRequestResult<T = unknown> = HttpRequestResult<T>;

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_USER_AGENT = "AppMap-Integration/1.0";

// ============================================================================
// INTEGRATION CLIENT CLASS
// ============================================================================

export class IntegrationClient extends HttpClient {
  private integration: Integration;

  constructor(integration: Integration, config: IntegrationClientConfig = {}) {
    super({
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
      defaultHeaders: config.defaultHeaders ?? {},
      allowInsecure: integration.allowInsecure ?? false,
    });
    this.integration = integration;
  }

  /**
   * Build integration-specific authentication headers
   */
  private buildIntegrationHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    const { type, apiKey, username, password } = this.integration;

    // Add authentication based on integration type
    switch (type) {
      case "truenas":
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }
        break;

      case "jellyfin":
        if (apiKey) {
          // Modern Jellyfin auth - Authorization header with MediaBrowser format
          headers["Authorization"] = `MediaBrowser Token="${apiKey}", Client="AppMap", Device="Server", DeviceId="appmap-dashboard", Version="1.0.0"`;
          // Legacy header for older Jellyfin versions
          headers["X-Emby-Token"] = apiKey;
        }
        break;

      case "radarr":
      case "sonarr":
      case "lidarr":
        if (apiKey) {
          headers["X-Api-Key"] = apiKey;
        }
        break;

      case "proxmox":
        if (apiKey && username) {
          headers["Authorization"] = `PVEAPIToken=${username}=${apiKey}`;
        } else if (apiKey) {
          headers["Authorization"] = `PVEAPIToken=${apiKey}`;
        }
        break;

      case "glances":
        if (password) {
          const authStr = username ? `${username}:${password}` : `glances:${password}`;
          headers["Authorization"] = `Basic ${btoa(authStr)}`;
        }
        break;

      case "docker":
      case "uptime_kuma":
      case "portainer":
        // These typically don't need special auth headers
        // Docker uses URL-based socket or TCP connection
        // Uptime Kuma public endpoints don't need auth
        // Portainer may need token in future implementation
        break;
    }

    return headers;
  }

  /**
   * Build the full URL with path and query parameters
   */
  private buildIntegrationUrl(endpoint: string, params?: Record<string, string>, baseUrl?: string): string {
    const base = baseUrl || this.integration.url;
    const url = new URL(endpoint, base);

    // Add API key as query param for *arr services if not already in headers
    if (["radarr", "sonarr", "lidarr"].includes(this.integration.type) && this.integration.apiKey) {
      url.searchParams.set("apikey", this.integration.apiKey);
    }

    // Add custom params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Execute an HTTP request with integration-specific handling
   * Leverages the parent HttpClient for connection pooling, timeout, and retry logic
   */
  async request<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<IntegrationRequestResult<T>> {
    // Build the full URL with integration base URL and query params
    const url = this.buildIntegrationUrl(endpoint, options.params, options.baseUrl);

    // Build integration-specific headers
    const headers = this.buildIntegrationHeaders(options.headers);

    // Use parent class request with integration-specific configuration
    return super.request<T>(method, url, {
      timeout: options.timeout,
      headers,
      body: options.body,
      rawResponse: options.rawResponse,
      allowInsecure: this.integration.allowInsecure ?? false,
    });
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = unknown>(endpoint: string, options?: Omit<RequestOptions, "body">): Promise<IntegrationRequestResult<T>> {
    return this.request<T>("GET", endpoint, options);
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<IntegrationRequestResult<T>> {
    return this.request<T>("POST", endpoint, { ...options, body });
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<IntegrationRequestResult<T>> {
    return this.request<T>("PUT", endpoint, { ...options, body });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<IntegrationRequestResult<T>> {
    return this.request<T>("DELETE", endpoint, options);
  }

  /**
   * Get data or throw an error - useful for simpler code paths
   */
  async getOrThrow<T = unknown>(endpoint: string, options?: Omit<RequestOptions, "body">): Promise<T> {
    const result = await this.get<T>(endpoint, options);
    if (!result.success) {
      throw new Error("error" in result ? result.error : "Request failed");
    }
    return result.data;
  }

  /**
   * Get data and ensure it's an array
   */
  async getArray<T = unknown>(endpoint: string, options?: Omit<RequestOptions, "body">): Promise<T[]> {
    const result = await this.get<T[]>(endpoint, options);
    if (!result.success) {
      throw new Error("error" in result ? result.error : "Request failed");
    }
    return Array.isArray(result.data) ? result.data : [];
  }

  /**
   * Get the underlying integration
   */
  getIntegration(): Integration {
    return this.integration;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an IntegrationClient from an integration ID (fetches integration from DB)
 */
export async function createIntegrationClient(
  integrationId: string,
  userId: string,
  config?: IntegrationClientConfig
): Promise<IntegrationClient> {
  const { getDb } = await import("./get-db");
  const { eq, and } = await import("drizzle-orm");
  const { integrations } = await import("@/database/schema/integrations");

  const db = await getDb();

  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.id, integrationId), eq(integrations.userId, userId)))
    .limit(1);

  if (!integration) {
    throw new Error("Integration not found");
  }

  return new IntegrationClient(integration, config);
}

/**
 * Create an IntegrationClient for authenticated session (uses getAuthenticatedSession)
 */
export async function createAuthenticatedIntegrationClient(
  integrationId: string,
  config?: IntegrationClientConfig
): Promise<IntegrationClient> {
  const { getAuthenticatedSession } = await import("./auth-utils.server");
  const session = await getAuthenticatedSession();
  return createIntegrationClient(integrationId, session.user.id, config);
}

// fetchWithTimeout and fetchJsonWithTimeout are now re-exported from http-client.server.ts

// ============================================================================
// INTEGRATION-SPECIFIC HELPERS
// ============================================================================

/**
 * Create headers for *arr services (Sonarr, Radarr, Lidarr)
 */
export function createArrHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  };
}

/**
 * Create headers for Jellyfin
 */
export function createJellyfinHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `MediaBrowser Token="${token}", Client="AppMap", Device="Server", DeviceId="appmap-dashboard", Version="1.0.0"`,
    "X-Emby-Token": token,
  };
}

/**
 * Create headers for TrueNAS
 */
export function createTrueNASHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };
}

// ensureArray is now re-exported from http-client.server.ts
