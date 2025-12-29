import { createServerFn } from "@tanstack/react-start";
import type { TrueNASApp } from "./widget-proxy.server";

// Types for discovered services
export interface DiscoveredPort {
  port: number;
  hostPort?: number;
  protocol: "tcp" | "udp";
  isWebUI?: boolean;
}

export interface DiscoveredService {
  id: string;
  source: "docker" | "truenas";
  name: string;
  displayName: string;
  containerName?: string;
  image?: string;
  ports: DiscoveredPort[];
  status: "running" | "stopped" | "unknown";
  iconUrl?: string;
  labels?: Record<string, string>;
  truenasAppName?: string;
  truenasPortal?: string;
  existingAppId?: string | null;
  integrationId: string;
  integrationName: string;
}

type DockerContainer = {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Ports: Array<{
    IP?: string;
    PrivatePort: number;
    PublicPort?: number;
    Type: string;
  }>;
  Labels?: Record<string, string>;
};

// Common web UI ports
const WEB_UI_PORTS = new Set([80, 443, 8080, 8443, 3000, 5000, 8000, 9000]);

function isWebUIPort(port: number): boolean {
  return WEB_UI_PORTS.has(port) || (port >= 8000 && port <= 9999);
}

// Normalize container/app name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^\//, "") // Remove leading slash from Docker names
    .replace(/^ix-/, "") // Remove TrueNAS ix- prefix
    .replace(/[-_]/g, "") // Remove separators
    .trim();
}

// Get the best display name for a container
function getDisplayName(name: string): string {
  return name
    .replace(/^\//, "")
    .replace(/^ix-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Transform Docker container to DiscoveredService
function dockerToDiscoveredService(
  container: DockerContainer,
  integrationId: string,
  integrationName: string,
  getIconUrl: (name: string) => string | null
): DiscoveredService {
  const rawName = container.Names[0]?.replace(/^\//, "") || container.Id.substring(0, 12);

  const ports: DiscoveredPort[] = (container.Ports || [])
    .filter((p) => p.PublicPort)
    .map((p) => ({
      port: p.PrivatePort,
      hostPort: p.PublicPort,
      protocol: (p.Type as "tcp" | "udp") || "tcp",
      isWebUI: isWebUIPort(p.PublicPort || p.PrivatePort),
    }));

  // Extract image name without tag
  const imageName = container.Image.split(":")[0].split("/").pop() || container.Image;

  // Try to find an icon - check both container name and image name
  const iconUrl = getIconUrl(rawName) || getIconUrl(imageName);

  return {
    id: `docker:${container.Id}`,
    source: "docker",
    name: rawName,
    displayName: getDisplayName(rawName),
    containerName: rawName,
    image: imageName,
    ports,
    status: container.State === "running" ? "running" : "stopped",
    iconUrl: iconUrl || undefined,
    labels: container.Labels,
    integrationId,
    integrationName,
  };
}

// Transform TrueNAS app to DiscoveredService
function truenasToDiscoveredService(
  app: TrueNASApp,
  integrationId: string,
  integrationName: string,
  getIconUrl: (name: string) => string | null
): DiscoveredService {
  const ports: DiscoveredPort[] = (app.active_workloads?.used_ports || []).map((p) => ({
    port: p.container_port,
    hostPort: p.host_port,
    protocol: (p.protocol as "tcp" | "udp") || "tcp",
    isWebUI: isWebUIPort(p.host_port || p.container_port),
  }));

  // Get the first portal URL if available
  const portalEntries = Object.entries(app.portals || {});
  const portal = portalEntries.length > 0 ? portalEntries[0][1] : undefined;

  // Try to find an icon for this app
  const iconUrl = getIconUrl(app.name);

  return {
    id: `truenas:${app.id}`,
    source: "truenas",
    name: app.name,
    displayName: getDisplayName(app.name),
    truenasAppName: app.name,
    truenasPortal: portal,
    ports,
    status: app.state === "RUNNING" ? "running" : app.state === "DEPLOYING" ? "unknown" : "stopped",
    iconUrl: iconUrl || undefined,
    integrationId,
    integrationName,
  };
}

// Deduplicate services - TrueNAS apps often appear in Docker too
function deduplicateServices(services: DiscoveredService[]): DiscoveredService[] {
  const seen = new Map<string, DiscoveredService>();
  const result: DiscoveredService[] = [];

  // First pass: group by normalized name
  for (const service of services) {
    const normalizedName = normalizeName(service.name);
    const existing = seen.get(normalizedName);

    if (!existing) {
      seen.set(normalizedName, service);
      continue;
    }

    // If we have both Docker and TrueNAS versions, prefer TrueNAS (more metadata)
    if (existing.source === "docker" && service.source === "truenas") {
      // Merge Docker info into TrueNAS service
      service.image = service.image || existing.image;
      service.labels = service.labels || existing.labels;
      // Combine ports, prefer TrueNAS port mappings
      if (service.ports.length === 0 && existing.ports.length > 0) {
        service.ports = existing.ports;
      }
      seen.set(normalizedName, service);
    } else if (existing.source === "truenas" && service.source === "docker") {
      // Keep TrueNAS, add Docker info
      existing.image = existing.image || service.image;
      existing.labels = existing.labels || service.labels;
      if (existing.ports.length === 0 && service.ports.length > 0) {
        existing.ports = service.ports;
      }
    }
    // If same source, keep the first one
  }

  // Convert map back to array
  for (const service of seen.values()) {
    result.push(service);
  }

  return result;
}

// Match discovered services with existing apps
async function matchWithExistingApps(
  services: DiscoveredService[],
  userId: string,
  db: any,
  apps: any,
  eq: any
): Promise<DiscoveredService[]> {
  const existingApps = await db.query.apps.findMany({
    where: eq(apps.userId, userId),
  });

  for (const service of services) {
    // Try to match by Docker container ID
    if (service.source === "docker") {
      const containerId = service.id.replace("docker:", "");
      const match = existingApps.find(
        (app) => app.dockerContainerId === containerId
      );
      if (match) {
        service.existingAppId = match.id;
        continue;
      }
    }

    // Try to match by TrueNAS app ID
    if (service.source === "truenas") {
      const match = existingApps.find(
        (app) => app.truenasAppId === service.truenasAppName
      );
      if (match) {
        service.existingAppId = match.id;
        continue;
      }
    }

    // Try to match by name similarity
    const normalizedServiceName = normalizeName(service.name);
    const match = existingApps.find((app) => {
      const normalizedAppName = normalizeName(app.name);
      return (
        normalizedAppName === normalizedServiceName ||
        normalizedAppName.includes(normalizedServiceName) ||
        normalizedServiceName.includes(normalizedAppName)
      );
    });
    if (match) {
      service.existingAppId = match.id;
    }
  }

  return services;
}

// Main discovery function
export const discoverServices = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");
    const { integrations } = await import("@/database/schema/integrations");
    const { fetchDockerContainers, fetchTrueNASApps } = await import("./widget-proxy.server");
    const { getIconUrl } = await import("./icons.server");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    // Get all enabled Docker and TrueNAS integrations
    const userIntegrations = await db.query.integrations.findMany({
      where: and(
        eq(integrations.userId, session.user.id),
        eq(integrations.enabled, true)
      ),
    });

    const dockerIntegrations = userIntegrations.filter((i) => i.type === "docker");
    const truenasIntegrations = userIntegrations.filter((i) => i.type === "truenas");

    const allServices: DiscoveredService[] = [];
    const errors: { integration: string; error: string }[] = [];

    // Fetch from Docker integrations
    for (const integration of dockerIntegrations) {
      try {
        const containers = await fetchDockerContainers(integration.id, session.user.id, true);
        if (Array.isArray(containers)) {
          for (const container of containers as DockerContainer[]) {
            allServices.push(
              dockerToDiscoveredService(container, integration.id, integration.name, getIconUrl)
            );
          }
        }
      } catch (error) {
        errors.push({
          integration: integration.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Fetch from TrueNAS integrations
    for (const integration of truenasIntegrations) {
      try {
        const apps = await fetchTrueNASApps(integration.id, session.user.id);
        if (Array.isArray(apps)) {
          for (const app of apps as TrueNASApp[]) {
            allServices.push(
              truenasToDiscoveredService(app, integration.id, integration.name, getIconUrl)
            );
          }
        }
      } catch (error) {
        errors.push({
          integration: integration.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Deduplicate services
    const dedupedServices = deduplicateServices(allServices);

    // Match with existing apps
    const matchedServices = await matchWithExistingApps(
      dedupedServices,
      session.user.id,
      db,
      apps,
      eq
    );

    // Sort: running first, then by name
    matchedServices.sort((a, b) => {
      if (a.status === "running" && b.status !== "running") return -1;
      if (a.status !== "running" && b.status === "running") return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return {
      services: matchedServices,
      errors,
      integrationCount: {
        docker: dockerIntegrations.length,
        truenas: truenasIntegrations.length,
      },
    };
  }
);

// Import a discovered service as an app
export const importDiscoveredService = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    data: {
      service: DiscoveredService;
      name?: string;
      localUrl?: string;
      categoryId?: string;
      healthCheckEnabled?: boolean;
    };
  }) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    const { service, name, localUrl, categoryId, healthCheckEnabled } = ctx.data;

    // Determine the URL to use
    let url = localUrl;
    if (!url && service.truenasPortal) {
      url = service.truenasPortal;
    }
    if (!url && service.ports.length > 0) {
      const webPort = service.ports.find((p) => p.isWebUI) || service.ports[0];
      const port = webPort.hostPort || webPort.port;
      url = `http://localhost:${port}`;
    }

    const [newApp] = await db
      .insert(apps)
      .values({
        name: name || service.displayName,
        localUrl: url || null,
        icon: service.iconUrl || null,
        categoryId: categoryId || null,
        userId: session.user.id,
        dockerContainerId: service.source === "docker" ? service.id.replace("docker:", "") : null,
        truenasAppId: service.source === "truenas" ? service.truenasAppName : null,
        discoverySource: service.source,
        healthCheckEnabled: healthCheckEnabled ?? false,
        healthCheckUrl: url || null,
      })
      .returning();

    return newApp;
  }
);

// Bulk import multiple services
export const bulkImportServices = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    data: {
      services: DiscoveredService[];
      categoryId?: string;
    };
  }) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema/apps");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    const { services, categoryId } = ctx.data;
    const imported: string[] = [];
    const failed: { name: string; error: string }[] = [];

    for (const service of services) {
      try {
        let url: string | null = null;
        if (service.truenasPortal) {
          url = service.truenasPortal;
        } else if (service.ports.length > 0) {
          const webPort = service.ports.find((p) => p.isWebUI) || service.ports[0];
          const port = webPort.hostPort || webPort.port;
          url = `http://localhost:${port}`;
        }

        await db.insert(apps).values({
          name: service.displayName,
          localUrl: url,
          icon: service.iconUrl || null,
          categoryId: categoryId || null,
          userId: session.user.id,
          dockerContainerId: service.source === "docker" ? service.id.replace("docker:", "") : null,
          truenasAppId: service.source === "truenas" ? service.truenasAppName : null,
          discoverySource: service.source,
        });

        imported.push(service.displayName);
      } catch (error) {
        failed.push({
          name: service.displayName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { imported, failed };
  }
);
