import { createServerFn } from "@tanstack/react-start";
import type { DependencyType, NewAppDependency } from "@/database/schema/app-dependencies";

export type DependencyWithApps = {
  id: string;
  appId: string;
  dependsOnAppId: string;
  dependencyType: DependencyType;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  app: {
    id: string;
    name: string;
    icon: string | null;
  };
  dependsOnApp: {
    id: string;
    name: string;
    icon: string | null;
  };
};

export type DependencyGraphNode = {
  id: string;
  name: string;
  icon: string | null;
  healthStatus?: "online" | "offline" | "unknown";
  dependencyStatus?: "healthy" | "degraded" | "offline";
};

export type DependencyGraphEdge = {
  id: string;
  from: string;
  to: string;
  type: DependencyType;
  description: string | null;
};

export type DependencyGraph = {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
  circularDependencies: string[][]; // Array of circular dependency paths
};

/**
 * Detect circular dependencies using DFS (Depth-First Search)
 * Returns an array of circular dependency paths
 */
function detectCircularDependencies(
  nodes: string[],
  edges: { from: string; to: string }[]
): string[][] {
  const adjacencyList = new Map<string, string[]>();

  // Build adjacency list
  for (const node of nodes) {
    adjacencyList.set(node, []);
  }
  for (const edge of edges) {
    const neighbors = adjacencyList.get(edge.from) || [];
    neighbors.push(edge.to);
    adjacencyList.set(edge.from, neighbors);
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle - extract the cycle path
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycle.push(neighbor); // Complete the cycle
        cycles.push(cycle);
      }
    }

    path.pop();
    recursionStack.delete(node);
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Check if adding a dependency would create a circular dependency
 */
function wouldCreateCircularDependency(
  existingEdges: { from: string; to: string }[],
  newFrom: string,
  newTo: string
): boolean {
  // Check if there's a path from newTo back to newFrom
  const adjacencyList = new Map<string, string[]>();

  // Build adjacency list including the new edge
  for (const edge of existingEdges) {
    const neighbors = adjacencyList.get(edge.from) || [];
    neighbors.push(edge.to);
    adjacencyList.set(edge.from, neighbors);
  }

  // Add the new edge
  const fromNeighbors = adjacencyList.get(newFrom) || [];
  fromNeighbors.push(newTo);
  adjacencyList.set(newFrom, fromNeighbors);

  // BFS to find if there's a path from newTo to newFrom
  const visited = new Set<string>();
  const queue = [newTo];
  visited.add(newTo);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === newFrom) {
      return true; // Found a path back to newFrom
    }

    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}

/**
 * Calculate dependency status based on the health of dependencies
 */
function calculateDependencyStatus(
  appId: string,
  edges: DependencyGraphEdge[],
  healthStatuses: Map<string, "online" | "offline" | "unknown">
): "healthy" | "degraded" | "offline" {
  const dependencies = edges.filter(e => e.from === appId);

  if (dependencies.length === 0) {
    return "healthy"; // No dependencies, so healthy
  }

  let hasOfflineRequired = false;
  let hasOfflineOptional = false;

  for (const dep of dependencies) {
    const status = healthStatuses.get(dep.to) || "unknown";
    if (status === "offline") {
      if (dep.type === "required") {
        hasOfflineRequired = true;
      } else if (dep.type === "optional") {
        hasOfflineOptional = true;
      }
    }
  }

  if (hasOfflineRequired) {
    return "offline"; // Required dependency is offline
  }
  if (hasOfflineOptional) {
    return "degraded"; // Optional dependency is offline
  }
  return "healthy";
}

// Get all dependencies for the current user
export const getDependencies = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { appDependencies } = await import("@/database/schema");

  const db = await getDb();
  const session = await getOptionalSession();

  if (!session) return { dependencies: [] };

  const dependencies = await db.query.appDependencies.findMany({
    where: eq(appDependencies.userId, session.user.id),
    with: {
      app: {
        columns: {
          id: true,
          name: true,
          icon: true,
        },
      },
      dependsOnApp: {
        columns: {
          id: true,
          name: true,
          icon: true,
        },
      },
    },
  });

  return { dependencies: dependencies as DependencyWithApps[] };
});

// Get dependencies for a specific app
export const getAppDependencies = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appDependencies } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    // Get dependencies (apps this app depends on)
    const dependencies = await db.query.appDependencies.findMany({
      where: and(
        eq(appDependencies.appId, ctx.data.appId),
        eq(appDependencies.userId, session.user.id)
      ),
      with: {
        dependsOnApp: {
          columns: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    // Get dependents (apps that depend on this app)
    const dependents = await db.query.appDependencies.findMany({
      where: and(
        eq(appDependencies.dependsOnAppId, ctx.data.appId),
        eq(appDependencies.userId, session.user.id)
      ),
      with: {
        app: {
          columns: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return { dependencies, dependents };
  }
);

// Get the full dependency graph
export const getDependencyGraph = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { apps, appDependencies } = await import("@/database/schema");
  const { getAllCachedHealthResults } = await import("./health-cache.server");

  const db = await getDb();
  const session = await getOptionalSession();

  if (!session) {
    return {
      nodes: [],
      edges: [],
      circularDependencies: []
    } as DependencyGraph;
  }

  // Get all user apps
  const userApps = await db.query.apps.findMany({
    where: eq(apps.userId, session.user.id),
    columns: {
      id: true,
      name: true,
      icon: true,
    },
  });

  // Get all dependencies
  const dependencies = await db.query.appDependencies.findMany({
    where: eq(appDependencies.userId, session.user.id),
  });

  // Get health statuses
  const healthResults = await getAllCachedHealthResults(session.user.id);
  const healthStatuses = new Map<string, "online" | "offline" | "unknown">();
  for (const result of healthResults) {
    healthStatuses.set(result.appId, result.status as "online" | "offline" | "unknown");
  }

  // Build edges
  const edges: DependencyGraphEdge[] = dependencies.map(dep => ({
    id: dep.id,
    from: dep.appId,
    to: dep.dependsOnAppId,
    type: dep.dependencyType,
    description: dep.description,
  }));

  // Detect circular dependencies
  const nodeIds = userApps.map(a => a.id);
  const simpleEdges = edges.map(e => ({ from: e.from, to: e.to }));
  const circularDependencies = detectCircularDependencies(nodeIds, simpleEdges);

  // Build nodes with health and dependency status
  const nodes: DependencyGraphNode[] = userApps.map(app => {
    const healthStatus = healthStatuses.get(app.id) || "unknown";
    const dependencyStatus = calculateDependencyStatus(app.id, edges, healthStatuses);

    return {
      id: app.id,
      name: app.name,
      icon: app.icon,
      healthStatus,
      dependencyStatus,
    };
  });

  return {
    nodes,
    edges,
    circularDependencies,
  } as DependencyGraph;
});

// Create a new dependency
export const createDependency = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string; dependsOnAppId: string; dependencyType?: DependencyType; description?: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps, appDependencies } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    const { appId, dependsOnAppId, dependencyType = "required", description } = ctx.data;

    // Validate that both apps exist and belong to the user
    const [app, dependsOnApp] = await Promise.all([
      db.query.apps.findFirst({
        where: and(eq(apps.id, appId), eq(apps.userId, session.user.id)),
      }),
      db.query.apps.findFirst({
        where: and(eq(apps.id, dependsOnAppId), eq(apps.userId, session.user.id)),
      }),
    ]);

    if (!app || !dependsOnApp) {
      throw new Error("One or both apps not found");
    }

    // Check for self-dependency
    if (appId === dependsOnAppId) {
      throw new Error("An app cannot depend on itself");
    }

    // Check for duplicate dependency
    const existingDep = await db.query.appDependencies.findFirst({
      where: and(
        eq(appDependencies.appId, appId),
        eq(appDependencies.dependsOnAppId, dependsOnAppId),
        eq(appDependencies.userId, session.user.id)
      ),
    });

    if (existingDep) {
      throw new Error("This dependency already exists");
    }

    // Check for circular dependency
    const existingDeps = await db.query.appDependencies.findMany({
      where: eq(appDependencies.userId, session.user.id),
    });
    const existingEdges = existingDeps.map(d => ({ from: d.appId, to: d.dependsOnAppId }));

    if (wouldCreateCircularDependency(existingEdges, appId, dependsOnAppId)) {
      throw new Error("Adding this dependency would create a circular dependency");
    }

    // Create the dependency
    const [newDependency] = await db
      .insert(appDependencies)
      .values({
        appId,
        dependsOnAppId,
        dependencyType,
        description: description || null,
        userId: session.user.id,
      })
      .returning();

    return newDependency;
  }
);

// Update a dependency
export const updateDependency = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string; dependencyType?: DependencyType; description?: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appDependencies } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    const { id, dependencyType, description } = ctx.data;

    const updateData: Partial<NewAppDependency> = {
      updatedAt: new Date(),
    };

    if (dependencyType !== undefined) {
      updateData.dependencyType = dependencyType;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const [updated] = await db
      .update(appDependencies)
      .set(updateData)
      .where(and(eq(appDependencies.id, id), eq(appDependencies.userId, session.user.id)))
      .returning();

    if (!updated) {
      throw new Error("Dependency not found");
    }

    return updated;
  }
);

// Delete a dependency
export const deleteDependency = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appDependencies } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    await db
      .delete(appDependencies)
      .where(and(eq(appDependencies.id, ctx.data.id), eq(appDependencies.userId, session.user.id)));

    return { success: true };
  }
);

// Bulk update dependencies for an app
export const updateAppDependencies = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string; dependencies: { dependsOnAppId: string; dependencyType: DependencyType; description?: string }[] } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps, appDependencies } = await import("@/database/schema");

    const db = await getDb();
    const session = await getAuthenticatedSession();

    const { appId, dependencies } = ctx.data;

    // Verify app belongs to user
    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, appId), eq(apps.userId, session.user.id)),
    });

    if (!app) {
      throw new Error("App not found");
    }

    // Validate no self-dependencies
    if (dependencies.some(d => d.dependsOnAppId === appId)) {
      throw new Error("An app cannot depend on itself");
    }

    // Check for circular dependencies with the new set
    const allDeps = await db.query.appDependencies.findMany({
      where: eq(appDependencies.userId, session.user.id),
    });

    // Filter out existing deps for this app
    const otherDeps = allDeps.filter(d => d.appId !== appId);
    const otherEdges = otherDeps.map(d => ({ from: d.appId, to: d.dependsOnAppId }));

    // Check each new dependency
    for (const dep of dependencies) {
      if (wouldCreateCircularDependency(otherEdges, appId, dep.dependsOnAppId)) {
        throw new Error(`Adding dependency on ${dep.dependsOnAppId} would create a circular dependency`);
      }
      // Add this edge to check subsequent dependencies
      otherEdges.push({ from: appId, to: dep.dependsOnAppId });
    }

    // Delete existing dependencies for this app
    await db
      .delete(appDependencies)
      .where(and(eq(appDependencies.appId, appId), eq(appDependencies.userId, session.user.id)));

    // Insert new dependencies
    if (dependencies.length > 0) {
      await db.insert(appDependencies).values(
        dependencies.map(dep => ({
          appId,
          dependsOnAppId: dep.dependsOnAppId,
          dependencyType: dep.dependencyType,
          description: dep.description || null,
          userId: session.user.id,
        }))
      );
    }

    return { success: true };
  }
);

// Get dependency status for all apps (used for health display)
export const getDependencyStatuses = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { apps, appDependencies } = await import("@/database/schema");
  const { getAllCachedHealthResults } = await import("./health-cache.server");

  const db = await getDb();
  const session = await getOptionalSession();

  if (!session) return { statuses: {} };

  // Get all dependencies
  const dependencies = await db.query.appDependencies.findMany({
    where: eq(appDependencies.userId, session.user.id),
  });

  // Get health statuses
  const healthResults = await getAllCachedHealthResults(session.user.id);
  const healthStatuses = new Map<string, "online" | "offline" | "unknown">();
  for (const result of healthResults) {
    healthStatuses.set(result.appId, result.status as "online" | "offline" | "unknown");
  }

  // Build edges
  const edges: DependencyGraphEdge[] = dependencies.map(dep => ({
    id: dep.id,
    from: dep.appId,
    to: dep.dependsOnAppId,
    type: dep.dependencyType,
    description: dep.description,
  }));

  // Get all app IDs
  const userApps = await db.query.apps.findMany({
    where: eq(apps.userId, session.user.id),
    columns: { id: true },
  });

  // Calculate dependency status for each app
  const statuses: Record<string, "healthy" | "degraded" | "offline"> = {};
  for (const app of userApps) {
    statuses[app.id] = calculateDependencyStatus(app.id, edges, healthStatuses);
  }

  return { statuses };
});
