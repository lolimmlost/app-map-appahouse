import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Image,
  FolderOpen,
  Activity,
  MoreHorizontal,
  CheckSquare,
  Square,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getApps,
  deleteApp,
  bulkDeleteApps,
  bulkUpdateCategory,
  bulkToggleHealthCheck,
  refreshAppIcons,
} from "@/lib/server/apps";
import { getCategories } from "@/lib/server/categories";
import type { App } from "@/database/schema/apps";
import type { Category } from "@/database/schema/categories";

export const Route = createFileRoute("/apps")({ component: AppsPage });

type AppWithCategory = App & { category?: Category | null; tags?: { id: string; name: string; color: string | null }[] };

function AppsPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");

  // Fetch apps
  const { data: appsData, isLoading: isAppsLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => getApps(),
    enabled: !!session?.user,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: !!session?.user,
  });

  const apps = (appsData?.apps ?? []) as AppWithCategory[];
  const categories = categoriesData?.categories ?? [];

  // Filter apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        searchQuery === "" ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.localUrl?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "uncategorized" && !app.categoryId) ||
        app.categoryId === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [apps, searchQuery, categoryFilter]);

  // Mutations
  const deleteAppMutation = useMutation({
    mutationFn: (id: string) => deleteApp({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteApps({ data: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setSelectedIds(new Set());
    },
  });

  const bulkCategoryMutation = useMutation({
    mutationFn: (data: { ids: string[]; categoryId: string | null }) =>
      bulkUpdateCategory({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setSelectedIds(new Set());
      setBulkCategoryDialogOpen(false);
    },
  });

  const bulkHealthCheckMutation = useMutation({
    mutationFn: (data: { ids: string[]; enabled: boolean }) =>
      bulkToggleHealthCheck({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setSelectedIds(new Set());
    },
  });

  const refreshIconsMutation = useMutation({
    mutationFn: (ids: string[]) => refreshAppIcons({ data: { ids } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setSelectedIds(new Set());
      if (data.updated > 0) {
        alert(`Updated ${data.updated} app icon(s)`);
      } else {
        alert("No matching icons found for selected apps");
      }
    },
  });

  // Handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApps.map((a) => a.id)));
    }
  };

  const handleDelete = (app: AppWithCategory) => {
    if (confirm(`Delete "${app.name}"?`)) {
      deleteAppMutation.mutate(app.id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} selected app(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleBulkCategory = () => {
    if (selectedIds.size === 0) return;
    setBulkCategoryDialogOpen(true);
  };

  const handleBulkCategorySubmit = () => {
    bulkCategoryMutation.mutate({
      ids: Array.from(selectedIds),
      categoryId: bulkCategoryId === "uncategorized" ? null : bulkCategoryId,
    });
  };

  const handleBulkHealthCheck = (enabled: boolean) => {
    if (selectedIds.size === 0) return;
    bulkHealthCheckMutation.mutate({
      ids: Array.from(selectedIds),
      enabled,
    });
  };

  const handleRefreshIcons = () => {
    if (selectedIds.size === 0) {
      // Refresh all apps
      if (confirm("Refresh icons for all apps?")) {
        refreshIconsMutation.mutate(apps.map((a) => a.id));
      }
    } else {
      refreshIconsMutation.mutate(Array.from(selectedIds));
    }
  };

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Apps</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your apps</p>
        </div>
      </main>
    );
  }

  const selectedCount = selectedIds.size;
  const isAllSelected = filteredApps.length > 0 && selectedIds.size === filteredApps.length;

  return (
    <main className="container mx-auto flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Apps</h1>
          <p className="text-muted-foreground">Manage all your apps in one place</p>
        </div>
        <Link to="/">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <Card className="border-primary">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium mr-2">
                {selectedCount} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkCategory}
                disabled={bulkCategoryMutation.isPending}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Set Category
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkHealthCheck(true)}
                disabled={bulkHealthCheckMutation.isPending}
              >
                <Activity className="h-4 w-4 mr-2" />
                Enable Health Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkHealthCheck(false)}
                disabled={bulkHealthCheckMutation.isPending}
              >
                <Activity className="h-4 w-4 mr-2" />
                Disable Health Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshIcons}
                disabled={refreshIconsMutation.isPending}
              >
                <Image className="h-4 w-4 mr-2" />
                Refresh Icons
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apps Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">
            {filteredApps.length} App{filteredApps.length !== 1 ? "s" : ""}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshIcons}
              disabled={refreshIconsMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshIconsMutation.isPending ? "animate-spin" : ""}`} />
              Refresh All Icons
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAppsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : filteredApps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {apps.length === 0
                ? "No apps yet. Add some from the dashboard or use the Discover feature!"
                : "No apps match your search"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 w-10">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 pr-4 w-12">Icon</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4 hidden md:table-cell">URL</th>
                    <th className="pb-3 pr-4 hidden sm:table-cell">Category</th>
                    <th className="pb-3 pr-4 hidden lg:table-cell">Health</th>
                    <th className="pb-3 pr-4 hidden lg:table-cell">Source</th>
                    <th className="pb-3 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Checkbox
                          checked={selectedIds.has(app.id)}
                          onCheckedChange={() => toggleSelect(app.id)}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        {app.icon ? (
                          <img
                            src={app.icon}
                            alt=""
                            className="h-8 w-8 rounded object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-medium">
                            {app.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{app.name}</div>
                        {app.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {app.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        {app.localUrl && (
                          <a
                            href={app.localUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline truncate block max-w-[200px]"
                          >
                            {app.localUrl}
                          </a>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        {app.category ? (
                          <Badge variant="outline">
                            {app.category.icon && <span className="mr-1">{app.category.icon}</span>}
                            {app.category.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        {app.healthCheckEnabled ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Enabled
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        {app.discoverySource ? (
                          <Badge variant="secondary" className="text-xs">
                            {app.discoverySource}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">manual</span>
                        )}
                      </td>
                      <td className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {app.localUrl && (
                              <DropdownMenuItem asChild>
                                <a href={app.localUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                refreshIconsMutation.mutate([app.id]);
                              }}
                            >
                              <Image className="h-4 w-4 mr-2" />
                              Refresh Icon
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(app)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Category Dialog */}
      <Dialog open={bulkCategoryDialogOpen} onOpenChange={setBulkCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Category</DialogTitle>
            <DialogDescription>
              Assign a category to {selectedCount} selected app(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-category">Category</Label>
            <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkCategorySubmit}
              disabled={!bulkCategoryId || bulkCategoryMutation.isPending}
            >
              {bulkCategoryMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
