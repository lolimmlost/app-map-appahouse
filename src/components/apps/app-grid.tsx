import { useMemo } from "react";
import { AppCard, type HealthStatus, type DependencyStatus } from "./app-card";
import { AppTable } from "./app-table";
import { SwipeableCard } from "./swipeable-card";
import type { App, Tag } from "@/types/database";
import type { Category } from "@/types/database";
import { cn } from "@/lib/utils";

export type AppWithRelations = App & {
  category?: Category | null;
  tags?: Tag[];
};

interface AppGridProps {
  apps: AppWithRelations[];
  healthStatuses?: Record<string, HealthStatus>;
  dependencyStatuses?: Record<string, DependencyStatus>;
  healthBarStyle?: "dot" | "border" | "none";
  columns?: number;
  viewMode?: "grid" | "list" | "table";
  groupByCategory?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectApp?: (app: App) => void;
  onEditApp?: (app: App) => void;
  onDeleteApp?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPinApp?: (app: App, pinned: boolean) => void;
  onShareApp?: (app: App) => void;
}

export function AppGrid({
  apps,
  healthStatuses = {},
  dependencyStatuses = {},
  healthBarStyle = "dot",
  columns = 4,
  viewMode = "grid",
  groupByCategory = true,
  selectionMode = false,
  selectedIds = new Set(),
  onSelectApp,
  onEditApp,
  onDeleteApp,
  onViewNotes,
  onPinApp,
  onShareApp,
}: AppGridProps) {
  const groupedApps = useMemo(() => {
    if (!groupByCategory) {
      return [{ category: null, apps: apps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) }];
    }

    const groups: Map<string | null, { category: Category | null; apps: AppWithRelations[] }> = new Map();

    // Initialize uncategorized group
    groups.set(null, { category: null, apps: [] });

    for (const app of apps) {
      const categoryId = app.categoryId;

      if (!categoryId) {
        groups.get(null)!.apps.push(app);
      } else {
        if (!groups.has(categoryId)) {
          groups.set(categoryId, { category: app.category ?? null, apps: [] });
        }
        groups.get(categoryId)!.apps.push(app);
      }
    }

    // Sort apps within each group
    for (const group of groups.values()) {
      group.apps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    // Convert to array and sort by category sortOrder
    return Array.from(groups.values())
      .filter(group => group.apps.length > 0)
      .sort((a, b) => {
        if (!a.category) return 1;
        if (!b.category) return -1;
        return (a.category.sortOrder ?? 0) - (b.category.sortOrder ?? 0);
      });
  }, [apps, groupByCategory]);

  const gridClasses = cn(
    viewMode === "list" ? "flex flex-col gap-1" : "grid gap-1.5 sm:gap-2",
    viewMode === "grid" && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
  );

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">No apps yet</p>
          <p className="text-sm mt-1">Add your first app to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupedApps.map((group) => (
        <div key={group.category?.id ?? "uncategorized"}>
          {groupByCategory && (
            <div className="flex items-center gap-2 mb-2.5">
              {group.category?.icon && (
                <span className="text-base">{group.category.icon}</span>
              )}
              <h2
                className="text-sm font-semibold"
                style={group.category?.color ? { color: group.category.color } : undefined}
              >
                {group.category?.name ?? "Uncategorized"}
              </h2>
              <span className="text-xs text-muted-foreground">
                ({group.apps.length})
              </span>
            </div>
          )}
          {viewMode === "table" ? (
            <AppTable
              apps={group.apps}
              healthStatuses={healthStatuses}
              dependencyStatuses={dependencyStatuses}
              showCategory={!groupByCategory}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelectApp={onSelectApp}
              onEditApp={onEditApp}
              onDeleteApp={onDeleteApp}
              onViewNotes={onViewNotes}
              onPinApp={onPinApp}
              onShareApp={onShareApp}
            />
          ) : (
          <div className={gridClasses}>
            {group.apps.map((app) => (
              <SwipeableCard
                key={app.id}
                onDelete={onDeleteApp ? () => onDeleteApp(app) : undefined}
                onPin={onPinApp ? () => onPinApp(app, !app.pinned) : undefined}
                isPinned={app.pinned ?? false}
                disabled={selectionMode}
              >
                <AppCard
                  app={app}
                  healthStatus={healthStatuses[app.id] ?? "unknown"}
                  dependencyStatus={dependencyStatuses[app.id]}
                  healthBarStyle={healthBarStyle}
                  viewMode={viewMode}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(app.id)}
                  onSelect={onSelectApp}
                  onEdit={onEditApp}
                  onDelete={onDeleteApp}
                  onViewNotes={onViewNotes}
                  onPin={onPinApp}
                  onShare={onShareApp}
                />
              </SwipeableCard>
            ))}
          </div>
          )}
        </div>
      ))}
    </div>
  );
}
