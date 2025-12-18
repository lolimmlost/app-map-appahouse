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
import { getApps } from "@/lib/server/apps";
import type { App } from "@/database/schema/apps";

interface CommandPaletteProps {
  onAddApp?: () => void;
}

// Client-only wrapper to avoid SSR issues with useQuery
function CommandPaletteClient({ onAddApp }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: session } = useAuthenticate();

  // Fetch apps for search
  const { data: appsData } = useQuery({
    queryKey: ["apps"],
    queryFn: () => getApps(),
    enabled: !!session?.user,
  });

  const apps = appsData?.apps ?? [];

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
      // Ensure URL has a protocol
      const normalizedUrl = url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `http://${url}`;
      window.open(normalizedUrl, "_blank");
    }
    setOpen(false);
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

  return (
    <>
      {/* Search trigger button - can be placed in header */}
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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search apps, pages, or actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Apps */}
          {apps.length > 0 && (
            <CommandGroup heading="Apps">
              {apps.slice(0, 8).map((app) => (
                <CommandItem
                  key={app.id}
                  value={`app-${app.name}-${app.description || ""}`}
                  onSelect={() => handleOpenApp(app)}
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
                  <div className="flex-1">
                    <span>{app.name}</span>
                    {app.description && (
                      <span className="ml-2 text-muted-foreground text-xs">
                        {app.description}
                      </span>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
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
              value="categories tags"
              onSelect={() => handleNavigate("/categories")}
            >
              <Tags className="mr-2 h-4 w-4" />
              <span>Categories & Tags</span>
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
            <CommandItem value="add new app" onSelect={handleAddApp}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add New App</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Exported wrapper - renders nothing on server, renders client component on client
export function CommandPalette({ onAddApp }: CommandPaletteProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return placeholder on server to avoid SSR issues with useQuery
  if (!mounted) {
    return (
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
    );
  }

  return <CommandPaletteClient onAddApp={onAddApp} />;
}
