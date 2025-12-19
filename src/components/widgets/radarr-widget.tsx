import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Film, Download, Calendar, AlertCircle, Settings, ExternalLink } from "lucide-react";
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
import { getRadarrMovies, getRadarrQueue, getRadarrCalendar } from "@/lib/server/widget-proxy";
import { updateWidget } from "@/lib/server/widgets";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";

interface RadarrWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
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

export function RadarrWidget({ widget, onEdit, onDelete }: RadarrWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showQueue = config.showQueue ?? true;
  const showCalendar = config.showCalendar ?? true;
  const maxItems = config.maxItems ?? 5;

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "Radarr");
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
      queryClient.invalidateQueries({ queryKey: ["radarr-missing", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["radarr-queue", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["radarr-calendar", widget.id] });
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

  const isLoading = missingLoading || queueLoading || calendarLoading;
  const missing = missingData || [];
  const queue = queueData || [];
  const calendar = calendarData || [];

  const handleRefresh = () => {
    refetchMissing();
    if (showQueue) refetchQueue();
    if (showCalendar) refetchCalendar();
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
                  {missing.length} wanted
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
                      onClick={() => item.movie?.id && handleOpenMovie(item.movie.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate block font-medium">
                            {item.movie?.title || item.title}
                          </span>
                          {item.movie?.year && (
                            <span className="text-xs text-muted-foreground">
                              {item.movie.year}
                            </span>
                          )}
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

            {/* Wanted/Missing */}
            {missing.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Wanted
                </div>
                {missing.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleOpenMovie(movie.id)}
                  >
                    <span className="text-sm truncate flex-1 font-medium">{movie.title}</span>
                    <Badge variant="outline" className="ml-2">
                      {movie.year}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar */}
            {showCalendar && calendar.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Upcoming
                </div>
                {calendar.map((movie) => {
                  const releaseDate = movie.digitalRelease || movie.physicalRelease || movie.inCinemas;
                  const date = releaseDate ? new Date(releaseDate) : null;
                  const isToday = date?.toDateString() === new Date().toDateString();
                  const releaseType = movie.digitalRelease
                    ? "Digital"
                    : movie.physicalRelease
                    ? "Physical"
                    : "Cinema";
                  return (
                    <div
                      key={movie.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/80 transition-colors",
                        movie.hasFile ? "bg-green-500/10" : "bg-muted/50"
                      )}
                      onClick={() => handleOpenMovie(movie.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block font-medium">{movie.title}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{movie.year}</span>
                          <span>•</span>
                          <span>{releaseType}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {movie.hasFile && (
                          <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                            Downloaded
                          </Badge>
                        )}
                        {date && (
                          <Badge variant={isToday ? "default" : "secondary"}>
                            {isToday
                              ? "Today"
                              : date.toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {missing.length === 0 && queue.length === 0 && calendar.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                No movies to display
              </div>
            )}
          </div>
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
