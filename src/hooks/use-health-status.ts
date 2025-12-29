import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { checkAllAppsHealth, type HealthStatus, type HealthCheckResult } from "@/lib/server/health.server";

// Exponential backoff configuration
const BACKOFF_CONFIG = {
  baseInterval: 30000, // 30 seconds base polling interval
  maxInterval: 300000, // 5 minutes maximum interval
  backoffMultiplier: 2, // Double the interval on each failure
  maxConsecutiveFailures: 5, // Max failures before reaching max interval
};

type AppBackoffState = {
  consecutiveFailures: number;
  nextCheckTime: number;
};

export function useHealthStatus(enabled = true, pollingInterval = 30000) {
  const [healthStatuses, setHealthStatuses] = useState<Record<string, HealthStatus>>({});
  const backoffStateRef = useRef<Record<string, AppBackoffState>>({});
  const queryClient = useQueryClient();

  // Calculate dynamic polling interval based on backoff states
  const getDynamicInterval = useCallback(() => {
    const now = Date.now();
    const states = backoffStateRef.current;
    const appIds = Object.keys(states);

    if (appIds.length === 0) {
      return pollingInterval;
    }

    // Find the minimum time until next check across all apps
    let minTimeUntilNextCheck = pollingInterval;

    for (const appId of appIds) {
      const state = states[appId];
      const timeUntilNextCheck = Math.max(0, state.nextCheckTime - now);
      if (timeUntilNextCheck < minTimeUntilNextCheck) {
        minTimeUntilNextCheck = timeUntilNextCheck;
      }
    }

    // Return at least the base interval to prevent too frequent polling
    return Math.max(BACKOFF_CONFIG.baseInterval, minTimeUntilNextCheck);
  }, [pollingInterval]);

  // Calculate backoff interval for a specific app based on consecutive failures
  const calculateBackoffInterval = useCallback((consecutiveFailures: number): number => {
    if (consecutiveFailures === 0) {
      return BACKOFF_CONFIG.baseInterval;
    }

    const cappedFailures = Math.min(consecutiveFailures, BACKOFF_CONFIG.maxConsecutiveFailures);
    const interval = BACKOFF_CONFIG.baseInterval * Math.pow(BACKOFF_CONFIG.backoffMultiplier, cappedFailures);

    return Math.min(interval, BACKOFF_CONFIG.maxInterval);
  }, []);

  // Update backoff state based on health check results
  const updateBackoffState = useCallback((results: HealthCheckResult[]) => {
    const now = Date.now();
    const newBackoffState = { ...backoffStateRef.current };

    for (const result of results) {
      const currentState = newBackoffState[result.appId] || { consecutiveFailures: 0, nextCheckTime: now };

      if (result.status === "offline") {
        // Increment failure count and calculate next check time with backoff
        const newFailures = currentState.consecutiveFailures + 1;
        const backoffInterval = calculateBackoffInterval(newFailures);

        newBackoffState[result.appId] = {
          consecutiveFailures: newFailures,
          nextCheckTime: now + backoffInterval,
        };
      } else if (result.status === "online") {
        // Reset on success
        newBackoffState[result.appId] = {
          consecutiveFailures: 0,
          nextCheckTime: now + BACKOFF_CONFIG.baseInterval,
        };
      } else {
        // For unknown status, keep current state but schedule normal check
        newBackoffState[result.appId] = {
          ...currentState,
          nextCheckTime: now + BACKOFF_CONFIG.baseInterval,
        };
      }
    }

    backoffStateRef.current = newBackoffState;
  }, [calculateBackoffInterval]);

  // Filter apps that are due for a health check based on backoff
  const getAppsToCheck = useCallback((): string[] | null => {
    const now = Date.now();
    const states = backoffStateRef.current;
    const appIds = Object.keys(states);

    if (appIds.length === 0) {
      // No backoff state yet, check all apps
      return null;
    }

    const dueApps = appIds.filter(appId => {
      const state = states[appId];
      return now >= state.nextCheckTime;
    });

    // If no apps are due, still return null to force a full check
    // This handles new apps that don't have backoff state yet
    return dueApps.length > 0 ? dueApps : null;
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["healthCheck"],
    queryFn: async () => {
      const appsToCheck = getAppsToCheck();
      // Pass the apps to check to the server function
      // For now, we check all apps but the backoff logic is applied client-side
      const result = await checkAllAppsHealth();
      return result;
    },
    enabled,
    refetchInterval: getDynamicInterval,
    staleTime: pollingInterval / 2,
  });

  useEffect(() => {
    if (data?.results) {
      const statuses: Record<string, HealthStatus> = {};
      for (const result of data.results) {
        statuses[result.appId] = result.status;
      }
      setHealthStatuses(statuses);

      // Update backoff state based on results
      updateBackoffState(data.results);
    }
  }, [data, updateBackoffState]);

  const refreshHealth = useCallback(() => {
    // Reset all backoff states on manual refresh
    backoffStateRef.current = {};
    refetch();
  }, [refetch]);

  // Get current backoff info for debugging/display purposes
  const getBackoffInfo = useCallback(() => {
    return { ...backoffStateRef.current };
  }, []);

  return {
    healthStatuses,
    isLoading,
    refreshHealth,
    getBackoffInfo,
  };
}
