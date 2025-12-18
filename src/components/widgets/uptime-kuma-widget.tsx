import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";

interface UptimeKumaWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
}

type Monitor = {
  id: number;
  name: string;
  status: number; // 0 = down, 1 = up, 2 = pending
  uptime?: number;
};

type StatusPageData = {
  publicGroupList: Array<{
    name: string;
    monitorList: Monitor[];
  }>;
};

export function UptimeKumaWidget({ widget, onEdit, onDelete }: UptimeKumaWidgetProps) {
  const config = widget.config || {};
  const integration = widget.integration;
  const showOnlyDown = config.showOnlyDown ?? false;
  const maxItems = config.maxItems ?? 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["uptime-kuma", widget.id, integration?.id],
    queryFn: async (): Promise<StatusPageData | null> => {
      if (!integration?.url) return null;

      const slug = config.statusPageSlug || "default";
      const response = await fetch(`${integration.url}/api/status-page/${slug}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!integration?.url && !!integration?.id,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const allMonitors = data?.publicGroupList?.flatMap((group) => group.monitorList) || [];
  const filteredMonitors = showOnlyDown
    ? allMonitors.filter((m) => m.status !== 1)
    : allMonitors;
  const displayMonitors = filteredMonitors.slice(0, maxItems);

  const upCount = allMonitors.filter((m) => m.status === 1).length;
  const downCount = allMonitors.filter((m) => m.status === 0).length;
  const pendingCount = allMonitors.filter((m) => m.status === 2).length;

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 0:
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="outline" className="border-green-500 text-green-500">Up</Badge>;
      case 0:
        return <Badge variant="outline" className="border-red-500 text-red-500">Down</Badge>;
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
    }
  };

  if (!integration) {
    return (
      <WidgetContainer
        widget={widget}
        title={config.title || "Uptime Kuma"}
        icon={<Activity className="h-4 w-4" />}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        <div className="text-sm text-muted-foreground text-center py-4">
          No integration configured
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      widget={widget}
      title={config.title || "Uptime Kuma"}
      icon={<Activity className="h-4 w-4" />}
      isLoading={isLoading}
      onRefresh={() => refetch()}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {error ? (
        <div className="text-sm text-destructive text-center py-4">
          Failed to load status
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {upCount}
              </span>
              {downCount > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  {downCount}
                </span>
              )}
              {pendingCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-muted-foreground">
              {allMonitors.length} monitors
            </span>
          </div>

          {/* Monitor List */}
          {displayMonitors.length > 0 ? (
            <div className="space-y-1.5">
              {displayMonitors.map((monitor) => (
                <div
                  key={monitor.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md",
                    monitor.status === 0 && "bg-red-500/10",
                    monitor.status === 1 && "bg-muted/50",
                    monitor.status === 2 && "bg-yellow-500/10"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getStatusIcon(monitor.status)}
                    <span className="text-sm truncate">{monitor.name}</span>
                  </div>
                  {getStatusBadge(monitor.status)}
                </div>
              ))}
            </div>
          ) : showOnlyDown ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              All services operational
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-2">
              No monitors found
            </div>
          )}

          {filteredMonitors.length > maxItems && (
            <div className="text-xs text-muted-foreground text-center">
              +{filteredMonitors.length - maxItems} more
            </div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
