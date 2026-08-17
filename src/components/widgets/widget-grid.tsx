import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Clock, Cloud, Activity, Bookmark, ExternalLink, StickyNote, Film, Tv, Music, Play, ChevronLeft, AlertCircle, Server, Container, Database, GripVertical, LayoutGrid, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { TrueNASWidget } from "./truenas-widget";
import { WeatherWidget } from "./weather-widget";
import { TopStatusBar } from "./top-status-bar";
import { getWidgets, createWidget, deleteWidget, updateWidgetOrder, updateWidget } from "@/lib/server/widgets.server";
import { getIntegrations } from "@/lib/server/integrations.server";
import type { Widget, WidgetConfig } from "@/types/database";
import type { Integration } from "@/types/database";

// Widget types that should appear in the top status bar instead of the grid
const STATUS_BAR_WIDGET_TYPES = ["clock", "weather"] as const;

type WidgetWithIntegration = Widget & {
  config: WidgetConfig;
  integration?: Integration | null;
};

interface WidgetGridProps {
  onEditWidget?: (widget: Widget) => void;
  reorderMode?: boolean;
}

type LayoutMode = "masonry" | "grid";

// Get column span classes for grid layout based on widget size
function getWidgetSizeClasses(size?: "small" | "medium" | "large" | "full"): string {
  switch (size) {
    case "full":
      return "col-span-full";
    case "large":
      return "md:col-span-2 lg:col-span-3";
    case "medium":
      return "md:col-span-2";
    case "small":
    default:
      return "col-span-1";
  }
}

// Simple widget wrapper for non-reorder mode
function WidgetWrapper({
  widget,
  children,
  layoutMode,
}: {
  widget: WidgetWithIntegration;
  children: React.ReactNode;
  layoutMode: LayoutMode;
}) {
  const sizeClasses = layoutMode === "grid" ? getWidgetSizeClasses(widget.config?.size) : "";
  const layoutClasses = layoutMode === "masonry" ? "break-inside-avoid" : "";

  return <div className={cn("min-w-0", layoutClasses, sizeClasses)}>{children}</div>;
}

// Sortable widget wrapper for reorder mode
function SortableWidget({
  widget,
  children,
  layoutMode,
}: {
  widget: WidgetWithIntegration;
  children: React.ReactNode;
  layoutMode: LayoutMode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sizeClasses = layoutMode === "grid" ? getWidgetSizeClasses(widget.config?.size) : "";
  const layoutClasses = layoutMode === "masonry" ? "break-inside-avoid" : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/sortable-widget",
        layoutClasses,
        sizeClasses,
        isDragging && "opacity-50 z-50"
      )}
    >
      {/* Drag handle overlay */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing flex items-start justify-end p-2 opacity-0 group-hover/sortable-widget:opacity-100 transition-opacity"
      >
        <div className="bg-background/90 rounded-md p-1.5 shadow-sm border">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {children}
    </div>
  );
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
    type: "truenas" as const,
    name: "TrueNAS",
    description: "Pool, disk & app status",
    icon: Database,
    requiresIntegration: true,
    integrationType: "truenas",
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

export function WidgetGrid({ onEditWidget, reorderMode = false }: WidgetGridProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState<SelectedWidgetType>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localWidgets, setLocalWidgets] = useState<WidgetWithIntegration[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const queryClient = useQueryClient();
  const { data: session } = useAuthenticate();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const widgetsFromQuery = (widgetsData?.widgets || []) as WidgetWithIntegration[];
  const integrations = integrationsData?.integrations || [];

  // Keep local state in sync with query data (for order tracking during reorder)
  // Only sync when widget count or IDs change
  if (widgetsFromQuery.length !== localWidgets.length ||
      widgetsFromQuery.some((w, i) => localWidgets[i]?.id !== w.id)) {
    setLocalWidgets(widgetsFromQuery);
  }

  // In reorder mode, use localWidgets order but with fresh data from query
  // This ensures we have the drag order but up-to-date config (like size)
  const widgets = reorderMode
    ? localWidgets
        .map(lw => widgetsFromQuery.find(w => w.id === lw.id))
        .filter((w): w is WidgetWithIntegration => w !== undefined)
    : widgetsFromQuery;

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

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      updateWidgetOrder({ data: { orderedIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });

  const resizeMutation = useMutation({
    mutationFn: ({ id, size }: { id: string; size: "small" | "medium" | "large" | "full" }) =>
      updateWidget({
        data: {
          id,
          config: {
            ...widgets.find((w) => w.id === id)?.config,
            size,
          },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = localWidgets.findIndex((w) => w.id === active.id);
      const newIndex = localWidgets.findIndex((w) => w.id === over.id);

      const newWidgets = arrayMove(localWidgets, oldIndex, newIndex);
      setLocalWidgets(newWidgets);

      // Save the new order
      reorderMutation.mutate(newWidgets.map((w) => w.id));
    }
  };

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

  const handleResizeWidget = (widget: Widget, size: "small" | "medium" | "large" | "full") => {
    resizeMutation.mutate({ id: widget.id, size });
  };

  const renderWidget = (widget: WidgetWithIntegration) => {
    const commonProps = {
      widget,
      onEdit: onEditWidget,
      onDelete: handleDeleteWidget,
      onResize: handleResizeWidget,
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
      case "truenas":
        return <TrueNASWidget key={widget.id} {...commonProps} />;
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

  // Separate status bar widgets from regular widgets
  const statusBarWidgets = widgets.filter((w) =>
    STATUS_BAR_WIDGET_TYPES.includes(w.type as typeof STATUS_BAR_WIDGET_TYPES[number])
  );
  const gridWidgets = widgets.filter(
    (w) => !STATUS_BAR_WIDGET_TYPES.includes(w.type as typeof STATUS_BAR_WIDGET_TYPES[number])
  );

  const clockWidget = statusBarWidgets.find((w) => w.type === "clock") || null;
  const weatherWidget = statusBarWidgets.find((w) => w.type === "weather") || null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Widgets Section Header — clock/weather merged in */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {(clockWidget || weatherWidget) && (
            <TopStatusBar clockWidget={clockWidget} weatherWidget={weatherWidget} />
          )}
          {gridWidgets.length > 0 && (
            <h2 className="panel-label whitespace-nowrap">Widgets</h2>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Layout mode toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={layoutMode === "masonry" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayoutMode("masonry")}
              className="rounded-r-none h-8 px-2"
              title="Masonry layout (compact, no size control)"
            >
              <Columns className="h-4 w-4" />
            </Button>
            <Button
              variant={layoutMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayoutMode("grid")}
              className="rounded-l-none h-8 px-2"
              title="Grid layout (supports widget sizing)"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
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
      </div>

      {gridWidgets.length === 0 && !clockWidget && !weatherWidget ? (
        <div className="text-center py-8 text-muted-foreground">
          No widgets yet. Add one to get started!
        </div>
      ) : gridWidgets.length > 0 ? (
        reorderMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={gridWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
              <div className={cn(
                layoutMode === "masonry"
                  ? "columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr items-stretch"
              )}>
                {gridWidgets.map((widget) => (
                  <SortableWidget key={widget.id} widget={widget} layoutMode={layoutMode}>
                    {renderWidget(widget)}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="opacity-90 shadow-xl">
                  {renderWidget(gridWidgets.find((w) => w.id === activeId)!)}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className={cn(
            layoutMode === "masonry"
              ? "columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr items-stretch"
          )}>
            {gridWidgets.map((widget) => (
              <WidgetWrapper key={widget.id} widget={widget} layoutMode={layoutMode}>
                {renderWidget(widget)}
              </WidgetWrapper>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
