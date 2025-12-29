import { createServerFn } from "@tanstack/react-start";
import { Agent } from "undici";
import type { Integration, NewIntegration } from "@/types/database";

// Create an undici agent that ignores SSL certificate errors
const insecureAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

// Get all integrations for the current user
export const getIntegrations = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, asc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { integrations } = await import("@/database/schema/integrations");

  const session = await getOptionalSession();
  if (!session) return { integrations: [] };

  const db = await getDb();
  const result = await db.query.integrations.findMany({
    where: eq(integrations.userId, session.user.id),
    orderBy: [asc(integrations.name)],
  });

  return { integrations: result };
});

// Get a single integration by ID
export const getIntegration = createServerFn({ method: "GET" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { integrations } = await import("@/database/schema/integrations");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.id), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    return { integration };
  }
);

type CreateIntegrationData = {
  data: Omit<NewIntegration, "id" | "userId" | "createdAt" | "updatedAt">;
};

// Create a new integration
export const createIntegration = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateIntegrationData) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { integrations } = await import("@/database/schema/integrations");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [newIntegration] = await db
      .insert(integrations)
      .values({
        ...ctx.data,
        userId: session.user.id,
      })
      .returning();

    return newIntegration;
  }
);

type UpdateIntegrationData = {
  data: {
    id: string;
    data: Partial<Omit<NewIntegration, "id" | "userId" | "createdAt">>;
  };
};

// Update an existing integration
export const updateIntegration = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateIntegrationData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { integrations } = await import("@/database/schema/integrations");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { id, data } = ctx.data;

    const [updatedIntegration] = await db
      .update(integrations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(integrations.id, id), eq(integrations.userId, session.user.id)))
      .returning();

    if (!updatedIntegration) throw new Error("Integration not found");

    return updatedIntegration;
  }
);

// Delete an integration
export const deleteIntegration = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { integrations } = await import("@/database/schema/integrations");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    await db.delete(integrations).where(
      and(eq(integrations.id, ctx.data.id), eq(integrations.userId, session.user.id))
    );

    return { success: true };
  }
);

// Test an integration connection
export const testIntegration = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { integrations } = await import("@/database/schema/integrations");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, ctx.data.id), eq(integrations.userId, session.user.id)))
      .limit(1);

    if (!integration) throw new Error("Integration not found");

    try {
      const result = await testIntegrationConnection(integration);
      return { success: result.success, message: result.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }
);

// Helper function to test different integration types
async function testIntegrationConnection(
  integration: Integration
): Promise<{ success: boolean; message: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    let testUrl = integration.url;
    let headers: Record<string, string> = {
      "User-Agent": "AppMap-Integration/1.0",
    };

    switch (integration.type) {
      case "uptime_kuma":
        // Uptime Kuma API endpoint
        testUrl = `${integration.url}/api/status-page`;
        break;

      case "radarr":
      case "sonarr":
        // Radarr/Sonarr use API v3
        testUrl = `${integration.url}/api/v3/system/status`;
        if (integration.apiKey) {
          headers["X-Api-Key"] = integration.apiKey;
        }
        break;

      case "lidarr":
        // Lidarr uses API v1
        testUrl = `${integration.url}/api/v1/system/status`;
        if (integration.apiKey) {
          headers["X-Api-Key"] = integration.apiKey;
        }
        break;

      case "jellyfin":
        // Jellyfin system info endpoint
        testUrl = `${integration.url}/System/Info/Public`;
        break;

      case "docker":
        // Docker API version endpoint
        testUrl = `${integration.url}/version`;
        break;

      case "proxmox":
        // Proxmox API version
        testUrl = `${integration.url}/api2/json/version`;
        // Proxmox uses API token format: PVEAPIToken=USER@REALM!TOKENID=SECRET
        if (integration.apiKey && integration.username) {
          headers["Authorization"] = `PVEAPIToken=${integration.username}=${integration.apiKey}`;
        } else if (integration.apiKey) {
          // If only apiKey is provided, assume it's the full token
          headers["Authorization"] = `PVEAPIToken=${integration.apiKey}`;
        }
        break;

      case "portainer":
        // Portainer API status
        testUrl = `${integration.url}/api/status`;
        break;

      case "glances":
        // Glances API version/status
        testUrl = `${integration.url}/api/3/version`;
        if (integration.password) {
          // Glances uses HTTP Basic Auth if password is set
          const authStr = integration.username
            ? `${integration.username}:${integration.password}`
            : `glances:${integration.password}`;
          headers["Authorization"] = `Basic ${btoa(authStr)}`;
        }
        break;

      case "truenas":
        // TrueNAS Scale REST API
        testUrl = `${integration.url}/api/v2.0/system/info`;
        if (integration.apiKey) {
          headers["Authorization"] = `Bearer ${integration.apiKey}`;
        }
        break;

      default:
        // Generic HTTP check
        break;
    }

    // Build fetch options
    const fetchOptions: RequestInit & { dispatcher?: Agent } = {
      method: "GET",
      headers,
      signal: controller.signal,
    };

    // Use insecure dispatcher for self-signed certificates if allowInsecure is enabled
    if (integration.allowInsecure && testUrl.startsWith("https://")) {
      // @ts-expect-error - dispatcher is undici-specific but works with Node.js fetch
      fetchOptions.dispatcher = insecureAgent;
    }

    const response = await fetch(testUrl, fetchOptions);

    clearTimeout(timeoutId);

    if (response.ok) {
      return { success: true, message: "Connection successful" };
    } else {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, message: "Connection timed out" };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
