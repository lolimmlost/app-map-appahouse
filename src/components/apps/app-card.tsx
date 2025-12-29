import { useState } from "react";
import { Copy, MoreVertical, Pencil, Trash2, StickyNote, Home, Globe, Pin, PinOff, Check, Share2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { App, Tag } from "@/types/database";
import type { Category } from "@/types/database";
import type { GranularPermissions } from "@/types/database";

export type HealthStatus = "online" | "offline" | "unknown" | "checking";

interface AppCardProps {
  app: App & {
    category?: Category | null;
    tags?: Tag[];
    isOwner?: boolean;
    sharedBy?: { id: string; name: string; email: string; image?: string | null };
    permissions?: GranularPermissions;
  };
  healthStatus?: HealthStatus;
  healthBarStyle?: "dot" | "border" | "none";
  viewMode?: "grid" | "list";
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
  online: "bg-status-online",
  offline: "bg-status-offline",
  unknown: "bg-status-unknown",
  checking: "bg-status-pending animate-pulse",
};

const healthBorderColors: Record<HealthStatus, string> = {
  online: "border-status-online",
  offline: "border-status-offline",
  unknown: "border-status-unknown",
  checking: "border-status-pending",
};

export function AppCard({
  app,
  healthStatus = "unknown",
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

  // Check permissions
  const isOwner = app.isOwner !== false; // Default to true for backward compatibility
  const permissions = app.permissions;
  const canEdit = isOwner || permissions?.canEdit;
  const canDelete = isOwner || permissions?.canDelete;
  const canAccessLocalUrl = isOwner || permissions?.canAccessLocalUrl;
  const canAccessRemoteUrl = isOwner || permissions?.canAccessRemoteUrl;
  const canSeeHealth = isOwner || permissions?.canSeeHealth;
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

  const handleOpenApp = (e: React.MouseEvent) => {
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
        // Track the access
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
            "group relative transition-all",
            hasValidUrl && !selectionMode && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
            selectionMode && "cursor-pointer hover:shadow-md",
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
              className="absolute top-2 left-2 z-10"
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
      <CardContent className={cn("p-4 sm:p-4 p-5", viewMode === "list" && "p-3 sm:p-3 p-4")}>
        <div className={cn(
          "flex items-start gap-3 sm:gap-3 gap-4",
          viewMode === "list" && "items-center"
        )}>
          {/* App Icon */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              "flex items-center justify-center rounded-lg bg-muted",
              viewMode === "list" ? "h-12 w-12 sm:h-10 sm:w-10" : "h-14 w-14 sm:h-12 sm:w-12"
            )}>
              {app.icon ? (
                app.icon.startsWith("http") ? (
                  <img
                    src={app.icon}
                    alt={app.name}
                    className={cn(viewMode === "list" ? "h-7 w-7 sm:h-6 sm:w-6" : "h-9 w-9 sm:h-8 sm:w-8", "object-contain")}
                  />
                ) : (
                  <span className={cn(viewMode === "list" ? "text-2xl sm:text-xl" : "text-3xl sm:text-2xl")}>{app.icon}</span>
                )
              ) : (
                <span className={cn(
                  "font-semibold text-muted-foreground",
                  viewMode === "list" ? "text-lg sm:text-base" : "text-xl sm:text-lg"
                )}>
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Health Dot */}
            {healthBarStyle === "dot" && app.healthCheckEnabled && (
              <div
                className={cn(
                  "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background",
                  healthColors[healthStatus]
                )}
              />
            )}
          </div>

          {/* App Info */}
          <div className={cn(
            "flex-1 min-w-0",
            viewMode === "list" && "flex items-center gap-4"
          )}>
            <div className={cn(
              "flex items-center gap-2",
              viewMode === "list" && "flex-shrink-0"
            )}>
              <h3 className={cn(
                "font-semibold truncate",
                viewMode === "list" && "text-sm"
              )}>{app.name}</h3>
              {app.notes && (
                <StickyNote className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              {!isOwner && (
                <Badge variant="outline" className="text-xs flex-shrink-0" title={`Shared by ${app.sharedBy?.name || 'another user'}`}>
                  <Users className="h-3 w-3 mr-1" />
                  Shared
                </Badge>
              )}
            </div>
            {app.description && viewMode === "grid" && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {app.description}
              </p>
            )}
            {app.description && viewMode === "list" && (
              <p className="text-sm text-muted-foreground truncate hidden sm:block flex-1">
                {app.description}
              </p>
            )}
            {/* URL quick access in list view */}
            {hasBothUrls && viewMode === "list" && (
              <div className="flex items-center gap-2 sm:gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 sm:h-7 sm:w-7"
                  onClick={(e) => handleOpenUrl(e, "local")}
                  title="Open Local"
                >
                  <Home className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 sm:h-7 sm:w-7"
                  onClick={(e) => handleOpenUrl(e, "remote")}
                  title="Open Remote"
                >
                  <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
            {app.category && viewMode === "grid" && (
              <Badge
                variant="secondary"
                className="mt-2 text-xs"
                style={app.category.color ? { backgroundColor: app.category.color } : undefined}
              >
                {app.category.name}
              </Badge>
            )}
            {/* URL quick access buttons - show when both URLs available */}
            {hasBothUrls && viewMode === "grid" && (
              <div className="mt-3 sm:mt-2 flex items-center gap-2 sm:gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 sm:h-7 px-3 sm:px-2 text-sm sm:text-xs"
                  onClick={(e) => handleOpenUrl(e, "local")}
                >
                  <Home className="h-4 w-4 sm:h-3 sm:w-3 mr-1.5 sm:mr-1" />
                  Local
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 sm:h-7 px-3 sm:px-2 text-sm sm:text-xs"
                  onClick={(e) => handleOpenUrl(e, "remote")}
                >
                  <Globe className="h-4 w-4 sm:h-3 sm:w-3 mr-1.5 sm:mr-1" />
                  Remote
                </Button>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 sm:h-8 sm:w-8 transition-opacity",
                  viewMode === "list" ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                )}
              >
                <MoreVertical className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {/* Local URL options */}
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
              {/* Remote URL options */}
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

        {/* Tags - only show in grid view */}
        {viewMode === "grid" && app.tags && app.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {app.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {menuItems}
      </ContextMenuContent>
    </ContextMenu>
  );
}
