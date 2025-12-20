import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, CheckCircle, XCircle, AlertCircle, Settings, ExternalLink, Clock, AlertTriangle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getUptimeKumaStatus } from "@/lib/server/widget-proxy";
import { updateWidget } from "@/lib/server/widgets";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";

interface UptimeKumaWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: "small" | "medium" | "large" | "full") => void;
}

type Heartbeat = {
  status: number;
  ping?: number | null;
  time?: string;
};

type Incident = {
  time: string;
  type: "down" | "recovered";
};

type Monitor = {
  id: number;
  name: string;
  status: number; // 0 = down, 1 = up, 2 = pending, 3 = maintenance
  uptime?: number;
  ping?: number | null;
  avgPing?: number | null;
  recentHeartbeats?: Heartbeat[];
  incidents?: Incident[];
};

type StatusPageData = {
  publicGroupList: Array<{
    name: string;
    monitorList: Monitor[];
  }>;
};

export function UptimeKumaWidget({ widget, onEdit, onDelete, onResize }: UptimeKumaWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monitorsExpanded, setMonitorsExpanded] = useState(true);
  const [incidentsExpanded, setIncidentsExpanded] = useState(true);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showOnlyDown = config.showOnlyDown ?? false;
  const showHeartbeatGraph = config.showHeartbeatGraph ?? true;
  const showIncidents = config.showIncidents ?? true;
  const showResponseTime = config.showResponseTime ?? true;
  const maxItems = config.maxItems ?? 10;
  const statusPageSlug = config.statusPageSlug || "default";
  const widgetSize = config.size || "small";

  // Display mode: "detailed" (full info), "compact" (just icons/names), "auto" (based on size)
  const displayMode = config.displayMode || "auto";

  // Determine actual display based on mode and size
  const isCompact = displayMode === "compact" || (displayMode === "auto" && widgetSize === "small");
  const isWide = widgetSize === "medium" || widgetSize === "large" || widgetSize === "full";

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "Uptime Kuma");
  const [formSlug, setFormSlug] = useState(statusPageSlug);
  const [formShowOnlyDown, setFormShowOnlyDown] = useState(showOnlyDown);
  const [formShowHeartbeatGraph, setFormShowHeartbeatGraph] = useState(showHeartbeatGraph);
  const [formShowIncidents, setFormShowIncidents] = useState(showIncidents);
  const [formShowResponseTime, setFormShowResponseTime] = useState(showResponseTime);
  const [formMaxItems, setFormMaxItems] = useState(maxItems);
  const [formDisplayMode, setFormDisplayMode] = useState<"auto" | "detailed" | "compact">(displayMode);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["uptime-kuma", widget.id, integration?.id, statusPageSlug],
    queryFn: async (): Promise<StatusPageData | null> => {
      if (!integration?.id) return null;
      return getUptimeKumaStatus({
        data: {
          integrationId: integration.id,
          statusPageSlug,
        },
      });
    },
    enabled: !!integration?.id,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: (newConfig: WidgetConfig) =>
      updateWidget({
        data: {
          id: widget.id,
          config: newConfig,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      queryClient.invalidateQueries({ queryKey: ["uptime-kuma", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      statusPageSlug: formSlug,
      showOnlyDown: formShowOnlyDown,
      showHeartbeatGraph: formShowHeartbeatGraph,
      showIncidents: formShowIncidents,
      showResponseTime: formShowResponseTime,
      maxItems: formMaxItems,
      displayMode: formDisplayMode,
    });
  };

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
      case 3:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="outline" className="border-green-500 text-green-500 text-xs">Up</Badge>;
      case 0:
        return <Badge variant="outline" className="border-red-500 text-red-500 text-xs">Down</Badge>;
      case 3:
        return <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">Maint</Badge>;
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">Pending</Badge>;
    }
  };

  // Heartbeat graph component - shows mini colored blocks for recent status
  const HeartbeatGraph = ({ heartbeats }: { heartbeats: Heartbeat[] }) => {
    if (!heartbeats || heartbeats.length === 0) return null;

    return (
      <div className="flex items-center gap-px h-4 flex-1" title="Recent heartbeats">
        {heartbeats.map((hb, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-full rounded-[2px] min-w-[3px] max-w-[6px] transition-all",
              hb.status === 1 && "bg-green-500",
              hb.status === 0 && "bg-red-500",
              hb.status === 2 && "bg-yellow-500",
              hb.status === 3 && "bg-blue-500"
            )}
            title={`${hb.status === 1 ? "Up" : hb.status === 0 ? "Down" : "Pending"}${hb.ping ? ` - ${hb.ping}ms` : ""}`}
          />
        ))}
      </div>
    );
  };

  // Format relative time for incidents
  const formatIncidentTime = (timeStr: string) => {
    const time = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Collect all incidents from all monitors
  const allIncidents = allMonitors
    .flatMap((m) => (m.incidents || []).map((inc) => ({ ...inc, monitorName: m.name })))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  const handleOpenDashboard = () => {
    if (integration?.url) {
      window.open(integration.url, "_blank");
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
        onResize={onResize}
      >
        <div className="text-sm text-muted-foreground text-center py-4">
          No integration configured
        </div>
      </WidgetContainer>
    );
  }

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={config.title || "Uptime Kuma"}
        icon={<Activity className="h-4 w-4" />}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onEdit={onEdit}
        onDelete={onDelete}
        onResize={onResize}
        headerActions={
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleOpenDashboard}
              title="Open Uptime Kuma"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        }
      >
        {error ? (
          <div className="text-sm text-destructive text-center py-4">
            Failed to load status. Check status page slug.
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
            <Collapsible open={monitorsExpanded} onOpenChange={setMonitorsExpanded}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Monitors</span>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {monitorsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                {displayMonitors.length > 0 ? (
                  <div className={cn(
                    "mt-2",
                    // Use grid layout when wide, single column when narrow
                    isWide ? "grid grid-cols-2 gap-2" : "space-y-1.5",
                    // Compact mode uses tighter grid
                    isCompact && isWide && "grid-cols-3 gap-1.5"
                  )}>
                    {displayMonitors.map((monitor) => (
                      <div
                        key={monitor.id}
                        className={cn(
                          "rounded-md",
                          isCompact ? "p-1.5" : "p-2",
                          monitor.status === 0 && "bg-red-500/10",
                          monitor.status === 1 && "bg-muted/50",
                          monitor.status === 2 && "bg-yellow-500/10",
                          monitor.status === 3 && "bg-blue-500/10"
                        )}
                      >
                        {isCompact ? (
                          // Compact mode: just icon and name
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(monitor.status)}
                            <span className="text-xs truncate font-medium">{monitor.name}</span>
                          </div>
                        ) : (
                          // Detailed mode
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getStatusIcon(monitor.status)}
                                <span className="text-sm truncate font-medium">{monitor.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {showResponseTime && monitor.ping !== null && monitor.ping !== undefined && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1" title={monitor.avgPing ? `Avg: ${monitor.avgPing}ms` : undefined}>
                                    <Clock className="h-3 w-3" />
                                    {monitor.ping}ms
                                  </span>
                                )}
                                {getStatusBadge(monitor.status)}
                              </div>
                            </div>
                            {/* Heartbeat Graph with Uptime */}
                            {showHeartbeatGraph && monitor.recentHeartbeats && monitor.recentHeartbeats.length > 0 && (
                              <div className="mt-1.5 flex items-center gap-2">
                                <HeartbeatGraph heartbeats={monitor.recentHeartbeats} />
                                {monitor.uptime !== undefined && monitor.uptime > 0 && (
                                  <span
                                    className={cn(
                                      "text-xs font-medium min-w-[45px] text-right",
                                      monitor.uptime >= 99 && "text-green-500",
                                      monitor.uptime >= 95 && monitor.uptime < 99 && "text-yellow-500",
                                      monitor.uptime < 95 && "text-red-500"
                                    )}
                                  >
                                    {monitor.uptime.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Show uptime percentage without heartbeats if graph disabled but uptime exists */}
                            {!showHeartbeatGraph && monitor.uptime !== undefined && monitor.uptime > 0 && (
                              <div className="mt-1.5 flex items-center justify-end">
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    monitor.uptime >= 99 && "text-green-500",
                                    monitor.uptime >= 95 && monitor.uptime < 99 && "text-yellow-500",
                                    monitor.uptime < 95 && "text-red-500"
                                  )}
                                >
                                  {monitor.uptime.toFixed(1)}% uptime
                                </span>
                              </div>
                            )}
                          </>
                        )}
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
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    +{filteredMonitors.length - maxItems} more
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Recent Incidents */}
            {showIncidents && allIncidents.length > 0 && (
              <Collapsible open={incidentsExpanded} onOpenChange={setIncidentsExpanded}>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-medium">Recent Incidents</span>
                      <Badge variant="outline" className="text-xs h-4 px-1">{allIncidents.length}</Badge>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {incidentsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className={cn(
                      "space-y-1 mt-2",
                      isWide && "grid grid-cols-2 gap-x-4 gap-y-1 space-y-0"
                    )}>
                      {allIncidents.map((incident, i) => (
                        <div
                          key={`${incident.monitorName}-${incident.time}-${i}`}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {incident.type === "down" ? (
                              <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                            ) : (
                              <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
                            )}
                            <span className="truncate text-muted-foreground">
                              {incident.monitorName}
                            </span>
                          </div>
                          <span className="text-muted-foreground/70 shrink-0">
                            {formatIncidentTime(incident.time)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}
          </div>
        )}
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uptime Kuma Settings</DialogTitle>
            <DialogDescription>
              Configure the status page display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="uk-title">Title</Label>
              <Input
                id="uk-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Uptime Kuma"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uk-slug">Status Page Slug</Label>
              <Input
                id="uk-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="default"
              />
              <p className="text-xs text-muted-foreground">
                The slug from your Uptime Kuma status page URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uk-max">Max Items</Label>
              <Input
                id="uk-max"
                type="number"
                min={1}
                max={50}
                value={formMaxItems}
                onChange={(e) => setFormMaxItems(parseInt(e.target.value) || 10)}
              />
            </div>

            <div className="space-y-2">
              <Label>Display Mode</Label>
              <Select value={formDisplayMode} onValueChange={(v) => setFormDisplayMode(v as "auto" | "detailed" | "compact")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (adapts to size)</SelectItem>
                  <SelectItem value="detailed">Detailed (full info)</SelectItem>
                  <SelectItem value="compact">Compact (icons only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Auto: compact when small, detailed when larger
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="uk-down-only">Show Only Down</Label>
                <p className="text-sm text-muted-foreground">
                  Only display services that are down
                </p>
              </div>
              <Switch
                id="uk-down-only"
                checked={formShowOnlyDown}
                onCheckedChange={setFormShowOnlyDown}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="uk-heartbeat">Heartbeat Graph</Label>
                <p className="text-sm text-muted-foreground">
                  Show visual status history per monitor
                </p>
              </div>
              <Switch
                id="uk-heartbeat"
                checked={formShowHeartbeatGraph}
                onCheckedChange={setFormShowHeartbeatGraph}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="uk-incidents">Recent Incidents</Label>
                <p className="text-sm text-muted-foreground">
                  Show recent down/recovery events
                </p>
              </div>
              <Switch
                id="uk-incidents"
                checked={formShowIncidents}
                onCheckedChange={setFormShowIncidents}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="uk-response">Response Time</Label>
                <p className="text-sm text-muted-foreground">
                  Display ping times for each monitor
                </p>
              </div>
              <Switch
                id="uk-response"
                checked={formShowResponseTime}
                onCheckedChange={setFormShowResponseTime}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
