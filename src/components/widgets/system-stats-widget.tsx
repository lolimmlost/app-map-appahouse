import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cpu, HardDrive, MemoryStick, Settings, Server } from "lucide-react";
import { WidgetContainer } from "./widget-container";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getLocalSystemStats, getGlancesStats } from "@/lib/server/system-stats";
import { updateWidget } from "@/lib/server/widgets";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";
import type { SystemStats } from "@/lib/server/system-stats";

interface SystemStatsWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getUsageColor(usage: number): string {
  if (usage >= 90) return "bg-red-500";
  if (usage >= 75) return "bg-yellow-500";
  return "bg-green-500";
}

function getUsageTextColor(usage: number): string {
  if (usage >= 90) return "text-red-500";
  if (usage >= 75) return "text-yellow-500";
  return "text-green-500";
}

export function SystemStatsWidget({ widget, onEdit, onDelete }: SystemStatsWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const title = config.title || "System Stats";
  const showCpu = config.showCpu ?? true;
  const showRam = config.showRam ?? true;
  const showDisk = config.showDisk ?? true;
  const refreshInterval = config.refreshInterval ?? 10;

  // Settings form state
  const [formTitle, setFormTitle] = useState(title);
  const [formShowCpu, setFormShowCpu] = useState(showCpu);
  const [formShowRam, setFormShowRam] = useState(showRam);
  const [formShowDisk, setFormShowDisk] = useState(showDisk);
  const [formRefreshInterval, setFormRefreshInterval] = useState(refreshInterval);

  // Fetch system stats
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["system-stats", widget.id, integration?.id],
    queryFn: async (): Promise<SystemStats> => {
      if (integration?.url) {
        // Use Glances for remote stats
        return getGlancesStats({ data: { url: integration.url, apiKey: integration.apiKey || undefined } });
      }
      // Use local stats
      return getLocalSystemStats();
    },
    refetchInterval: refreshInterval * 1000,
    staleTime: 5000,
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
      queryClient.invalidateQueries({ queryKey: ["system-stats", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      showCpu: formShowCpu,
      showRam: formShowRam,
      showDisk: formShowDisk,
      refreshInterval: formRefreshInterval,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={title}
        icon={<Server className="h-4 w-4" />}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onEdit={onEdit}
        onDelete={onDelete}
        headerActions={
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-3 w-3" />
          </Button>
        }
      >
        {error ? (
          <div className="text-sm text-destructive text-center py-4">
            <p>Failed to get system stats</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(error as Error)?.message || "Unknown error"}
            </p>
          </div>
        ) : isLoading && !stats ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {/* Hostname */}
            {stats.hostname && (
              <div className="text-xs text-muted-foreground text-center -mt-1 -mb-2">
                {stats.hostname}
              </div>
            )}

            {/* CPU */}
            {showCpu && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span>CPU</span>
                    <span className="text-xs text-muted-foreground">
                      ({stats.cpu.cores} cores)
                    </span>
                  </div>
                  <span className={cn("font-medium", getUsageTextColor(stats.cpu.usage))}>
                    {stats.cpu.usage}%
                  </span>
                </div>
                <Progress
                  value={stats.cpu.usage}
                  className={cn("h-2", `[&>div]:${getUsageColor(stats.cpu.usage)}`)}
                />
              </div>
            )}

            {/* RAM */}
            {showRam && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                    <span>RAM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(stats.ram.used)} / {formatBytes(stats.ram.total)}
                    </span>
                    <span className={cn("font-medium", getUsageTextColor(stats.ram.usage))}>
                      {stats.ram.usage}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={stats.ram.usage}
                  className={cn("h-2", `[&>div]:${getUsageColor(stats.ram.usage)}`)}
                />
              </div>
            )}

            {/* Disks */}
            {showDisk && stats.disks.length > 0 && (
              <div className="space-y-3 pt-2 mt-2 border-t border-border/50">
                {stats.disks.map((disk, index) => (
                  <div key={disk.mount || index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[100px]" title={disk.mount}>
                          {disk.mount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(disk.used)} / {formatBytes(disk.total)}
                        </span>
                        <span className={cn("font-medium", getUsageTextColor(disk.usage))}>
                          {disk.usage}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={disk.usage}
                      className={cn("h-2", `[&>div]:${getUsageColor(disk.usage)}`)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* No stats to show */}
            {!showCpu && !showRam && !showDisk && (
              <div className="text-sm text-muted-foreground text-center py-2">
                No stats enabled. Open settings to configure.
              </div>
            )}
          </div>
        ) : null}
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>System Stats Settings</DialogTitle>
            <DialogDescription>
              Configure the system stats widget display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stats-title">Title</Label>
              <Input
                id="stats-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="System Stats"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stats-refresh">Refresh Interval (seconds)</Label>
              <Select
                value={formRefreshInterval.toString()}
                onValueChange={(v) => setFormRefreshInterval(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stats-cpu">Show CPU</Label>
                <p className="text-sm text-muted-foreground">
                  Display CPU usage percentage
                </p>
              </div>
              <Switch
                id="stats-cpu"
                checked={formShowCpu}
                onCheckedChange={setFormShowCpu}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stats-ram">Show RAM</Label>
                <p className="text-sm text-muted-foreground">
                  Display memory usage
                </p>
              </div>
              <Switch
                id="stats-ram"
                checked={formShowRam}
                onCheckedChange={setFormShowRam}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stats-disk">Show Disk</Label>
                <p className="text-sm text-muted-foreground">
                  Display disk usage for mounted volumes
                </p>
              </div>
              <Switch
                id="stats-disk"
                checked={formShowDisk}
                onCheckedChange={setFormShowDisk}
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
