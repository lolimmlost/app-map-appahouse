import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Clock, Film, Tv, Music, User, Settings, ExternalLink, Pause, Library, ChevronDown, ChevronUp, Server, BookOpen } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { getJellyfinSessions, getJellyfinLatest, getJellyfinLibraryStats, getJellyfinSystemInfo } from "@/lib/server/widget-proxy.server";
import { updateWidget } from "@/lib/server/widgets.server";
import type { Widget, WidgetConfig } from "@/types/database";
import type { Integration } from "@/types/database";

interface JellyfinWidgetProps {
  widget: Widget & { config: WidgetConfig; integration?: Integration | null };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: "small" | "medium" | "large" | "full") => void;
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

type JellyfinLibraryStats = {
  movies: number;
  series: number;
  episodes: number;
  music: number;
  albums: number;
  artists: number;
  books: number;
  libraries: Array<{ name: string; type: string; id: string }>;
};

type JellyfinSystemInfo = {
  serverName: string;
  version: string;
  operatingSystem: string;
  architecture: string;
  hasUpdateAvailable: boolean;
  localAddress: string;
};

export function JellyfinWidget({ widget, onEdit, onDelete, onResize }: JellyfinWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const integration = widget.integration;
  const showNowPlaying = config.showNowPlaying ?? true;
  const showRecentlyAdded = config.showRecentlyAdded ?? true;
  const showLibraryStats = config.showLibraryStats ?? true;
  const showServerInfo = config.showServerInfo ?? false;
  const maxItems = config.maxItems ?? 5;

  // Collapsible section state
  const [nowPlayingOpen, setNowPlayingOpen] = useState(true);
  const [recentlyAddedOpen, setRecentlyAddedOpen] = useState(true);
  const [libraryStatsOpen, setLibraryStatsOpen] = useState(true);
  const [serverInfoOpen, setServerInfoOpen] = useState(false);

  // Settings form state
  const [formTitle, setFormTitle] = useState(config.title || "Jellyfin");
  const [formShowNowPlaying, setFormShowNowPlaying] = useState(showNowPlaying);
  const [formShowRecentlyAdded, setFormShowRecentlyAdded] = useState(showRecentlyAdded);
  const [formShowLibraryStats, setFormShowLibraryStats] = useState(showLibraryStats);
  const [formShowServerInfo, setFormShowServerInfo] = useState(showServerInfo);
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

  // Fetch library statistics
  const { data: libraryStats, isLoading: libraryLoading, refetch: refetchLibrary } = useQuery({
    queryKey: ["jellyfin-library", widget.id, integration?.id],
    queryFn: async (): Promise<JellyfinLibraryStats> => {
      if (!integration?.id || !showLibraryStats) {
        return { movies: 0, series: 0, episodes: 0, music: 0, albums: 0, artists: 0, books: 0, libraries: [] };
      }
      return getJellyfinLibraryStats({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id && showLibraryStats,
    refetchInterval: (config.refreshInterval || 300) * 1000, // Refresh every 5 minutes
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch server info
  const { data: serverInfo, isLoading: serverLoading, refetch: refetchServer } = useQuery({
    queryKey: ["jellyfin-server", widget.id, integration?.id],
    queryFn: async (): Promise<JellyfinSystemInfo | null> => {
      if (!integration?.id || !showServerInfo) return null;
      return getJellyfinSystemInfo({ data: { integrationId: integration.id } });
    },
    enabled: !!integration?.id && showServerInfo,
    refetchInterval: (config.refreshInterval || 300) * 1000, // Refresh every 5 minutes
    staleTime: 120000,
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
      queryClient.invalidateQueries({ queryKey: ["jellyfin-library", widget.id] });
      queryClient.invalidateQueries({ queryKey: ["jellyfin-server", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      showNowPlaying: formShowNowPlaying,
      showRecentlyAdded: formShowRecentlyAdded,
      showLibraryStats: formShowLibraryStats,
      showServerInfo: formShowServerInfo,
      maxItems: formMaxItems,
    });
  };

  const isLoading = sessionsLoading || recentLoading || libraryLoading || serverLoading;
  const sessions = sessionsData || [];
  const recentItems = recentData || [];

  const handleRefresh = () => {
    if (showNowPlaying) refetchSessions();
    if (showRecentlyAdded) refetchRecent();
    if (showLibraryStats) refetchLibrary();
    if (showServerInfo) refetchServer();
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getLibraryIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "movies":
        return <Film className="h-3 w-3" />;
      case "tvshows":
        return <Tv className="h-3 w-3" />;
      case "music":
        return <Music className="h-3 w-3" />;
      case "books":
        return <BookOpen className="h-3 w-3" />;
      default:
        return <Library className="h-3 w-3" />;
    }
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
        onResize={onResize}
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
        onResize={onResize}
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
          <div className="space-y-3">
            {/* Now Playing */}
            {showNowPlaying && (
              <Collapsible open={nowPlayingOpen} onOpenChange={setNowPlayingOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Play className="h-3 w-3" /> Now Playing
                    {sessions.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                        {sessions.length}
                      </Badge>
                    )}
                  </div>
                  {nowPlayingOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1.5 mt-1.5">
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
                            session.PlayState?.IsPaused ? "bg-warning/10" : "bg-success/10"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <div className="mt-0.5">
                                {session.PlayState?.IsPaused ? (
                                  <Pause className="h-4 w-4 text-warning" />
                                ) : (
                                  <Play className="h-4 w-4 text-success" />
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
                                  ? "[&>div]:bg-warning"
                                  : "[&>div]:bg-success"
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
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Library Stats */}
            {showLibraryStats && libraryStats && (
              <Collapsible open={libraryStatsOpen} onOpenChange={setLibraryStatsOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Library className="h-3 w-3" /> Library
                  </div>
                  {libraryStatsOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {libraryStats.movies > 0 && (
                      <div className="p-2 rounded-md bg-muted/50 text-center">
                        <Film className="h-4 w-4 mx-auto text-muted-foreground" />
                        <div className="text-lg font-mono font-semibold tabular-nums">{formatNumber(libraryStats.movies)}</div>
                        <div className="text-[10px] text-muted-foreground">Movies</div>
                      </div>
                    )}
                    {libraryStats.series > 0 && (
                      <div className="p-2 rounded-md bg-muted/50 text-center">
                        <Tv className="h-4 w-4 mx-auto text-muted-foreground" />
                        <div className="text-lg font-mono font-semibold tabular-nums">{formatNumber(libraryStats.series)}</div>
                        <div className="text-[10px] text-muted-foreground">Series</div>
                      </div>
                    )}
                    {libraryStats.episodes > 0 && (
                      <div className="p-2 rounded-md bg-muted/50 text-center">
                        <Play className="h-4 w-4 mx-auto text-muted-foreground" />
                        <div className="text-lg font-mono font-semibold tabular-nums">{formatNumber(libraryStats.episodes)}</div>
                        <div className="text-[10px] text-muted-foreground">Episodes</div>
                      </div>
                    )}
                    {libraryStats.music > 0 && (
                      <div className="p-2 rounded-md bg-muted/50 text-center">
                        <Music className="h-4 w-4 mx-auto text-muted-foreground" />
                        <div className="text-lg font-mono font-semibold tabular-nums">{formatNumber(libraryStats.music)}</div>
                        <div className="text-[10px] text-muted-foreground">Tracks</div>
                      </div>
                    )}
                  </div>
                  {libraryStats.libraries && libraryStats.libraries.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {libraryStats.libraries.map((lib) => (
                        <div
                          key={lib.id}
                          className="flex items-center justify-between p-1.5 rounded-md bg-muted/30"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            {getLibraryIcon(lib.type)}
                            <span>{lib.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {lib.type || "mixed"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Recently Added */}
            {showRecentlyAdded && recentItems.length > 0 && (
              <Collapsible open={recentlyAddedOpen} onOpenChange={setRecentlyAddedOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Recently Added
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                      {recentItems.length}
                    </Badge>
                  </div>
                  {recentlyAddedOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1.5 mt-1.5">
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
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Server Info */}
            {showServerInfo && serverInfo && (
              <Collapsible open={serverInfoOpen} onOpenChange={setServerInfoOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Server className="h-3 w-3" /> Server
                    {serverInfo.hasUpdateAvailable && (
                      <Badge variant="default" className="ml-1 text-[10px] px-1 py-0 bg-warning/15 text-warning">
                        Update
                      </Badge>
                    )}
                  </div>
                  {serverInfoOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1.5">
                  <div className="p-2 rounded-md bg-muted/50 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{serverInfo.serverName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Version</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{serverInfo.version}</span>
                        {serverInfo.hasUpdateAvailable && (
                          <Badge variant="outline" className="text-[10px] text-warning border-warning">
                            Update available
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">OS</span>
                      <span className="font-medium">{serverInfo.operatingSystem} ({serverInfo.architecture})</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Empty state */}
            {sessions.length === 0 && recentItems.length === 0 && !libraryStats && !serverInfo && (
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="jf-library">Show Library Stats</Label>
                <p className="text-sm text-muted-foreground">
                  Display media library counts
                </p>
              </div>
              <Switch
                id="jf-library"
                checked={formShowLibraryStats}
                onCheckedChange={setFormShowLibraryStats}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="jf-server">Show Server Info</Label>
                <p className="text-sm text-muted-foreground">
                  Display server version and status
                </p>
              </div>
              <Switch
                id="jf-server"
                checked={formShowServerInfo}
                onCheckedChange={setFormShowServerInfo}
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
