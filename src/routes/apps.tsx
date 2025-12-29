import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trash2,
  Search,
  Image,
  FolderOpen,
  Activity,
  MoreHorizontal,
  RefreshCw,
  ExternalLink,
  Tag,
  Pin,
  X,
  Save,
  BookmarkPlus,
  Bookmark,
  Star,
  ChevronDown,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getApps,
  deleteApp,
  bulkDeleteApps,
  bulkUpdateCategory,
  bulkToggleHealthCheck,
  refreshAppIcons,
} from "@/lib/server/apps.server";
import { getCategories } from "@/lib/server/categories.server";
import { getTags } from "@/lib/server/tags.server";
import {
  getSavedViews,
  createSavedView,
  updateSavedView,
  deleteSavedView,
  setDefaultView,
} from "@/lib/server/saved-views.server";
import type { App, Tag as DbTag } from "@/types/database";
import type { Category } from "@/types/database";
import type { SavedView, SearchViewFilters } from "@/types/database";

export const Route = createFileRoute("/apps")({ component: AppsPage });

type AppWithCategory = App & {
  category?: Category | null;
  tags?: { id: string; name: string; color: string | null }[]
};

// Default empty filters
const defaultFilters: SearchViewFilters = {
  searchQuery: "",
  categoryIds: [],
  tagIds: [],
  healthStatus: "all",
  pinnedOnly: false,
  discoverySource: null,
};

function AppsPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const queryClient = useQueryClient();

  // Filter state
  const [filters, setFilters] = useState<SearchViewFilters>(defaultFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dialog states
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [viewDescription, setViewDescription] = useState("");
  const [viewIsDefault, setViewIsDefault] = useState(false);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

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

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
    enabled: !!session?.user,
  });

  // Fetch saved views
  const { data: savedViewsData } = useQuery({
    queryKey: ["savedViews"],
    queryFn: () => getSavedViews(),
    enabled: !!session?.user,
  });

  const apps = (appsData?.apps ?? []) as AppWithCategory[];
  const categories = categoriesData?.categories ?? [];
  const tags = tagsData?.tags ?? [];
  const savedViews = savedViewsData?.views ?? [];

  // Load default view on initial load
  useEffect(() => {
    if (savedViews.length > 0 && !activeViewId) {
      const defaultView = savedViews.find((v) => v.isDefault);
      if (defaultView) {
        setActiveViewId(defaultView.id);
        setFilters(defaultView.filters);
      }
    }
  }, [savedViews, activeViewId]);

  // Get unique discovery sources from apps
  const discoverySources = useMemo(() => {
    const sources = new Set<string>();
    apps.forEach((app) => {
      if (app.discoverySource) {
        sources.add(app.discoverySource);
      }
    });
    return Array.from(sources).sort();
  }, [apps]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.searchQuery && filters.searchQuery.length > 0) ||
      (filters.categoryIds && filters.categoryIds.length > 0) ||
      (filters.tagIds && filters.tagIds.length > 0) ||
      filters.healthStatus !== "all" ||
      filters.pinnedOnly ||
      filters.discoverySource !== null
    );
  }, [filters]);

  // Filter apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Search query filter (searches name, description, URL, and notes)
      const searchQuery = filters.searchQuery?.toLowerCase() || "";
      const matchesSearch =
        searchQuery === "" ||
        app.name.toLowerCase().includes(searchQuery) ||
        app.description?.toLowerCase().includes(searchQuery) ||
        app.localUrl?.toLowerCase().includes(searchQuery) ||
        app.remoteUrl?.toLowerCase().includes(searchQuery) ||
        app.notes?.toLowerCase().includes(searchQuery);

      // Category filter (supports multiple categories)
      const matchesCategory =
        !filters.categoryIds?.length ||
        (filters.categoryIds.includes("uncategorized") && !app.categoryId) ||
        (app.categoryId && filters.categoryIds.includes(app.categoryId));

      // Tag filter (supports multiple tags - app must have at least one matching tag)
      const matchesTags =
        !filters.tagIds?.length ||
        (app.tags && app.tags.some((tag) => filters.tagIds?.includes(tag.id)));

      // Health status filter
      const matchesHealthStatus =
        filters.healthStatus === "all" ||
        (filters.healthStatus === "enabled" && app.healthCheckEnabled) ||
        (filters.healthStatus === "disabled" && !app.healthCheckEnabled);

      // Pinned only filter
      const matchesPinned = !filters.pinnedOnly || app.pinned;

      // Discovery source filter
      const matchesDiscoverySource =
        filters.discoverySource === null ||
        (filters.discoverySource === "manual" && !app.discoverySource) ||
        app.discoverySource === filters.discoverySource;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesTags &&
        matchesHealthStatus &&
        matchesPinned &&
        matchesDiscoverySource
      );
    });
  }, [apps, filters]);

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

  // Saved views mutations
  const createViewMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; filters: SearchViewFilters; isDefault?: boolean }) =>
      createSavedView({ data }),
    onSuccess: (newView) => {
      queryClient.invalidateQueries({ queryKey: ["savedViews"] });
      setSaveViewDialogOpen(false);
      setViewName("");
      setViewDescription("");
      setViewIsDefault(false);
      setActiveViewId(newView.id);
    },
  });

  const updateViewMutation = useMutation({
    mutationFn: (data: { id: string; filters?: SearchViewFilters; isDefault?: boolean }) =>
      updateSavedView({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedViews"] });
    },
  });

  const deleteViewMutation = useMutation({
    mutationFn: (id: string) => deleteSavedView({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedViews"] });
      if (activeViewId) {
        setActiveViewId(null);
        setFilters(defaultFilters);
      }
    },
  });

  const setDefaultViewMutation = useMutation({
    mutationFn: (id: string | null) => setDefaultView({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedViews"] });
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
      if (confirm("Refresh icons for all apps?")) {
        refreshIconsMutation.mutate(apps.map((a) => a.id));
      }
    } else {
      refreshIconsMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setActiveViewId(null);
  };

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    createViewMutation.mutate({
      name: viewName.trim(),
      description: viewDescription.trim() || undefined,
      filters,
      isDefault: viewIsDefault,
    });
  };

  const handleLoadView = (view: SavedView) => {
    setActiveViewId(view.id);
    setFilters(view.filters);
  };

  const handleUpdateCurrentView = () => {
    if (!activeViewId) return;
    updateViewMutation.mutate({
      id: activeViewId,
      filters,
    });
  };

  const handleDeleteView = (view: SavedView) => {
    if (confirm(`Delete saved view "${view.name}"?`)) {
      deleteViewMutation.mutate(view.id);
    }
  };

  const handleSetDefaultView = (view: SavedView) => {
    setDefaultViewMutation.mutate(view.isDefault ? null : view.id);
  };

  const toggleCategoryFilter = (categoryId: string) => {
    setFilters((prev) => {
      const currentIds = prev.categoryIds || [];
      const newIds = currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId];
      return { ...prev, categoryIds: newIds };
    });
    setActiveViewId(null);
  };

  const toggleTagFilter = (tagId: string) => {
    setFilters((prev) => {
      const currentIds = prev.tagIds || [];
      const newIds = currentIds.includes(tagId)
        ? currentIds.filter((id) => id !== tagId)
        : [...currentIds, tagId];
      return { ...prev, tagIds: newIds };
    });
    setActiveViewId(null);
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
  const activeView = savedViews.find((v) => v.id === activeViewId);

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

      {/* Saved Views Bar */}
      {savedViews.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">
            <Bookmark className="h-4 w-4 inline mr-1" />
            Views:
          </span>
          {savedViews.map((view) => (
            <Button
              key={view.id}
              variant={activeViewId === view.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleLoadView(view)}
              className="group relative"
            >
              {view.isDefault && <Star className="h-3 w-3 mr-1 fill-current" />}
              {view.name}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSetDefaultView(view)}>
                    <Star className={`h-4 w-4 mr-2 ${view.isDefault ? "fill-current" : ""}`} />
                    {view.isDefault ? "Remove as Default" : "Set as Default"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteView(view)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Button>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Main search row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search apps by name, description, URL, or notes..."
                  value={filters.searchQuery || ""}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
                    setActiveViewId(null);
                  }}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>

              {/* Category dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto" data-testid="category-filter">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Categories
                    {filters.categoryIds?.length ? (
                      <Badge variant="secondary" className="ml-2">
                        {filters.categoryIds.length}
                      </Badge>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.categoryIds?.includes("uncategorized")}
                    onCheckedChange={() => toggleCategoryFilter("uncategorized")}
                  >
                    Uncategorized
                  </DropdownMenuCheckboxItem>
                  {categories.map((cat) => (
                    <DropdownMenuCheckboxItem
                      key={cat.id}
                      checked={filters.categoryIds?.includes(cat.id)}
                      onCheckedChange={() => toggleCategoryFilter(cat.id)}
                    >
                      {cat.icon && <span className="mr-2">{cat.icon}</span>}
                      {cat.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tags dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto" data-testid="tag-filter">
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                    {filters.tagIds?.length ? (
                      <Badge variant="secondary" className="ml-2">
                        {filters.tagIds.length}
                      </Badge>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tags.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No tags available</div>
                  ) : (
                    tags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        checked={filters.tagIds?.includes(tag.id)}
                        onCheckedChange={() => toggleTagFilter(tag.id)}
                      >
                        <span
                          className="w-3 h-3 rounded-full mr-2 inline-block"
                          style={{ backgroundColor: tag.color || "#6b7280" }}
                        />
                        {tag.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Advanced filters toggle */}
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                data-testid="advanced-filters-toggle"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                More Filters
                {(filters.healthStatus !== "all" || filters.pinnedOnly || filters.discoverySource !== null) && (
                  <Badge variant="secondary" className="ml-2">!</Badge>
                )}
              </Button>
            </div>

            {/* Advanced filters */}
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleContent>
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                  {/* Health status */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Health Check:</Label>
                    <Select
                      value={filters.healthStatus || "all"}
                      onValueChange={(value: "all" | "enabled" | "disabled") => {
                        setFilters((prev) => ({ ...prev, healthStatus: value }));
                        setActiveViewId(null);
                      }}
                    >
                      <SelectTrigger className="w-32" data-testid="health-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pinned only */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pinned-only"
                      checked={filters.pinnedOnly || false}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({ ...prev, pinnedOnly: checked }));
                        setActiveViewId(null);
                      }}
                      data-testid="pinned-only-filter"
                    />
                    <Label htmlFor="pinned-only" className="text-sm flex items-center gap-1">
                      <Pin className="h-4 w-4" />
                      Pinned Only
                    </Label>
                  </div>

                  {/* Discovery source */}
                  {discoverySources.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Source:</Label>
                      <Select
                        value={filters.discoverySource === null ? "all" : filters.discoverySource || "manual"}
                        onValueChange={(value) => {
                          setFilters((prev) => ({
                            ...prev,
                            discoverySource: value === "all" ? null : value,
                          }));
                          setActiveViewId(null);
                        }}
                      >
                        <SelectTrigger className="w-40" data-testid="discovery-source-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          {discoverySources.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Active filters and actions */}
            {(hasActiveFilters || activeView) && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                {activeView && (
                  <Badge variant="outline" className="bg-primary/10">
                    <Bookmark className="h-3 w-3 mr-1" />
                    {activeView.name}
                  </Badge>
                )}

                {filters.searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{filters.searchQuery}"
                    <button onClick={() => setFilters((prev) => ({ ...prev, searchQuery: "" }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {filters.categoryIds?.map((catId) => {
                  const category = catId === "uncategorized"
                    ? { id: "uncategorized", name: "Uncategorized", icon: null }
                    : categories.find((c) => c.id === catId);
                  if (!category) return null;
                  return (
                    <Badge key={catId} variant="secondary" className="gap-1">
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                      <button onClick={() => toggleCategoryFilter(catId)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}

                {filters.tagIds?.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge key={tagId} variant="secondary" className="gap-1">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: tag.color || "#6b7280" }}
                      />
                      {tag.name}
                      <button onClick={() => toggleTagFilter(tagId)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}

                {filters.healthStatus !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Health: {filters.healthStatus}
                    <button onClick={() => setFilters((prev) => ({ ...prev, healthStatus: "all" }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {filters.pinnedOnly && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="h-3 w-3" />
                    Pinned Only
                    <button onClick={() => setFilters((prev) => ({ ...prev, pinnedOnly: false }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {filters.discoverySource !== null && (
                  <Badge variant="secondary" className="gap-1">
                    Source: {filters.discoverySource || "manual"}
                    <button onClick={() => setFilters((prev) => ({ ...prev, discoverySource: null }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                <div className="flex-1" />

                {/* Save/Update View buttons */}
                {hasActiveFilters && !activeView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveViewDialogOpen(true)}
                    data-testid="save-view-button"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Save as View
                  </Button>
                )}

                {activeView && hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateCurrentView}
                    disabled={updateViewMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update View
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={handleClearFilters} data-testid="clear-filters">
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
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
          <CardTitle className="text-lg" data-testid="apps-count">
            {filteredApps.length} App{filteredApps.length !== 1 ? "s" : ""}
            {hasActiveFilters && apps.length !== filteredApps.length && (
              <span className="text-muted-foreground font-normal ml-2">
                (of {apps.length} total)
              </span>
            )}
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
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="no-apps-message">
              {apps.length === 0
                ? "No apps yet. Add some from the dashboard or use the Discover feature!"
                : "No apps match your filters"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="apps-table">
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
                    <th className="pb-3 pr-4 hidden lg:table-cell">Tags</th>
                    <th className="pb-3 pr-4 hidden lg:table-cell">Health</th>
                    <th className="pb-3 pr-4 hidden lg:table-cell">Source</th>
                    <th className="pb-3 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="border-b last:border-0" data-testid={`app-row-${app.id}`}>
                      <td className="py-3 pr-4">
                        <Checkbox
                          checked={selectedIds.has(app.id)}
                          onCheckedChange={() => toggleSelect(app.id)}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="relative">
                          {app.pinned && (
                            <Pin className="h-3 w-3 absolute -top-1 -right-1 text-primary" />
                          )}
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
                        </div>
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
                        {app.tags && app.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {app.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: `${tag.color}20` || "#6b728020",
                                  borderColor: tag.color || "#6b7280",
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {app.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{app.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        {app.healthCheckEnabled ? (
                          <Badge variant="outline" className="text-success border-success">
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

      {/* Save View Dialog */}
      <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as View</DialogTitle>
            <DialogDescription>
              Save the current filter settings as a reusable view for quick access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">View Name</Label>
              <Input
                id="view-name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="e.g., Production Apps, Docker Services..."
                data-testid="view-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="view-description">Description (optional)</Label>
              <Input
                id="view-description"
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                placeholder="Optional description for this view"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="view-default"
                checked={viewIsDefault}
                onCheckedChange={setViewIsDefault}
              />
              <Label htmlFor="view-default" className="text-sm">
                Set as default view (loads automatically)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveViewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveView}
              disabled={!viewName.trim() || createViewMutation.isPending}
              data-testid="save-view-confirm"
            >
              {createViewMutation.isPending ? "Saving..." : "Save View"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
