import { useMemo } from "react";
import { AppCard, type HealthStatus } from "./app-card";
import { SwipeableCard } from "./swipeable-card";
import type { App, Tag } from "@/database/schema/apps";
import type { Category } from "@/database/schema/categories";
import { cn } from "@/lib/utils";

export type AppWithRelations = App & {
  category?: Category | null;
  tags?: Tag[];
};

interface AppGridProps {
  apps: AppWithRelations[];
  healthStatuses?: Record<string, HealthStatus>;
  healthBarStyle?: "dot" | "border" | "none";
  columns?: number;
  viewMode?: "grid" | "list";
  groupByCategory?: boolean;
  onEditApp?: (app: App) => void;
  onDeleteApp?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPinApp?: (app: App, pinned: boolean) => void;
}

export function AppGrid({
  apps,
  healthStatuses = {},
  healthBarStyle = "dot",
  columns = 4,
  viewMode = "grid",
  groupByCategory = true,
  onEditApp,
  onDeleteApp,
  onViewNotes,
  onPinApp,
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
    viewMode === "list" ? "flex flex-col gap-2" : "grid gap-4",
    viewMode === "grid" && columns === 2 && "grid-cols-1 sm:grid-cols-2",
    viewMode === "grid" && columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    viewMode === "grid" && columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    viewMode === "grid" && columns === 5 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    viewMode === "grid" && columns === 6 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
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
    <div className="space-y-8">
      {groupedApps.map((group) => (
        <div key={group.category?.id ?? "uncategorized"}>
          {groupByCategory && (
            <div className="flex items-center gap-2 mb-4">
              {group.category?.icon && (
                <span className="text-xl">{group.category.icon}</span>
              )}
              <h2
                className="text-lg font-semibold"
                style={group.category?.color ? { color: group.category.color } : undefined}
              >
                {group.category?.name ?? "Uncategorized"}
              </h2>
              <span className="text-sm text-muted-foreground">
                ({group.apps.length})
              </span>
            </div>
          )}
          <div className={gridClasses}>
            {group.apps.map((app) => (
              <SwipeableCard
                key={app.id}
                onDelete={onDeleteApp ? () => onDeleteApp(app) : undefined}
                onPin={onPinApp ? () => onPinApp(app, !app.pinned) : undefined}
                isPinned={app.pinned ?? false}
              >
                <AppCard
                  app={app}
                  healthStatus={healthStatuses[app.id] ?? "unknown"}
                  healthBarStyle={healthBarStyle}
                  viewMode={viewMode}
                  onEdit={onEditApp}
                  onDelete={onDeleteApp}
                  onViewNotes={onViewNotes}
                  onPin={onPinApp}
                />
              </SwipeableCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
