import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkAllAppsHealth, type HealthStatus } from "@/lib/server/health";

export function useHealthStatus(enabled = true, pollingInterval = 30000) {
  const [healthStatuses, setHealthStatuses] = useState<Record<string, HealthStatus>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["healthCheck"],
    queryFn: () => checkAllAppsHealth(),
    enabled,
    refetchInterval: pollingInterval,
    staleTime: pollingInterval / 2,
  });

  useEffect(() => {
    if (data?.results) {
      const statuses: Record<string, HealthStatus> = {};
      for (const result of data.results) {
        statuses[result.appId] = result.status;
      }
      setHealthStatuses(statuses);
    }
  }, [data]);

  const refreshHealth = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    healthStatuses,
    isLoading,
    refreshHealth,
  };
}
