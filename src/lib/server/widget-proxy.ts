import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/database/db";
import { integrations } from "@/database/schema/integrations";
import { auth } from "@/lib/auth";

async function getSession() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

type ProxyRequest = {
  data: {
    integrationId: string;
    endpoint: string;
    params?: Record<string, string>;
  };
};

// Proxy requests to integrations to avoid CORS issues
export const proxyIntegrationRequest = createServerFn({ method: "POST" }).handler(
  async (ctx: ProxyRequest) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const { integrationId, endpoint, params } = ctx.data;

    // Get the integration
    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    // Build the URL
    const url = new URL(endpoint, integration.url);

    // Add API key to params
    if (integration.apiKey) {
      url.searchParams.set("apikey", integration.apiKey);
    }

    // Add additional params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const headers: Record<string, string> = {
        "User-Agent": "AppMap-Widget/1.0",
      };

      // Some integrations use headers instead of query params
      if (integration.type === "jellyfin" && integration.apiKey) {
        headers["X-Emby-Token"] = integration.apiKey;
        url.searchParams.delete("apikey");
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out");
      }
      throw error;
    }
  }
);

// Sonarr-specific endpoints
export const getSonarrQueue = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v3/queue?apikey=${integration.apiKey}&includeSeries=true&includeEpisode=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

export const getSonarrCalendar = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v3/calendar?apikey=${integration.apiKey}&start=${ctx.data.start}&end=${ctx.data.end}&includeSeries=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

export const getSonarrWanted = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; pageSize: number } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v3/wanted/missing?apikey=${integration.apiKey}&pageSize=${ctx.data.pageSize}&sortKey=airDateUtc&sortDirection=descending&includeSeries=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

// Radarr-specific endpoints
export const getRadarrMovies = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v3/movie?apikey=${integration.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

export const getRadarrQueue = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v3/queue?apikey=${integration.apiKey}&includeMovie=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

export const getRadarrCalendar = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v3/calendar?apikey=${integration.apiKey}&start=${ctx.data.start}&end=${ctx.data.end}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

// Lidarr-specific endpoints
export const getLidarrWanted = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; pageSize: number } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v1/wanted/missing?apikey=${integration.apiKey}&pageSize=${ctx.data.pageSize}&sortKey=releaseDate&sortDirection=descending`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

export const getLidarrQueue = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v1/queue?apikey=${integration.apiKey}&includeArtist=true&includeAlbum=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

export const getLidarrCalendar = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; start: string; end: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const url = `${integration.url}/api/v1/calendar?apikey=${integration.apiKey}&start=${ctx.data.start}&end=${ctx.data.end}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);

// Uptime Kuma-specific endpoints
export const getUptimeKumaStatus = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; statusPageSlug?: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    const slug = ctx.data.statusPageSlug || "default";

    // Fetch both status page config and heartbeat data
    const [statusResponse, heartbeatResponse] = await Promise.all([
      fetch(`${integration.url}/api/status-page/${slug}`),
      fetch(`${integration.url}/api/status-page/heartbeat/${slug}`),
    ]);

    if (!statusResponse.ok) throw new Error(`HTTP ${statusResponse.status}`);

    const data = await statusResponse.json();

    // Try to get heartbeat data from separate endpoint
    let heartbeatList: Record<string, Array<{ status: number }>> = {};
    if (heartbeatResponse.ok) {
      const heartbeatData = await heartbeatResponse.json();
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
              const upHeartbeats = heartbeats.filter((h: { status: number }) => h.status === 1).length;
              monitor.uptime = heartbeats.length > 0 ? (upHeartbeats / heartbeats.length) * 100 : 0;

              // Get average response time
              const pings = heartbeats
                .filter((h: { ping?: number }) => h.ping !== undefined && h.ping !== null)
                .map((h: { ping: number }) => h.ping);
              monitor.avgPing = pings.length > 0 ? Math.round(pings.reduce((a: number, b: number) => a + b, 0) / pings.length) : null;
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

// Helper to build Jellyfin auth headers
// Uses the modern Authorization header format recommended by Jellyfin
function getJellyfinHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    // Modern Jellyfin auth - Authorization header with MediaBrowser format
    // This works with both API keys and user access tokens
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
      console.log("[Jellyfin Auth] Attempting auth to:", authUrl);
      console.log("[Jellyfin Auth] Username:", integration.username);

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

      console.log("[Jellyfin Auth] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        const token = data.AccessToken;
        const userId = data.User?.Id || "";

        console.log("[Jellyfin Auth] Success! Got token and userId:", userId);

        // Cache the token for 23 hours (Jellyfin tokens typically don't expire but we refresh periodically)
        jellyfinTokenCache.set(integration.id, {
          token,
          userId,
          expiresAt: Date.now() + 23 * 60 * 60 * 1000,
        });

        return { token, userId };
      } else {
        const errorText = await response.text();
        console.error("[Jellyfin Auth] Failed with status:", response.status, errorText);
      }
    } catch (error) {
      console.error("[Jellyfin Auth] Network error:", error);
    }
  }

  // Fall back to API key if authentication failed
  if (integration.apiKey) {
    return { token: integration.apiKey, userId: "" };
  }

  return null;
}

// Jellyfin-specific endpoints
export const getJellyfinSessions = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    console.log("[Jellyfin] Fetching sessions for:", integration.url);
    console.log("[Jellyfin] Has username:", !!integration.username);
    console.log("[Jellyfin] Has password:", !!integration.password);
    console.log("[Jellyfin] Has apiKey:", !!integration.apiKey);

    // Get access token (supports both API key and username/password auth)
    const auth = await getJellyfinAccessToken(integration);
    if (!auth) throw new Error("No authentication configured for Jellyfin");

    console.log("[Jellyfin] Got auth token, userId:", auth.userId || "(none)");

    const headers = getJellyfinHeaders(auth.token);
    const url = `${integration.url}/Sessions?ActiveWithinSeconds=960`;

    console.log("[Jellyfin] Fetching:", url);

    try {
      // ActiveWithinSeconds=960 filters to sessions active in last 16 minutes
      const response = await fetch(url, { headers });
      console.log("[Jellyfin] Sessions response status:", response.status);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      // Handle both array response and wrapped response
      if (Array.isArray(data)) return data;
      if (data.Items && Array.isArray(data.Items)) return data.Items;
      return [];
    } catch (error) {
      console.error("[Jellyfin] Sessions fetch error:", error);
      throw new Error(`Jellyfin connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
);

export const getJellyfinLatest = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { integrationId: string; limit: number } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.integrationId), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    // Get access token (supports both API key and username/password auth)
    const auth = await getJellyfinAccessToken(integration);
    if (!auth) throw new Error("No authentication configured for Jellyfin");

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

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    // Handle both array response and wrapped response
    if (Array.isArray(data)) return data;
    if (data.Items && Array.isArray(data.Items)) return data.Items;
    return [];
  }
);
