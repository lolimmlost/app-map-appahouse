import { useState, useMemo } from "react";
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
import { GripVertical } from "lucide-react";
import { AppCard, type HealthStatus } from "./app-card";
import { cn } from "@/lib/utils";
import type { App, Tag } from "@/types/database";
import type { Category } from "@/types/database";

export type AppWithRelations = App & {
  category?: Category | null;
  tags?: Tag[];
};

interface SortableAppGridProps {
  apps: AppWithRelations[];
  healthStatuses?: Record<string, HealthStatus>;
  healthBarStyle?: "dot" | "border" | "none";
  columns?: number;
  viewMode?: "grid" | "list";
  onEditApp?: (app: App) => void;
  onDeleteApp?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPinApp?: (app: App, pinned: boolean) => void;
  onReorder?: (orderedIds: string[]) => void;
  reorderEnabled?: boolean;
}

interface SortableAppCardProps {
  app: AppWithRelations;
  healthStatus: HealthStatus;
  healthBarStyle: "dot" | "border" | "none";
  viewMode: "grid" | "list";
  onEdit?: (app: App) => void;
  onDelete?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPin?: (app: App, pinned: boolean) => void;
  isDragging?: boolean;
}

function SortableAppCard({
  app,
  healthStatus,
  healthBarStyle,
  viewMode,
  onEdit,
  onDelete,
  onViewNotes,
  onPin,
  isDragging,
}: SortableAppCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/sortable",
        isSortableDragging && "opacity-50"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing z-10",
          "opacity-0 group-hover/sortable:opacity-100 transition-opacity",
          "bg-gradient-to-r from-muted/80 to-transparent rounded-l-lg"
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <AppCard
        app={app}
        healthStatus={healthStatus}
        healthBarStyle={healthBarStyle}
        viewMode={viewMode}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewNotes={onViewNotes}
        onPin={onPin}
      />
    </div>
  );
}

export function SortableAppGrid({
  apps,
  healthStatuses = {},
  healthBarStyle = "dot",
  columns = 4,
  viewMode = "grid",
  onEditApp,
  onDeleteApp,
  onViewNotes,
  onPinApp,
  onReorder,
  reorderEnabled = true,
}: SortableAppGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localApps, setLocalApps] = useState<AppWithRelations[]>(apps);

  // Keep local state in sync with props
  useMemo(() => {
    setLocalApps(apps);
  }, [apps]);

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

  const activeApp = activeId ? localApps.find((app) => app.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = localApps.findIndex((app) => app.id === active.id);
      const newIndex = localApps.findIndex((app) => app.id === over.id);

      const newApps = arrayMove(localApps, oldIndex, newIndex);
      setLocalApps(newApps);

      // Call onReorder with the new order
      if (onReorder) {
        onReorder(newApps.map((app) => app.id));
      }
    }
  };

  const gridClasses = cn(
    viewMode === "list" ? "flex flex-col gap-2" : "grid gap-4",
    viewMode === "grid" && columns === 2 && "grid-cols-1 sm:grid-cols-2",
    viewMode === "grid" && columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    viewMode === "grid" && columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    viewMode === "grid" && columns === 5 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    viewMode === "grid" && columns === 6 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
  );

  if (localApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">No apps yet</p>
          <p className="text-sm mt-1">Add your first app to get started</p>
        </div>
      </div>
    );
  }

  if (!reorderEnabled) {
    // Render without DnD
    return (
      <div className={gridClasses}>
        {localApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            healthStatus={healthStatuses[app.id] ?? "unknown"}
            healthBarStyle={healthBarStyle}
            viewMode={viewMode}
            onEdit={onEditApp}
            onDelete={onDeleteApp}
            onViewNotes={onViewNotes}
            onPin={onPinApp}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localApps.map((app) => app.id)} strategy={rectSortingStrategy}>
        <div className={gridClasses}>
          {localApps.map((app) => (
            <SortableAppCard
              key={app.id}
              app={app}
              healthStatus={healthStatuses[app.id] ?? "unknown"}
              healthBarStyle={healthBarStyle}
              viewMode={viewMode}
              onEdit={onEditApp}
              onDelete={onDeleteApp}
              onViewNotes={onViewNotes}
              onPin={onPinApp}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeApp ? (
          <div className="opacity-90 shadow-xl">
            <AppCard
              app={activeApp}
              healthStatus={healthStatuses[activeApp.id] ?? "unknown"}
              healthBarStyle={healthBarStyle}
              viewMode={viewMode}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
