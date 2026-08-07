import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Film, Download, Calendar, AlertCircle, Settings, ExternalLink, ChevronDown, ChevronUp, HardDrive, AlertTriangle, CheckCircle } from "lucide-react";
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
import { getRadarrMovies, getRadarrQueue, getRadarrCalendar, getRadarrDiskSpace, getRadarrHealth } from "@/lib/server/widget-proxy.server";
import { updateWidget } from "@/lib/server/widgets.server";
import type { Widget, WidgetConfig } from "@/types/database";
import type { Integration } from "@/types/database";

interface RadarrWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: "small" | "medium" | "large" | "full") => void;
}

type RadarrMovie = {
  id: number;
  title: string;
  year: number;
  monitored: boolean;
  hasFile: boolean;
};

type RadarrQueueItem = {
  id: number;
  title: string;
  status: string;
  sizeleft: number;
  size: number;
  timeleft?: string;
  quality?: { quality: { name: string } };
  movie?: { title: string; year: number; id: number };
};

type RadarrCalendarItem = {
  id: number;
  title: string;
  year: number;
  digitalRelease?: string;
  physicalRelease?: string;
  inCinemas?: string;
  hasFile?: boolean;
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

export function RadarrWidget({ widget, onEdit, onDelete, onResize }: RadarrWidgetProps) {
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
  const [formTitle, setFormTitle] = useState(config.title || "Radarr");
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
      queryClient.invalidateQueries({ queryKey: ["radarr-missing", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["radarr-queue", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["radarr-calendar", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["radarr-diskspace", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["radarr-health", widget.id] });
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

  // Fetch missing movies via server proxy
  const { data: missingData, isLoading: missingLoading, refetch: refetchMissing } = useQuery({
    queryKey: ["radarr-missing", widget.id, integration?.id],
    queryFn: async (): Promise<RadarrMovie[]> => {
      if (!integration?.id) return [];
      const movies: RadarrMovie[] = await getRadarrMovies({ data: { integrationId: integration.id } });
      return movies.filter((m) => m.monitored && !m.hasFile).slice(0, maxItems);
    },
    enabled: !!integration?.id,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch queue via server proxy
  const { data: queueData, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ["radarr-queue", widget.id, integration?.id],
    queryFn: async (): Promise<RadarrQueueItem[]> => {
      if (!integration?.id || !showQueue) return [];
      const data = await getRadarrQueue({ data: { integrationId: integration.id } });
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
    queryKey: ["radarr-calendar", widget.id, integration?.id],
    queryFn: async (): Promise<RadarrCalendarItem[]> => {
      if (!integration?.id || !showCalendar) return [];

      const start = new Date().toISOString().split("T")[0];
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const data = await getRadarrCalendar({ data: { integrationId: integration.id, start, end } });
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
    queryKey: ["radarr-diskspace", widget.id, integration?.id],
    queryFn: async (): Promise<DiskSpace[]> => {
      if (!integration?.id || !showDiskSpace) return [];
      return getRadarrDiskSpace({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id && showDiskSpace,
    refetchInterval: (config.refreshInterval || 300) * 1000,
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch health issues
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["radarr-health", widget.id, integration?.id],
    queryFn: async (): Promise<HealthIssue[]> => {
      if (!integration?.id || !showHealth) return [];
      return getRadarrHealth({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id && showHealth,
    refetchInterval: (config.refreshInterval || 300) * 1000,
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isLoading = missingLoading || queueLoading || calendarLoading || diskSpaceLoading || healthLoading;
  const missing = missingData || [];
  const queue = queueData || [];
  const calendar = calendarData || [];
  const diskSpace = diskSpaceData || [];
  const health = healthData || [];

  const handleRefresh = () => {
    refetchMissing();
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

  const handleOpenMovie = (movieId: number) => {
    if (integration?.url) {
      window.open(`${integration.url}/movie/${movieId}`, "_blank");
    }
  };

  if (!integration) {
    return (
      <WidgetContainer
        widget={widget}
        title={config.title || "Radarr"}
        icon={<Film className="h-4 w-4" />}
        onEdit={onEdit}
        onDelete={onDelete}
        onResize={onResize}
      >
        <div className="text-sm text-muted-foreground text-center py-4">
          No Radarr integration configured
        </div>
      </WidgetContainer>
    );
  }

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={config.title || "Radarr"}
        icon={<Film className="h-4 w-4" />}
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
              title="Open Radarr"
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
        {isLoading && !missingData && !queueData && !calendarData ? (
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <Collapsible open={expanded || defaultExpanded} onOpenChange={setExpanded}>
            {/* Compact Summary - Always Visible */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-warning" />
                  <span className="font-medium">{missing.length}</span> wanted
                </span>
                {showQueue && (
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3 text-info" />
                    <span className="font-medium">{queue.length}</span> queue
                  </span>
                )}
                {showCalendar && calendar.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{calendar.length}</span> upcoming
                  </span>
                )}
                {showHealth && (
                  <span className="flex items-center gap-1">
                    {health.length > 0 ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-warning" />
                        <span className="font-medium text-warning">{health.length}</span>
                      </>
                    ) : (
                      <CheckCircle className="h-3 w-3 text-success" />
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
                          onClick={() => item.movie?.id && handleOpenMovie(item.movie.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm truncate flex-1 font-medium">
                              {item.movie?.title || item.title}
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
                {missing.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Wanted
                    </div>
                    {missing.slice(0, isWide ? 5 : 3).map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center justify-between p-1.5 rounded-md bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors text-sm"
                        onClick={() => handleOpenMovie(movie.id)}
                      >
                        <span className="truncate flex-1">{movie.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">{movie.year}</span>
                      </div>
                    ))}
                    {missing.length > (isWide ? 5 : 3) && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{missing.length - (isWide ? 5 : 3)} more
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right column when wide: Calendar + Disk + Health */}
              <div className={cn(isWide ? "space-y-3" : "contents")}>

              {/* Calendar */}
              {showCalendar && calendar.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Upcoming
                  </div>
                  {calendar.slice(0, 3).map((movie) => {
                    const releaseDate = movie.digitalRelease || movie.physicalRelease || movie.inCinemas;
                    const date = releaseDate ? new Date(releaseDate) : null;
                    return (
                      <div
                        key={movie.id}
                        className={cn(
                          "flex items-center justify-between p-1.5 rounded-md cursor-pointer hover:bg-muted/80 transition-colors text-sm",
                          movie.hasFile ? "bg-success/10" : "bg-muted/50"
                        )}
                        onClick={() => handleOpenMovie(movie.id)}
                      >
                        <span className="truncate flex-1">{movie.title}</span>
                        {date && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
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
                            isLow ? "text-error" : isWarning ? "text-warning" : "text-muted-foreground"
                          )}>
                            {formatSize(disk.freeSpace)} free
                          </span>
                        </div>
                        <Progress
                          value={usedPercent}
                          className={cn(
                            "h-1.5",
                            isLow ? "[&>div]:bg-error" : isWarning ? "[&>div]:bg-warning" : ""
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
                        issue.type === "error" ? "bg-error/10" : "bg-warning/10"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={cn(
                          "h-3 w-3 mt-0.5 shrink-0",
                          issue.type === "error" ? "text-error" : "text-warning"
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
              {missing.length === 0 && queue.length === 0 && calendar.length === 0 && health.length === 0 && (
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
            <DialogTitle>Radarr Settings</DialogTitle>
            <DialogDescription>
              Configure the Radarr widget display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="radarr-title">Title</Label>
              <Input
                id="radarr-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Radarr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radarr-max">Max Items per Section</Label>
              <Input
                id="radarr-max"
                type="number"
                min={1}
                max={20}
                value={formMaxItems}
                onChange={(e) => setFormMaxItems(parseInt(e.target.value) || 5)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="radarr-queue">Show Queue</Label>
                <p className="text-sm text-muted-foreground">
                  Display downloading movies
                </p>
              </div>
              <Switch
                id="radarr-queue"
                checked={formShowQueue}
                onCheckedChange={setFormShowQueue}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="radarr-calendar">Show Calendar</Label>
                <p className="text-sm text-muted-foreground">
                  Display upcoming releases
                </p>
              </div>
              <Switch
                id="radarr-calendar"
                checked={formShowCalendar}
                onCheckedChange={setFormShowCalendar}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="radarr-diskspace">Show Disk Space</Label>
                <p className="text-sm text-muted-foreground">
                  Display storage usage
                </p>
              </div>
              <Switch
                id="radarr-diskspace"
                checked={formShowDiskSpace}
                onCheckedChange={setFormShowDiskSpace}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="radarr-health">Show Health</Label>
                <p className="text-sm text-muted-foreground">
                  Display system health issues
                </p>
              </div>
              <Switch
                id="radarr-health"
                checked={formShowHealth}
                onCheckedChange={setFormShowHealth}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="radarr-expanded">Expanded by Default</Label>
                <p className="text-sm text-muted-foreground">
                  Show details without clicking
                </p>
              </div>
              <Switch
                id="radarr-expanded"
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
