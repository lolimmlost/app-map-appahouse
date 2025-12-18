import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/database/db";
import { integrations, type NewIntegration, type Integration } from "@/database/schema/integrations";
import { auth } from "@/lib/auth";

async function getSession() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

// Get all integrations for the current user
export const getIntegrations = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session?.user) return { integrations: [] };

  const result = await db.query.integrations.findMany({
    where: eq(integrations.userId, session.user.id),
    orderBy: [asc(integrations.name)],
  });

  return { integrations: result };
});

// Get a single integration by ID
export const getIntegration = createServerFn({ method: "GET" }).handler(
  async (ctx: { data: { id: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
  id: string;
  data: Partial<Omit<NewIntegration, "id" | "userId" | "createdAt">>;
};

// Update an existing integration
export const updateIntegration = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateIntegrationData) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [updatedIntegration] = await db
      .update(integrations)
      .set({
        ...ctx.data,
        updatedAt: new Date(),
      })
      .where(and(eq(integrations.id, ctx.id), eq(integrations.userId, session.user.id)))
      .returning();

    if (!updatedIntegration) throw new Error("Integration not found");

    return updatedIntegration;
  }
);

// Delete an integration
export const deleteIntegration = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    await db.delete(integrations).where(
      and(eq(integrations.id, ctx.data.id), eq(integrations.userId, session.user.id))
    );

    return { success: true };
  }
);

// Test an integration connection
export const testIntegration = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
      case "lidarr":
        // *arr apps use X-Api-Key header
        testUrl = `${integration.url}/api/v3/system/status`;
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
        break;

      case "portainer":
        // Portainer API status
        testUrl = `${integration.url}/api/status`;
        break;

      default:
        // Generic HTTP check
        break;
    }

    const response = await fetch(testUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

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
