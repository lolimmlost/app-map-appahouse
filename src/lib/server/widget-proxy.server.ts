/**
 * Widget Proxy Server
 *
 * Provides server-side proxy functionality for widget integrations.
 * Uses the IntegrationClient for consistent HTTP request handling with
 * timeout management, connection pooling, and error handling.
 */

import { createServerFn } from "@tanstack/react-start";

// ============================================================================
// TYPES
// ============================================================================

type ProxyRequest = {
  data: {
    integrationId: string;
    endpoint: string;
    params?: Record<string, string>;
  };
};

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Internal helper function to fetch TrueNAS apps (can be called from other server code)
 */
export async function fetchTrueNASApps(integrationId: string, userId: string): Promise<any[]> {
  const { createIntegrationClient } = await import("./integration-client.server");
  const client = await createIntegrationClient(integrationId, userId, { timeout: 15000 });
  return client.getArray("/api/v2.0/app");
}

/**
 * Internal helper function to fetch Docker containers (can be called from other server code)
 */
export async function fetchDockerContainers(integrationId: string, userId: string, all = false): Promise<any[]> {
  const { createIntegrationClient } = await import("./integration-client.server");
  const client = await createIntegrationClient(integrationId, userId, { timeout: 10000 });
  const params = all ? { all: "true" } : undefined;
  return client.getArray("/containers/json", { params });
}

// ============================================================================
// GENERIC PROXY
// ============================================================================

/**
 * Proxy requests to integrations to avoid CORS issues
 */
export const proxyIntegrationRequest = createServerFn({ method: "POST" }).handler(
  async (ctx: ProxyRequest) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const { integrationId, endpoint, params } = ctx.data;
    const client = await createAuthenticatedIntegrationClient(integrationId, { timeout: 15000 });

    const result = await client.get(endpoint, { params });
    if (!result.success) {
      throw new Error("error" in result ? result.error : "Request failed");
    }
    return { success: true, data: result.data };
  }
);

// ============================================================================
// SONARR ENDPOINTS
// ============================================================================

export const getSonarrQueue = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/queue", {
      params: { includeSeries: "true", includeEpisode: "true" },
    });
  }
);

export const getSonarrCalendar = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/calendar", {
      params: {
        start: ctx.data.start,
        end: ctx.data.end,
        includeSeries: "true",
      },
    });
  }
);

export const getSonarrWanted = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; pageSize: number } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/wanted/missing", {
      params: {
        pageSize: String(ctx.data.pageSize),
        sortKey: "airDateUtc",
        sortDirection: "descending",
        includeSeries: "true",
      },
    });
  }
);

export const getSonarrDiskSpace = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/diskspace");
  }
);

export const getSonarrHealth = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/health");
  }
);

// ============================================================================
// RADARR ENDPOINTS
// ============================================================================

export const getRadarrMovies = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/movie");
  }
);

export const getRadarrQueue = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/queue", {
      params: { includeMovie: "true" },
    });
  }
);

export const getRadarrCalendar = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/calendar", {
      params: {
        start: ctx.data.start,
        end: ctx.data.end,
      },
    });
  }
);

export const getRadarrDiskSpace = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/diskspace");
  }
);

export const getRadarrHealth = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v3/health");
  }
);

// ============================================================================
// LIDARR ENDPOINTS
// ============================================================================

export const getLidarrWanted = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; pageSize: number } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v1/wanted/missing", {
      params: {
        pageSize: String(ctx.data.pageSize),
        sortKey: "releaseDate",
        sortDirection: "descending",
      },
    });
  }
);

export const getLidarrQueue = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v1/queue", {
      params: { includeArtist: "true", includeAlbum: "true" },
    });
  }
);

export const getLidarrCalendar = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v1/calendar", {
      params: {
        start: ctx.data.start,
        end: ctx.data.end,
      },
    });
  }
);

export const getLidarrDiskSpace = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v1/diskspace");
  }
);

export const getLidarrHealth = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    return client.getOrThrow("/api/v1/health");
  }
);

// ============================================================================
// UPTIME KUMA ENDPOINTS
// ============================================================================

export const getUptimeKumaStatus = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; statusPageSlug?: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    const slug = ctx.data.statusPageSlug || "default";

    // Fetch both status page config and heartbeat data in parallel
    const [statusResult, heartbeatResult] = await Promise.all([
      client.get(`/api/status-page/${slug}`),
      client.get(`/api/status-page/heartbeat/${slug}`),
    ]);

    if (!statusResult.success) {
      throw new Error("error" in statusResult ? statusResult.error : "Request failed");
    }

    const data = statusResult.data as Record<string, any>;

    // Try to get heartbeat data from separate endpoint
    let heartbeatList: Record<string, Array<{ status: number; ping?: number; time?: string }>> = {};
    if (heartbeatResult.success) {
      const heartbeatData = heartbeatResult.data as Record<string, any>;
      heartbeatList = heartbeatData.heartbeatList || heartbeatData || {};
    }

    // Fallback to heartbeatList from main response if separate endpoint didn't work
    if (Object.keys(heartbeatList).length === 0 && data.heartbeatList) {
      heartbeatList = data.heartbeatList;
    }

    // Process publicGroupList to add status from heartbeats
    if (data.publicGroupList) {
      for (const group of data.publicGroupList) {
        if (group.monitorList) {
          for (const monitor of group.monitorList) {
            // Get the latest heartbeat for this monitor
            // Try both number and string keys since Uptime Kuma uses string keys
            const heartbeats = heartbeatList[monitor.id] || heartbeatList[String(monitor.id)] || [];

            if (Array.isArray(heartbeats) && heartbeats.length > 0) {
              // Get the most recent heartbeat (last in array)
              const latestHeartbeat = heartbeats[heartbeats.length - 1];
              // Uptime Kuma status: 0 = down, 1 = up, 2 = pending, 3 = maintenance
              monitor.status = latestHeartbeat.status ?? 2;
              monitor.ping = latestHeartbeat.ping ?? null;

              // Calculate uptime percentage from heartbeats
              const upHeartbeats = heartbeats.filter((h) => h.status === 1).length;
              monitor.uptime = heartbeats.length > 0 ? (upHeartbeats / heartbeats.length) * 100 : 0;

              // Get average response time
              const pings = heartbeats
                .filter((h) => h.ping !== undefined && h.ping !== null)
                .map((h) => h.ping as number);
              monitor.avgPing = pings.length > 0 ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : null;

              // Include recent heartbeats for the uptime graph (last 30)
              monitor.recentHeartbeats = heartbeats.slice(-30).map((h) => ({
                status: h.status,
                ping: h.ping,
                time: h.time,
              }));

              // Find recent incidents (transitions from up to down)
              monitor.incidents = [];
              for (let i = 1; i < heartbeats.length; i++) {
                const prev = heartbeats[i - 1];
                const curr = heartbeats[i];
                if (prev.status === 1 && curr.status === 0) {
                  monitor.incidents.push({
                    time: curr.time,
                    type: "down",
                  });
                } else if (prev.status === 0 && curr.status === 1) {
                  monitor.incidents.push({
                    time: curr.time,
                    type: "recovered",
                  });
                }
              }
              // Keep only last 5 incidents
              monitor.incidents = monitor.incidents.slice(-5);
            } else {
              // No heartbeat data - check if monitor already has status from sendInfo
              // Some versions include status directly on the monitor object
              if (monitor.status === undefined) {
                monitor.status = 2; // pending
              }
              monitor.uptime = 0;
              monitor.ping = null;
              monitor.avgPing = null;
            }
          }
        }
      }
    }

    return data;
  }
);

// ============================================================================
// JELLYFIN ENDPOINTS
// ============================================================================

// Helper to build Jellyfin auth headers
function getJellyfinHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    // Modern Jellyfin auth - Authorization header with MediaBrowser format
    headers["Authorization"] = `MediaBrowser Token="${token}", Client="AppMap", Device="Server", DeviceId="appmap-dashboard", Version="1.0.0"`;
    // Also include legacy headers for older Jellyfin versions
    headers["X-Emby-Token"] = token;
  }
  return headers;
}

// Cache for Jellyfin access tokens (in-memory, per-process)
const jellyfinTokenCache = new Map<string, { token: string; userId: string; expiresAt: number }>();

// Authenticate with Jellyfin using username/password and get access token
async function getJellyfinAccessToken(
  integration: { id: string; url: string; username: string | null; password: string | null; apiKey: string | null }
): Promise<{ token: string; userId: string } | null> {
  // If we have a cached token that's not expired, use it
  const cached = jellyfinTokenCache.get(integration.id);
  if (cached && cached.expiresAt > Date.now()) {
    return { token: cached.token, userId: cached.userId };
  }

  // If we have an API key but no username/password, use the API key directly
  if (integration.apiKey && !integration.username) {
    return { token: integration.apiKey, userId: "" };
  }

  // If we have username/password, authenticate to get an access token
  if (integration.username && integration.password) {
    try {
      const authUrl = `${integration.url}/Users/AuthenticateByName`;

      const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `MediaBrowser Client="AppMap", Device="Server", DeviceId="appmap-dashboard-${integration.id}", Version="1.0.0"`,
      };

      const response = await fetch(authUrl, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          Username: integration.username,
          Pw: integration.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.AccessToken;
        const userId = data.User?.Id || "";

        // Cache the token for 23 hours
        jellyfinTokenCache.set(integration.id, {
          token,
          userId,
          expiresAt: Date.now() + 23 * 60 * 60 * 1000,
        });

        return { token, userId };
      }
    } catch {
      // Auth failed - will fall back to API key if available
    }
  }

  // Fall back to API key if authentication failed
  if (integration.apiKey) {
    return { token: integration.apiKey, userId: "" };
  }

  return null;
}

export const getJellyfinSessions = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    const integration = client.getIntegration();

    // Get access token (supports both API key and username/password auth)
    let auth = await getJellyfinAccessToken(integration);
    if (!auth) throw new Error("No authentication configured for Jellyfin");

    const headers = getJellyfinHeaders(auth.token);
    const url = `${integration.url}/Sessions?ActiveWithinSeconds=960`;

    let response = await fetch(url, { headers });

    // If 401, clear cache and retry with fresh auth
    if (response.status === 401) {
      jellyfinTokenCache.delete(integration.id);
      auth = await getJellyfinAccessToken(integration);
      if (!auth) throw new Error("No authentication configured for Jellyfin");
      const freshHeaders = getJellyfinHeaders(auth.token);
      response = await fetch(url, { headers: freshHeaders });
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();

    // Handle both array response and wrapped response
    if (Array.isArray(data)) return data;
    if (data.Items && Array.isArray(data.Items)) return data.Items;
    return [];
  }
);

export const getJellyfinLatest = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; limit: number } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    const integration = client.getIntegration();

    const fetchLatest = async (auth: { token: string; userId: string }) => {
      const headers = getJellyfinHeaders(auth.token);

      // Use cached userId if available from auth, otherwise fetch it
      let userId = auth.userId;
      if (!userId) {
        const userResponse = await fetch(`${integration.url}/Users/Me`, { headers });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.Id;
        }
      }

      // Fetch latest items - include UserId if available for better results
      const url = userId
        ? `${integration.url}/Users/${userId}/Items/Latest?Limit=${ctx.data.limit}&IncludeItemTypes=Movie,Series,Episode&Fields=DateCreated,ProductionYear`
        : `${integration.url}/Items/Latest?Limit=${ctx.data.limit}&IncludeItemTypes=Movie,Series,Episode&Fields=DateCreated,ProductionYear`;

      return fetch(url, { headers });
    };

    // Get access token (supports both API key and username/password auth)
    let auth = await getJellyfinAccessToken(integration);
    if (!auth) throw new Error("No authentication configured for Jellyfin");

    let response = await fetchLatest(auth);

    // If 401, clear cache and retry with fresh auth
    if (response.status === 401) {
      jellyfinTokenCache.delete(integration.id);
      auth = await getJellyfinAccessToken(integration);
      if (!auth) throw new Error("No authentication configured for Jellyfin");
      response = await fetchLatest(auth);
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();

    // Handle both array response and wrapped response
    if (Array.isArray(data)) return data;
    if (data.Items && Array.isArray(data.Items)) return data.Items;
    return [];
  }
);

export const getJellyfinLibraryStats = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    const integration = client.getIntegration();

    const auth = await getJellyfinAccessToken(integration);
    if (!auth) throw new Error("No authentication configured for Jellyfin");

    const headers = getJellyfinHeaders(auth.token);

    // Get library info
    const [countsResponse, librariesResponse] = await Promise.all([
      fetch(`${integration.url}/Items/Counts`, { headers }),
      fetch(`${integration.url}/Library/VirtualFolders`, { headers }),
    ]);

    const counts = countsResponse.ok ? await countsResponse.json() : {};
    const libraries = librariesResponse.ok ? await librariesResponse.json() : [];

    return {
      movies: counts.MovieCount || 0,
      series: counts.SeriesCount || 0,
      episodes: counts.EpisodeCount || 0,
      music: counts.SongCount || 0,
      albums: counts.AlbumCount || 0,
      artists: counts.ArtistCount || 0,
      books: counts.BookCount || 0,
      libraries: libraries.map((lib: { Name: string; CollectionType: string; ItemId: string }) => ({
        name: lib.Name,
        type: lib.CollectionType,
        id: lib.ItemId,
      })),
    };
  }
);

export const getJellyfinSystemInfo = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId);
    const integration = client.getIntegration();

    const auth = await getJellyfinAccessToken(integration);
    if (!auth) throw new Error("No authentication configured for Jellyfin");

    const headers = getJellyfinHeaders(auth.token);

    const response = await fetch(`${integration.url}/System/Info`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const data = await response.json();
    return {
      serverName: data.ServerName,
      version: data.Version,
      operatingSystem: data.OperatingSystem,
      architecture: data.SystemArchitecture,
      hasUpdateAvailable: data.HasUpdateAvailable,
      webSocketPortNumber: data.WebSocketPortNumber,
      canSelfRestart: data.CanSelfRestart,
      canLaunchWebBrowser: data.CanLaunchWebBrowser,
      localAddress: data.LocalAddress,
    };
  }
);

// ============================================================================
// DOCKER ENDPOINTS
// ============================================================================

export const getDockerContainers = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; all?: boolean } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 15000 });
    const params = { all: ctx.data.all ? "true" : "false" };
    return client.getOrThrow("/containers/json", { params });
  }
);

export const getDockerContainerStats = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; containerId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });
    return client.getOrThrow(`/containers/${ctx.data.containerId}/stats`, {
      params: { stream: "false" },
    });
  }
);

export const getDockerInfo = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });
    return client.getOrThrow("/info");
  }
);

// ============================================================================
// TRUENAS TYPES
// ============================================================================

export type TrueNASApp = {
  name: string;
  id: string;
  state: "RUNNING" | "STOPPED" | "DEPLOYING" | "CRASHED";
  version: string;
  human_version?: string;
  portals?: Record<string, string>;
  active_workloads?: {
    containers: number;
    used_ports: Array<{
      container_port: number;
      host_port: number;
      protocol: string;
    }>;
  };
};

export type TrueNASPool = {
  id: number;
  name: string;
  path: string;
  status: "ONLINE" | "DEGRADED" | "FAULTED" | "OFFLINE" | "REMOVED" | "UNAVAIL";
  healthy: boolean;
  is_decrypted: boolean;
  topology: {
    data: Array<{
      type: string;
      status: string;
      children: Array<{
        disk: string;
        status: string;
        stats: {
          read_errors: number;
          write_errors: number;
          checksum_errors: number;
        };
      }>;
    }>;
  };
  size?: number;
  allocated?: number;
  free?: number;
  scan?: {
    function: string;
    state: string;
    percentage: number;
    end_time?: { $date: number };
  };
};

export type TrueNASDisk = {
  identifier: string;
  name: string;
  serial: string;
  size: number;
  type: string;
  model?: string;
  rotationrate?: number | null;
  pool?: string | null;
  temperature?: number | null;
  hddstandby?: string;
  togglesmart?: boolean;
  smartoptions?: string;
};

export type TrueNASInterface = {
  id: string;
  name: string;
  state: {
    name: string;
    link_state: "LINK_STATE_UP" | "LINK_STATE_DOWN";
    active_media_type?: string;
    active_media_subtype?: string;
    mtu?: number;
    aliases?: Array<{
      address: string;
      netmask: number;
      type: string;
    }>;
  };
};

// ============================================================================
// TRUENAS ENDPOINTS
// ============================================================================

export const getTrueNASApps = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 15000 });
    return client.getArray<TrueNASApp>("/api/v2.0/app");
  }
);

export const getTrueNASSystemInfo = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });
    return client.getOrThrow("/api/v2.0/system/info");
  }
);

export const getTrueNASPools = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });
    return client.getArray<TrueNASPool>("/api/v2.0/pool");
  }
);

export const getTrueNASDisks = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });
    return client.getArray<TrueNASDisk>("/api/v2.0/disk");
  }
);

export const getTrueNASInterfaces = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const { createAuthenticatedIntegrationClient } = await import("./integration-client.server");
    const client = await createAuthenticatedIntegrationClient(ctx.data.integrationId, { timeout: 10000 });
    return client.getArray<TrueNASInterface>("/api/v2.0/interface");
  }
);
