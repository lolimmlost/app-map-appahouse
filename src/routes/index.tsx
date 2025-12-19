import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, LayoutGrid, List, Settings2, RefreshCw, Activity } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { AppGrid, AppForm, AppNotesDialog, QuickLinksBar, type AppFormData } from "@/components/apps";
import { WidgetGrid } from "@/components/widgets";
import { getApps, createApp, updateApp, deleteApp, pinApp } from "@/lib/server/apps";
import { getCategories } from "@/lib/server/categories";
import { getTags } from "@/lib/server/tags";
import { getUserSettings } from "@/lib/server/user-settings";
import { useHealthStatus } from "@/hooks/use-health-status";
import type { App } from "@/database/schema/apps";

export const Route = createFileRoute("/")({ component: DashboardPage });

function DashboardPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [notesApp, setNotesApp] = useState<App | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [groupByCategory, setGroupByCategory] = useState(true);

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

  // Create app mutation
  const createMutation = useMutation({
    mutationFn: (data: AppFormData) =>
      createApp({
        data: {
          name: data.name,
          description: data.description || null,
          icon: data.icon || null,
          localUrl: data.localUrl || null,
          remoteUrl: data.remoteUrl || null,
          categoryId: data.categoryId,
          healthCheckEnabled: data.healthCheckEnabled,
          healthCheckType: data.healthCheckType,
          healthCheckUrl: data.healthCheckUrl || null,
          uptimeKumaMonitorId: data.uptimeKumaMonitorId || null,
          notes: data.notes || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setFormOpen(false);
    },
  });

  // Update app mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppFormData }) =>
      updateApp({
        data: {
          id,
          name: data.name,
          description: data.description || null,
          icon: data.icon || null,
          localUrl: data.localUrl || null,
          remoteUrl: data.remoteUrl || null,
          categoryId: data.categoryId,
          healthCheckEnabled: data.healthCheckEnabled,
          healthCheckType: data.healthCheckType,
          healthCheckUrl: data.healthCheckUrl || null,
          uptimeKumaMonitorId: data.uptimeKumaMonitorId || null,
          notes: data.notes || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setFormOpen(false);
      setEditingApp(null);
    },
  });

  // Delete app mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApp({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  // Pin app mutation
  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      pinApp({ data: { id, pinned } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
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

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingApp(null);
    }
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh health button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refreshHealth()}
            disabled={isHealthLoading}
            title="Refresh health status"
          >
            <Activity className={`h-4 w-4 ${isHealthLoading ? "animate-pulse" : ""}`} />
          </Button>

          {/* Refresh apps button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchApps()}
            disabled={isAppsLoading}
            title="Refresh apps"
          >
            <RefreshCw className={`h-4 w-4 ${isAppsLoading ? "animate-spin" : ""}`} />
          </Button>

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Group toggle */}
          <Button
            variant={groupByCategory ? "secondary" : "outline"}
            size="icon"
            className="sm:hidden"
            onClick={() => setGroupByCategory(!groupByCategory)}
            title="Group by Category"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            variant={groupByCategory ? "secondary" : "outline"}
            size="sm"
            className="hidden sm:flex"
            onClick={() => setGroupByCategory(!groupByCategory)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Group by Category
          </Button>

          {/* Add app button */}
          <Button size="icon" className="sm:hidden" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
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
      <WidgetGrid />

      {/* App Grid */}
      {isAppsLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AppGrid
          apps={apps}
          healthStatuses={healthStatuses}
          healthBarStyle={healthBarStyle}
          columns={4}
          viewMode={viewMode}
          groupByCategory={groupByCategory}
          onEditApp={handleEdit}
          onDeleteApp={handleDelete}
          onViewNotes={handleViewNotes}
          onPinApp={handlePin}
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
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Notes Dialog */}
      <AppNotesDialog
        open={!!notesApp}
        onOpenChange={(open) => !open && setNotesApp(null)}
        app={notesApp}
      />
    </main>
  );
}
