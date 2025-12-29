import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Music, Download, Calendar, AlertCircle, Settings, ExternalLink, ChevronDown, ChevronUp, HardDrive, AlertTriangle, CheckCircle } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getLidarrWanted, getLidarrQueue, getLidarrCalendar, getLidarrDiskSpace, getLidarrHealth } from "@/lib/server/widget-proxy.server";
import { updateWidget } from "@/lib/server/widgets.server";
import type { Widget, WidgetConfig } from "@/types/database";
import type { Integration } from "@/types/database";

interface LidarrWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: "small" | "medium" | "large" | "full") => void;
}

type LidarrAlbum = {
  id: number;
  title: string;
  releaseDate?: string;
  monitored: boolean;
  statistics?: {
    trackFileCount: number;
    trackCount: number;
    percentOfTracks: number;
  };
  artist: {
    artistName: string;
    id: number;
  };
};

type LidarrQueueItem = {
  id: number;
  title: string;
  status: string;
  sizeleft: number;
  size: number;
  timeleft?: string;
  quality?: { quality: { name: string } };
  artist: { artistName: string; id: number };
  album?: { title: string; id: number };
};

type LidarrCalendarItem = {
  id: number;
  title: string;
  releaseDate: string;
  artist: { artistName: string; id: number };
  grabbed?: boolean;
};

type DiskSpace = {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
};

type HealthIssue = {
  source: string;
  type: string;
  message: string;
  wikiUrl?: string;
};

export function LidarrWidget({ widget, onEdit, onDelete, onResize }: LidarrWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showQueue = config.showQueue ?? true;
  const showCalendar = config.showCalendar ?? true;
  const showDiskSpace = config.showDiskSpace ?? true;
  const showHealth = config.showHealth ?? true;
  const maxItems = config.maxItems ?? 5;
  const defaultExpanded = config.defaultExpanded ?? false;
  const widgetSize = config.size || "small";
  const isWide = widgetSize === "medium" || widgetSize === "large" || widgetSize === "full";

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "Lidarr");
  const [formShowQueue, setFormShowQueue] = useState(showQueue);
  const [formShowCalendar, setFormShowCalendar] = useState(showCalendar);
  const [formShowDiskSpace, setFormShowDiskSpace] = useState(showDiskSpace);
  const [formShowHealth, setFormShowHealth] = useState(showHealth);
  const [formMaxItems, setFormMaxItems] = useState(maxItems);
  const [formDefaultExpanded, setFormDefaultExpanded] = useState(defaultExpanded);

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
      queryClient.invalidateQueries({ queryKey: ["lidarr-wanted", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["lidarr-queue", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["lidarr-calendar", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["lidarr-diskspace", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["lidarr-health", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      showQueue: formShowQueue,
      showCalendar: formShowCalendar,
      showDiskSpace: formShowDiskSpace,
      showHealth: formShowHealth,
      maxItems: formMaxItems,
      defaultExpanded: formDefaultExpanded,
    });
  };

  // Fetch wanted/missing albums via server proxy
  const { data: wantedData, isLoading: wantedLoading, refetch: refetchWanted } = useQuery({
    queryKey: ["lidarr-wanted", widget.id, integration?.id],
    queryFn: async () => {
      if (!integration?.id) return { totalRecords: 0, records: [] };
      return getLidarrWanted({ data: { integrationId: integration.id, pageSize: maxItems } });
    },
    enabled: !!integration?.id,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch queue via server proxy
  const { data: queueData, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ["lidarr-queue", widget.id, integration?.id],
    queryFn: async (): Promise<LidarrQueueItem[]> => {
      if (!integration?.id || !showQueue) return [];
      const data = await getLidarrQueue({ data: { integrationId: integration.id } });
      return (data.records || []).slice(0, maxItems);
    },
    enabled: !!integration?.id && showQueue,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch calendar via server proxy
  const { data: calendarData, isLoading: calendarLoading, refetch: refetchCalendar } = useQuery({
    queryKey: ["lidarr-calendar", widget.id, integration?.id],
    queryFn: async (): Promise<LidarrCalendarItem[]> => {
      if (!integration?.id || !showCalendar) return [];

      const start = new Date().toISOString().split("T")[0];
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const data = await getLidarrCalendar({ data: { integrationId: integration.id, start, end } });
      return (data || []).slice(0, maxItems);
    },
    enabled: !!integration?.id && showCalendar,
    refetchInterval: (config.refreshInterval || 300) * 1000,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch disk space
  const { data: diskSpaceData, isLoading: diskSpaceLoading, refetch: refetchDiskSpace } = useQuery({
    queryKey: ["lidarr-diskspace", widget.id, integration?.id],
    queryFn: async (): Promise<DiskSpace[]> => {
      if (!integration?.id || !showDiskSpace) return [];
      return getLidarrDiskSpace({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id && showDiskSpace,
    refetchInterval: (config.refreshInterval || 300) * 1000,
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch health issues
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["lidarr-health", widget.id, integration?.id],
    queryFn: async (): Promise<HealthIssue[]> => {
      if (!integration?.id || !showHealth) return [];
      return getLidarrHealth({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id && showHealth,
    refetchInterval: (config.refreshInterval || 300) * 1000,
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isLoading = wantedLoading || queueLoading || calendarLoading || diskSpaceLoading || healthLoading;
  const wanted = wantedData?.records || [];
  const wantedCount = wantedData?.totalRecords || 0;
  const queue = queueData || [];
  const calendar = calendarData || [];
  const diskSpace = diskSpaceData || [];
  const health = healthData || [];

  const handleRefresh = () => {
    refetchWanted();
    if (showQueue) refetchQueue();
    if (showCalendar) refetchCalendar();
    if (showDiskSpace) refetchDiskSpace();
    if (showHealth) refetchHealth();
  };

  const formatTimeLeft = (timeleft?: string) => {
    if (!timeleft) return null;
    const parts = timeleft.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    return timeleft;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleOpenDashboard = () => {
    if (integration?.url) {
      window.open(integration.url, "_blank");
    }
  };

  const handleOpenArtist = (artistId: number) => {
    if (integration?.url) {
      window.open(`${integration.url}/artist/${artistId}`, "_blank");
    }
  };

  const handleOpenAlbum = (albumId: number) => {
    if (integration?.url) {
      window.open(`${integration.url}/album/${albumId}`, "_blank");
    }
  };

  if (!integration) {
    return (
      <WidgetContainer
        widget={widget}
        title={config.title || "Lidarr"}
        icon={<Music className="h-4 w-4" />}
        onEdit={onEdit}
        onDelete={onDelete}
        onResize={onResize}
      >
        <div className="text-sm text-muted-foreground text-center py-4">
          No Lidarr integration configured
        </div>
      </WidgetContainer>
    );
  }

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={config.title || "Lidarr"}
        icon={<Music className="h-4 w-4" />}
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
              title="Open Lidarr"
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
        {isLoading && !wantedData && !queueData && !calendarData ? (
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <Collapsible open={expanded || defaultExpanded} onOpenChange={setExpanded}>
            {/* Compact Summary - Always Visible */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">{wantedCount}</span> wanted
                </span>
                {showQueue && (
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3 text-blue-500" />
                    <span className="font-medium">{queue.length}</span> queue
                  </span>
                )}
                {showCalendar && calendar.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-purple-500" />
                    <span className="font-medium">{calendar.length}</span> upcoming
                  </span>
                )}
                {showHealth && (
                  <span className="flex items-center gap-1">
                    {health.length > 0 ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="font-medium text-orange-500">{health.length}</span>
                      </>
                    ) : (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                  </span>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {expanded || defaultExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Expanded Details */}
            <CollapsibleContent className={cn(
              "pt-3",
              isWide ? "grid grid-cols-2 gap-4" : "space-y-3"
            )}>
              {/* Left column when wide: Queue + Wanted */}
              <div className={cn(isWide ? "space-y-3" : "contents")}>
                {/* Queue */}
                {showQueue && queue.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Download className="h-3 w-3" /> Queue
                    </div>
                    {queue.map((item) => {
                      const progress = item.size > 0 ? ((item.size - item.sizeleft) / item.size) * 100 : 0;
                      const timeLeft = formatTimeLeft(item.timeleft);
                      return (
                        <div
                          key={item.id}
                          className="p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => item.album?.id ? handleOpenAlbum(item.album.id) : handleOpenArtist(item.artist.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm truncate flex-1 font-medium">
                              {item.album?.title || item.title}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {progress.toFixed(0)}%{timeLeft && ` • ${timeLeft}`}
                            </span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Wanted/Missing */}
                {wanted.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Wanted
                    </div>
                    {wanted.slice(0, isWide ? 5 : 3).map((album: LidarrAlbum) => (
                      <div
                        key={album.id}
                        className="flex items-center justify-between p-1.5 rounded-md bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors text-sm"
                        onClick={() => handleOpenAlbum(album.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{album.title}</span>
                          <span className="text-xs text-muted-foreground truncate block">
                            {album.artist?.artistName}
                          </span>
                        </div>
                        {album.releaseDate && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(album.releaseDate).getFullYear()}
                          </span>
                        )}
                      </div>
                    ))}
                    {wantedCount > (isWide ? 5 : 3) && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{wantedCount - (isWide ? 5 : 3)} more
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right column when wide: Calendar + Disk Space + Health */}
              <div className={cn(isWide ? "space-y-3" : "contents")}>
                {/* Calendar */}
                {showCalendar && calendar.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Upcoming
                  </div>
                  {calendar.slice(0, 3).map((album) => {
                    const releaseDate = new Date(album.releaseDate);
                    const isToday = releaseDate.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={album.id}
                        className={cn(
                          "flex items-center justify-between p-1.5 rounded-md cursor-pointer hover:bg-muted/80 transition-colors text-sm",
                          album.grabbed ? "bg-green-500/10" : "bg-muted/50"
                        )}
                        onClick={() => handleOpenAlbum(album.id)}
                      >
                        <span className="truncate flex-1">{album.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {isToday
                            ? "Today"
                            : releaseDate.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disk Space */}
              {showDiskSpace && diskSpace.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> Disk Space
                  </div>
                  {diskSpace.map((disk, idx) => {
                    const usedSpace = disk.totalSpace - disk.freeSpace;
                    const usedPercent = disk.totalSpace > 0 ? (usedSpace / disk.totalSpace) * 100 : 0;
                    const isLow = usedPercent > 90;
                    const isWarning = usedPercent > 75;
                    return (
                      <div key={idx} className="p-2 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="truncate flex-1">{disk.label || disk.path}</span>
                          <span className={cn(
                            "text-xs",
                            isLow ? "text-red-500" : isWarning ? "text-yellow-500" : "text-muted-foreground"
                          )}>
                            {formatSize(disk.freeSpace)} free
                          </span>
                        </div>
                        <Progress
                          value={usedPercent}
                          className={cn(
                            "h-1.5",
                            isLow ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-yellow-500" : ""
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Health Issues */}
              {showHealth && health.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Health Issues
                  </div>
                  {health.slice(0, 3).map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-2 rounded-md text-sm",
                        issue.type === "error" ? "bg-red-500/10" : "bg-yellow-500/10"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={cn(
                          "h-3 w-3 mt-0.5 shrink-0",
                          issue.type === "error" ? "text-red-500" : "text-yellow-500"
                        )} />
                        <span className="text-xs">{issue.message}</span>
                      </div>
                    </div>
                  ))}
                  {health.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{health.length - 3} more issues
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* Empty state */}
              {wanted.length === 0 && queue.length === 0 && calendar.length === 0 && health.length === 0 && (
                <div className={cn("text-sm text-muted-foreground text-center py-2", isWide && "col-span-2")}>
                  All clear!
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lidarr Settings</DialogTitle>
            <DialogDescription>
              Configure the Lidarr widget display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lidarr-title">Title</Label>
              <Input
                id="lidarr-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Lidarr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lidarr-max">Max Items per Section</Label>
              <Input
                id="lidarr-max"
                type="number"
                min={1}
                max={20}
                value={formMaxItems}
                onChange={(e) => setFormMaxItems(parseInt(e.target.value) || 5)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lidarr-queue">Show Queue</Label>
                <p className="text-sm text-muted-foreground">
                  Display downloading albums
                </p>
              </div>
              <Switch
                id="lidarr-queue"
                checked={formShowQueue}
                onCheckedChange={setFormShowQueue}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lidarr-calendar">Show Calendar</Label>
                <p className="text-sm text-muted-foreground">
                  Display upcoming releases
                </p>
              </div>
              <Switch
                id="lidarr-calendar"
                checked={formShowCalendar}
                onCheckedChange={setFormShowCalendar}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lidarr-diskspace">Show Disk Space</Label>
                <p className="text-sm text-muted-foreground">
                  Display storage usage
                </p>
              </div>
              <Switch
                id="lidarr-diskspace"
                checked={formShowDiskSpace}
                onCheckedChange={setFormShowDiskSpace}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lidarr-health">Show Health</Label>
                <p className="text-sm text-muted-foreground">
                  Display system health issues
                </p>
              </div>
              <Switch
                id="lidarr-health"
                checked={formShowHealth}
                onCheckedChange={setFormShowHealth}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lidarr-expanded">Expanded by Default</Label>
                <p className="text-sm text-muted-foreground">
                  Show details without clicking
                </p>
              </div>
              <Switch
                id="lidarr-expanded"
                checked={formDefaultExpanded}
                onCheckedChange={setFormDefaultExpanded}
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
