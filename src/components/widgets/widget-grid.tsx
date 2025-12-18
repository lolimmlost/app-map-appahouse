import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Plus, Clock, Activity, Bookmark, ExternalLink } from "lucide-react";
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
import { getWidgets, createWidget, deleteWidget } from "@/lib/server/widgets";
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
    type: "uptime_kuma" as const,
    name: "Uptime Kuma",
    description: "Monitor service status",
    icon: Activity,
    requiresIntegration: true,
    integrationType: "uptime_kuma",
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
];

export function WidgetGrid({ onEditWidget }: WidgetGridProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useAuthenticate();

  const { data: widgetsData, isLoading } = useQuery({
    queryKey: ["widgets"],
    queryFn: () => getWidgets(),
    enabled: !!session?.user,
    staleTime: 30000,
  });

  const widgets = (widgetsData?.widgets || []) as WidgetWithIntegration[];

  const createMutation = useMutation({
    mutationFn: (type: Widget["type"]) =>
      createWidget({
        data: {
          type,
          config: {},
          sortOrder: widgets.length,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setAddDialogOpen(false);
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

  const handleAddWidget = (type: Widget["type"]) => {
    createMutation.mutate(type);
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
      case "uptime_kuma":
        return <UptimeKumaWidget key={widget.id} {...commonProps} />;
      case "bookmarks":
        return <BookmarksWidget key={widget.id} {...commonProps} />;
      case "iframe":
        return <IframeWidget key={widget.id} {...commonProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Widgets</h2>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                    onClick={() => handleAddWidget(widgetType.type)}
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
          </DialogContent>
        </Dialog>
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No widgets yet. Add one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {widgets.map(renderWidget)}
        </div>
      )}
    </div>
  );
}
