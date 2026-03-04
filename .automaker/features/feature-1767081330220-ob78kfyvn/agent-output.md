
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing integration API patterns",
      "status": "in_progress",
      "activeForm": "Exploring codebase to understand existing integration API patterns"
    },
    {
      "content": "Identify duplicate patterns in TrueNAS, Docker, and widget proxy modules",
      "status": "pending",
      "activeForm": "Identifying duplicate patterns in TrueNAS, Docker, and widget proxy modules"
    },
    {
      "content": "Design IntegrationClient/HttpClient utility architecture",
      "status": "pending",
      "activeForm": "Designing IntegrationClient/HttpClient utility architecture"
    },
    {
      "content": "Implement the reusable client utility",
      "status": "pending",
      "activeForm": "Implementing the reusable client utility"
    },
    {
      "content": "Refactor existing modules to use new utility",
      "status": "pending",
      "activeForm": "Refactoring existing modules to use new utility"
    }
  ]
}

Let me start by exploring the codebase to understand the existing structure and find the integration modules mentioned.

🔧 Tool: Glob
Input: {
  "pattern": "**/*truenas*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*docker*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*proxy*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*widget*"
}

Let me read the key files to understand the existing patterns:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/widgets/truenas-widget.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/widgets/docker-widget.tsx"
}

Now I've seen the pattern clearly. Let me search for more examples and count the occurrences of the duplicate patterns:

🔧 Tool: Grep
Input: {
  "pattern": "clearTimeout\\(timeoutId\\)",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src",
  "output_mode": "count"
}

🔧 Tool: Grep
Input: {
  "pattern": "const controller = new AbortController",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src",
  "output_mode": "count"
}

🔧 Tool: Grep
Input: {
  "pattern": "setTimeout\\(\\(\\) => controller\\.abort",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src",
  "output_mode": "count"
}

Let me also look at the integrations.server.ts file and check the existing lib/server folder structure:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integrations.server.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/lib/server/*.ts",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

Let me check the health.server.ts and status-pages.server.ts for more patterns:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/health.server.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema/integrations.ts"
}

Now I have a clear understanding of the patterns. Let me update the todo list and start implementing:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing integration API patterns",
      "status": "completed",
      "activeForm": "Exploring codebase to understand existing integration API patterns"
    },
    {
      "content": "Identify duplicate patterns in TrueNAS, Docker, and widget proxy modules",
      "status": "completed",
      "activeForm": "Identifying duplicate patterns in TrueNAS, Docker, and widget proxy modules"
    },
    {
      "content": "Design and implement IntegrationClient utility",
      "status": "in_progress",
      "activeForm": "Designing and implementing IntegrationClient utility"
    },
    {
      "content": "Refactor widget-proxy.server.ts to use new utility",
      "status": "pending",
      "activeForm": "Refactoring widget-proxy.server.ts to use new utility"
    },
    {
      "content": "Refactor integrations.server.ts to use new utility",
      "status": "pending",
      "activeForm": "Refactoring integrations.server.ts to use new utility"
    }
  ]
}

Now I'll create the `IntegrationClient` utility. Based on my analysis, the duplicate patterns include:

1. **Connection acquisition** - Getting integration from DB by ID + userId
2. **Timeout handling** - `AbortController` + `setTimeout` + `clearTimeout` (29 occurrences)
3. **Request building** - URL construction, headers setup with API keys
4. **Error handling** - Abort error handling, HTTP status validation
5. **Response validation** - JSON parsing, array/object handling

Let me create the utility:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integration-client.server.ts",
  "content": "/**\n * Integration Client - Reusable HTTP Client for External Integrations\n *\n * This module provides a unified interface for making HTTP requests to external\n * integrations (TrueNAS, Docker, Sonarr, Radarr, Jellyfin, etc.) with:\n *\n * - Connection pooling and management\n * - Configurable timeout handling\n * - Request building with proper headers\n * - Standardized error handling\n * - Response validation and transformation\n *\n * USAGE:\n * ```typescript\n * const client = new IntegrationClient(integration, { timeout: 15000 });\n * const data = await client.get('/api/v2.0/app');\n * ```\n */\n\nimport { Agent } from \"undici\";\nimport type { Integration } from \"@/types/database\";\n\n// ============================================================================\n// TYPES\n// ============================================================================\n\nexport type HttpMethod = \"GET\" | \"POST\" | \"PUT\" | \"DELETE\" | \"PATCH\" | \"HEAD\";\n\nexport type RequestOptions = {\n  /** Request timeout in milliseconds (default: 15000) */\n  timeout?: number;\n  /** Additional headers to include */\n  headers?: Record<string, string>;\n  /** Query parameters to append to URL */\n  params?: Record<string, string>;\n  /** Request body (will be JSON stringified if object) */\n  body?: unknown;\n  /** Whether to skip JSON parsing of response */\n  rawResponse?: boolean;\n  /** Override the base URL for this request */\n  baseUrl?: string;\n};\n\nexport type IntegrationClientConfig = {\n  /** Default timeout for all requests (default: 15000ms) */\n  timeout?: number;\n  /** User agent string (default: \"AppMap-Integration/1.0\") */\n  userAgent?: string;\n  /** Custom headers to include in all requests */\n  defaultHeaders?: Record<string, string>;\n};\n\nexport type IntegrationRequestResult<T = unknown> = {\n  success: true;\n  data: T;\n  status: number;\n  responseTime: number;\n} | {\n  success: false;\n  error: string;\n  status?: number;\n  responseTime?: number;\n};\n\n// ============================================================================\n// CONSTANTS\n// ============================================================================\n\nconst DEFAULT_TIMEOUT = 15000;\nconst DEFAULT_USER_AGENT = \"AppMap-Integration/1.0\";\n\n// Shared insecure agent for self-signed certificates\nlet insecureAgent: Agent | null = null;\n\nfunction getInsecureAgent(): Agent {\n  if (!insecureAgent) {\n    insecureAgent = new Agent({\n      connect: {\n        rejectUnauthorized: false,\n      },\n    });\n  }\n  return insecureAgent;\n}\n\n// ============================================================================\n// INTEGRATION CLIENT CLASS\n// ============================================================================\n\nexport class IntegrationClient {\n  private integration: Integration;\n  private config: Required<IntegrationClientConfig>;\n\n  constructor(integration: Integration, config: IntegrationClientConfig = {}) {\n    this.integration = integration;\n    this.config = {\n      timeout: config.timeout ?? DEFAULT_TIMEOUT,\n      userAgent: config.userAgent ?? DEFAULT_USER_AGENT,\n      defaultHeaders: config.defaultHeaders ?? {},\n    };\n  }\n\n  /**\n   * Build headers for the request based on integration type\n   */\n  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {\n    const headers: Record<string, string> = {\n      \"Content-Type\": \"application/json\",\n      \"User-Agent\": this.config.userAgent,\n      ...this.config.defaultHeaders,\n      ...customHeaders,\n    };\n\n    const { type, apiKey, username, password } = this.integration;\n\n    // Add authentication based on integration type\n    switch (type) {\n      case \"truenas\":\n        if (apiKey) {\n          headers[\"Authorization\"] = `Bearer ${apiKey}`;\n        }\n        break;\n\n      case \"jellyfin\":\n        if (apiKey) {\n          // Modern Jellyfin auth - Authorization header with MediaBrowser format\n          headers[\"Authorization\"] = `MediaBrowser Token=\"${apiKey}\", Client=\"AppMap\", Device=\"Server\", DeviceId=\"appmap-dashboard\", Version=\"1.0.0\"`;\n          // Legacy header for older Jellyfin versions\n          headers[\"X-Emby-Token\"] = apiKey;\n        }\n        break;\n\n      case \"radarr\":\n      case \"sonarr\":\n      case \"lidarr\":\n        if (apiKey) {\n          headers[\"X-Api-Key\"] = apiKey;\n        }\n        break;\n\n      case \"proxmox\":\n        if (apiKey && username) {\n          headers[\"Authorization\"] = `PVEAPIToken=${username}=${apiKey}`;\n        } else if (apiKey) {\n          headers[\"Authorization\"] = `PVEAPIToken=${apiKey}`;\n        }\n        break;\n\n      case \"glances\":\n        if (password) {\n          const authStr = username ? `${username}:${password}` : `glances:${password}`;\n          headers[\"Authorization\"] = `Basic ${btoa(authStr)}`;\n        }\n        break;\n\n      case \"docker\":\n      case \"uptime_kuma\":\n      case \"portainer\":\n        // These typically don't need special auth headers\n        // Docker uses URL-based socket or TCP connection\n        // Uptime Kuma public endpoints don't need auth\n        // Portainer may need token in future implementation\n        break;\n    }\n\n    return headers;\n  }\n\n  /**\n   * Build the full URL with path and query parameters\n   */\n  private buildUrl(endpoint: string, params?: Record<string, string>, baseUrl?: string): string {\n    const base = baseUrl || this.integration.url;\n    const url = new URL(endpoint, base);\n\n    // Add API key as query param for *arr services if not already in headers\n    if ([\"radarr\", \"sonarr\", \"lidarr\"].includes(this.integration.type) && this.integration.apiKey) {\n      url.searchParams.set(\"apikey\", this.integration.apiKey);\n    }\n\n    // Add custom params\n    if (params) {\n      Object.entries(params).forEach(([key, value]) => {\n        url.searchParams.set(key, value);\n      });\n    }\n\n    return url.toString();\n  }\n\n  /**\n   * Execute an HTTP request with timeout handling\n   */\n  async request<T = unknown>(\n    method: HttpMethod,\n    endpoint: string,\n    options: RequestOptions = {}\n  ): Promise<IntegrationRequestResult<T>> {\n    const timeout = options.timeout ?? this.config.timeout;\n    const startTime = Date.now();\n\n    const controller = new AbortController();\n    const timeoutId = setTimeout(() => controller.abort(), timeout);\n\n    try {\n      const url = this.buildUrl(endpoint, options.params, options.baseUrl);\n      const headers = this.buildHeaders(options.headers);\n\n      const fetchOptions: RequestInit & { dispatcher?: Agent } = {\n        method,\n        headers,\n        signal: controller.signal,\n      };\n\n      // Add body for non-GET requests\n      if (options.body && method !== \"GET\" && method !== \"HEAD\") {\n        fetchOptions.body = typeof options.body === \"string\"\n          ? options.body\n          : JSON.stringify(options.body);\n      }\n\n      // Use insecure agent for self-signed certificates\n      if (this.integration.allowInsecure && url.startsWith(\"https://\")) {\n        // @ts-expect-error - dispatcher is undici-specific but works with Node.js fetch\n        fetchOptions.dispatcher = getInsecureAgent();\n      }\n\n      const response = await fetch(url, fetchOptions);\n      clearTimeout(timeoutId);\n\n      const responseTime = Date.now() - startTime;\n\n      if (!response.ok) {\n        return {\n          success: false,\n          error: `HTTP ${response.status}: ${response.statusText}`,\n          status: response.status,\n          responseTime,\n        };\n      }\n\n      // Handle raw response (no JSON parsing)\n      if (options.rawResponse) {\n        return {\n          success: true,\n          data: response as unknown as T,\n          status: response.status,\n          responseTime,\n        };\n      }\n\n      // Parse JSON response\n      const data = await response.json();\n      return {\n        success: true,\n        data: data as T,\n        status: response.status,\n        responseTime,\n      };\n    } catch (error) {\n      clearTimeout(timeoutId);\n      const responseTime = Date.now() - startTime;\n\n      if (error instanceof Error && error.name === \"AbortError\") {\n        return {\n          success: false,\n          error: \"Request timed out\",\n          responseTime,\n        };\n      }\n\n      return {\n        success: false,\n        error: error instanceof Error ? error.message : \"Unknown error\",\n        responseTime,\n      };\n    }\n  }\n\n  /**\n   * Convenience method for GET requests\n   */\n  async get<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<IntegrationRequestResult<T>> {\n    return this.request<T>(\"GET\", endpoint, options);\n  }\n\n  /**\n   * Convenience method for POST requests\n   */\n  async post<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<IntegrationRequestResult<T>> {\n    return this.request<T>(\"POST\", endpoint, { ...options, body });\n  }\n\n  /**\n   * Convenience method for PUT requests\n   */\n  async put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<IntegrationRequestResult<T>> {\n    return this.request<T>(\"PUT\", endpoint, { ...options, body });\n  }\n\n  /**\n   * Convenience method for DELETE requests\n   */\n  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<IntegrationRequestResult<T>> {\n    return this.request<T>(\"DELETE\", endpoint, options);\n  }\n\n  /**\n   * Get data or throw an error - useful for simpler code paths\n   */\n  async getOrThrow<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T> {\n    const result = await this.get<T>(endpoint, options);\n    if (!result.success) {\n      throw new Error(result.error);\n    }\n    return result.data;\n  }\n\n  /**\n   * Get data and ensure it's an array\n   */\n  async getArray<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T[]> {\n    const result = await this.get<T[]>(endpoint, options);\n    if (!result.success) {\n      throw new Error(result.error);\n    }\n    return Array.isArray(result.data) ? result.data : [];\n  }\n\n  /**\n   * Get the underlying integration\n   */\n  getIntegration(): Integration {\n    return this.integration;\n  }\n}\n\n// ============================================================================\n// HELPER FUNCTIONS\n// ============================================================================\n\n/**\n * Create an IntegrationClient from an integration ID (fetches integration from DB)\n */\nexport async function createIntegrationClient(\n  integrationId: string,\n  userId: string,\n  config?: IntegrationClientConfig\n): Promise<IntegrationClient> {\n  const { getDb } = await import(\"./get-db\");\n  const { eq, and } = await import(\"drizzle-orm\");\n  const { integrations } = await import(\"@/database/schema/integrations\");\n\n  const db = await getDb();\n\n  const [integration] = await db\n    .select()\n    .from(integrations)\n    .where(and(eq(integrations.id, integrationId), eq(integrations.userId, userId)))\n    .limit(1);\n\n  if (!integration) {\n    throw new Error(\"Integration not found\");\n  }\n\n  return new IntegrationClient(integration, config);\n}\n\n/**\n * Create an IntegrationClient for authenticated session (uses getAuthenticatedSession)\n */\nexport async function createAuthenticatedIntegrationClient(\n  integrationId: string,\n  config?: IntegrationClientConfig\n): Promise<IntegrationClient> {\n  const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n  const session = await getAuthenticatedSession();\n  return createIntegrationClient(integrationId, session.user.id, config);\n}\n\n/**\n * Execute a simple fetch with timeout - standalone utility\n */\nexport async function fetchWithTimeout(\n  url: string,\n  options: RequestInit & { timeout?: number; allowInsecure?: boolean } = {}\n): Promise<Response> {\n  const { timeout = DEFAULT_TIMEOUT, allowInsecure = false, ...fetchOptions } = options;\n\n  const controller = new AbortController();\n  const timeoutId = setTimeout(() => controller.abort(), timeout);\n\n  try {\n    const requestOptions: RequestInit & { dispatcher?: Agent } = {\n      ...fetchOptions,\n      signal: controller.signal,\n    };\n\n    if (allowInsecure && url.startsWith(\"https://\")) {\n      // @ts-expect-error - dispatcher is undici-specific but works with Node.js fetch\n      requestOptions.dispatcher = getInsecureAgent();\n    }\n\n    const response = await fetch(url, requestOptions);\n    clearTimeout(timeoutId);\n    return response;\n  } catch (error) {\n    clearTimeout(timeoutId);\n    if (error instanceof Error && error.name === \"AbortError\") {\n      throw new Error(\"Request timed out\");\n    }\n    throw error;\n  }\n}\n\n/**\n * Execute fetch and parse JSON with timeout - standalone utility\n */\nexport async function fetchJsonWithTimeout<T = unknown>(\n  url: string,\n  options: RequestInit & { timeout?: number; allowInsecure?: boolean } = {}\n): Promise<T> {\n  const response = await fetchWithTimeout(url, options);\n\n  if (!response.ok) {\n    throw new Error(`HTTP ${response.status}: ${response.statusText}`);\n  }\n\n  return response.json() as Promise<T>;\n}\n\n// ============================================================================\n// INTEGRATION-SPECIFIC HELPERS\n// ============================================================================\n\n/**\n * Create headers for *arr services (Sonarr, Radarr, Lidarr)\n */\nexport function createArrHeaders(apiKey: string): Record<string, string> {\n  return {\n    \"Content-Type\": \"application/json\",\n    \"X-Api-Key\": apiKey,\n  };\n}\n\n/**\n * Create headers for Jellyfin\n */\nexport function createJellyfinHeaders(token: string): Record<string, string> {\n  return {\n    \"Content-Type\": \"application/json\",\n    \"Authorization\": `MediaBrowser Token=\"${token}\", Client=\"AppMap\", Device=\"Server\", DeviceId=\"appmap-dashboard\", Version=\"1.0.0\"`,\n    \"X-Emby-Token\": token,\n  };\n}\n\n/**\n * Create headers for TrueNAS\n */\nexport function createTrueNASHeaders(apiKey: string): Record<string, string> {\n  return {\n    \"Content-Type\": \"application/json\",\n    \"Authorization\": `Bearer ${apiKey}`,\n  };\n}\n\n/**\n * Validate that response data is an array, return empty array if not\n */\nexport function ensureArray<T>(data: unknown): T[] {\n  return Array.isArray(data) ? data : [];\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing integration API patterns",
      "status": "completed",
      "activeForm": "Exploring codebase to understand existing integration API patterns"
    },
    {
      "content": "Identify duplicate patterns in TrueNAS, Docker, and widget proxy modules",
      "status": "completed",
      "activeForm": "Identifying duplicate patterns in TrueNAS, Docker, and widget proxy modules"
    },
    {
      "content": "Design and implement IntegrationClient utility",
      "status": "completed",
      "activeForm": "Designing and implementing IntegrationClient utility"
    },
    {
      "content": "Refactor widget-proxy.server.ts to use new utility",
      "status": "in_progress",
      "activeForm": "Refactoring widget-proxy.server.ts to use new utility"
    },
    {
      "content": "Refactor integrations.server.ts to use new utility",
      "status": "pending",
      "activeForm": "Refactoring integrations.server.ts to use new utility"
    }
  ]
}

Now let me refactor the `widget-proxy.server.ts` to use the new utility. This is a large file, so I'll refactor it methodically:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts"
}

Now I'll rewrite the `widget-proxy.server.ts` file to use the new `IntegrationClient` utility. This will significantly reduce the code duplication:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts",
  "content": "/**\n * Widget Proxy Server\n *\n * Provides server-side proxy functionality for widget integrations.\n * Uses the IntegrationClient for consistent HTTP request handling with\n * timeout management, connection pooling, and error handling.\n */\n\nimport { createServerFn } from \"@tanstack/react-start\";\nimport {\n  IntegrationClient,\n  createIntegrationClient,\n  createAuthenticatedIntegrationClient,\n  ensureArray,\n} from \"./integration-client.server\";\n\n// ============================================================================\n// TYPES\n// ============================================================================\n\ntype ProxyRequest = {\n  data: {\n    integrationId: string;\n    endpoint: string;\n    params?: Record<string, string>;\n  };\n};\n\n// ============================================================================\n// INTERNAL HELPER FUNCTIONS\n// ============================================================================\n\n/**\n * Internal helper function to fetch TrueNAS apps (can be called from other server code)\n */\nexport async function fetchTrueNASApps(integrationId: string, userId: string): Promise<any[]> {\n  const client = await createIntegrationClient(integrationId, userId, { timeout: 15000 });\n  return client.getArray(\"/api/v2.0/app\");\n}\n\n/**\n * Internal helper function to fetch Docker containers (can be called from other server code)\n */\nexport async function fetchDockerContainers(integrationId: string, userId: string, all = false): Promise<any[]> {\n  const client = await createIntegrationClient(integrationId, userId, { timeout: 10000 });\n  const params = all ? { all: \"true\" } : undefined;\n  return client.getArray(\"/containers/json\", { params });\n}\n\n// ============================================================================\n// GENERIC PROXY\n// ============================================================================\n\n/**\n * Proxy requests to integrations to avoid CORS issues\n */\nexport const proxyIntegrationRequest = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: ProxyRequest) => {\n    const { integrationId, endpoint, params } = ctx.data;\n    const client = await createAuthenticatedIntegrationClient(integrationId, { timeout: 15000 });\n\n    const result = await client.get(endpoint, { params });\n    if (!result.success) {\n      throw new Error(result.error);\n    }\n    return { success: true, data: result.data };\n  }\n);\n\n// ============================================================================\n// SONARR ENDPOINTS\n// ============================================================================\n\nexport const getSonarrQueue = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/queue\", {\n      params: { includeSeries: \"true\", includeEpisode: \"true\" },\n    });\n  }\n);\n\nexport const getSonarrCalendar = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/calendar\", {\n      params: {\n        start: ctx.data.start,\n        end: ctx.data.end,\n        includeSeries: \"true\",\n      },\n    });\n  }\n);\n\nexport const getSonarrWanted = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; pageSize: number } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/wanted/missing\", {\n      params: {\n        pageSize: String(ctx.data.pageSize),\n        sortKey: \"airDateUtc\",\n        sortDirection: \"descending\",\n        includeSeries: \"true\",\n      },\n    });\n  }\n);\n\nexport const getSonarrDiskSpace = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/diskspace\");\n  }\n);\n\nexport const getSonarrHealth = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/health\");\n  }\n);\n\n// ============================================================================\n// RADARR ENDPOINTS\n// ============================================================================\n\nexport const getRadarrMovies = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/movie\");\n  }\n);\n\nexport const getRadarrQueue = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/queue\", {\n      params: { includeMovie: \"true\" },\n    });\n  }\n);\n\nexport const getRadarrCalendar = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/calendar\", {\n      params: {\n        start: ctx.data.start,\n        end: ctx.data.end,\n      },\n    });\n  }\n);\n\nexport const getRadarrDiskSpace = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/diskspace\");\n  }\n);\n\nexport const getRadarrHealth = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v3/health\");\n  }\n);\n\n// ============================================================================\n// LIDARR ENDPOINTS\n// ============================================================================\n\nexport const getLidarrWanted = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; pageSize: number } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v1/wanted/missing\", {\n      params: {\n        pageSize: String(ctx.data.pageSize),\n        sortKey: \"releaseDate\",\n        sortDirection: \"descending\",\n      },\n    });\n  }\n);\n\nexport const getLidarrQueue = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v1/queue\", {\n      params: { includeArtist: \"true\", includeAlbum: \"true\" },\n    });\n  }\n);\n\nexport const getLidarrCalendar = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v1/calendar\", {\n      params: {\n        start: ctx.data.start,\n        end: ctx.data.end,\n      },\n    });\n  }\n);\n\nexport const getLidarrDiskSpace = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v1/diskspace\");\n  }\n);\n\nexport const getLidarrHealth = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    return client.getOrThrow(\"/api/v1/health\");\n  }\n);\n\n// ============================================================================\n// UPTIME KUMA ENDPOINTS\n// ============================================================================\n\nexport const getUptimeKumaStatus = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; statusPageSlug?: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    const integration = client.getIntegration();\n    const slug = ctx.data.statusPageSlug || \"default\";\n\n    // Fetch both status page config and heartbeat data in parallel\n    const [statusResult, heartbeatResult] = await Promise.all([\n      client.get(`/api/status-page/${slug}`),\n      client.get(`/api/status-page/heartbeat/${slug}`),\n    ]);\n\n    if (!statusResult.success) {\n      throw new Error(statusResult.error);\n    }\n\n    const data = statusResult.data as Record<string, any>;\n\n    // Try to get heartbeat data from separate endpoint\n    let heartbeatList: Record<string, Array<{ status: number; ping?: number; time?: string }>> = {};\n    if (heartbeatResult.success) {\n      const heartbeatData = heartbeatResult.data as Record<string, any>;\n      heartbeatList = heartbeatData.heartbeatList || heartbeatData || {};\n    }\n\n    // Fallback to heartbeatList from main response if separate endpoint didn't work\n    if (Object.keys(heartbeatList).length === 0 && data.heartbeatList) {\n      heartbeatList = data.heartbeatList;\n    }\n\n    // Process publicGroupList to add status from heartbeats\n    if (data.publicGroupList) {\n      for (const group of data.publicGroupList) {\n        if (group.monitorList) {\n          for (const monitor of group.monitorList) {\n            // Get the latest heartbeat for this monitor\n            // Try both number and string keys since Uptime Kuma uses string keys\n            const heartbeats = heartbeatList[monitor.id] || heartbeatList[String(monitor.id)] || [];\n\n            if (Array.isArray(heartbeats) && heartbeats.length > 0) {\n              // Get the most recent heartbeat (last in array)\n              const latestHeartbeat = heartbeats[heartbeats.length - 1];\n              // Uptime Kuma status: 0 = down, 1 = up, 2 = pending, 3 = maintenance\n              monitor.status = latestHeartbeat.status ?? 2;\n              monitor.ping = latestHeartbeat.ping ?? null;\n\n              // Calculate uptime percentage from heartbeats\n              const upHeartbeats = heartbeats.filter((h) => h.status === 1).length;\n              monitor.uptime = heartbeats.length > 0 ? (upHeartbeats / heartbeats.length) * 100 : 0;\n\n              // Get average response time\n              const pings = heartbeats\n                .filter((h) => h.ping !== undefined && h.ping !== null)\n                .map((h) => h.ping as number);\n              monitor.avgPing = pings.length > 0 ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : null;\n\n              // Include recent heartbeats for the uptime graph (last 30)\n              monitor.recentHeartbeats = heartbeats.slice(-30).map((h) => ({\n                status: h.status,\n                ping: h.ping,\n                time: h.time,\n              }));\n\n              // Find recent incidents (transitions from up to down)\n              monitor.incidents = [];\n              for (let i = 1; i < heartbeats.length; i++) {\n                const prev = heartbeats[i - 1];\n                const curr = heartbeats[i];\n                if (prev.status === 1 && curr.status === 0) {\n                  monitor.incidents.push({\n                    time: curr.time,\n                    type: \"down\",\n                  });\n                } else if (prev.status === 0 && curr.status === 1) {\n                  monitor.incidents.push({\n                    time: curr.time,\n                    type: \"recovered\",\n                  });\n                }\n              }\n              // Keep only last 5 incidents\n              monitor.incidents = monitor.incidents.slice(-5);\n            } else {\n              // No heartbeat data - check if monitor already has status from sendInfo\n              // Some versions include status directly on the monitor object\n              if (monitor.status === undefined) {\n                monitor.status = 2; // pending\n              }\n              monitor.uptime = 0;\n              monitor.ping = null;\n              monitor.avgPing = null;\n            }\n          }\n        }\n      }\n    }\n\n    return data;\n  }\n);\n\n// ============================================================================\n// JELLYFIN ENDPOINTS\n// ============================================================================\n\n// Helper to build Jellyfin auth headers\nfunction getJellyfinHeaders(token: string | null): Record<string, string> {\n  const headers: Record<string, string> = {\n    \"Content-Type\": \"application/json\",\n  };\n  if (token) {\n    // Modern Jellyfin auth - Authorization header with MediaBrowser format\n    headers[\"Authorization\"] = `MediaBrowser Token=\"${token}\", Client=\"AppMap\", Device=\"Server\", DeviceId=\"appmap-dashboard\", Version=\"1.0.0\"`;\n    // Also include legacy headers for older Jellyfin versions\n    headers[\"X-Emby-Token\"] = token;\n  }\n  return headers;\n}\n\n// Cache for Jellyfin access tokens (in-memory, per-process)\nconst jellyfinTokenCache = new Map<string, { token: string; userId: string; expiresAt: number }>();\n\n// Authenticate with Jellyfin using username/password and get access token\nasync function getJellyfinAccessToken(\n  integration: { id: string; url: string; username: string | null; password: string | null; apiKey: string | null }\n): Promise<{ token: string; userId: string } | null> {\n  // If we have a cached token that's not expired, use it\n  const cached = jellyfinTokenCache.get(integration.id);\n  if (cached && cached.expiresAt > Date.now()) {\n    return { token: cached.token, userId: cached.userId };\n  }\n\n  // If we have an API key but no username/password, use the API key directly\n  if (integration.apiKey && !integration.username) {\n    return { token: integration.apiKey, userId: \"\" };\n  }\n\n  // If we have username/password, authenticate to get an access token\n  if (integration.username && integration.password) {\n    try {\n      const authUrl = `${integration.url}/Users/AuthenticateByName`;\n\n      const authHeaders = {\n        \"Content-Type\": \"application/json\",\n        \"Authorization\": `MediaBrowser Client=\"AppMap\", Device=\"Server\", DeviceId=\"appmap-dashboard-${integration.id}\", Version=\"1.0.0\"`,\n      };\n\n      const response = await fetch(authUrl, {\n        method: \"POST\",\n        headers: authHeaders,\n        body: JSON.stringify({\n          Username: integration.username,\n          Pw: integration.password,\n        }),\n      });\n\n      if (response.ok) {\n        const data = await response.json();\n        const token = data.AccessToken;\n        const userId = data.User?.Id || \"\";\n\n        // Cache the token for 23 hours\n        jellyfinTokenCache.set(integration.id, {\n          token,\n          userId,\n          expiresAt: Date.now() + 23 * 60 * 60 * 1000,\n        });\n\n        return { token, userId };\n      }\n    } catch {\n      // Auth failed - will fall back to API key if available\n    }\n  }\n\n  // Fall back to API key if authentication failed\n  if (integration.apiKey) {\n    return { token: integration.apiKey, userId: \"\" };\n  }\n\n  return null;\n}\n\nexport const getJellyfinSessions = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    const integration = client.getIntegration();\n\n    // Get access token (supports both API key and username/password auth)\n    let auth = await getJellyfinAccessToken(integration);\n    if (!auth) throw new Error(\"No authentication configured for Jellyfin\");\n\n    const headers = getJellyfinHeaders(auth.token);\n    const url = `${integration.url}/Sessions?ActiveWithinSeconds=960`;\n\n    let response = await fetch(url, { headers });\n\n    // If 401, clear cache and retry with fresh auth\n    if (response.status === 401) {\n      jellyfinTokenCache.delete(integration.id);\n      auth = await getJellyfinAccessToken(integration);\n      if (!auth) throw new Error(\"No authentication configured for Jellyfin\");\n      const freshHeaders = getJellyfinHeaders(auth.token);\n      response = await fetch(url, { headers: freshHeaders });\n    }\n\n    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);\n    const data = await response.json();\n\n    // Handle both array response and wrapped response\n    if (Array.isArray(data)) return data;\n    if (data.Items && Array.isArray(data.Items)) return data.Items;\n    return [];\n  }\n);\n\nexport const getJellyfinLatest = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; limit: number } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    const integration = client.getIntegration();\n\n    const fetchLatest = async (auth: { token: string; userId: string }) => {\n      const headers = getJellyfinHeaders(auth.token);\n\n      // Use cached userId if available from auth, otherwise fetch it\n      let userId = auth.userId;\n      if (!userId) {\n        const userResponse = await fetch(`${integration.url}/Users/Me`, { headers });\n        if (userResponse.ok) {\n          const userData = await userResponse.json();\n          userId = userData.Id;\n        }\n      }\n\n      // Fetch latest items - include UserId if available for better results\n      const url = userId\n        ? `${integration.url}/Users/${userId}/Items/Latest?Limit=${ctx.data.limit}&IncludeItemTypes=Movie,Series,Episode&Fields=DateCreated,ProductionYear`\n        : `${integration.url}/Items/Latest?Limit=${ctx.data.limit}&IncludeItemTypes=Movie,Series,Episode&Fields=DateCreated,ProductionYear`;\n\n      return fetch(url, { headers });\n    };\n\n    // Get access token (supports both API key and username/password auth)\n    let auth = await getJellyfinAccessToken(integration);\n    if (!auth) throw new Error(\"No authentication configured for Jellyfin\");\n\n    let response = await fetchLatest(auth);\n\n    // If 401, clear cache and retry with fresh auth\n    if (response.status === 401) {\n      jellyfinTokenCache.delete(integration.id);\n      auth = await getJellyfinAccessToken(integration);\n      if (!auth) throw new Error(\"No authentication configured for Jellyfin\");\n      response = await fetchLatest(auth);\n    }\n\n    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);\n    const data = await response.json();\n\n    // Handle both array response and wrapped response\n    if (Array.isArray(data)) return data;\n    if (data.Items && Array.isArray(data.Items)) return data.Items;\n    return [];\n  }\n);\n\nexport const getJellyfinLibraryStats = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    const integration = client.getIntegration();\n\n    const auth = await getJellyfinAccessToken(integration);\n    if (!auth) throw new Error(\"No authentication configured for Jellyfin\");\n\n    const headers = getJellyfinHeaders(auth.token);\n\n    // Get library info\n    const [countsResponse, librariesResponse] = await Promise.all([\n      fetch(`${integration.url}/Items/Counts`, { headers }),\n      fetch(`${integration.url}/Library/VirtualFolders`, { headers }),\n    ]);\n\n    const counts = countsResponse.ok ? await countsResponse.json() : {};\n    const libraries = librariesResponse.ok ? await librariesResponse.json() : [];\n\n    return {\n      movies: counts.MovieCount || 0,\n      series: counts.SeriesCount || 0,\n      episodes: counts.EpisodeCount || 0,\n      music: counts.SongCount || 0,\n      albums: counts.AlbumCount || 0,\n      artists: counts.ArtistCount || 0,\n      books: counts.BookCount || 0,\n      libraries: libraries.map((lib: { Name: string; CollectionType: string; ItemId: string }) => ({\n        name: lib.Name,\n        type: lib.CollectionType,\n        id: lib.ItemId,\n      })),\n    };\n  }\n);\n\nexport const getJellyfinSystemInfo = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    const integration = client.getIntegration();\n\n    const auth = await getJellyfinAccessToken(integration);\n    if (!auth) throw new Error(\"No authentication configured for Jellyfin\");\n\n    const headers = getJellyfinHeaders(auth.token);\n\n    const response = await fetch(`${integration.url}/System/Info`, { headers });\n    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);\n\n    const data = await response.json();\n    return {\n      serverName: data.ServerName,\n      version: data.Version,\n      operatingSystem: data.OperatingSystem,\n      architecture: data.SystemArchitecture,\n      hasUpdateAvailable: data.HasUpdateAvailable,\n      webSocketPortNumber: data.WebSocketPortNumber,\n      canSelfRestart: data.CanSelfRestart,\n      canLaunchWebBrowser: data.CanLaunchWebBrowser,\n      localAddress: data.LocalAddress,\n    };\n  }\n);\n\n// ============================================================================\n// DOCKER ENDPOINTS\n// ============================================================================\n\nexport const getDockerContainers = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; all?: boolean } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 15000 });\n    const params = { all: ctx.data.all ? \"true\" : \"false\" };\n    return client.getOrThrow(\"/containers/json\", { params });\n  }\n);\n\nexport const getDockerContainerStats = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string; containerId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });\n    return client.getOrThrow(`/containers/${ctx.data.containerId}/stats`, {\n      params: { stream: \"false\" },\n    });\n  }\n);\n\nexport const getDockerInfo = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });\n    return client.getOrThrow(\"/info\");\n  }\n);\n\n// ============================================================================\n// TRUENAS TYPES\n// ============================================================================\n\nexport type TrueNASApp = {\n  name: string;\n  id: string;\n  state: \"RUNNING\" | \"STOPPED\" | \"DEPLOYING\" | \"CRASHED\";\n  version: string;\n  human_version?: string;\n  portals?: Record<string, string>;\n  active_workloads?: {\n    containers: number;\n    used_ports: Array<{\n      container_port: number;\n      host_port: number;\n      protocol: string;\n    }>;\n  };\n};\n\nexport type TrueNASPool = {\n  id: number;\n  name: string;\n  path: string;\n  status: \"ONLINE\" | \"DEGRADED\" | \"FAULTED\" | \"OFFLINE\" | \"REMOVED\" | \"UNAVAIL\";\n  healthy: boolean;\n  is_decrypted: boolean;\n  topology: {\n    data: Array<{\n      type: string;\n      status: string;\n      children: Array<{\n        disk: string;\n        status: string;\n        stats: {\n          read_errors: number;\n          write_errors: number;\n          checksum_errors: number;\n        };\n      }>;\n    }>;\n  };\n  size?: number;\n  allocated?: number;\n  free?: number;\n  scan?: {\n    function: string;\n    state: string;\n    percentage: number;\n    end_time?: { $date: number };\n  };\n};\n\nexport type TrueNASDisk = {\n  identifier: string;\n  name: string;\n  serial: string;\n  size: number;\n  type: string;\n  model?: string;\n  rotationrate?: number | null;\n  pool?: string | null;\n  temperature?: number | null;\n  hddstandby?: string;\n  togglesmart?: boolean;\n  smartoptions?: string;\n};\n\nexport type TrueNASInterface = {\n  id: string;\n  name: string;\n  state: {\n    name: string;\n    link_state: \"LINK_STATE_UP\" | \"LINK_STATE_DOWN\";\n    active_media_type?: string;\n    active_media_subtype?: string;\n    mtu?: number;\n    aliases?: Array<{\n      address: string;\n      netmask: number;\n      type: string;\n    }>;\n  };\n};\n\n// ============================================================================\n// TRUENAS ENDPOINTS\n// ============================================================================\n\nexport const getTrueNASApps = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 15000 });\n    return client.getArray<TrueNASApp>(\"/api/v2.0/app\");\n  }\n);\n\nexport const getTrueNASSystemInfo = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });\n    return client.getOrThrow(\"/api/v2.0/system/info\");\n  }\n);\n\nexport const getTrueNASPools = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });\n    return client.getArray<TrueNASPool>(\"/api/v2.0/pool\");\n  }\n);\n\nexport const getTrueNASDisks = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });\n    return client.getArray<TrueNASDisk>(\"/api/v2.0/disk\");\n  }\n);\n\nexport const getTrueNASInterfaces = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { integrationId: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });\n    return client.getArray<TrueNASInterface>(\"/api/v2.0/interface\");\n  }\n);\n"
}

Now let me update the todo and refactor the `integrations.server.ts` file:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing integration API patterns",
      "status": "completed",
      "activeForm": "Exploring codebase to understand existing integration API patterns"
    },
    {
      "content": "Identify duplicate patterns in TrueNAS, Docker, and widget proxy modules",
      "status": "completed",
      "activeForm": "Identifying duplicate patterns in TrueNAS, Docker, and widget proxy modules"
    },
    {
      "content": "Design and implement IntegrationClient utility",
      "status": "completed",
      "activeForm": "Designing and implementing IntegrationClient utility"
    },
    {
      "content": "Refactor widget-proxy.server.ts to use new utility",
      "status": "completed",
      "activeForm": "Refactoring widget-proxy.server.ts to use new utility"
    },
    {
      "content": "Refactor integrations.server.ts to use new utility",
      "status": "in_progress",
      "activeForm": "Refactoring integrations.server.ts to use new utility"
    }
  ]
}

Now let me update the `integrations.server.ts` to use the new `fetchWithTimeout` utility:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integrations.server.ts",
  "old_string": "import { createServerFn } from \"@tanstack/react-start\";\nimport { Agent } from \"undici\";\nimport type { Integration, NewIntegration } from \"@/types/database\";\n\n// Create an undici agent that ignores SSL certificate errors\nconst insecureAgent = new Agent({\n  connect: {\n    rejectUnauthorized: false,\n  },\n});",
  "new_string": "import { createServerFn } from \"@tanstack/react-start\";\nimport type { Integration, NewIntegration } from \"@/types/database\";\nimport { fetchWithTimeout } from \"./integration-client.server\";"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integrations.server.ts",
  "old_string": "// Helper function to test different integration types\nasync function testIntegrationConnection(\n  integration: Integration\n): Promise<{ success: boolean; message: string }> {\n  const controller = new AbortController();\n  const timeoutId = setTimeout(() => controller.abort(), 10000);\n\n  try {\n    let testUrl = integration.url;\n    let headers: Record<string, string> = {\n      \"User-Agent\": \"AppMap-Integration/1.0\",\n    };\n\n    switch (integration.type) {\n      case \"uptime_kuma\":\n        // Uptime Kuma API endpoint\n        testUrl = `${integration.url}/api/status-page`;\n        break;\n\n      case \"radarr\":\n      case \"sonarr\":\n        // Radarr/Sonarr use API v3\n        testUrl = `${integration.url}/api/v3/system/status`;\n        if (integration.apiKey) {\n          headers[\"X-Api-Key\"] = integration.apiKey;\n        }\n        break;\n\n      case \"lidarr\":\n        // Lidarr uses API v1\n        testUrl = `${integration.url}/api/v1/system/status`;\n        if (integration.apiKey) {\n          headers[\"X-Api-Key\"] = integration.apiKey;\n        }\n        break;\n\n      case \"jellyfin\":\n        // Jellyfin system info endpoint\n        testUrl = `${integration.url}/System/Info/Public`;\n        break;\n\n      case \"docker\":\n        // Docker API version endpoint\n        testUrl = `${integration.url}/version`;\n        break;\n\n      case \"proxmox\":\n        // Proxmox API version\n        testUrl = `${integration.url}/api2/json/version`;\n        // Proxmox uses API token format: PVEAPIToken=USER@REALM!TOKENID=SECRET\n        if (integration.apiKey && integration.username) {\n          headers[\"Authorization\"] = `PVEAPIToken=${integration.username}=${integration.apiKey}`;\n        } else if (integration.apiKey) {\n          // If only apiKey is provided, assume it's the full token\n          headers[\"Authorization\"] = `PVEAPIToken=${integration.apiKey}`;\n        }\n        break;\n\n      case \"portainer\":\n        // Portainer API status\n        testUrl = `${integration.url}/api/status`;\n        break;\n\n      case \"glances\":\n        // Glances API version/status\n        testUrl = `${integration.url}/api/3/version`;\n        if (integration.password) {\n          // Glances uses HTTP Basic Auth if password is set\n          const authStr = integration.username\n            ? `${integration.username}:${integration.password}`\n            : `glances:${integration.password}`;\n          headers[\"Authorization\"] = `Basic ${btoa(authStr)}`;\n        }\n        break;\n\n      case \"truenas\":\n        // TrueNAS Scale REST API\n        testUrl = `${integration.url}/api/v2.0/system/info`;\n        if (integration.apiKey) {\n          headers[\"Authorization\"] = `Bearer ${integration.apiKey}`;\n        }\n        break;\n\n      default:\n        // Generic HTTP check\n        break;\n    }\n\n    // Build fetch options\n    const fetchOptions: RequestInit & { dispatcher?: Agent } = {\n      method: \"GET\",\n      headers,\n      signal: controller.signal,\n    };\n\n    // Use insecure dispatcher for self-signed certificates if allowInsecure is enabled\n    if (integration.allowInsecure && testUrl.startsWith(\"https://\")) {\n      // @ts-expect-error - dispatcher is undici-specific but works with Node.js fetch\n      fetchOptions.dispatcher = insecureAgent;\n    }\n\n    const response = await fetch(testUrl, fetchOptions);\n\n    clearTimeout(timeoutId);\n\n    if (response.ok) {\n      return { success: true, message: \"Connection successful\" };\n    } else {\n      return {\n        success: false,\n        message: `HTTP ${response.status}: ${response.statusText}`,\n      };\n    }\n  } catch (error) {\n    clearTimeout(timeoutId);\n    if (error instanceof Error && error.name === \"AbortError\") {\n      return { success: false, message: \"Connection timed out\" };\n    }\n    return {\n      success: false,\n      message: error instanceof Error ? error.message : \"Connection failed\",\n    };\n  }\n}",
  "new_string": "// Helper function to test different integration types\nasync function testIntegrationConnection(\n  integration: Integration\n): Promise<{ success: boolean; message: string }> {\n  try {\n    let testUrl = integration.url;\n    let headers: Record<string, string> = {\n      \"User-Agent\": \"AppMap-Integration/1.0\",\n    };\n\n    switch (integration.type) {\n      case \"uptime_kuma\":\n        // Uptime Kuma API endpoint\n        testUrl = `${integration.url}/api/status-page`;\n        break;\n\n      case \"radarr\":\n      case \"sonarr\":\n        // Radarr/Sonarr use API v3\n        testUrl = `${integration.url}/api/v3/system/status`;\n        if (integration.apiKey) {\n          headers[\"X-Api-Key\"] = integration.apiKey;\n        }\n        break;\n\n      case \"lidarr\":\n        // Lidarr uses API v1\n        testUrl = `${integration.url}/api/v1/system/status`;\n        if (integration.apiKey) {\n          headers[\"X-Api-Key\"] = integration.apiKey;\n        }\n        break;\n\n      case \"jellyfin\":\n        // Jellyfin system info endpoint\n        testUrl = `${integration.url}/System/Info/Public`;\n        break;\n\n      case \"docker\":\n        // Docker API version endpoint\n        testUrl = `${integration.url}/version`;\n        break;\n\n      case \"proxmox\":\n        // Proxmox API version\n        testUrl = `${integration.url}/api2/json/version`;\n        // Proxmox uses API token format: PVEAPIToken=USER@REALM!TOKENID=SECRET\n        if (integration.apiKey && integration.username) {\n          headers[\"Authorization\"] = `PVEAPIToken=${integration.username}=${integration.apiKey}`;\n        } else if (integration.apiKey) {\n          // If only apiKey is provided, assume it's the full token\n          headers[\"Authorization\"] = `PVEAPIToken=${integration.apiKey}`;\n        }\n        break;\n\n      case \"portainer\":\n        // Portainer API status\n        testUrl = `${integration.url}/api/status`;\n        break;\n\n      case \"glances\":\n        // Glances API version/status\n        testUrl = `${integration.url}/api/3/version`;\n        if (integration.password) {\n          // Glances uses HTTP Basic Auth if password is set\n          const authStr = integration.username\n            ? `${integration.username}:${integration.password}`\n            : `glances:${integration.password}`;\n          headers[\"Authorization\"] = `Basic ${btoa(authStr)}`;\n        }\n        break;\n\n      case \"truenas\":\n        // TrueNAS Scale REST API\n        testUrl = `${integration.url}/api/v2.0/system/info`;\n        if (integration.apiKey) {\n          headers[\"Authorization\"] = `Bearer ${integration.apiKey}`;\n        }\n        break;\n\n      default:\n        // Generic HTTP check\n        break;\n    }\n\n    // Use fetchWithTimeout utility for consistent timeout handling\n    const response = await fetchWithTimeout(testUrl, {\n      method: \"GET\",\n      headers,\n      timeout: 10000,\n      allowInsecure: integration.allowInsecure || false,\n    });\n\n    if (response.ok) {\n      return { success: true, message: \"Connection successful\" };\n    } else {\n      return {\n        success: false,\n        message: `HTTP ${response.status}: ${response.statusText}`,\n      };\n    }\n  } catch (error) {\n    return {\n      success: false,\n      message: error instanceof Error ? error.message : \"Connection failed\",\n    };\n  }\n}"
}

Now let's run a TypeScript build to check for any errors:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --skipLibCheck 2>&1 | head -100",
  "description": "Check TypeScript compilation",
  "timeout": 120000
}

These errors are pre-existing in the codebase and not related to my changes. Let me verify that my changes compile correctly by checking just the files I modified:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --skipLibCheck src/lib/server/integration-client.server.ts src/lib/server/widget-proxy.server.ts src/lib/server/integrations.server.ts 2>&1",
  "description": "Check TypeScript compilation for modified files",
  "timeout": 60000
}

There are some type issues I need to fix. Let me fix the TypeScript issues:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integration-client.server.ts",
  "old_string": "  /**\n   * Get data or throw an error - useful for simpler code paths\n   */\n  async getOrThrow<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T> {\n    const result = await this.get<T>(endpoint, options);\n    if (!result.success) {\n      throw new Error(result.error);\n    }\n    return result.data;\n  }\n\n  /**\n   * Get data and ensure it's an array\n   */\n  async getArray<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T[]> {\n    const result = await this.get<T[]>(endpoint, options);\n    if (!result.success) {\n      throw new Error(result.error);\n    }\n    return Array.isArray(result.data) ? result.data : [];\n  }",
  "new_string": "  /**\n   * Get data or throw an error - useful for simpler code paths\n   */\n  async getOrThrow<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T> {\n    const result = await this.get<T>(endpoint, options);\n    if (!result.success) {\n      throw new Error((result as { success: false; error: string }).error);\n    }\n    return result.data;\n  }\n\n  /**\n   * Get data and ensure it's an array\n   */\n  async getArray<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T[]> {\n    const result = await this.get<T[]>(endpoint, options);\n    if (!result.success) {\n      throw new Error((result as { success: false; error: string }).error);\n    }\n    return Array.isArray(result.data) ? result.data : [];\n  }"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integration-client.server.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integration-client.server.ts",
  "old_string": "  /**\n   * Get data or throw an error - useful for simpler code paths\n   */\n  async getOrThrow<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T> {\n    const result = await this.get<T>(endpoint, options);\n    if (!result.success) {\n      throw new Error(result.error);\n    }\n    return result.data;\n  }\n\n  /**\n   * Get data and ensure it's an array\n   */\n  async getArray<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T[]> {\n    const result = await this.get<T[]>(endpoint, options);\n    if (!result.success) {\n      throw new Error(result.error);\n    }\n    return Array.isArray(result.data) ? result.data : [];\n  }",
  "new_string": "  /**\n   * Get data or throw an error - useful for simpler code paths\n   */\n  async getOrThrow<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T> {\n    const result = await this.get<T>(endpoint, options);\n    if (!result.success) {\n      throw new Error(\"error\" in result ? result.error : \"Request failed\");\n    }\n    return result.data;\n  }\n\n  /**\n   * Get data and ensure it's an array\n   */\n  async getArray<T = unknown>(endpoint: string, options?: Omit<RequestOptions, \"body\">): Promise<T[]> {\n    const result = await this.get<T[]>(endpoint, options);\n    if (!result.success) {\n      throw new Error(\"error\" in result ? result.error : \"Request failed\");\n    }\n    return Array.isArray(result.data) ? result.data : [];\n  }"
}

Now let me also fix the widget-proxy.server.ts with the same fix:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts",
  "offset": 60,
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts",
  "old_string": "    const result = await client.get(endpoint, { params });\n    if (!result.success) {\n      throw new Error(result.error);\n    }\n    return { success: true, data: result.data };",
  "new_string": "    const result = await client.get(endpoint, { params });\n    if (!result.success) {\n      throw new Error(\"error\" in result ? result.error : \"Request failed\");\n    }\n    return { success: true, data: result.data };"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts",
  "offset": 235,
  "limit": 20
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts",
  "old_string": "    if (!statusResult.success) {\n      throw new Error(statusResult.error);\n    }",
  "new_string": "    if (!statusResult.success) {\n      throw new Error(\"error\" in statusResult ? statusResult.error : \"Request failed\");\n    }"
}

Now let me run a quick test by checking if the project builds correctly:

🔧 Tool: Bash
Input: {
  "command": "npm run build 2>&1 | head -100",
  "description": "Test project build",
  "timeout": 180000
}

The build seems to be proceeding. Let me wait for it to complete:

🔧 Tool: Bash
Input: {
  "command": "npm run build 2>&1 | tail -40",
  "description": "Complete build check",
  "timeout": 180000
}

The build error is a pre-existing issue unrelated to my changes (it's a Node.js stream module import problem with `@tanstack/router-core`). Let me verify my changes are syntactically correct by running the linter:

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/lib/server/integration-client.server.ts src/lib/server/widget-proxy.server.ts src/lib/server/integrations.server.ts 2>&1 | head -50",
  "description": "Check ESLint for modified files",
  "timeout": 60000
}

Let me check for existing lint configurations:

🔧 Tool: Glob
Input: {
  "pattern": "*eslint*",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/ | grep -E 'eslint|lint'",
  "description": "Check for lint configuration"
}

No ESLint config in the project root. Let me check the package.json for available scripts:

🔧 Tool: Bash
Input: {
  "command": "cat /home/default/Desktop/dev/app-map-appahouse/package.json | grep -A 10 '\"scripts\"'",
  "description": "Check package.json scripts"
}

The project uses Biome instead of ESLint. Let me run the Biome lint check:

🔧 Tool: Bash
Input: {
  "command": "npm run lint 2>&1 | head -60",
  "description": "Run Biome lint check",
  "timeout": 120000
}

The linting issues are pre-existing and not related to my changes. Let me specifically check the files I created/modified:

🔧 Tool: Bash
Input: {
  "command": "npx biome lint src/lib/server/integration-client.server.ts src/lib/server/widget-proxy.server.ts src/lib/server/integrations.server.ts 2>&1",
  "description": "Check Biome lint for modified files",
  "timeout": 60000
}

These are mostly style warnings (not errors). Let me fix the unused imports and the unused variable issue to keep it clean:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts",
  "old_string": "import { createServerFn } from \"@tanstack/react-start\";\nimport {\n  IntegrationClient,\n  createIntegrationClient,\n  createAuthenticatedIntegrationClient,\n  ensureArray,\n} from \"./integration-client.server\";",
  "new_string": "import { createServerFn } from \"@tanstack/react-start\";\nimport {\n  createIntegrationClient,\n  createAuthenticatedIntegrationClient,\n} from \"./integration-client.server\";"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts",
  "old_string": "  async (ctx: { data: { integrationId: string; statusPageSlug?: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    const integration = client.getIntegration();\n    const slug = ctx.data.statusPageSlug || \"default\";",
  "new_string": "  async (ctx: { data: { integrationId: string; statusPageSlug?: string } }) => {\n    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);\n    const slug = ctx.data.statusPageSlug || \"default\";"
}

Now let me update the todo list to reflect the completed work:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing integration API patterns",
      "status": "completed",
      "activeForm": "Exploring codebase to understand existing integration API patterns"
    },
    {
      "content": "Identify duplicate patterns in TrueNAS, Docker, and widget proxy modules",
      "status": "completed",
      "activeForm": "Identifying duplicate patterns in TrueNAS, Docker, and widget proxy modules"
    },
    {
      "content": "Design and implement IntegrationClient utility",
      "status": "completed",
      "activeForm": "Designing and implementing IntegrationClient utility"
    },
    {
      "content": "Refactor widget-proxy.server.ts to use new utility",
      "status": "completed",
      "activeForm": "Refactoring widget-proxy.server.ts to use new utility"
    },
    {
      "content": "Refactor integrations.server.ts to use new utility",
      "status": "completed",
      "activeForm": "Refactoring integrations.server.ts to use new utility"
    }
  ]
}

Let me run one final check to verify the lint warnings are minor:

🔧 Tool: Bash
Input: {
  "command": "npx biome lint --diagnostic-level=error src/lib/server/integration-client.server.ts src/lib/server/widget-proxy.server.ts src/lib/server/integrations.server.ts 2>&1",
  "description": "Check for lint errors only"
}

No errors. Let me generate a quick summary of the changes made:

🔧 Tool: Bash
Input: {
  "command": "wc -l /home/default/Desktop/dev/app-map-appahouse/src/lib/server/integration-client.server.ts /home/default/Desktop/dev/app-map-appahouse/src/lib/server/widget-proxy.server.ts /home/default/Desktop/dev/app-map-appahouse/src/lib/server/integrations.server.ts 2>&1",
  "description": "Count lines in modified files"
}

<summary>
## Summary: Consolidate Duplicate Integration API Request Patterns

### Changes Implemented
- Created new `IntegrationClient` class with unified HTTP request handling, including:
  - **Connection pooling**: Shared `undici.Agent` for self-signed certificate support
  - **Timeout management**: Configurable timeouts with consistent `AbortController` pattern
  - **Request building**: Automatic header construction based on integration type (TrueNAS, Jellyfin, Sonarr, Radarr, Docker, etc.)
  - **Response validation**: Result types with success/error discriminated unions
  - **Convenience methods**: `get()`, `post()`, `put()`, `delete()`, `getOrThrow()`, `getArray()`

- Created helper functions:
  - `createIntegrationClient()` - Creates client from integration ID + userId
  - `createAuthenticatedIntegrationClient()` - Creates client using authenticated session
  - `fetchWithTimeout()` - Standalone timeout-aware fetch utility
  - `fetchJsonWithTimeout()` - Standalone JSON fetch with timeout
  - Integration-specific header helpers (`createArrHeaders`, `createJellyfinHeaders`, `createTrueNASHeaders`)

- Refactored `widget-proxy.server.ts`:
  - Replaced all 29+ duplicate `AbortController`/`setTimeout`/`clearTimeout` patterns with `IntegrationClient`
  - Reduced code from ~900 lines to ~700 lines (22% reduction)
  - All Sonarr, Radarr, Lidarr, Docker, TrueNAS, Jellyfin, and Uptime Kuma endpoints now use the centralized client

- Refactored `integrations.server.ts`:
  - Updated `testIntegrationConnection()` to use `fetchWithTimeout()` utility
  - Removed direct `undici.Agent` import in favor of shared utility

### Files Modified
- `src/lib/server/integration-client.server.ts` (NEW - 472 lines)
- `src/lib/server/widget-proxy.server.ts` (REFACTORED - 704 lines)
- `src/lib/server/integrations.server.ts` (UPDATED - 265 lines)

### Notes for Developer
- The `IntegrationClient` automatically handles authentication headers based on integration type
- SSL certificate verification can be bypassed per-integration via `allowInsecure` flag
- The client returns discriminated union types (`success: true/false`) for proper error handling
- Jellyfin authentication still uses specialized logic (username/password auth with token caching) preserved in widget-proxy
- Pre-existing build error in `@tanstack/router-core` is unrelated to these changes
- Lint warnings are style-level (useLiteralKeys), not functional errors
</summary>

---

## Follow-up Session

Let me investigate this error. It appears to be a JavaScript/React issue with variable initialization order.

🔧 Tool: Grep
Input: {
  "pattern": "isSummaryLoading",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/analytics/analytics-widget.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx"
}

I found the issue! In `/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx`, on line 68, the code is using `isSummaryLoading` in the console.log before it's defined on line 72. This is a temporal dead zone (TDZ) error with `const` declarations.

Let me fix this:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "  const summaryData = summaryQuery.data;\n  const dailyData = dailyQuery.data;\n  const healthHistoryData = healthHistoryQuery.data;\n  const uptimeStatsData = uptimeStatsQuery.data;\n  const serviceReliabilityData = serviceReliabilityQuery.data;\n\n  // Debug logging\n  console.log(\"Analytics Data:\", {\n    summaryData,\n    dailyData,\n    healthHistoryData,\n    uptimeStatsData,\n    serviceReliabilityData,\n    isLoading: isSummaryLoading,\n    session: session?.user?.email,\n  });\n\n  const isSummaryLoading = summaryQuery.isLoading;",
  "new_string": "  const summaryData = summaryQuery.data;\n  const dailyData = dailyQuery.data;\n  const healthHistoryData = healthHistoryQuery.data;\n  const uptimeStatsData = uptimeStatsQuery.data;\n  const serviceReliabilityData = serviceReliabilityQuery.data;\n\n  const isSummaryLoading = summaryQuery.isLoading;"
}

The fix removes the debug `console.log` statement that was trying to access `isSummaryLoading` before it was declared. The variable declarations are now in the correct order.

Let me verify the fix is complete by checking the file doesn't have any other references to `isSummaryLoading` before its declaration:

🔧 Tool: Bash
Input: {
  "command": "npx biome lint --diagnostic-level=error /home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx 2>&1",
  "description": "Check for lint errors in analytics.tsx"
}

No lint errors. The fix was successful. The issue was a JavaScript temporal dead zone (TDZ) error where the code was trying to access `isSummaryLoading` in a `console.log` statement before the variable was declared with `const`.

<summary>
## Summary: Fix Lexical Declaration Error in Analytics Page

### Changes Implemented
- Fixed temporal dead zone (TDZ) error in `analytics.tsx` where `isSummaryLoading` was being accessed before its declaration
- Removed the debug `console.log` statement that was causing the error by referencing `isSummaryLoading` before it was defined

### Files Modified
- `src/routes/analytics.tsx` - Removed debug console.log and reordered variable declarations

### Notes for Developer
- The error "can't access lexical declaration 'isSummaryLoading' before initialization" occurs when trying to use a `const` or `let` variable before its declaration in the code
- This is a JavaScript temporal dead zone (TDZ) restriction that prevents accessing block-scoped variables before they're initialized
- The debug logging was likely added during development and should be removed for production code
</summary>