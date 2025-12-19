import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Clock, Film, Tv, Music, User, Settings, ExternalLink, Pause } from "lucide-react";
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
import { getJellyfinSessions, getJellyfinLatest } from "@/lib/server/widget-proxy";
import { updateWidget } from "@/lib/server/widgets";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";

interface JellyfinWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
}

type JellyfinSession = {
  Id: string;
  UserName: string;
  Client: string;
  DeviceName: string;
  NowPlayingItem?: {
    Id: string;
    Name: string;
    Type: string;
    SeriesName?: string;
    ParentIndexNumber?: number;
    IndexNumber?: number;
    RunTimeTicks?: number;
  };
  PlayState?: {
    IsPaused: boolean;
    PositionTicks?: number;
  };
};

type JellyfinItem = {
  Id: string;
  Name: string;
  Type: string;
  SeriesName?: string;
  ParentIndexNumber?: number;
  IndexNumber?: number;
  DateCreated?: string;
  ProductionYear?: number;
};

export function JellyfinWidget({ widget, onEdit, onDelete }: JellyfinWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showNowPlaying = config.showNowPlaying ?? true;
  const showRecentlyAdded = config.showRecentlyAdded ?? true;
  const maxItems = config.maxItems ?? 5;

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "Jellyfin");
  const [formShowNowPlaying, setFormShowNowPlaying] = useState(showNowPlaying);
  const [formShowRecentlyAdded, setFormShowRecentlyAdded] = useState(showRecentlyAdded);
  const [formMaxItems, setFormMaxItems] = useState(maxItems);

  // Fetch active sessions (now playing) via server proxy
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery({
    queryKey: ["jellyfin-sessions", widget.id, integration?.id],
    queryFn: async (): Promise<JellyfinSession[]> => {
      if (!integration?.id || !showNowPlaying) return [];
      const sessions: JellyfinSession[] = await getJellyfinSessions({ data: { integrationId: integration.id } });
      // Filter to only sessions with something playing (check both null and undefined)
      if (!Array.isArray(sessions)) return [];
      return sessions.filter((s) => s.NowPlayingItem && s.NowPlayingItem.Name);
    },
    enabled: !!integration?.id && showNowPlaying,
    refetchInterval: (config.refreshInterval || 15) * 1000,
    staleTime: 5000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch recently added items via server proxy
  const { data: recentData, isLoading: recentLoading, error: recentError, refetch: refetchRecent } = useQuery({
    queryKey: ["jellyfin-recent", widget.id, integration?.id],
    queryFn: async (): Promise<JellyfinItem[]> => {
      if (!integration?.id || !showRecentlyAdded) return [];
      const items = await getJellyfinLatest({ data: { integrationId: integration.id, limit: maxItems } });
      if (!Array.isArray(items)) return [];
      return items;
    },
    enabled: !!integration?.id && showRecentlyAdded,
    refetchInterval: (config.refreshInterval || 120) * 1000,
    staleTime: 60000,
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
      queryClient.invalidateQueries({ queryKey: ["jellyfin-sessions", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["jellyfin-recent", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      showNowPlaying: formShowNowPlaying,
      showRecentlyAdded: formShowRecentlyAdded,
      maxItems: formMaxItems,
    });
  };

  const isLoading = sessionsLoading || recentLoading;
  const sessions = sessionsData || [];
  const recentItems = recentData || [];

  const handleRefresh = () => {
    if (showNowPlaying) refetchSessions();
    if (showRecentlyAdded) refetchRecent();
  };

  const handleOpenDashboard = () => {
    if (integration?.url) {
      window.open(integration.url, "_blank");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Movie":
        return <Film className="h-3 w-3" />;
      case "Episode":
      case "Series":
        return <Tv className="h-3 w-3" />;
      case "Audio":
      case "MusicAlbum":
        return <Music className="h-3 w-3" />;
      default:
        return <Play className="h-3 w-3" />;
    }
  };

  const formatEpisode = (seasonNum?: number, episodeNum?: number) => {
    if (!seasonNum && !episodeNum) return "";
    return `S${String(seasonNum || 0).padStart(2, "0")}E${String(episodeNum || 0).padStart(2, "0")}`;
  };

  const formatTime = (ticks?: number) => {
    if (!ticks) return "";
    const seconds = Math.floor(ticks / 10000000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  const getProgress = (position?: number, runtime?: number) => {
    if (!position || !runtime) return 0;
    return Math.round((position / runtime) * 100);
  };

  const getItemTitle = (item: JellyfinItem | JellyfinSession["NowPlayingItem"]) => {
    if (!item) return "";
    if (item.Type === "Episode" && item.SeriesName) {
      const epNum = formatEpisode(item.ParentIndexNumber, item.IndexNumber);
      return (
        <>
          <span className="truncate block font-medium">{item.SeriesName}</span>
          <span className="text-xs text-muted-foreground">
            {epNum} - {item.Name}
          </span>
        </>
      );
    }
    return <span className="truncate block font-medium">{item.Name}</span>;
  };

  if (!integration) {
    return (
      <WidgetContainer
        widget={widget}
        title={config.title || "Jellyfin"}
        icon={<Play className="h-4 w-4" />}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        <div className="text-sm text-muted-foreground text-center py-4">
          No Jellyfin integration configured
        </div>
      </WidgetContainer>
    );
  }

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={config.title || "Jellyfin"}
        icon={<Play className="h-4 w-4" />}
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
              title="Open Jellyfin"
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
        {(sessionsError || recentError) ? (
          <div className="text-sm text-destructive text-center py-4">
            <p>Failed to connect to Jellyfin</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(sessionsError as Error)?.message || (recentError as Error)?.message || "Unknown error"}
            </p>
          </div>
        ) : isLoading && !sessionsData && !recentData ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Now Playing */}
            {showNowPlaying && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Play className="h-3 w-3" /> Now Playing
                </div>
                {sessions.length > 0 ? (
                  sessions.map((session) => {
                    const progress = getProgress(
                      session.PlayState?.PositionTicks,
                      session.NowPlayingItem?.RunTimeTicks
                    );
                    return (
                      <div
                        key={session.Id}
                        className={cn(
                          "p-2 rounded-md",
                          session.PlayState?.IsPaused ? "bg-yellow-500/10" : "bg-green-500/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="mt-0.5">
                              {session.PlayState?.IsPaused ? (
                                <Pause className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Play className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-sm">
                              {getItemTitle(session.NowPlayingItem)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {session.NowPlayingItem && getTypeIcon(session.NowPlayingItem.Type)}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {session.UserName}
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            value={progress}
                            className={cn(
                              "h-1.5 flex-1",
                              session.PlayState?.IsPaused
                                ? "[&>div]:bg-yellow-500"
                                : "[&>div]:bg-green-500"
                            )}
                          />
                          <span className="text-xs text-muted-foreground min-w-[80px] text-right">
                            {formatTime(session.PlayState?.PositionTicks)} / {formatTime(session.NowPlayingItem?.RunTimeTicks)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Nothing playing
                  </div>
                )}
              </div>
            )}

            {/* Recently Added */}
            {showRecentlyAdded && recentItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Recently Added
                </div>
                {recentItems.map((item) => {
                  const addedDate = item.DateCreated
                    ? new Date(item.DateCreated)
                    : null;
                  const isToday = addedDate?.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={item.Id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => {
                        if (integration?.url) {
                          window.open(`${integration.url}/web/index.html#!/details?id=${item.Id}`, "_blank");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getTypeIcon(item.Type)}
                        <div className="flex-1 min-w-0 text-sm">{getItemTitle(item)}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {item.ProductionYear && (
                          <span className="text-xs text-muted-foreground">{item.ProductionYear}</span>
                        )}
                        {addedDate && (
                          <Badge variant="outline" className="text-xs">
                            {isToday
                              ? "Today"
                              : addedDate.toLocaleDateString(undefined, {
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
            {sessions.length === 0 && recentItems.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                No activity to display
              </div>
            )}
          </div>
        )}
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jellyfin Settings</DialogTitle>
            <DialogDescription>
              Configure the Jellyfin widget display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="jf-title">Title</Label>
              <Input
                id="jf-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Jellyfin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jf-max">Max Recently Added Items</Label>
              <Input
                id="jf-max"
                type="number"
                min={1}
                max={20}
                value={formMaxItems}
                onChange={(e) => setFormMaxItems(parseInt(e.target.value) || 5)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="jf-now-playing">Show Now Playing</Label>
                <p className="text-sm text-muted-foreground">
                  Display active playback sessions
                </p>
              </div>
              <Switch
                id="jf-now-playing"
                checked={formShowNowPlaying}
                onCheckedChange={setFormShowNowPlaying}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="jf-recent">Show Recently Added</Label>
                <p className="text-sm text-muted-foreground">
                  Display recently added media
                </p>
              </div>
              <Switch
                id="jf-recent"
                checked={formShowRecentlyAdded}
                onCheckedChange={setFormShowRecentlyAdded}
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
