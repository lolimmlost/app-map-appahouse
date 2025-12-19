import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import {
  ExternalLink,
  Layers,
  Tags,
  Settings,
  Plus,
  Search,
  Plug,
  Copy,
  FileText,
  Folder,
  Tag,
  Check,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getApps } from "@/lib/server/apps";
import { getTags } from "@/lib/server/tags";
import { getCategories } from "@/lib/server/categories";
import type { App } from "@/database/schema/apps";
import type { Category } from "@/database/schema/categories";

interface CommandPaletteProps {
  onAddApp?: () => void;
  onFilterByCategory?: (categoryId: string | null) => void;
  onFilterByTag?: (tagId: string | null) => void;
}

// Client-only wrapper to avoid SSR issues with useQuery
function CommandPaletteClient({ onAddApp, onFilterByCategory, onFilterByTag }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: session } = useAuthenticate();

  // Fetch apps for search
  const { data: appsData } = useQuery({
    queryKey: ["apps"],
    queryFn: () => getApps(),
    enabled: !!session?.user,
  });

  // Fetch tags for search
  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
    enabled: !!session?.user,
  });

  // Fetch categories for search
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: !!session?.user,
  });

  const apps = appsData?.apps ?? [];
  const tags = tagsData?.tags ?? [];
  const categories = categoriesData?.categories ?? [];

  // Apps with notes for searching
  const appsWithNotes = apps.filter((app) => app.notes && app.notes.trim().length > 0);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenApp = useCallback((app: App) => {
    const url = app.localUrl || app.remoteUrl;
    if (url) {
      const normalizedUrl = url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `http://${url}`;
      window.open(normalizedUrl, "_blank");
    }
    setOpen(false);
  }, []);

  const handleCopyUrl = useCallback((app: App) => {
    const url = app.localUrl || app.remoteUrl;
    if (url) {
      const normalizedUrl = url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `http://${url}`;
      navigator.clipboard.writeText(normalizedUrl);
      setCopiedId(app.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate({ to: path });
      setOpen(false);
    },
    [navigate]
  );

  const handleAddApp = useCallback(() => {
    onAddApp?.();
    setOpen(false);
  }, [onAddApp]);

  const handleFilterByCategory = useCallback(
    (categoryId: string) => {
      onFilterByCategory?.(categoryId);
      setOpen(false);
    },
    [onFilterByCategory]
  );

  const handleFilterByTag = useCallback(
    (tagId: string) => {
      onFilterByTag?.(tagId);
      setOpen(false);
    },
    [onFilterByTag]
  );

  return (
    <>
      {/* Desktop search trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Mobile search trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search apps, categories, tags, notes..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Apps */}
          {apps.length > 0 && (
            <CommandGroup heading="Apps">
              {apps.slice(0, 8).map((app) => (
                <CommandItem
                  key={app.id}
                  value={`app-${app.name}-${app.description || ""}-${app.notes || ""}`}
                  onSelect={() => handleOpenApp(app)}
                  className="group"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-muted mr-2">
                    {app.icon ? (
                      app.icon.startsWith("http") ? (
                        <img
                          src={app.icon}
                          alt=""
                          className="h-4 w-4 object-contain"
                        />
                      ) : (
                        <span className="text-sm">{app.icon}</span>
                      )
                    ) : (
                      <span className="text-xs font-semibold">
                        {app.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{app.name}</span>
                    {app.description && (
                      <span className="ml-2 text-muted-foreground text-xs truncate">
                        {app.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(app);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                      title="Copy URL"
                    >
                      {copiedId === app.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Apps with Notes */}
          {appsWithNotes.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Apps with Notes">
                {appsWithNotes.slice(0, 5).map((app) => (
                  <CommandItem
                    key={`notes-${app.id}`}
                    value={`notes-${app.name}-${app.notes}`}
                    onSelect={() => handleOpenApp(app)}
                  >
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{app.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs truncate block">
                        {app.notes?.slice(0, 60)}...
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Categories">
                {categories.slice(0, 6).map((category) => (
                  <CommandItem
                    key={category.id}
                    value={`category-${category.name}`}
                    onSelect={() => handleFilterByCategory(category.id)}
                  >
                    <Folder className="h-4 w-4 mr-2" style={{ color: category.color || undefined }} />
                    <span>{category.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Filter
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Tags">
                {tags.slice(0, 6).map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={`tag-${tag.name}`}
                    onSelect={() => handleFilterByTag(tag.id)}
                  >
                    <Tag className="h-4 w-4 mr-2" style={{ color: tag.color || undefined }} />
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: tag.color || undefined, color: tag.color || undefined }}
                    >
                      {tag.name}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Filter
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem
              value="dashboard home"
              onSelect={() => handleNavigate("/")}
            >
              <Layers className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              value="categories tags management"
              onSelect={() => handleNavigate("/categories")}
            >
              <Tags className="mr-2 h-4 w-4" />
              <span>Categories & Tags</span>
            </CommandItem>
            <CommandItem
              value="integrations connections"
              onSelect={() => handleNavigate("/integrations")}
            >
              <Plug className="mr-2 h-4 w-4" />
              <span>Integrations</span>
            </CommandItem>
            <CommandItem
              value="settings preferences"
              onSelect={() => handleNavigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Actions */}
          <CommandGroup heading="Actions">
            <CommandItem value="add new app create" onSelect={handleAddApp}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add New App</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            {onFilterByCategory && (
              <CommandItem
                value="clear filter show all"
                onSelect={() => {
                  onFilterByCategory(null);
                  onFilterByTag?.(null);
                  setOpen(false);
                }}
              >
                <Layers className="mr-2 h-4 w-4" />
                <span>Clear All Filters</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Exported wrapper - renders nothing on server, renders client component on client
export function CommandPalette({ onAddApp, onFilterByCategory, onFilterByTag }: CommandPaletteProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return placeholder on server to avoid SSR issues with useQuery
  if (!mounted) {
    return (
      <>
        <button
          className="hidden md:inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground"
          disabled
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <Button variant="ghost" size="icon" className="md:hidden" disabled>
          <Search className="h-5 w-5" />
        </Button>
      </>
    );
  }

  return <CommandPaletteClient onAddApp={onAddApp} onFilterByCategory={onFilterByCategory} onFilterByTag={onFilterByTag} />;
}
