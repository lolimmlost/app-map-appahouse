import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, LayoutGrid, List, Table2, Settings2, RefreshCw, Activity, Radar, GripVertical, CheckSquare, GitBranch, MoreHorizontal, PanelLeft, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { AppGrid, SortableAppGrid, AppForm, AppNotesDialog, QuickLinksBar, BulkActionsBar, ShareDialog, DependencyGraphView, OpsSidebar, type AppFormData, type AppMetrics } from "@/components/apps";
import { hostParts } from "@/components/apps/host";
import type { HealthStatus } from "@/components/apps/app-card";
import { WidgetGrid } from "@/components/widgets";
import { LinksGrid } from "@/components/links";
import { ServiceDiscoveryDialog } from "@/components/discovery";
import { getApps } from "@/lib/server/apps.server";
import { getCategories } from "@/lib/server/categories.server";
import { getTags } from "@/lib/server/tags.server";
import { getUserSettings } from "@/lib/server/user-settings.server";
import { getAnalyticsSummary } from "@/lib/server/analytics.server";
import { useHealthStatus } from "@/hooks/use-health-status";
import { useAppMutations } from "@/hooks/use-app-mutations";
import { useDependencyStatuses } from "@/hooks/use-dependency-status";
import type { App } from "@/types/database";

export const Route = createFileRoute("/")({ component: DashboardPage });

function DashboardPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();

  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [notesApp, setNotesApp] = useState<App | null>(null);
  const [sharingApp, setSharingApp] = useState<App | null>(null);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table");
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Ops-console sidebar: visibility + the filters it drives across the dashboard.
  // Ops console: closed by default (esp. mobile, where it would push apps off
  // the first screen); auto-open on desktop widths after mount.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarOpen(true);
    }
  }, []);
  const [activeStatus, setActiveStatus] = useState<HealthStatus | null>(null);
  const [activeHost, setActiveHost] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // App mutations hook
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    pinMutation,
    reorderMutation,
    bulkDeleteMutation,
    bulkCategoryMutation,
    bulkHealthCheckMutation,
    bulkExportMutation,
    bulkTagsMutation,
    isFormLoading,
    isBulkLoading,
  } = useAppMutations({
    onFormClose: () => setFormOpen(false),
    onClearEditing: () => setEditingApp(null),
    onClearSelection: () => setSelectedIds(new Set()),
    onExitSelectionMode: () => setSelectionMode(false),
  });

  // Health status polling
  const { healthStatuses, healthResults, isLoading: isHealthLoading, refreshHealth } = useHealthStatus(
    !!session?.user,
    30000 // Poll every 30 seconds
  );

  // Dependency status tracking
  const { dependencyStatuses } = useDependencyStatuses(!!session?.user);
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);

  // Fetch apps
  const { data: appsData, isLoading: isAppsLoading, refetch: refetchApps } = useQuery({
    queryKey: ["apps"],
    queryFn: () => getApps(),
    enabled: !!session?.user,
    staleTime: 30000,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: !!session?.user,
    staleTime: 60000,
  });

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
    enabled: !!session?.user,
    staleTime: 60000,
  });

  // Fetch user settings
  const { data: settingsData } = useQuery({
    queryKey: ["user-settings"],
    queryFn: () => getUserSettings(),
    enabled: !!session?.user,
    staleTime: 60000,
  });

  // Aggregated 30d metrics (uptime %) for the table view — reuses the analytics summary.
  const { data: analyticsData } = useQuery({
    queryKey: ["analytics-summary", "30d"],
    queryFn: () => getAnalyticsSummary({ data: { range: "30d" } }),
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000,
  });

  // Merge live latency/last-checked (health cache) with aggregated uptime (analytics).
  const tableMetrics = useMemo(() => {
    const map: Record<string, AppMetrics> = {};
    for (const [appId, r] of Object.entries(healthResults)) {
      map[appId] = { responseTime: r.responseTime, lastChecked: r.lastChecked };
    }
    for (const summary of analyticsData?.apps ?? []) {
      map[summary.appId] = { ...map[summary.appId], uptime: summary.uptimePercentage };
    }
    return map;
  }, [healthResults, analyticsData]);

  const handleSubmit = (data: AppFormData) => {
    if (editingApp) {
      updateMutation.mutate({ id: editingApp.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (app: App) => {
    setEditingApp(app);
    setFormOpen(true);
  };

  const handleDelete = (app: App) => {
    if (confirm(`Are you sure you want to delete "${app.name}"?`)) {
      deleteMutation.mutate(app.id);
    }
  };

  const handleViewNotes = (app: App) => {
    setNotesApp(app);
  };

  const handlePin = (app: App, pinned: boolean) => {
    pinMutation.mutate({ id: app.id, pinned });
  };

  const handleShare = (app: App) => {
    setSharingApp(app);
  };

  const handleReorder = (orderedIds: string[]) => {
    reorderMutation.mutate(orderedIds);
  };

  const toggleReorderMode = () => {
    if (!reorderMode) {
      // Entering reorder mode - disable grouping
      setGroupByCategory(false);
    }
    setReorderMode(!reorderMode);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingApp(null);
    }
  };

  // Selection mode handlers
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exiting selection mode - clear selections
      setSelectedIds(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  const handleSelectApp = (app: App) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(app.id)) {
        next.delete(app.id);
      } else {
        next.add(app.id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(apps.map((a) => a.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} selected app(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleBulkUpdateCategory = (categoryId: string | null) => {
    if (selectedIds.size === 0) return;
    bulkCategoryMutation.mutate({
      ids: Array.from(selectedIds),
      categoryId,
    });
  };

  const handleBulkToggleHealthCheck = (enabled: boolean) => {
    if (selectedIds.size === 0) return;
    bulkHealthCheckMutation.mutate({
      ids: Array.from(selectedIds),
      enabled,
    });
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    bulkExportMutation.mutate(Array.from(selectedIds));
  };

  const handleBulkUpdateTags = (tagIds: string[], mode: "replace" | "append") => {
    if (selectedIds.size === 0) return;
    bulkTagsMutation.mutate({
      ids: Array.from(selectedIds),
      tagIds,
      mode,
    });
  };

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">App Map</h1>
          <p className="text-muted-foreground mb-6">
            Your personal homelab dashboard
          </p>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your apps
          </p>
        </div>
      </main>
    );
  }

  const apps = appsData?.apps ?? [];
  const categories = categoriesData?.categories ?? [];
  const tags = tagsData?.tags ?? [];
  const healthBarStyle = settingsData?.settings?.healthBarStyle ?? "dot";

  // Sidebar-driven filters — applied to every view mode.
  const hasFilters = !!(activeStatus || activeHost || activeCategoryId);
  const visibleApps = useMemo(() => {
    if (!hasFilters) return apps;
    return apps.filter((app) => {
      if (activeStatus && (healthStatuses[app.id] ?? "unknown") !== activeStatus) return false;
      if (activeCategoryId && app.categoryId !== activeCategoryId) return false;
      if (activeHost) {
        const host = hostParts(app.localUrl)?.host ?? hostParts(app.remoteUrl)?.host;
        if (host !== activeHost) return false;
      }
      return true;
    });
  }, [apps, hasFilters, activeStatus, activeCategoryId, activeHost, healthStatuses]);
  const clearFilters = () => { setActiveStatus(null); setActiveHost(null); setActiveCategoryId(null); };
  const activeCategoryName = categories.find((c) => c.id === activeCategoryId)?.name;

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {apps.length} app{apps.length !== 1 ? "s" : ""} configured
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sidebar toggle */}
          <Button
            variant={sidebarOpen ? "secondary" : "outline"}
            size="icon"
            className="h-10 w-10 sm:h-9 sm:w-9"
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Hide console" : "Show console"}
          >
            <PanelLeft className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="sr-only">Toggle ops console</span>
          </Button>

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none h-10 w-10 sm:h-9 sm:w-9"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none border-x h-10 w-10 sm:h-9 sm:w-9"
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none h-10 w-10 sm:h-9 sm:w-9"
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <Table2 className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Overflow menu: secondary + rare actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:h-9 sm:w-9"
                title="More actions"
              >
                <MoreHorizontal className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>View</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={groupByCategory}
                onCheckedChange={() => setGroupByCategory(!groupByCategory)}
                disabled={reorderMode}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Group by category
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showDependencyGraph}
                onCheckedChange={() => setShowDependencyGraph(!showDependencyGraph)}
                data-testid="dependency-graph-toggle"
              >
                <GitBranch className="mr-2 h-4 w-4" />
                Dependencies
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Edit</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={reorderMode}
                onCheckedChange={() => toggleReorderMode()}
                disabled={selectionMode}
              >
                <GripVertical className="mr-2 h-4 w-4" />
                Reorder apps
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectionMode}
                onCheckedChange={() => toggleSelectionMode()}
                disabled={reorderMode}
                data-testid="selection-mode-toggle"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Select apps
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDiscoveryOpen(true)}>
                <Radar className="mr-2 h-4 w-4" />
                Discover services
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => refreshHealth()} disabled={isHealthLoading}>
                <Activity className="mr-2 h-4 w-4" />
                Refresh health
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => refetchApps()} disabled={isAppsLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh apps
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add app (primary) — anchored to the right */}
          <Button size="icon" className="sm:hidden h-10 w-10 ml-auto" onClick={() => setFormOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
          <Button className="hidden sm:flex ml-auto" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add App
          </Button>
        </div>
      </div>

      {/* Ops console shell: left sidebar + main column */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {sidebarOpen && (
          <div className="lg:sticky lg:top-4 lg:w-60 shrink-0">
            <OpsSidebar
              apps={apps}
              categories={categories}
              healthStatuses={healthStatuses}
              enabled={!!session?.user}
              activeStatus={activeStatus}
              activeHost={activeHost}
              activeCategoryId={activeCategoryId}
              onToggleStatus={(s) => setActiveStatus((cur) => (cur === s ? null : s))}
              onToggleHost={(h) => setActiveHost((cur) => (cur === h ? null : h))}
              onToggleCategory={(id) => setActiveCategoryId((cur) => (cur === id ? null : id))}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}

        <div className="min-w-0 flex-1 flex flex-col gap-4">
          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="panel-label">Filtered</span>
              {activeStatus && (
                <FilterChip label={activeStatus} onClear={() => setActiveStatus(null)} />
              )}
              {activeHost && (
                <FilterChip label={activeHost} mono onClear={() => setActiveHost(null)} />
              )}
              {activeCategoryName && (
                <FilterChip label={activeCategoryName} onClear={() => setActiveCategoryId(null)} />
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear all
              </button>
              <span className="text-xs text-muted-foreground/70 font-mono tabular-nums">
                {visibleApps.length}/{apps.length}
              </span>
            </div>
          )}

      {/* Quick Links */}
      {apps.filter(app => app.pinned).length > 0 && (
        <QuickLinksBar
          apps={apps.filter(app => app.pinned)}
          healthStatuses={healthStatuses}
          healthBarStyle={healthBarStyle}
        />
      )}

      {/* Dependency Graph */}
      {showDependencyGraph && (
        <DependencyGraphView className="mb-2" />
      )}

      {/* Links Section */}
      <LinksGrid />

      {/* Widgets Section */}
      <WidgetGrid reorderMode={reorderMode} />

      {/* Bulk Actions Bar - shown when in selection mode */}
      {selectionMode && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          totalCount={apps.length}
          isAllSelected={selectedIds.size === apps.length && apps.length > 0}
          categories={categories}
          tags={tags}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkUpdateCategory={handleBulkUpdateCategory}
          onBulkUpdateTags={handleBulkUpdateTags}
          onBulkToggleHealthCheck={handleBulkToggleHealthCheck}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          isLoading={isBulkLoading}
        />
      )}

      {/* App Grid */}
      {isAppsLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reorderMode ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Drag apps to reorder. Changes are saved automatically.
          </p>
          <SortableAppGrid
            apps={apps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))}
            healthStatuses={healthStatuses}
            healthBarStyle={healthBarStyle}
            columns={4}
            viewMode={viewMode === "table" ? "list" : viewMode}
            onEditApp={handleEdit}
            onDeleteApp={handleDelete}
            onViewNotes={handleViewNotes}
            onPinApp={handlePin}
            onReorder={handleReorder}
            reorderEnabled={true}
          />
        </div>
      ) : hasFilters && visibleApps.length === 0 && apps.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-base font-medium">No apps match these filters</p>
            <p className="text-sm mt-1 font-mono tabular-nums">0 of {apps.length}</p>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <AppGrid
          apps={visibleApps}
          healthStatuses={healthStatuses}
          dependencyStatuses={dependencyStatuses}
          metrics={tableMetrics}
          healthBarStyle={healthBarStyle}
          columns={4}
          viewMode={viewMode}
          groupByCategory={groupByCategory}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectApp={handleSelectApp}
          onEditApp={handleEdit}
          onDeleteApp={handleDelete}
          onViewNotes={handleViewNotes}
          onPinApp={handlePin}
          onShareApp={handleShare}
        />
      )}
        </div>
      </div>

      {/* App Form Dialog */}
      <AppForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmit}
        app={editingApp}
        categories={categories}
        tags={tags}
        isLoading={isFormLoading}
      />

      {/* Notes Dialog */}
      <AppNotesDialog
        open={!!notesApp}
        onOpenChange={(open) => !open && setNotesApp(null)}
        app={notesApp}
      />

      {/* Service Discovery Dialog */}
      <ServiceDiscoveryDialog
        open={discoveryOpen}
        onOpenChange={setDiscoveryOpen}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={!!sharingApp}
        onOpenChange={(open) => !open && setSharingApp(null)}
        app={sharingApp ?? undefined}
      />
    </main>
  );
}

function FilterChip({ label, onClear, mono }: { label: string; onClear: () => void; mono?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 pl-2 pr-1 py-0.5 text-xs capitalize">
      <span className={mono ? "font-mono normal-case" : undefined}>{label}</span>
      <button onClick={onClear} className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Remove filter">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
