import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Music, Download, Calendar, AlertCircle, Settings, ExternalLink } from "lucide-react";
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
import { getLidarrWanted, getLidarrQueue, getLidarrCalendar } from "@/lib/server/widget-proxy";
import { updateWidget } from "@/lib/server/widgets";
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

export function LidarrWidget({ widget, onEdit, onDelete }: LidarrWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showQueue = config.showQueue ?? true;
  const showCalendar = config.showCalendar ?? true;
  const maxItems = config.maxItems ?? 5;

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "Lidarr");
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
      queryClient.invalidateQueries({ queryKey: ["lidarr-wanted", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["lidarr-queue", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["lidarr-calendar", widget.id] });
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
                      onClick={() => item.album?.id ? handleOpenAlbum(item.album.id) : handleOpenArtist(item.artist.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate block font-medium">
                            {item.album?.title || item.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.artist?.artistName}
                          </span>
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
            {wanted.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Wanted
                </div>
                {wanted.map((album: LidarrAlbum) => (
                  <div
                    key={album.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleOpenAlbum(album.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block font-medium">{album.title}</span>
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
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/80 transition-colors",
                        album.grabbed ? "bg-green-500/10" : "bg-muted/50"
                      )}
                      onClick={() => handleOpenAlbum(album.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block font-medium">{album.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {album.artist?.artistName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {album.grabbed && (
                          <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                            Grabbed
                          </Badge>
                        )}
                        <Badge variant={isToday ? "default" : "secondary"}>
                          {isToday
                            ? "Today"
                            : releaseDate.toLocaleDateString(undefined, {
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

            {/* Empty state */}
            {wanted.length === 0 && queue.length === 0 && calendar.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                No albums to display
              </div>
            )}
          </div>
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
