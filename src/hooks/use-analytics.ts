import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  trackAppAccess,
  getAnalyticsSummary,
  getDailyMetrics,
  getMostUsedApps,
  getLeastUsedApps,
  getLeastReliableApps,
  getAppAnalytics,
  getHealthHistory,
  getUptimeStats,
  getServiceReliability,
  exportAnalyticsData,
  type TimeRange,
  type AccessType,
} from "@/lib/server/analytics.server";

/**
 * Hook for tracking app access events
 * Use this when a user opens/clicks on an app
 */
export function useTrackAppAccess() {
  const trackMutation = useMutation({
    mutationFn: (data: { appId: string; accessType?: AccessType }) => {
      console.log("[Analytics] CLIENT: Calling trackAppAccess with:", data);
      return trackAppAccess({ data });
    },
    onSuccess: (result) => {
      console.log("[Analytics] CLIENT: trackAppAccess succeeded:", result);
    },
    // Silent - don't show errors for analytics
    onError: (error) => {
      console.error("[Analytics] CLIENT: Failed to track app access:", error);
    },
  });

  return {
    trackAccess: trackMutation.mutate,
    isTracking: trackMutation.isPending,
  };
}

/**
 * Hook for fetching analytics summary
 */
export function useAnalyticsSummary(range: TimeRange = "30d") {
  return useQuery({
    queryKey: ["analytics", "summary", range],
    queryFn: () => getAnalyticsSummary({ data: { range } }),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching daily metrics (for charts)
 */
export function useDailyMetrics(range: TimeRange = "30d", appId?: string) {
  return useQuery({
    queryKey: ["analytics", "daily", range, appId],
    queryFn: () => getDailyMetrics({ data: { range, appId } }),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching most used apps
 */
export function useMostUsedApps(range: TimeRange = "30d", limit = 10) {
  return useQuery({
    queryKey: ["analytics", "mostUsed", range, limit],
    queryFn: () => getMostUsedApps({ data: { range, limit } }),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching least used apps
 */
export function useLeastUsedApps(range: TimeRange = "30d", limit = 10) {
  return useQuery({
    queryKey: ["analytics", "leastUsed", range, limit],
    queryFn: () => getLeastUsedApps({ data: { range, limit } }),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching least reliable apps
 */
export function useLeastReliableApps(range: TimeRange = "30d", limit = 10) {
  return useQuery({
    queryKey: ["analytics", "leastReliable", range, limit],
    queryFn: () => getLeastReliableApps({ data: { range, limit } }),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching single app analytics
 */
export function useAppAnalytics(appId: string, range: TimeRange = "30d") {
  return useQuery({
    queryKey: ["analytics", "app", appId, range],
    queryFn: () => getAppAnalytics({ data: { appId, range } }),
    staleTime: 60000, // 1 minute
    enabled: !!appId,
  });
}

/**
 * Invalidate analytics queries
 */
export function useInvalidateAnalytics() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };
}

/**
 * Hook for fetching health status history
 */
export function useHealthHistory(range: TimeRange = "7d", limit = 100, appId?: string) {
  return useQuery({
    queryKey: ["analytics", "healthHistory", range, limit, appId],
    queryFn: () => getHealthHistory({ data: { range, limit, appId } }),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching uptime statistics
 */
export function useUptimeStats(range: TimeRange = "30d", appId?: string) {
  return useQuery({
    queryKey: ["analytics", "uptimeStats", range, appId],
    queryFn: () => getUptimeStats({ data: { range, appId } }),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching service reliability statistics
 */
export function useServiceReliability(range: TimeRange = "30d") {
  return useQuery({
    queryKey: ["analytics", "serviceReliability", range],
    queryFn: () => getServiceReliability({ data: { range } }),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for exporting analytics data
 */
export function useExportAnalytics() {
  return useMutation({
    mutationFn: (data: { range: TimeRange; format: "csv" | "json" }) =>
      exportAnalyticsData({ data }),
    onError: (error) => {
      console.error("Failed to export analytics:", error);
    },
  });
}
