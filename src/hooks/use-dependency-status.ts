import { useQuery } from "@tanstack/react-query";
import { getDependencyStatuses, getDependencyGraph } from "@/lib/server/app-dependencies.server";

export type DependencyStatus = "healthy" | "degraded" | "offline";

/**
 * Hook to get dependency statuses for all apps
 * Returns a map of appId -> dependency status
 */
export function useDependencyStatuses(enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dependency-statuses"],
    queryFn: () => getDependencyStatuses(),
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return {
    dependencyStatuses: data?.statuses ?? {},
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get the full dependency graph
 */
export function useDependencyGraph(enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dependency-graph"],
    queryFn: () => getDependencyGraph(),
    enabled,
    staleTime: 30000,
  });

  return {
    graph: data ?? { nodes: [], edges: [], circularDependencies: [] },
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get the combined health and dependency status for an app
 * Returns the worse of the two statuses
 */
export function getCombinedStatus(
  healthStatus: "online" | "offline" | "unknown" | "checking",
  dependencyStatus: DependencyStatus | undefined
): "online" | "offline" | "unknown" | "checking" | "degraded" {
  // If health check is offline, return offline
  if (healthStatus === "offline") return "offline";

  // If health check is checking or unknown, return that
  if (healthStatus === "checking") return "checking";
  if (healthStatus === "unknown") return "unknown";

  // Health is online, check dependency status
  if (dependencyStatus === "offline") return "degraded"; // Required dependency is down
  if (dependencyStatus === "degraded") return "degraded"; // Optional dependency is down

  return "online";
}
