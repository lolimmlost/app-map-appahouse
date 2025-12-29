import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Container, Settings, ExternalLink, AlertCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getDockerContainers, getDockerInfo } from "@/lib/server/widget-proxy.server";
import { updateWidget } from "@/lib/server/widgets.server";
import type { Widget, WidgetConfig } from "@/types/database";
import type { Integration } from "@/types/database";

interface DockerWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: "small" | "medium" | "large" | "full") => void;
}

type DockerContainer = {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
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

type DockerInfo = {
  Containers: number;
  ContainersRunning: number;
  ContainersPaused: number;
  ContainersStopped: number;
  Images: number;
  Name: string;
  ServerVersion: string;
  OperatingSystem: string;
  Architecture: string;
  MemTotal: number;
  NCPU: number;
};

const stateColors: Record<string, string> = {
  running: "bg-green-500",
  paused: "bg-yellow-500",
  restarting: "bg-yellow-500",
  exited: "bg-red-500",
  dead: "bg-red-500",
  created: "bg-gray-400",
  removing: "bg-orange-500",
};


export function DockerWidget({ widget, onEdit, onDelete, onResize }: DockerWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showAllContainers = config.showAllContainers ?? true;
  const maxItems = config.maxItems ?? 10;
  const showHostInfo = config.showHostInfo ?? true;

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "Docker");
  const [formShowAllContainers, setFormShowAllContainers] = useState(showAllContainers);
  const [formMaxItems, setFormMaxItems] = useState(maxItems);
  const [formShowHostInfo, setFormShowHostInfo] = useState(showHostInfo);

  // Fetch containers
  const { data: containersData, isLoading: containersLoading, error: containersError, refetch: refetchContainers } = useQuery({
    queryKey: ["docker-containers", widget.id, integration?.id, showAllContainers],
    queryFn: async (): Promise<DockerContainer[]> => {
      if (!integration?.id) return [];
      const containers = await getDockerContainers({ data: { integrationId: integration.id, all: showAllContainers } });
      if (!Array.isArray(containers)) return [];
      return containers;
    },
    enabled: !!integration?.id,
    refetchInterval: (config.refreshInterval || 30) * 1000,
    staleTime: 10000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch Docker host info
  const { data: infoData, isLoading: infoLoading } = useQuery({
    queryKey: ["docker-info", widget.id, integration?.id],
    queryFn: async (): Promise<DockerInfo | null> => {
      if (!integration?.id || !showHostInfo) return null;
      const info = await getDockerInfo({ data: { integrationId: integration.id } });
      return info as DockerInfo;
    },
    enabled: !!integration?.id && showHostInfo,
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
      queryClient.invalidateQueries({ queryKey: ["docker-containers", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["docker-info", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      showAllContainers: formShowAllContainers,
      maxItems: formMaxItems,
      showHostInfo: formShowHostInfo,
    });
  };

  const isLoading = containersLoading || (showHostInfo && infoLoading);
  const containers = containersData || [];
  const dockerInfo = infoData;

  const handleRefresh = () => {
    refetchContainers();
  };

  const handleOpenDashboard = () => {
    if (integration?.url) {
      window.open(integration.url, "_blank");
    }
  };

  const getContainerName = (container: DockerContainer) => {
    if (container.Names && container.Names.length > 0) {
      // Docker names start with /
      return container.Names[0].replace(/^\//, "");
    }
    return container.Id.substring(0, 12);
  };

  const getImageName = (image: string) => {
    // Remove sha256 prefix if present
    if (image.startsWith("sha256:")) {
      return image.substring(7, 19);
    }
    // Split on : to get just the image name without tag
    const parts = image.split(":");
    const name = parts[0];
    // Get last part of path if it's a full registry path
    const nameParts = name.split("/");
    return nameParts[nameParts.length - 1];
  };

  const formatUptime = (created: number) => {
    const now = Date.now() / 1000;
    const diff = now - created;

    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const runningCount = containers.filter(c => c.State === "running").length;
  const stoppedCount = containers.filter(c => c.State !== "running").length;

  // Sort containers: running first, then by name
  const sortedContainers = [...containers]
    .sort((a, b) => {
      if (a.State === "running" && b.State !== "running") return -1;
      if (a.State !== "running" && b.State === "running") return 1;
      return getContainerName(a).localeCompare(getContainerName(b));
    })
    .slice(0, maxItems);

  if (!integration) {
    return (
      <WidgetContainer
        widget={widget}
        title={config.title || "Docker"}
        icon={<Container className="h-4 w-4" />}
        onEdit={onEdit}
        onDelete={onDelete}
        onResize={onResize}
      >
        <div className="text-sm text-muted-foreground text-center py-4">
          No Docker integration configured
        </div>
      </WidgetContainer>
    );
  }

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={config.title || "Docker"}
        icon={<Container className="h-4 w-4" />}
        isLoading={isLoading}
        onRefresh={handleRefresh}
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
              title="Open Docker"
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
        {containersError ? (
          <div className="text-sm text-destructive text-center py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to connect to Docker</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(containersError as Error)?.message || "Unknown error"}
            </p>
          </div>
        ) : isLoading && !containersData ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary stats */}
            {showHostInfo && dockerInfo && (
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {runningCount} running
                  </span>
                  {stoppedCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      {stoppedCount} stopped
                    </span>
                  )}
                </div>
                <span title={dockerInfo.OperatingSystem}>
                  {dockerInfo.Name}
                </span>
              </div>
            )}

            {/* Container list */}
            {sortedContainers.length > 0 ? (
              <div className="space-y-1.5">
                {sortedContainers.map((container) => (
                  <div
                    key={container.Id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md transition-colors",
                      container.State === "running" ? "bg-green-500/10" : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          stateColors[container.State] || "bg-gray-400"
                        )}
                        title={container.State}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {getContainerName(container)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{getImageName(container.Image)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {container.Ports && container.Ports.length > 0 && container.Ports[0].PublicPort && (
                        <Badge variant="outline" className="text-xs">
                          :{container.Ports[0].PublicPort}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatUptime(container.Created)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No containers found
              </div>
            )}

            {/* Show more indicator */}
            {containers.length > maxItems && (
              <div className="text-xs text-muted-foreground text-center">
                +{containers.length - maxItems} more containers
              </div>
            )}
          </div>
        )}
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Docker Settings</DialogTitle>
            <DialogDescription>
              Configure the Docker widget display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docker-title">Title</Label>
              <Input
                id="docker-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Docker"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="docker-max">Max Containers to Show</Label>
              <Input
                id="docker-max"
                type="number"
                min={1}
                max={50}
                value={formMaxItems}
                onChange={(e) => setFormMaxItems(parseInt(e.target.value) || 10)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="docker-all">Show All Containers</Label>
                <p className="text-sm text-muted-foreground">
                  Include stopped containers
                </p>
              </div>
              <Switch
                id="docker-all"
                checked={formShowAllContainers}
                onCheckedChange={setFormShowAllContainers}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="docker-info">Show Host Info</Label>
                <p className="text-sm text-muted-foreground">
                  Display Docker host summary
                </p>
              </div>
              <Switch
                id="docker-info"
                checked={formShowHostInfo}
                onCheckedChange={setFormShowHostInfo}
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
