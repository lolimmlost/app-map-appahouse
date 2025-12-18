import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "@/database/db";
import { apps } from "@/database/schema/apps";
import { auth } from "@/lib/auth";

export type HealthStatus = "online" | "offline" | "unknown" | "checking";

export type HealthCheckResult = {
  appId: string;
  status: HealthStatus;
  responseTime?: number;
  lastChecked: string;
  error?: string;
};

// Perform HTTP health check
async function httpHealthCheck(url: string, timeoutMs = 5000): Promise<{ online: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "AppMap-HealthCheck/1.0",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Consider 2xx and 3xx as online
    return {
      online: response.status >= 200 && response.status < 400,
      responseTime,
    };
  } catch (error) {
    return {
      online: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Perform TCP health check (simplified - just try HTTP)
async function tcpHealthCheck(url: string, timeoutMs = 5000): Promise<{ online: boolean; responseTime?: number; error?: string }> {
  // For now, TCP check is the same as HTTP but we try to just connect
  return httpHealthCheck(url, timeoutMs);
}

// Check health of a single app
export const checkAppHealth = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string } }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const [app] = await db
      .select()
      .from(apps)
      .where(eq(apps.id, ctx.data.appId))
      .limit(1);

    if (!app || app.userId !== session.user.id) {
      throw new Error("App not found");
    }

    if (!app.healthCheckEnabled) {
      return {
        appId: app.id,
        status: "unknown" as HealthStatus,
        lastChecked: new Date().toISOString(),
      };
    }

    // Determine the URL to check
    const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;

    if (!checkUrl) {
      return {
        appId: app.id,
        status: "unknown" as HealthStatus,
        lastChecked: new Date().toISOString(),
        error: "No URL configured for health check",
      };
    }

    let result: { online: boolean; responseTime?: number; error?: string };

    switch (app.healthCheckType) {
      case "http":
        result = await httpHealthCheck(checkUrl);
        break;
      case "tcp":
        result = await tcpHealthCheck(checkUrl);
        break;
      case "uptime_kuma":
        // Uptime Kuma integration would go here
        // For now, return unknown
        return {
          appId: app.id,
          status: "unknown" as HealthStatus,
          lastChecked: new Date().toISOString(),
          error: "Uptime Kuma integration not configured",
        };
      default:
        result = await httpHealthCheck(checkUrl);
    }

    return {
      appId: app.id,
      status: result.online ? "online" : "offline",
      responseTime: result.responseTime,
      lastChecked: new Date().toISOString(),
      error: result.error,
    } as HealthCheckResult;
  }
);

// Check health of all apps for the current user
export const checkAllAppsHealth = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return { results: [] };
    }

    const userApps = await db
      .select()
      .from(apps)
      .where(eq(apps.userId, session.user.id));

    const results: HealthCheckResult[] = [];

    // Check health in parallel with a limit
    const healthCheckPromises = userApps
      .filter((app) => app.healthCheckEnabled)
      .map(async (app) => {
        const checkUrl = app.healthCheckUrl || app.localUrl || app.remoteUrl;

        if (!checkUrl) {
          return {
            appId: app.id,
            status: "unknown" as HealthStatus,
            lastChecked: new Date().toISOString(),
            error: "No URL configured",
          };
        }

        try {
          let result: { online: boolean; responseTime?: number; error?: string };

          switch (app.healthCheckType) {
            case "http":
              result = await httpHealthCheck(checkUrl);
              break;
            case "tcp":
              result = await tcpHealthCheck(checkUrl);
              break;
            default:
              result = await httpHealthCheck(checkUrl);
          }

          return {
            appId: app.id,
            status: result.online ? "online" : "offline",
            responseTime: result.responseTime,
            lastChecked: new Date().toISOString(),
            error: result.error,
          } as HealthCheckResult;
        } catch (error) {
          return {
            appId: app.id,
            status: "offline" as HealthStatus,
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

    const healthResults = await Promise.allSettled(healthCheckPromises);

    for (const result of healthResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }

    // Add unknown status for apps without health check enabled
    for (const app of userApps) {
      if (!app.healthCheckEnabled) {
        results.push({
          appId: app.id,
          status: "unknown" as HealthStatus,
          lastChecked: new Date().toISOString(),
        });
      }
    }

    return { results };
  }
);
