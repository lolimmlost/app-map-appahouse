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

    const headers: Record<string, string> = {};
    if (integration.apiKey) {
      headers["X-Emby-Token"] = integration.apiKey;
    }

    const response = await fetch(`${integration.url}/Sessions`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
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

    const headers: Record<string, string> = {};
    if (integration.apiKey) {
      headers["X-Emby-Token"] = integration.apiKey;
    }

    const response = await fetch(
      `${integration.url}/Items/Latest?Limit=${ctx.data.limit}&IncludeItemTypes=Movie,Series,Episode&Fields=DateCreated`,
      { headers }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
);
