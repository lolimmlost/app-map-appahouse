/**
 * Unified HTTP Client Library
 *
 * This module provides a centralized, reusable HTTP client with shared concerns:
 *
 * - Connection pooling and management
 * - Configurable timeout handling with AbortController
 * - Retry logic with exponential backoff
 * - Standardized error handling and transformation
 * - Request/response logging support
 * - Type-safe response handling
 *
 * ARCHITECTURE:
 * - HttpClient: Base class for generic HTTP requests (health checks, simple fetches)
 * - IntegrationClient: Extends HttpClient for integration-specific logic (auth headers, etc.)
 *
 * USAGE:
 * ```typescript
 * // Simple health check
 * const client = new HttpClient({ timeout: 5000 });
 * const result = await client.head('https://example.com/health');
 *
 * // With retry logic
 * const result = await client.get('https://api.example.com/data', {
 *   retry: { maxAttempts: 3, backoffMs: 1000 }
 * });
 * ```
 *
 * @see integration-client.server.ts for integration-specific client that extends this
 */

import { Agent } from "undici";

// ============================================================================
// TYPES
// ============================================================================

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

export type RetryConfig = {
  /** Maximum number of retry attempts (default: 0 - no retries) */
  maxAttempts?: number;
  /** Initial backoff delay in milliseconds (default: 1000) */
  backoffMs?: number;
  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Maximum backoff delay in milliseconds (default: 30000) */
  maxBackoffMs?: number;
  /** HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryOnStatus?: number[];
  /** Whether to retry on network errors (default: true) */
  retryOnNetworkError?: boolean;
};

export type HttpRequestOptions = {
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
  /** Retry configuration */
  retry?: RetryConfig;
  /** Whether to allow insecure HTTPS connections (self-signed certs) */
  allowInsecure?: boolean;
  /** Enable keep-alive for connection reuse */
  keepAlive?: boolean;
};

export type HttpClientConfig = {
  /** Default timeout for all requests (default: 15000ms) */
  timeout?: number;
  /** User agent string (default: "AppMap-HttpClient/1.0") */
  userAgent?: string;
  /** Custom headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  /** Default retry configuration */
  defaultRetry?: RetryConfig;
  /** Allow insecure HTTPS connections by default */
  allowInsecure?: boolean;
};

export type HttpRequestResult<T = unknown> =
  | {
      success: true;
      data: T;
      status: number;
      responseTime: number;
      headers?: Headers;
    }
  | {
      success: false;
      error: string;
      errorCode?: string;
      status?: number;
      responseTime?: number;
      retryable?: boolean;
    };

export type HttpError = {
  message: string;
  code: string;
  status?: number;
  retryable: boolean;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_USER_AGENT = "AppMap-HttpClient/1.0";
const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// ============================================================================
// CONNECTION POOL MANAGEMENT
// ============================================================================

// Connection pool for HTTP connection reuse
const connectionPool = new Map<
  string,
  {
    activeConnections: number;
    lastUsed: number;
  }
>();

// Pool configuration
const CONNECTION_POOL_CONFIG = {
  maxConnectionsPerHost: 6,
  keepAliveTimeout: 60000,
  cleanupInterval: 60000,
};

// Shared insecure agent for self-signed certificates
let insecureAgent: Agent | null = null;

function getInsecureAgent(): Agent {
  if (!insecureAgent) {
    insecureAgent = new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  }
  return insecureAgent;
}

// Cleanup stale connections periodically
function cleanupConnectionPool(): void {
  const now = Date.now();
  for (const [host, state] of connectionPool.entries()) {
    if (now - state.lastUsed > CONNECTION_POOL_CONFIG.keepAliveTimeout) {
      connectionPool.delete(host);
    }
  }
}

// Run cleanup every minute (only in server environment)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupConnectionPool, CONNECTION_POOL_CONFIG.cleanupInterval);
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
  const state = connectionPool.get(host) || {
    activeConnections: 0,
    lastUsed: Date.now(),
  };

  if (state.activeConnections >= CONNECTION_POOL_CONFIG.maxConnectionsPerHost) {
    // Wait for a connection to become available (simple polling)
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const currentState = connectionPool.get(host);
      if (
        !currentState ||
        currentState.activeConnections < CONNECTION_POOL_CONFIG.maxConnectionsPerHost
      ) {
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

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Transform various error types into standardized HttpError
 */
export function transformError(error: unknown): HttpError {
  if (error instanceof Error) {
    // Timeout/abort errors
    if (error.name === "AbortError") {
      return {
        message: "Request timed out",
        code: "TIMEOUT",
        retryable: true,
      };
    }

    // Network errors
    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ENETUNREACH")
    ) {
      return {
        message: error.message,
        code: "NETWORK_ERROR",
        retryable: true,
      };
    }

    // SSL/TLS errors
    if (
      error.message.includes("self-signed") ||
      error.message.includes("certificate") ||
      error.message.includes("SSL") ||
      error.message.includes("TLS")
    ) {
      return {
        message: error.message,
        code: "SSL_ERROR",
        retryable: false,
      };
    }

    // Generic error
    return {
      message: error.message,
      code: "REQUEST_ERROR",
      retryable: false,
    };
  }

  return {
    message: String(error),
    code: "UNKNOWN_ERROR",
    retryable: false,
  };
}

/**
 * Check if an HTTP status code should trigger a retry
 */
function shouldRetryStatus(
  status: number,
  retryOnStatus: number[] = DEFAULT_RETRY_STATUS_CODES
): boolean {
  return retryOnStatus.includes(status);
}

/**
 * Calculate backoff delay for retry attempt
 */
function calculateBackoff(attempt: number, config: Required<RetryConfig>): number {
  const delay = config.backoffMs * Math.pow(config.backoffMultiplier, attempt - 1);
  // Add jitter (10% random variance)
  const jitter = delay * 0.1 * Math.random();
  return Math.min(delay + jitter, config.maxBackoffMs);
}

// ============================================================================
// HTTP CLIENT CLASS
// ============================================================================

/**
 * Base HTTP client with connection pooling, timeout handling, retry logic,
 * and standardized error handling.
 */
export class HttpClient {
  protected config: Required<HttpClientConfig>;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
      defaultHeaders: config.defaultHeaders ?? {},
      defaultRetry: config.defaultRetry ?? {},
      allowInsecure: config.allowInsecure ?? false,
    };
  }

  /**
   * Build the full URL with query parameters
   */
  protected buildUrl(url: string, params?: Record<string, string>): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });

    return urlObj.toString();
  }

  /**
   * Build request headers
   */
  protected buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      "User-Agent": this.config.userAgent,
      ...this.config.defaultHeaders,
      ...customHeaders,
    };
  }

  /**
   * Execute a single HTTP request without retry logic
   */
  private async executeRequest<T>(
    method: HttpMethod,
    url: string,
    options: HttpRequestOptions
  ): Promise<HttpRequestResult<T>> {
    const timeout = options.timeout ?? this.config.timeout;
    const allowInsecure = options.allowInsecure ?? this.config.allowInsecure;
    const startTime = Date.now();
    const host = getHostFromUrl(url);

    // Acquire connection from pool
    if (options.keepAlive !== false) {
      await acquireConnection(host);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fullUrl = this.buildUrl(url, options.params);
      const headers = this.buildHeaders(options.headers);

      const fetchOptions: RequestInit & { dispatcher?: Agent } = {
        method,
        headers,
        signal: controller.signal,
      };

      // Add body for non-GET/HEAD requests
      if (options.body && method !== "GET" && method !== "HEAD") {
        fetchOptions.body =
          typeof options.body === "string" ? options.body : JSON.stringify(options.body);

        // Set Content-Type if not already set
        if (!headers["Content-Type"]) {
          (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
        }
      }

      // Enable keep-alive for connection reuse
      if (options.keepAlive !== false) {
        (fetchOptions.headers as Record<string, string>)["Connection"] = "keep-alive";
        (fetchOptions as Record<string, unknown>).keepalive = true;
      }

      // Use insecure agent for self-signed certificates
      if (allowInsecure && fullUrl.startsWith("https://")) {
        (fetchOptions as Record<string, unknown>).dispatcher = getInsecureAgent();
      }

      const response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          errorCode: "HTTP_ERROR",
          status: response.status,
          responseTime,
          retryable: shouldRetryStatus(response.status),
        };
      }

      // Handle raw response (no JSON parsing)
      if (options.rawResponse) {
        return {
          success: true,
          data: response as unknown as T,
          status: response.status,
          responseTime,
          headers: response.headers,
        };
      }

      // Check if response has content
      const contentLength = response.headers.get("content-length");
      const contentType = response.headers.get("content-type");

      if (contentLength === "0" || (method === "HEAD" && !contentType?.includes("application/json"))) {
        // No content to parse
        return {
          success: true,
          data: null as T,
          status: response.status,
          responseTime,
          headers: response.headers,
        };
      }

      // Parse JSON response
      try {
        const data = await response.json();
        return {
          success: true,
          data: data as T,
          status: response.status,
          responseTime,
          headers: response.headers,
        };
      } catch {
        // JSON parsing failed, return success with null data
        return {
          success: true,
          data: null as T,
          status: response.status,
          responseTime,
          headers: response.headers,
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const httpError = transformError(error);

      return {
        success: false,
        error: httpError.message,
        errorCode: httpError.code,
        responseTime,
        retryable: httpError.retryable,
      };
    } finally {
      // Release connection back to pool
      if (options.keepAlive !== false) {
        releaseConnection(host);
      }
    }
  }

  /**
   * Execute an HTTP request with optional retry logic
   */
  async request<T = unknown>(
    method: HttpMethod,
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpRequestResult<T>> {
    const retryConfig: Required<RetryConfig> = {
      maxAttempts: options.retry?.maxAttempts ?? this.config.defaultRetry?.maxAttempts ?? 0,
      backoffMs: options.retry?.backoffMs ?? this.config.defaultRetry?.backoffMs ?? 1000,
      backoffMultiplier:
        options.retry?.backoffMultiplier ?? this.config.defaultRetry?.backoffMultiplier ?? 2,
      maxBackoffMs:
        options.retry?.maxBackoffMs ?? this.config.defaultRetry?.maxBackoffMs ?? 30000,
      retryOnStatus:
        options.retry?.retryOnStatus ??
        this.config.defaultRetry?.retryOnStatus ??
        DEFAULT_RETRY_STATUS_CODES,
      retryOnNetworkError:
        options.retry?.retryOnNetworkError ??
        this.config.defaultRetry?.retryOnNetworkError ??
        true,
    };

    let lastResult: HttpRequestResult<T>;
    let attempt = 0;

    do {
      attempt++;
      lastResult = await this.executeRequest<T>(method, url, options);

      // If successful, return immediately
      if (lastResult.success) {
        return lastResult;
      }

      // Check if we should retry
      const shouldRetry =
        attempt < retryConfig.maxAttempts + 1 &&
        lastResult.retryable &&
        (retryConfig.retryOnNetworkError || lastResult.status !== undefined);

      if (shouldRetry && attempt < retryConfig.maxAttempts + 1) {
        const delay = calculateBackoff(attempt, retryConfig);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } while (attempt < retryConfig.maxAttempts + 1 && lastResult.retryable);

    return lastResult;
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = unknown>(
    url: string,
    options?: Omit<HttpRequestOptions, "body">
  ): Promise<HttpRequestResult<T>> {
    return this.request<T>("GET", url, options);
  }

  /**
   * Convenience method for HEAD requests (used for health checks)
   */
  async head(
    url: string,
    options?: Omit<HttpRequestOptions, "body">
  ): Promise<HttpRequestResult<null>> {
    return this.request<null>("HEAD", url, options);
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = unknown>(
    url: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpRequestResult<T>> {
    return this.request<T>("POST", url, { ...options, body });
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T = unknown>(
    url: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpRequestResult<T>> {
    return this.request<T>("PUT", url, { ...options, body });
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch<T = unknown>(
    url: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpRequestResult<T>> {
    return this.request<T>("PATCH", url, { ...options, body });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = unknown>(
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpRequestResult<T>> {
    return this.request<T>("DELETE", url, options);
  }

  /**
   * Get data or throw an error - useful for simpler code paths
   */
  async getOrThrow<T = unknown>(
    url: string,
    options?: Omit<HttpRequestOptions, "body">
  ): Promise<T> {
    const result = await this.get<T>(url, options);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  /**
   * Get data and ensure it's an array
   */
  async getArray<T = unknown>(
    url: string,
    options?: Omit<HttpRequestOptions, "body">
  ): Promise<T[]> {
    const result = await this.get<T[]>(url, options);
    if (!result.success) {
      throw new Error(result.error);
    }
    return Array.isArray(result.data) ? result.data : [];
  }
}

// ============================================================================
// STANDALONE UTILITY FUNCTIONS
// ============================================================================

// Shared default client instance
let defaultClient: HttpClient | null = null;

function getDefaultClient(): HttpClient {
  if (!defaultClient) {
    defaultClient = new HttpClient();
  }
  return defaultClient;
}

/**
 * Execute a simple fetch with timeout - standalone utility
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number; allowInsecure?: boolean } = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, allowInsecure = false, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const requestOptions: RequestInit & { dispatcher?: Agent } = {
      ...fetchOptions,
      signal: controller.signal,
    };

    if (allowInsecure && url.startsWith("https://")) {
      requestOptions.dispatcher = getInsecureAgent();
    }

    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
}

/**
 * Execute fetch and parse JSON with timeout - standalone utility
 */
export async function fetchJsonWithTimeout<T = unknown>(
  url: string,
  options: RequestInit & { timeout?: number; allowInsecure?: boolean } = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Perform an HTTP health check on a URL
 */
export async function performHealthCheck(
  url: string,
  options: {
    timeout?: number;
    method?: "HEAD" | "GET";
    allowInsecure?: boolean;
  } = {}
): Promise<{
  online: boolean;
  responseTime?: number;
  error?: string;
  status?: number;
}> {
  const client = getDefaultClient();
  const startTime = Date.now();

  try {
    const result = await client.request(
      options.method || "HEAD",
      url,
      {
        timeout: options.timeout || 5000,
        allowInsecure: options.allowInsecure,
        headers: {
          "User-Agent": "AppMap-HealthCheck/1.0",
        },
      }
    );

    const responseTime = Date.now() - startTime;

    if (result.success) {
      // Consider 2xx and 3xx as online
      const online = result.status >= 200 && result.status < 400;
      return {
        online,
        responseTime,
        status: result.status,
      };
    }

    return {
      online: false,
      responseTime,
      error: result.error,
      status: result.status,
    };
  } catch (error) {
    return {
      online: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate that response data is an array, return empty array if not
 */
export function ensureArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? data : [];
}
