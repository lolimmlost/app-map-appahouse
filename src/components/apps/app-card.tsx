import { useState } from "react";
import { Copy, MoreVertical, Pencil, Trash2, StickyNote, Home, Globe, Pin, PinOff, Check, Share2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { useTrackAppAccess } from "@/hooks/use-analytics";
import { useScrollGuard } from "@/hooks/use-scroll-guard";
import type { App, Tag } from "@/types/database";
import type { Category } from "@/types/database";
import type { GranularPermissions } from "@/types/database";

export type HealthStatus = "online" | "offline" | "unknown" | "checking";
export type DependencyStatus = "healthy" | "degraded" | "offline";

interface AppCardProps {
  app: App & {
    category?: Category | null;
    tags?: { tag: Tag }[] | Tag[];
    isOwner?: boolean;
    sharedBy?: { id: string; name: string; email: string; image?: string | null };
    permissions?: GranularPermissions;
  };
  healthStatus?: HealthStatus;
  dependencyStatus?: DependencyStatus;
  healthBarStyle?: "dot" | "border" | "none";
  viewMode?: "grid" | "list" | "table";
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (app: App) => void;
  onEdit?: (app: App) => void;
  onDelete?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPin?: (app: App, pinned: boolean) => void;
  onShare?: (app: App) => void;
}

const healthColors: Record<HealthStatus, string> = {
  online: "text-status-online",
  offline: "text-status-offline",
  unknown: "text-status-unknown",
  checking: "text-status-pending animate-pulse",
};

const healthBorderColors: Record<HealthStatus, string> = {
  online: "border-status-online",
  offline: "border-status-offline",
  unknown: "border-status-unknown",
  checking: "border-status-pending",
};

const dependencyStatusColors: Record<DependencyStatus, string> = {
  healthy: "text-status-online",
  degraded: "text-warning",
  offline: "text-status-offline",
};

export function AppCard({
  app,
  healthStatus = "unknown",
  dependencyStatus,
  healthBarStyle = "dot",
  viewMode = "grid",
  selectionMode = false,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onViewNotes,
  onPin,
  onShare,
}: AppCardProps) {
  // Analytics tracking
  const { trackAccess } = useTrackAppAccess();
  // Prevent accidental taps while scrolling
  const { isScrolling, guardedHandler } = useScrollGuard();

  // Check permissions
  const isOwner = app.isOwner !== false; // Default to true for backward compatibility
  const permissions = app.permissions;
  const canEdit = isOwner || permissions?.canEdit;
  const canDelete = isOwner || permissions?.canDelete;
  const [copiedType, setCopiedType] = useState<"local" | "remote" | null>(null);

  const primaryUrl = app.localUrl || app.remoteUrl;
  const hasLocalUrl = !!app.localUrl?.trim();
  const hasRemoteUrl = !!app.remoteUrl?.trim();
  const hasBothUrls = hasLocalUrl && hasRemoteUrl;

  // Ensure URL has a protocol and is valid
  const normalizeUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    let fullUrl = trimmed;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      fullUrl = `http://${trimmed}`;
    }

    // Validate URL
    try {
      new URL(fullUrl);
      return fullUrl;
    } catch {
      return null;
    }
  };

  const handleCopyUrl = async (e: React.MouseEvent, urlType: "local" | "remote") => {
    e.preventDefault();
    e.stopPropagation();
    const url = urlType === "local" ? app.localUrl : app.remoteUrl;
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopiedType(urlType);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleOpenUrl = (e: React.MouseEvent, urlType: "local" | "remote") => {
    e.preventDefault();
    e.stopPropagation();
    const url = urlType === "local" ? app.localUrl : app.remoteUrl;
    if (url) {
      const normalized = normalizeUrl(url);
      if (normalized) {
        // Track the access
        trackAccess({ appId: app.id, accessType: urlType === "local" ? "open_local" : "open_remote" });
        window.open(normalized, "_blank", "noopener,noreferrer");
      }
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuOpenChange = (open: boolean) => {
    // Block opening while scrolling
    if (open && isScrolling()) return;
    setMenuOpen(open);
  };

  const handleOpenApp = (e: React.MouseEvent) => {
    // Block while scrolling
    if (isScrolling()) return;

    // Don't open if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menu"]') || target.closest('[data-selection-checkbox]')) {
      return;
    }

    // In selection mode, toggle selection on click
    if (selectionMode && onSelect) {
      onSelect(app);
      return;
    }

    if (primaryUrl) {
      const url = normalizeUrl(primaryUrl);
      if (url) {
        trackAccess({ appId: app.id, accessType: "click" });
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) {
      onSelect(app);
    }
  };

  const borderClass = healthBarStyle === "border" && app.healthCheckEnabled
    ? healthBorderColors[healthStatus]
    : "border-border";

  const hasValidUrl = primaryUrl && normalizeUrl(primaryUrl);

  // Shared menu items for both context menu and dropdown
  const menuItems = (
    <>
      {/* Open options */}
      {hasLocalUrl && (
        <ContextMenuItem onClick={(e) => handleOpenUrl(e as unknown as React.MouseEvent, "local")}>
          <Home className="mr-2 h-4 w-4" />
          {hasBothUrls ? "Open Local" : "Open in new tab"}
        </ContextMenuItem>
      )}
      {hasRemoteUrl && (
        <ContextMenuItem onClick={(e) => handleOpenUrl(e as unknown as React.MouseEvent, "remote")}>
          <Globe className="mr-2 h-4 w-4" />
          {hasBothUrls ? "Open Remote" : "Open in new tab"}
        </ContextMenuItem>
      )}

      {/* Copy URL options */}
      {(hasLocalUrl || hasRemoteUrl) && <ContextMenuSeparator />}
      {hasLocalUrl && (
        <ContextMenuItem onClick={(e) => handleCopyUrl(e as unknown as React.MouseEvent, "local")}>
          <Copy className="mr-2 h-4 w-4" />
          {hasBothUrls ? "Copy Local URL" : "Copy URL"}
        </ContextMenuItem>
      )}
      {hasRemoteUrl && (
        <ContextMenuItem onClick={(e) => handleCopyUrl(e as unknown as React.MouseEvent, "remote")}>
          <Copy className="mr-2 h-4 w-4" />
          {hasBothUrls ? "Copy Remote URL" : "Copy URL"}
        </ContextMenuItem>
      )}

      {/* Notes */}
      {app.notes && onViewNotes && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onViewNotes(app)}>
            <StickyNote className="mr-2 h-4 w-4" />
            View notes
          </ContextMenuItem>
        </>
      )}

      {/* Pin/Unpin */}
      {onPin && isOwner && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onPin(app, !app.pinned)}>
            {app.pinned ? (
              <>
                <PinOff className="mr-2 h-4 w-4" />
                Unpin from Quick Links
              </>
            ) : (
              <>
                <Pin className="mr-2 h-4 w-4" />
                Pin to Quick Links
              </>
            )}
          </ContextMenuItem>
        </>
      )}

      {/* Share (only for owners) */}
      {onShare && isOwner && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onShare(app)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </ContextMenuItem>
        </>
      )}

      {/* Edit & Delete */}
      <ContextMenuSeparator />
      {onEdit && canEdit && (
        <ContextMenuItem onClick={() => onEdit(app)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>
      )}
      {onDelete && canDelete && (
        <ContextMenuItem
          onClick={() => onDelete(app)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      )}
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className={cn(
            "group relative transition-[box-shadow,border-color,background-color] duration-200",
            hasValidUrl && !selectionMode && "cursor-pointer hover:border-ring hover:bg-muted/40 hover:card-elevation-hover",
            selectionMode && "cursor-pointer hover:border-ring hover:bg-muted/40 hover:card-elevation-hover",
            !hasValidUrl && !selectionMode && "opacity-75",
            healthBarStyle === "border" && app.healthCheckEnabled && "border-2",
            borderClass,
            isSelected && "ring-2 ring-primary border-primary bg-primary/5"
          )}
          onClick={handleOpenApp}
          data-testid={`app-card-${app.id}`}
        >
          {/* Selection Checkbox Overlay */}
          {selectionMode && (
            <div
              data-selection-checkbox
              className="absolute top-1 left-1 z-10"
              onClick={handleCheckboxClick}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-sm border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-muted-foreground/50 hover:border-primary"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
            </div>
          )}
      <CardContent className="px-2.5 py-1 sm:px-2 sm:py-0.5">
        <div className="flex items-center gap-2 sm:gap-1.5">
          {/* App Icon */}
          <div className="relative flex-shrink-0">
            <div className="flex items-center justify-center rounded-md bg-muted h-8 w-8 sm:h-7 sm:w-7">
              {app.icon ? (
                app.icon.startsWith("http") ? (
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="h-4 w-4 sm:h-3.5 sm:w-3.5 object-contain"
                  />
                ) : (
                  <span className="text-sm">{app.icon}</span>
                )
              ) : (
                <span className="font-semibold text-muted-foreground text-xs">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Health Dot */}
            {healthBarStyle === "dot" && app.healthCheckEnabled && (
              <div
                className={cn(
                  "absolute -right-0.5 -top-0.5 status-dot",
                  healthColors[healthStatus]
                )}
              />
            )}
            {/* Dependency Status Indicator */}
            {dependencyStatus && dependencyStatus !== "healthy" && (
              <div
                className={cn(
                  "absolute -left-0.5 -top-0.5 status-dot",
                  dependencyStatusColors[dependencyStatus]
                )}
                title={dependencyStatus === "degraded"
                  ? "Optional dependency is offline"
                  : "Required dependency is offline"}
              />
            )}
          </div>

          {/* App Name */}
          <span className="text-xs font-medium truncate flex-1 min-w-0">
            {app.name}
          </span>
          {app.notes && (
            <StickyNote className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
          {!isOwner && (
            <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" title={`Shared by ${app.sharedBy?.name || 'another user'}`} />
          )}

          {/* URL quick access buttons */}
          {hasBothUrls && (
            <>
              <div className="h-4 w-px bg-border shrink-0" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-6 sm:w-6 shrink-0"
                onClick={guardedHandler((e: React.MouseEvent) => handleOpenUrl(e, "local"))}
                title="Local"
              >
                <Home className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-6 sm:w-6 shrink-0"
                onClick={guardedHandler((e: React.MouseEvent) => handleOpenUrl(e, "remote"))}
                title="Remote"
              >
                <Globe className="h-3 w-3" />
              </Button>
            </>
          )}

          {/* Actions Menu */}
          <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-6 sm:w-6 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {hasLocalUrl && (
                <>
                  <DropdownMenuItem onClick={(e) => handleOpenUrl(e, "local")}>
                    <Home className="mr-2 h-4 w-4" />
                    {hasBothUrls ? "Open Local" : "Open in new tab"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleCopyUrl(e, "local")}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copiedType === "local" ? "Copied!" : hasBothUrls ? "Copy Local URL" : "Copy URL"}
                  </DropdownMenuItem>
                </>
              )}
              {hasRemoteUrl && (
                <>
                  <DropdownMenuItem onClick={(e) => handleOpenUrl(e, "remote")}>
                    <Globe className="mr-2 h-4 w-4" />
                    {hasBothUrls ? "Open Remote" : "Open in new tab"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleCopyUrl(e, "remote")}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copiedType === "remote" ? "Copied!" : hasBothUrls ? "Copy Remote URL" : "Copy URL"}
                  </DropdownMenuItem>
                </>
              )}
              {app.notes && onViewNotes && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewNotes(app)}>
                    <StickyNote className="mr-2 h-4 w-4" />
                    View notes
                  </DropdownMenuItem>
                </>
              )}
              {onPin && isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onPin(app, !app.pinned)}>
                    {app.pinned ? (
                      <>
                        <PinOff className="mr-2 h-4 w-4" />
                        Unpin from Quick Links
                      </>
                    ) : (
                      <>
                        <Pin className="mr-2 h-4 w-4" />
                        Pin to Quick Links
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              {onShare && isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onShare(app)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              {onEdit && canEdit && (
                <DropdownMenuItem onClick={() => onEdit(app)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(app)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {menuItems}
      </ContextMenuContent>
    </ContextMenu>
  );
}
