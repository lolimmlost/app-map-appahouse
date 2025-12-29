import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, LayoutGrid, List, Settings2, RefreshCw, Activity, Radar, GripVertical, CheckSquare } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { AppGrid, SortableAppGrid, AppForm, AppNotesDialog, QuickLinksBar, BulkActionsBar, ShareDialog, type AppFormData } from "@/components/apps";
import { WidgetGrid } from "@/components/widgets";
import { ServiceDiscoveryDialog } from "@/components/discovery";
import { getApps } from "@/lib/server/apps.server";
import { getCategories } from "@/lib/server/categories.server";
import { getTags } from "@/lib/server/tags.server";
import { getUserSettings } from "@/lib/server/user-settings.server";
import { useHealthStatus } from "@/hooks/use-health-status";
import { useAppMutations } from "@/hooks/use-app-mutations";
import type { App } from "@/types/database";

export const Route = createFileRoute("/")({ component: DashboardPage });

function DashboardPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();

  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [notesApp, setNotesApp] = useState<App | null>(null);
  const [sharingApp, setSharingApp] = useState<App | null>(null);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
  const { healthStatuses, isLoading: isHealthLoading, refreshHealth } = useHealthStatus(
    !!session?.user,
    30000 // Poll every 30 seconds
  );

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

  return (
    <main className="container mx-auto flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {apps.length} app{apps.length !== 1 ? "s" : ""} configured
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-2">
          {/* Refresh health button */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 sm:h-9 sm:w-9"
            onClick={() => refreshHealth()}
            disabled={isHealthLoading}
            title="Refresh health status"
          >
            <Activity className={`h-5 w-5 sm:h-4 sm:w-4 ${isHealthLoading ? "animate-pulse" : ""}`} />
          </Button>

          {/* Refresh apps button */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 sm:h-9 sm:w-9"
            onClick={() => refetchApps()}
            disabled={isAppsLoading}
            title="Refresh apps"
          >
            <RefreshCw className={`h-5 w-5 sm:h-4 sm:w-4 ${isAppsLoading ? "animate-spin" : ""}`} />
          </Button>

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none h-11 w-11 sm:h-9 sm:w-9"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none h-11 w-11 sm:h-9 sm:w-9"
              onClick={() => setViewMode("list")}
            >
              <List className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Reorder toggle */}
          <Button
            variant={reorderMode ? "secondary" : "outline"}
            size="icon"
            className="sm:hidden h-11 w-11"
            onClick={toggleReorderMode}
            disabled={selectionMode}
            title={reorderMode ? "Exit Reorder Mode" : "Reorder Apps"}
          >
            <GripVertical className="h-5 w-5" />
          </Button>
          <Button
            variant={reorderMode ? "secondary" : "outline"}
            size="sm"
            className="hidden sm:flex"
            onClick={toggleReorderMode}
            disabled={selectionMode}
          >
            <GripVertical className="h-4 w-4 mr-2" />
            {reorderMode ? "Done" : "Reorder"}
          </Button>

          {/* Selection mode toggle */}
          <Button
            variant={selectionMode ? "secondary" : "outline"}
            size="icon"
            className="sm:hidden h-11 w-11"
            onClick={toggleSelectionMode}
            disabled={reorderMode}
            title={selectionMode ? "Exit Selection Mode" : "Select Apps"}
            data-testid="selection-mode-toggle"
          >
            <CheckSquare className="h-5 w-5" />
          </Button>
          <Button
            variant={selectionMode ? "secondary" : "outline"}
            size="sm"
            className="hidden sm:flex"
            onClick={toggleSelectionMode}
            disabled={reorderMode}
            data-testid="selection-mode-toggle-desktop"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            {selectionMode ? "Done" : "Select"}
          </Button>

          {/* Group toggle */}
          <Button
            variant={groupByCategory ? "secondary" : "outline"}
            size="icon"
            className="sm:hidden h-11 w-11"
            onClick={() => setGroupByCategory(!groupByCategory)}
            disabled={reorderMode}
            title="Group by Category"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
          <Button
            variant={groupByCategory ? "secondary" : "outline"}
            size="sm"
            className="hidden sm:flex"
            onClick={() => setGroupByCategory(!groupByCategory)}
            disabled={reorderMode}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Group by Category
          </Button>

          {/* Discover button */}
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden h-11 w-11"
            onClick={() => setDiscoveryOpen(true)}
            title="Discover Services"
          >
            <Radar className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => setDiscoveryOpen(true)}
          >
            <Radar className="h-4 w-4 mr-2" />
            Discover
          </Button>

          {/* Add app button */}
          <Button size="icon" className="sm:hidden h-11 w-11" onClick={() => setFormOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
          <Button className="hidden sm:flex" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add App
          </Button>
        </div>
      </div>

      {/* Quick Links */}
      {apps.filter(app => app.pinned).length > 0 && (
        <QuickLinksBar
          apps={apps.filter(app => app.pinned)}
          healthStatuses={healthStatuses}
          healthBarStyle={healthBarStyle}
        />
      )}

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
            viewMode={viewMode}
            onEditApp={handleEdit}
            onDeleteApp={handleDelete}
            onViewNotes={handleViewNotes}
            onPinApp={handlePin}
            onReorder={handleReorder}
            reorderEnabled={true}
          />
        </div>
      ) : (
        <AppGrid
          apps={apps}
          healthStatuses={healthStatuses}
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
