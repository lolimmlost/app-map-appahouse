import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tv, Download, Calendar, AlertCircle, Settings, ExternalLink } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getSonarrQueue, getSonarrCalendar, getSonarrWanted } from "@/lib/server/widget-proxy";
import { updateWidget } from "@/lib/server/widgets";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";

interface SonarrWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
}

type SonarrQueueItem = {
  id: number;
  title: string;
  status: string;
  sizeleft: number;
  size: number;
  timeleft?: string;
  quality?: { quality: { name: string } };
  series: { title: string; id: number };
  episode?: { title: string; seasonNumber: number; episodeNumber: number; id: number };
};

type SonarrCalendarItem = {
  id: number;
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  airDateUtc: string;
  series: { title: string; id: number };
  hasFile?: boolean;
};

export function SonarrWidget({ widget, onEdit, onDelete }: SonarrWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showQueue = config.showQueue ?? true;
  const showCalendar = config.showCalendar ?? true;
  const maxItems = config.maxItems ?? 5;

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "Sonarr");
  const [formShowQueue, setFormShowQueue] = useState(showQueue);
  const [formShowCalendar, setFormShowCalendar] = useState(showCalendar);
  const [formMaxItems, setFormMaxItems] = useState(maxItems);

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
      queryClient.invalidateQueries({ queryKey: ["sonarr-queue", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["sonarr-calendar", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["sonarr-wanted", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      showQueue: formShowQueue,
      showCalendar: formShowCalendar,
      maxItems: formMaxItems,
    });
  };

  // Fetch queue via server proxy
  const { data: queueData, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ["sonarr-queue", widget.id, integration?.id],
    queryFn: async (): Promise<SonarrQueueItem[]> => {
      if (!integration?.id || !showQueue) return [];
      const data = await getSonarrQueue({ data: { integrationId: integration.id } });
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
    queryKey: ["sonarr-calendar", widget.id, integration?.id],
    queryFn: async (): Promise<SonarrCalendarItem[]> => {
      if (!integration?.id || !showCalendar) return [];

      const start = new Date().toISOString().split("T")[0];
      const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const data = await getSonarrCalendar({ data: { integrationId: integration.id, start, end } });
      return (data || []).slice(0, maxItems);
    },
    enabled: !!integration?.id && showCalendar,
    refetchInterval: (config.refreshInterval || 300) * 1000,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch wanted/missing via server proxy
  const { data: wantedData, isLoading: wantedLoading, refetch: refetchWanted } = useQuery({
    queryKey: ["sonarr-wanted", widget.id, integration?.id],
    queryFn: async () => {
      if (!integration?.id) return { totalRecords: 0, records: [] };
      return getSonarrWanted({ data: { integrationId: integration.id, pageSize: maxItems } });
    },
    enabled: !!integration?.id,
    refetchInterval: (config.refreshInterval || 60) * 1000,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isLoading = queueLoading || calendarLoading || wantedLoading;
  const queue = queueData || [];
  const calendar = calendarData || [];
  const wanted = wantedData?.records || [];
  const wantedCount = wantedData?.totalRecords || 0;

  const handleRefresh = () => {
    if (showQueue) refetchQueue();
    if (showCalendar) refetchCalendar();
    refetchWanted();
  };

  const formatEpisode = (seasonNum: number, episodeNum: number) => {
    return `S${String(seasonNum).padStart(2, "0")}E${String(episodeNum).padStart(2, "0")}`;
  };

  const formatTimeLeft = (timeleft?: string) => {
    if (!timeleft) return null;
    // Format like "01:23:45" to "1h 23m"
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

  const handleOpenSeries = (seriesId: number) => {
    if (integration?.url) {
      window.open(`${integration.url}/series/${seriesId}`, "_blank");
    }
  };

  if (!integration) {
    return (
      <WidgetContainer
        widget={widget}
        title={config.title || "Sonarr"}
        icon={<Tv className="h-4 w-4" />}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        <div className="text-sm text-muted-foreground text-center py-4">
          No Sonarr integration configured
        </div>
      </WidgetContainer>
    );
  }

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={config.title || "Sonarr"}
        icon={<Tv className="h-4 w-4" />}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onEdit={onEdit}
        onDelete={onDelete}
        headerActions={
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleOpenDashboard}
              title="Open Sonarr"
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
        {isLoading && !queueData && !calendarData && !wantedData ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  {wantedCount} missing
                </span>
                {showQueue && queue.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3 text-blue-500" />
                    {queue.length} in queue
                  </span>
                )}
              </div>
            </div>

            {/* Queue */}
            {showQueue && queue.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Download className="h-3 w-3" /> Queue
                </div>
                {queue.map((item) => {
                  const progress = item.size > 0 ? ((item.size - item.sizeleft) / item.size) * 100 : 0;
                  const timeLeft = formatTimeLeft(item.timeleft);
                  const quality = item.quality?.quality?.name;
                  return (
                    <div
                      key={item.id}
                      className="p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleOpenSeries(item.series.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate block font-medium">{item.series?.title}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.episode && (
                              <span>{formatEpisode(item.episode.seasonNumber, item.episode.episodeNumber)}</span>
                            )}
                            {item.episode?.title && (
                              <span className="truncate">{item.episode.title}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {quality && (
                            <Badge variant="outline" className="text-xs">
                              {quality}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-fit">
                          <span>{progress.toFixed(0)}%</span>
                          {timeLeft && (
                            <span className="text-muted-foreground">• {timeLeft}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatSize(item.size - item.sizeleft)} / {formatSize(item.size)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Today's Episodes */}
            {showCalendar && calendar.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Upcoming
                </div>
                {calendar.map((ep) => {
                  const airDate = new Date(ep.airDateUtc);
                  const isToday = airDate.toDateString() === new Date().toDateString();
                  const isPast = airDate < new Date();
                  return (
                    <div
                      key={ep.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/80 transition-colors",
                        ep.hasFile ? "bg-green-500/10" : isPast ? "bg-yellow-500/10" : "bg-muted/50"
                      )}
                      onClick={() => handleOpenSeries(ep.series.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block font-medium">{ep.series?.title}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatEpisode(ep.seasonNumber, ep.episodeNumber)}</span>
                          <span className="truncate">{ep.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {ep.hasFile && (
                          <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                            Downloaded
                          </Badge>
                        )}
                        <Badge variant={isToday ? "default" : "secondary"}>
                          {isToday
                            ? airDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                            : airDate.toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Missing Episodes */}
            {wanted.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Missing
                </div>
                {wanted.slice(0, 3).map((ep: SonarrCalendarItem) => (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleOpenSeries(ep.series.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block font-medium">{ep.series?.title}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatEpisode(ep.seasonNumber, ep.episodeNumber)}</span>
                        {ep.title && <span className="truncate">{ep.title}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {wantedCount > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{wantedCount - 3} more
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {queue.length === 0 && calendar.length === 0 && wanted.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                No episodes to display
              </div>
            )}
          </div>
        )}
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sonarr Settings</DialogTitle>
            <DialogDescription>
              Configure the Sonarr widget display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sonarr-title">Title</Label>
              <Input
                id="sonarr-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Sonarr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sonarr-max">Max Items per Section</Label>
              <Input
                id="sonarr-max"
                type="number"
                min={1}
                max={20}
                value={formMaxItems}
                onChange={(e) => setFormMaxItems(parseInt(e.target.value) || 5)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sonarr-queue">Show Queue</Label>
                <p className="text-sm text-muted-foreground">
                  Display downloading episodes
                </p>
              </div>
              <Switch
                id="sonarr-queue"
                checked={formShowQueue}
                onCheckedChange={setFormShowQueue}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sonarr-calendar">Show Calendar</Label>
                <p className="text-sm text-muted-foreground">
                  Display upcoming episodes
                </p>
              </div>
              <Switch
                id="sonarr-calendar"
                checked={formShowCalendar}
                onCheckedChange={setFormShowCalendar}
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
