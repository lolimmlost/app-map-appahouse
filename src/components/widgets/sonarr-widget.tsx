import { useQuery } from "@tanstack/react-query";
import { Tv, Download, Calendar, AlertCircle } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Badge } from "@/components/ui/badge";
import { getSonarrQueue, getSonarrCalendar, getSonarrWanted } from "@/lib/server/widget-proxy";
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
  series: { title: string };
  episode?: { title: string; seasonNumber: number; episodeNumber: number };
};

type SonarrCalendarItem = {
  id: number;
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  airDateUtc: string;
  series: { title: string };
};

export function SonarrWidget({ widget, onEdit, onDelete }: SonarrWidgetProps) {
  const config = widget.config || {};
  const integration = widget.integration;
  const showQueue = config.showQueue ?? true;
  const showCalendar = config.showCalendar ?? true;
  const maxItems = config.maxItems ?? 5;

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
    <WidgetContainer
      widget={widget}
      title={config.title || "Sonarr"}
      icon={<Tv className="h-4 w-4" />}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onEdit={onEdit}
      onDelete={onDelete}
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
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">{item.series?.title}</span>
                      {item.episode && (
                        <span className="text-xs text-muted-foreground">
                          {formatEpisode(item.episode.seasonNumber, item.episode.episodeNumber)}
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

          {/* Today's Episodes */}
          {showCalendar && calendar.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Upcoming
              </div>
              {calendar.map((ep) => {
                const airDate = new Date(ep.airDateUtc);
                const isToday = airDate.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">{ep.series?.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatEpisode(ep.seasonNumber, ep.episodeNumber)} - {ep.title}
                      </span>
                    </div>
                    <Badge variant={isToday ? "default" : "secondary"}>
                      {isToday
                        ? "Today"
                        : airDate.toLocaleDateString(undefined, {
                            weekday: "short",
                          })}
                    </Badge>
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
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{ep.series?.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatEpisode(ep.seasonNumber, ep.episodeNumber)}
                    </span>
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
  );
}
