import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Plus, Clock, Cloud, Activity, Bookmark, ExternalLink, StickyNote, Film, Tv, Music, Play, ChevronLeft, AlertCircle, Server, Container } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClockWidget } from "./clock-widget";
import { UptimeKumaWidget } from "./uptime-kuma-widget";
import { BookmarksWidget } from "./bookmarks-widget";
import { IframeWidget } from "./iframe-widget";
import { NotesWidget } from "./notes-widget";
import { RadarrWidget } from "./radarr-widget";
import { SonarrWidget } from "./sonarr-widget";
import { LidarrWidget } from "./lidarr-widget";
import { JellyfinWidget } from "./jellyfin-widget";
import { SystemStatsWidget } from "./system-stats-widget";
import { DockerWidget } from "./docker-widget";
import { WeatherWidget } from "./weather-widget";
import { getWidgets, createWidget, deleteWidget } from "@/lib/server/widgets";
import { getIntegrations } from "@/lib/server/integrations";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";

type WidgetWithIntegration = Widget & {
  config: WidgetConfig;
  integration?: Integration | null;
};

interface WidgetGridProps {
  onEditWidget?: (widget: Widget) => void;
}

const WIDGET_TYPES = [
  {
    type: "clock" as const,
    name: "Clock",
    description: "Display current time and date",
    icon: Clock,
    requiresIntegration: false,
  },
  {
    type: "weather" as const,
    name: "Weather",
    description: "Current weather conditions",
    icon: Cloud,
    requiresIntegration: false,
  },
  {
    type: "system_stats" as const,
    name: "System Stats",
    description: "CPU, RAM, and Disk usage",
    icon: Server,
    requiresIntegration: false,
  },
  {
    type: "uptime_kuma" as const,
    name: "Uptime Kuma",
    description: "Monitor service status",
    icon: Activity,
    requiresIntegration: true,
    integrationType: "uptime_kuma",
  },
  {
    type: "radarr" as const,
    name: "Radarr",
    description: "Movies wanted & queue",
    icon: Film,
    requiresIntegration: true,
    integrationType: "radarr",
  },
  {
    type: "sonarr" as const,
    name: "Sonarr",
    description: "TV episodes & calendar",
    icon: Tv,
    requiresIntegration: true,
    integrationType: "sonarr",
  },
  {
    type: "lidarr" as const,
    name: "Lidarr",
    description: "Music albums wanted",
    icon: Music,
    requiresIntegration: true,
    integrationType: "lidarr",
  },
  {
    type: "jellyfin" as const,
    name: "Jellyfin",
    description: "Now playing & recent",
    icon: Play,
    requiresIntegration: true,
    integrationType: "jellyfin",
  },
  {
    type: "docker" as const,
    name: "Docker",
    description: "Container status & management",
    icon: Container,
    requiresIntegration: true,
    integrationType: "docker",
  },
  {
    type: "bookmarks" as const,
    name: "Bookmarks",
    description: "Quick links to websites",
    icon: Bookmark,
    requiresIntegration: false,
  },
  {
    type: "iframe" as const,
    name: "Embed",
    description: "Embed external content",
    icon: ExternalLink,
    requiresIntegration: false,
  },
  {
    type: "notes" as const,
    name: "Notes",
    description: "Quick notes and reminders",
    icon: StickyNote,
    requiresIntegration: false,
  },
];

type SelectedWidgetType = typeof WIDGET_TYPES[number] | null;

export function WidgetGrid({ onEditWidget }: WidgetGridProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState<SelectedWidgetType>(null);
  const queryClient = useQueryClient();
  const { data: session } = useAuthenticate();

  const { data: widgetsData, isLoading } = useQuery({
    queryKey: ["widgets"],
    queryFn: () => getWidgets(),
    enabled: !!session?.user,
    staleTime: 30000,
  });

  const { data: integrationsData } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => getIntegrations(),
    enabled: !!session?.user,
    staleTime: 30000,
  });

  const widgets = (widgetsData?.widgets || []) as WidgetWithIntegration[];
  const integrations = integrationsData?.integrations || [];

  const createMutation = useMutation({
    mutationFn: (data: { type: Widget["type"]; integrationId?: string }) =>
      createWidget({
        data: {
          type: data.type,
          integrationId: data.integrationId,
          config: {},
          sortOrder: widgets.length,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setAddDialogOpen(false);
      setSelectedWidgetType(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWidget({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });

  // Don't render if not authenticated - must be AFTER all hooks
  if (!session?.user) {
    return null;
  }

  const handleSelectWidgetType = (widgetType: typeof WIDGET_TYPES[number]) => {
    if (widgetType.requiresIntegration) {
      // Show integration selection step
      setSelectedWidgetType(widgetType);
    } else {
      // Create widget directly for widgets that don't require integration
      createMutation.mutate({ type: widgetType.type });
    }
  };

  const handleSelectIntegration = (integrationId: string) => {
    if (!selectedWidgetType) return;
    createMutation.mutate({ type: selectedWidgetType.type, integrationId });
  };

  const handleDialogClose = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setSelectedWidgetType(null);
    }
  };

  const getAvailableIntegrations = () => {
    if (!selectedWidgetType?.integrationType) return [];
    return integrations.filter((i) => i.type === selectedWidgetType.integrationType && i.enabled);
  };

  const handleDeleteWidget = (widget: Widget) => {
    if (confirm("Delete this widget?")) {
      deleteMutation.mutate(widget.id);
    }
  };

  const renderWidget = (widget: WidgetWithIntegration) => {
    const commonProps = {
      widget,
      onEdit: onEditWidget,
      onDelete: handleDeleteWidget,
    };

    switch (widget.type) {
      case "clock":
        return <ClockWidget key={widget.id} {...commonProps} />;
      case "weather":
        return <WeatherWidget key={widget.id} {...commonProps} />;
      case "system_stats":
        return <SystemStatsWidget key={widget.id} {...commonProps} />;
      case "uptime_kuma":
        return <UptimeKumaWidget key={widget.id} {...commonProps} />;
      case "radarr":
        return <RadarrWidget key={widget.id} {...commonProps} />;
      case "sonarr":
        return <SonarrWidget key={widget.id} {...commonProps} />;
      case "lidarr":
        return <LidarrWidget key={widget.id} {...commonProps} />;
      case "jellyfin":
        return <JellyfinWidget key={widget.id} {...commonProps} />;
      case "docker":
        return <DockerWidget key={widget.id} {...commonProps} />;
      case "bookmarks":
        return <BookmarksWidget key={widget.id} {...commonProps} />;
      case "iframe":
        return <IframeWidget key={widget.id} {...commonProps} />;
      case "notes":
        return <NotesWidget key={widget.id} {...commonProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="break-inside-avoid mb-4 h-40 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Widgets</h2>
        <Dialog open={addDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent>
            {!selectedWidgetType ? (
              <>
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                  <DialogDescription>
                    Choose a widget type to add to your dashboard
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {WIDGET_TYPES.map((widgetType) => {
                    const Icon = widgetType.icon;
                    return (
                      <button
                        key={widgetType.type}
                        onClick={() => handleSelectWidgetType(widgetType)}
                        disabled={createMutation.isPending}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-center"
                      >
                        <Icon className="h-8 w-8" />
                        <div>
                          <div className="font-medium">{widgetType.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {widgetType.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedWidgetType(null)}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <DialogTitle>Select {selectedWidgetType.name} Integration</DialogTitle>
                      <DialogDescription>
                        Choose which integration to use for this widget
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-3 pt-4">
                  {getAvailableIntegrations().length > 0 ? (
                    getAvailableIntegrations().map((integration) => (
                      <button
                        key={integration.id}
                        onClick={() => handleSelectIntegration(integration.id)}
                        disabled={createMutation.isPending}
                        className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left"
                      >
                        <selectedWidgetType.icon className="h-6 w-6 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{integration.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {integration.url}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        No {selectedWidgetType.name} integrations configured
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAddDialogOpen(false);
                          setSelectedWidgetType(null);
                          window.location.href = "/integrations";
                        }}
                      >
                        Add Integration
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No widgets yet. Add one to get started!
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
          {widgets.map((widget) => (
            <div key={widget.id} className="break-inside-avoid mb-4">
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
