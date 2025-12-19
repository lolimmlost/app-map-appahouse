import { useQuery } from "@tanstack/react-query";
import { Play, Clock, Film, Tv, Music, User } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Badge } from "@/components/ui/badge";
import { getJellyfinSessions, getJellyfinLatest } from "@/lib/server/widget-proxy";
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
  NowPlayingItem?: {
    Name: string;
    Type: string;
    SeriesName?: string;
    ParentIndexNumber?: number;
    IndexNumber?: number;
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
  const config = widget.config || {};
  const integration = widget.integration;
  const showNowPlaying = config.showNowPlaying ?? true;
  const showRecentlyAdded = config.showRecentlyAdded ?? true;
  const maxItems = config.maxItems ?? 5;

  // Fetch active sessions (now playing) via server proxy
  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ["jellyfin-sessions", widget.id, integration?.id],
    queryFn: async (): Promise<JellyfinSession[]> => {
      if (!integration?.id || !showNowPlaying) return [];
      const sessions: JellyfinSession[] = await getJellyfinSessions({ data: { integrationId: integration.id } });
      // Filter to only sessions with something playing
      return sessions.filter((s) => s.NowPlayingItem);
    },
    enabled: !!integration?.id && showNowPlaying,
    refetchInterval: (config.refreshInterval || 30) * 1000,
    staleTime: 10000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch recently added items via server proxy
  const { data: recentData, isLoading: recentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ["jellyfin-recent", widget.id, integration?.id],
    queryFn: async (): Promise<JellyfinItem[]> => {
      if (!integration?.id || !showRecentlyAdded) return [];
      return getJellyfinLatest({ data: { integrationId: integration.id, limit: maxItems } });
    },
    enabled: !!integration?.id && showRecentlyAdded,
    refetchInterval: (config.refreshInterval || 120) * 1000,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isLoading = sessionsLoading || recentLoading;
  const sessions = sessionsData || [];
  const recentItems = recentData || [];

  const handleRefresh = () => {
    if (showNowPlaying) refetchSessions();
    if (showRecentlyAdded) refetchRecent();
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

  const getItemTitle = (item: JellyfinItem | JellyfinSession["NowPlayingItem"]) => {
    if (!item) return "";
    if (item.Type === "Episode" && item.SeriesName) {
      const epNum = formatEpisode(item.ParentIndexNumber, item.IndexNumber);
      return (
        <>
          <span className="truncate block">{item.SeriesName}</span>
          <span className="text-xs text-muted-foreground">
            {epNum} - {item.Name}
          </span>
        </>
      );
    }
    return <span className="truncate block">{item.Name}</span>;
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
    <WidgetContainer
      widget={widget}
      title={config.title || "Jellyfin"}
      icon={<Play className="h-4 w-4" />}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {isLoading && !sessionsData && !recentData ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
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
                sessions.map((session) => (
                  <div
                    key={session.Id}
                    className="flex items-center justify-between p-2 rounded-md bg-green-500/10"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {session.NowPlayingItem && getTypeIcon(session.NowPlayingItem.Type)}
                      <div className="flex-1 min-w-0 text-sm">
                        {getItemTitle(session.NowPlayingItem)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge
                        variant={session.PlayState?.IsPaused ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {session.PlayState?.IsPaused ? "Paused" : "Playing"}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {session.UserName}
                      </span>
                    </div>
                  </div>
                ))
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
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getTypeIcon(item.Type)}
                      <div className="flex-1 min-w-0 text-sm">{getItemTitle(item)}</div>
                    </div>
                    {addedDate && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {isToday
                          ? "Today"
                          : addedDate.toLocaleDateString(undefined, {
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
          {sessions.length === 0 && recentItems.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              No activity to display
            </div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
