import { useQuery } from "@tanstack/react-query";
import { Film, Download, Calendar, AlertCircle } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Badge } from "@/components/ui/badge";
import { getRadarrMovies, getRadarrQueue, getRadarrCalendar } from "@/lib/server/widget-proxy";
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
  movie?: { title: string; year: number };
};

type RadarrCalendarItem = {
  id: number;
  title: string;
  year: number;
  digitalRelease?: string;
  physicalRelease?: string;
  inCinemas?: string;
};

export function RadarrWidget({ widget, onEdit, onDelete }: RadarrWidgetProps) {
  const config = widget.config || {};
  const integration = widget.integration;
  const showQueue = config.showQueue ?? true;
  const showCalendar = config.showCalendar ?? true;
  const maxItems = config.maxItems ?? 5;

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
    <WidgetContainer
      widget={widget}
      title={config.title || "Radarr"}
      icon={<Film className="h-4 w-4" />}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onEdit={onEdit}
      onDelete={onDelete}
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
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">
                        {item.movie?.title || item.title}
                      </span>
                      {item.movie?.year && (
                        <span className="text-xs text-muted-foreground">
                          {item.movie.year}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {progress.toFixed(0)}%
                    </Badge>
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
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <span className="text-sm truncate flex-1">{movie.title}</span>
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
                return (
                  <div
                    key={movie.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <span className="text-sm truncate flex-1">{movie.title}</span>
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
  );
}
