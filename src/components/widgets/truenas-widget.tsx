import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Server,
  HardDrive,
  Database,
  Network,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  XCircle,
  Thermometer,
  Activity,
  Box,
} from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
import { cn } from "@/lib/utils";
import {
  getTrueNASPools,
  getTrueNASDisks,
  getTrueNASApps,
  getTrueNASSystemInfo,
  getTrueNASInterfaces,
  type TrueNASPool,
  type TrueNASApp,
} from "@/lib/server/widget-proxy.server";
import { updateWidget } from "@/lib/server/widgets.server";
import type { Widget, WidgetConfig } from "@/types/database";
import type { Integration } from "@/types/database";

interface TrueNASWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: "small" | "medium" | "large" | "full") => void;
}

type TrueNASSystemInfo = {
  version?: string;
  hostname?: string;
  uptime_seconds?: number;
  loadavg?: number[];
};

type TrueNASDisk = {
  identifier: string;
  name: string;
  serial: string;
  size: number;
  type: string;
  model?: string;
  rotationrate?: number | null;
  pool?: string | null;
  temperature?: number | null;
};

type TrueNASInterface = {
  id: string;
  name: string;
  state?: {
    name: string;
    link_state: "LINK_STATE_UP" | "LINK_STATE_DOWN";
    active_media_type?: string;
    aliases?: Array<{
      address: string;
      netmask: number;
      type: string;
    }>;
  };
};

export function TrueNASWidget({ widget, onEdit, onDelete, onResize }: TrueNASWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [poolsExpanded, setPoolsExpanded] = useState(true);
  const [disksExpanded, setDisksExpanded] = useState(false);
  const [appsExpanded, setAppsExpanded] = useState(false);
  const [networkExpanded, setNetworkExpanded] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showPools = config.showPools ?? true;
  const showDisks = config.showDisks ?? true;
  const showApps = config.showApps ?? true;
  const showNetworkInterfaces = config.showNetworkInterfaces ?? false;

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "TrueNAS");
  const [formShowPools, setFormShowPools] = useState(showPools);
  const [formShowDisks, setFormShowDisks] = useState(showDisks);
  const [formShowApps, setFormShowApps] = useState(showApps);
  const [formShowNetwork, setFormShowNetwork] = useState(showNetworkInterfaces);

  // Fetch pools
  const { data: pools, isLoading: poolsLoading } = useQuery({
    queryKey: ["truenas-pools", widget.id, integration?.id],
    queryFn: async () => {
      if (!integration?.id) return [];
      return getTrueNASPools({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id && showPools,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
  });

  // Fetch disks
  const { data: disks, isLoading: disksLoading } = useQuery({
    queryKey: ["truenas-disks", widget.id, integration?.id],
    queryFn: async (): Promise<TrueNASDisk[]> => {
      if (!integration?.id) return [];
      return getTrueNASDisks({ data: { integrationId: integration.id } }) as Promise<TrueNASDisk[]>;
    },
    enabled: !!integration?.id && showDisks,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
  });

  // Fetch apps
  const { data: apps, isLoading: appsLoading } = useQuery({
    queryKey: ["truenas-apps", widget.id, integration?.id],
    queryFn: async () => {
      if (!integration?.id) return [];
      return getTrueNASApps({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id && showApps,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
  });

  // Fetch system info
  const { data: systemInfo, isLoading: systemLoading } = useQuery({
    queryKey: ["truenas-system", widget.id, integration?.id],
    queryFn: async (): Promise<TrueNASSystemInfo | null> => {
      if (!integration?.id) return null;
      return getTrueNASSystemInfo({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
  });

  // Fetch network interfaces
  const { data: interfaces } = useQuery({
    queryKey: ["truenas-interfaces", widget.id, integration?.id],
    queryFn: async (): Promise<TrueNASInterface[]> => {
      if (!integration?.id) return [];
      return getTrueNASInterfaces({ data: { integrationId: integration.id } }) as Promise<TrueNASInterface[]>;
    },
    enabled: !!integration?.id && showNetworkInterfaces,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
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
      queryClient.invalidateQueries({ queryKey: ["truenas-pools", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["truenas-disks", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["truenas-apps", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["truenas-system", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["truenas-interfaces", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      showPools: formShowPools,
      showDisks: formShowDisks,
      showApps: formShowApps,
      showNetworkInterfaces: formShowNetwork,
    });
  };

  const handleOpenDashboard = () => {
    if (integration?.url) {
      window.open(integration.url, "_blank");
    }
  };

  const isLoading = poolsLoading || disksLoading || appsLoading || systemLoading;

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get pool status icon
  const getPoolStatusIcon = (pool: TrueNASPool) => {
    if (pool.status === "ONLINE" && pool.healthy) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (pool.status === "DEGRADED") {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  // Get app status badge
  const getAppStatusBadge = (state: TrueNASApp["state"]) => {
    switch (state) {
      case "RUNNING":
        return <Badge variant="outline" className="border-green-500 text-green-500 text-xs">Running</Badge>;
      case "STOPPED":
        return <Badge variant="outline" className="border-gray-500 text-gray-500 text-xs">Stopped</Badge>;
      case "DEPLOYING":
        return <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">Deploying</Badge>;
      case "CRASHED":
        return <Badge variant="outline" className="border-red-500 text-red-500 text-xs">Crashed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{state}</Badge>;
    }
  };

  if (!integration) {
    return (
      <WidgetContainer
        widget={widget}
        title={config.title || "TrueNAS"}
        icon={<Server className="h-4 w-4" />}
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
        title={config.title || "TrueNAS"}
        icon={<Server className="h-4 w-4" />}
        isLoading={isLoading}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ["truenas-pools", widget.id] });
          queryClient.invalidateQueries({ queryKey: ["truenas-disks", widget.id] });
          queryClient.invalidateQueries({ queryKey: ["truenas-apps", widget.id] });
          queryClient.invalidateQueries({ queryKey: ["truenas-system", widget.id] });
          queryClient.invalidateQueries({ queryKey: ["truenas-interfaces", widget.id] });
        }}
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
              title="Open TrueNAS"
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
        <div className="space-y-3">
          {/* System Summary */}
          {systemInfo && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {systemInfo.hostname || "TrueNAS"}
                </span>
              </div>
              {systemInfo.uptime_seconds !== undefined && (
                <span className="text-xs text-muted-foreground">
                  Up {formatUptime(systemInfo.uptime_seconds)}
                </span>
              )}
            </div>
          )}

          {/* Pools Section */}
          {showPools && pools && pools.length > 0 && (
            <Collapsible open={poolsExpanded} onOpenChange={setPoolsExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 rounded p-1 -m-1">
                <Database className="h-3 w-3" />
                <span className="text-xs font-medium flex-1 text-left">
                  Pools ({pools.length})
                </span>
                {pools.every((p) => p.status === "ONLINE" && p.healthy) ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : pools.some((p) => p.status !== "ONLINE" || !p.healthy) ? (
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                ) : null}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {pools.map((pool) => {
                  const usedPercent = pool.size && pool.allocated
                    ? (pool.allocated / pool.size) * 100
                    : 0;

                  return (
                    <div key={pool.id} className="p-2 rounded-md bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getPoolStatusIcon(pool)}
                          <span className="text-sm font-medium">{pool.name}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            pool.status === "ONLINE" && pool.healthy && "border-green-500 text-green-500",
                            pool.status === "DEGRADED" && "border-yellow-500 text-yellow-500",
                            (pool.status !== "ONLINE" && pool.status !== "DEGRADED") && "border-red-500 text-red-500"
                          )}
                        >
                          {pool.status}
                        </Badge>
                      </div>
                      {pool.size && pool.allocated !== undefined && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress
                            value={usedPercent}
                            className={cn(
                              "h-1.5 flex-1",
                              usedPercent >= 90 && "[&>div]:bg-red-500",
                              usedPercent >= 75 && usedPercent < 90 && "[&>div]:bg-yellow-500",
                              usedPercent < 75 && "[&>div]:bg-green-500"
                            )}
                          />
                          <span className="text-xs text-muted-foreground min-w-[70px] text-right">
                            {formatBytes(pool.allocated)} / {formatBytes(pool.size)}
                          </span>
                        </div>
                      )}
                      {pool.scan && pool.scan.function === "SCRUB" && pool.scan.state === "SCANNING" && (
                        <div className="mt-1 text-xs text-blue-500">
                          Scrub in progress: {pool.scan.percentage.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Disks Section */}
          {showDisks && disks && disks.length > 0 && (
            <Collapsible open={disksExpanded} onOpenChange={setDisksExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 rounded p-1 -m-1">
                <HardDrive className="h-3 w-3" />
                <span className="text-xs font-medium flex-1 text-left">
                  Disks ({disks.length})
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 pt-2">
                {disks.slice(0, 10).map((disk) => (
                  <div
                    key={disk.identifier}
                    className="flex items-center justify-between p-1.5 rounded bg-muted/30 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <HardDrive className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{disk.name}</span>
                      {disk.model && (
                        <span className="text-muted-foreground truncate">
                          ({disk.model})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {disk.temperature !== null && disk.temperature !== undefined && (
                        <span
                          className={cn(
                            "flex items-center gap-0.5",
                            disk.temperature >= 50 && "text-red-500",
                            disk.temperature >= 40 && disk.temperature < 50 && "text-yellow-500",
                            disk.temperature < 40 && "text-muted-foreground"
                          )}
                        >
                          <Thermometer className="h-3 w-3" />
                          {disk.temperature}°C
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {formatBytes(disk.size)}
                      </span>
                    </div>
                  </div>
                ))}
                {disks.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{disks.length - 10} more
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Apps Section */}
          {showApps && apps && apps.length > 0 && (
            <Collapsible open={appsExpanded} onOpenChange={setAppsExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 rounded p-1 -m-1">
                <Box className="h-3 w-3" />
                <span className="text-xs font-medium flex-1 text-left">
                  Apps ({apps.length})
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-green-500">
                    {apps.filter((a) => a.state === "RUNNING").length}
                  </span>
                  {apps.some((a) => a.state === "CRASHED") && (
                    <span className="text-xs text-red-500">
                      / {apps.filter((a) => a.state === "CRASHED").length} crashed
                    </span>
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 pt-2">
                {apps.slice(0, 10).map((app) => (
                  <div
                    key={app.id}
                    className={cn(
                      "flex items-center justify-between p-1.5 rounded text-xs",
                      app.state === "RUNNING" && "bg-muted/30",
                      app.state === "CRASHED" && "bg-red-500/10",
                      app.state === "STOPPED" && "bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Box className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{app.name}</span>
                    </div>
                    {getAppStatusBadge(app.state)}
                  </div>
                ))}
                {apps.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{apps.length - 10} more
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Network Section */}
          {showNetworkInterfaces && interfaces && interfaces.length > 0 && (
            <Collapsible open={networkExpanded} onOpenChange={setNetworkExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 rounded p-1 -m-1">
                <Network className="h-3 w-3" />
                <span className="text-xs font-medium flex-1 text-left">
                  Network ({interfaces.length})
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 pt-2">
                {interfaces.map((iface) => (
                  <div
                    key={iface.id}
                    className="flex items-center justify-between p-1.5 rounded bg-muted/30 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Network className="h-3 w-3 text-muted-foreground" />
                      <span>{iface.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {iface.state?.aliases?.[0]?.address && (
                        <span className="text-muted-foreground">
                          {iface.state.aliases[0].address}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          iface.state?.link_state === "LINK_STATE_UP"
                            ? "border-green-500 text-green-500"
                            : "border-gray-500 text-gray-500"
                        )}
                      >
                        {iface.state?.link_state === "LINK_STATE_UP" ? "Up" : "Down"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>TrueNAS Settings</DialogTitle>
            <DialogDescription>
              Configure the TrueNAS widget display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="truenas-title">Title</Label>
              <Input
                id="truenas-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="TrueNAS"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="truenas-pools">Show Pools</Label>
                <p className="text-sm text-muted-foreground">
                  Display ZFS pool status and usage
                </p>
              </div>
              <Switch
                id="truenas-pools"
                checked={formShowPools}
                onCheckedChange={setFormShowPools}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="truenas-disks">Show Disks</Label>
                <p className="text-sm text-muted-foreground">
                  Display disk information and temperatures
                </p>
              </div>
              <Switch
                id="truenas-disks"
                checked={formShowDisks}
                onCheckedChange={setFormShowDisks}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="truenas-apps">Show Apps</Label>
                <p className="text-sm text-muted-foreground">
                  Display installed application status
                </p>
              </div>
              <Switch
                id="truenas-apps"
                checked={formShowApps}
                onCheckedChange={setFormShowApps}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="truenas-network">Show Network</Label>
                <p className="text-sm text-muted-foreground">
                  Display network interface status
                </p>
              </div>
              <Switch
                id="truenas-network"
                checked={formShowNetwork}
                onCheckedChange={setFormShowNetwork}
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
