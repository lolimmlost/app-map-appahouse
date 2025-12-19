import { useQuery } from "@tanstack/react-query";
import { Music, Download, Calendar, AlertCircle } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Badge } from "@/components/ui/badge";
import { getLidarrWanted, getLidarrQueue, getLidarrCalendar } from "@/lib/server/widget-proxy";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";

interface LidarrWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
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
  };
};

type LidarrQueueItem = {
  id: number;
  title: string;
  status: string;
  sizeleft: number;
  size: number;
  timeleft?: string;
  artist: { artistName: string };
  album?: { title: string };
};

type LidarrCalendarItem = {
  id: number;
  title: string;
  releaseDate: string;
  artist: { artistName: string };
};

export function LidarrWidget({ widget, onEdit, onDelete }: LidarrWidgetProps) {
  const config = widget.config || {};
  const integration = widget.integration;
  const showQueue = config.showQueue ?? true;
  const showCalendar = config.showCalendar ?? true;
  const maxItems = config.maxItems ?? 5;

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

  const isLoading = wantedLoading || queueLoading || calendarLoading;
  const wanted = wantedData?.records || [];
  const wantedCount = wantedData?.totalRecords || 0;
  const queue = queueData || [];
  const calendar = calendarData || [];

  const handleRefresh = () => {
    refetchWanted();
    if (showQueue) refetchQueue();
    if (showCalendar) refetchCalendar();
  };

  if (!integration) {
    return (
      <WidgetContainer
        widget={widget}
        title={config.title || "Lidarr"}
        icon={<Music className="h-4 w-4" />}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        <div className="text-sm text-muted-foreground text-center py-4">
          No Lidarr integration configured
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      widget={widget}
      title={config.title || "Lidarr"}
      icon={<Music className="h-4 w-4" />}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {isLoading && !wantedData && !queueData && !calendarData ? (
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
                      <span className="text-sm truncate block">{item.album?.title || item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.artist?.artistName}
                      </span>
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
          {wanted.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Wanted
              </div>
              {wanted.map((album: LidarrAlbum) => (
                <div
                  key={album.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{album.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {album.artist?.artistName}
                    </span>
                  </div>
                  {album.releaseDate && (
                    <Badge variant="outline">
                      {new Date(album.releaseDate).getFullYear()}
                    </Badge>
                  )}
                </div>
              ))}
              {wantedCount > maxItems && (
                <div className="text-xs text-muted-foreground text-center">
                  +{wantedCount - maxItems} more
                </div>
              )}
            </div>
          )}

          {/* Calendar */}
          {showCalendar && calendar.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Upcoming
              </div>
              {calendar.map((album) => {
                const releaseDate = new Date(album.releaseDate);
                const isToday = releaseDate.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={album.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">{album.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {album.artist?.artistName}
                      </span>
                    </div>
                    <Badge variant={isToday ? "default" : "secondary"}>
                      {isToday
                        ? "Today"
                        : releaseDate.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {wanted.length === 0 && queue.length === 0 && calendar.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              No albums to display
            </div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
