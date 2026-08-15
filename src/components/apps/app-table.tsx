import { useState } from "react";
import {
  Copy, MoreVertical, Pencil, Trash2, StickyNote, Home, Globe,
  Pin, PinOff, Share2, Users, Check, ExternalLink,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTrackAppAccess } from "@/hooks/use-analytics";
import type { AppWithRelations } from "./app-grid";
import type { HealthStatus, DependencyStatus } from "./app-card";
import type { App } from "@/types/database";

const healthDotColors: Record<HealthStatus, string> = {
  online: "text-status-online",
  offline: "text-status-offline",
  unknown: "text-status-unknown",
  checking: "text-status-pending animate-pulse",
};

const healthLabels: Record<HealthStatus, string> = {
  online: "Online",
  offline: "Offline",
  unknown: "Unknown",
  checking: "Checking",
};

const dependencyStatusColors: Record<DependencyStatus, string> = {
  healthy: "text-status-online",
  degraded: "text-warning",
  offline: "text-status-offline",
};

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const fullUrl =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `http://${trimmed}`;
  try {
    new URL(fullUrl);
    return fullUrl;
  } catch {
    return null;
  }
}

/** porttracker-style host:port label — strips protocol, keeps host + port + path. */
function hostLabel(url: string | null | undefined): string | null {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  try {
    const u = new URL(normalized);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.host}${path}`;
  } catch {
    return url?.trim() ?? null;
  }
}

interface AppTableProps {
  apps: AppWithRelations[];
  healthStatuses?: Record<string, HealthStatus>;
  dependencyStatuses?: Record<string, DependencyStatus>;
  showCategory?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectApp?: (app: App) => void;
  onEditApp?: (app: App) => void;
  onDeleteApp?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPinApp?: (app: App, pinned: boolean) => void;
  onShareApp?: (app: App) => void;
}

export function AppTable({
  apps,
  healthStatuses = {},
  dependencyStatuses = {},
  showCategory = true,
  selectionMode = false,
  selectedIds = new Set(),
  onSelectApp,
  onEditApp,
  onDeleteApp,
  onViewNotes,
  onPinApp,
  onShareApp,
}: AppTableProps) {
  return (
    <div className="rounded-lg border bg-card card-elevation overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {selectionMode && <TableHead className="w-8 pl-3" />}
            <TableHead className="panel-label w-8 pl-3" title="Health" />
            <TableHead className="panel-label">App</TableHead>
            {showCategory && (
              <TableHead className="panel-label hidden md:table-cell">
                Category
              </TableHead>
            )}
            <TableHead className="panel-label hidden sm:table-cell">
              Local
            </TableHead>
            <TableHead className="panel-label hidden lg:table-cell">
              Remote
            </TableHead>
            <TableHead className="panel-label hidden md:table-cell">
              Status
            </TableHead>
            <TableHead className="w-8 pr-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => (
            <AppTableRow
              key={app.id}
              app={app}
              healthStatus={healthStatuses[app.id] ?? "unknown"}
              dependencyStatus={dependencyStatuses[app.id]}
              showCategory={showCategory}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(app.id)}
              onSelect={onSelectApp}
              onEdit={onEditApp}
              onDelete={onDeleteApp}
              onViewNotes={onViewNotes}
              onPin={onPinApp}
              onShare={onShareApp}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface AppTableRowProps {
  app: AppWithRelations & {
    isOwner?: boolean;
    sharedBy?: { id: string; name: string; email: string; image?: string | null };
    permissions?: { canEdit?: boolean; canDelete?: boolean };
  };
  healthStatus: HealthStatus;
  dependencyStatus?: DependencyStatus;
  showCategory: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect?: (app: App) => void;
  onEdit?: (app: App) => void;
  onDelete?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPin?: (app: App, pinned: boolean) => void;
  onShare?: (app: App) => void;
}

function AppTableRow({
  app,
  healthStatus,
  dependencyStatus,
  showCategory,
  selectionMode,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewNotes,
  onPin,
  onShare,
}: AppTableRowProps) {
  const { trackAccess } = useTrackAppAccess();
  const [copied, setCopied] = useState<"local" | "remote" | null>(null);

  const isOwner = app.isOwner !== false;
  const canEdit = isOwner || app.permissions?.canEdit;
  const canDelete = isOwner || app.permissions?.canDelete;

  const localLabel = hostLabel(app.localUrl);
  const remoteLabel = hostLabel(app.remoteUrl);
  const primaryUrl = app.localUrl || app.remoteUrl;
  const hasValidUrl = !!normalizeUrl(primaryUrl);

  const openUrl = (urlType: "local" | "remote") => {
    const url = urlType === "local" ? app.localUrl : app.remoteUrl;
    const normalized = normalizeUrl(url);
    if (normalized) {
      trackAccess({
        appId: app.id,
        accessType: urlType === "local" ? "open_local" : "open_remote",
      });
      window.open(normalized, "_blank", "noopener,noreferrer");
    }
  };

  const copyUrl = async (urlType: "local" | "remote") => {
    const url = urlType === "local" ? app.localUrl : app.remoteUrl;
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(urlType);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const openPrimary = () => {
    if (selectionMode) {
      onSelect?.(app);
      return;
    }
    const normalized = normalizeUrl(primaryUrl);
    if (normalized) {
      trackAccess({ appId: app.id, accessType: "click" });
      window.open(normalized, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      data-testid={`app-row-${app.id}`}
      className={cn(
        "group",
        (hasValidUrl || selectionMode) && "cursor-pointer",
        isSelected && "bg-primary/5"
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("a") || target.closest('[role="menu"]')) {
          return;
        }
        openPrimary();
      }}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <TableCell className="pl-3">
          <div
            className={cn(
              "h-4 w-4 rounded-sm border-2 flex items-center justify-center transition-colors",
              isSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background border-muted-foreground/50 group-hover:border-primary"
            )}
          >
            {isSelected && <Check className="h-3 w-3" />}
          </div>
        </TableCell>
      )}

      {/* Health dot */}
      <TableCell className="pl-3">
        {app.healthCheckEnabled ? (
          <span
            className={cn("status-dot", healthDotColors[healthStatus])}
            title={healthLabels[healthStatus]}
          />
        ) : (
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/25" title="No health check" />
        )}
      </TableCell>

      {/* App name + icon */}
      <TableCell>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center rounded-md bg-muted h-6 w-6 shrink-0">
            {app.icon ? (
              app.icon.startsWith("http") ? (
                <img src={app.icon} alt="" className="h-3.5 w-3.5 object-contain" />
              ) : (
                <span className="text-xs">{app.icon}</span>
              )
            ) : (
              <span className="font-semibold text-muted-foreground text-[10px]">
                {app.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="font-medium truncate">{app.name}</span>
          {app.notes && (
            <StickyNote className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          {!isOwner && (
            <Users
              className="h-3 w-3 text-muted-foreground shrink-0"
              title={`Shared by ${app.sharedBy?.name || "another user"}`}
            />
          )}
          {dependencyStatus && dependencyStatus !== "healthy" && (
            <span
              className={cn("status-dot shrink-0", dependencyStatusColors[dependencyStatus])}
              title={
                dependencyStatus === "degraded"
                  ? "Optional dependency is offline"
                  : "Required dependency is offline"
              }
            />
          )}
        </div>
      </TableCell>

      {/* Category */}
      {showCategory && (
        <TableCell className="hidden md:table-cell">
          {app.category ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: app.category.color ?? "var(--color-muted-foreground)" }}
              />
              {app.category.name}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </TableCell>
      )}

      {/* Local URL */}
      <TableCell className="hidden sm:table-cell">
        {localLabel ? (
          <button
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground max-w-[16rem] truncate"
            onClick={(e) => { e.stopPropagation(); openUrl("local"); }}
            title={`Open ${app.localUrl}`}
          >
            <Home className="h-3 w-3 shrink-0" />
            <span className="truncate">{localLabel}</span>
          </button>
        ) : (
          <span className="text-xs text-muted-foreground/40 font-mono">—</span>
        )}
      </TableCell>

      {/* Remote URL */}
      <TableCell className="hidden lg:table-cell">
        {remoteLabel ? (
          <button
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground max-w-[16rem] truncate"
            onClick={(e) => { e.stopPropagation(); openUrl("remote"); }}
            title={`Open ${app.remoteUrl}`}
          >
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate">{remoteLabel}</span>
          </button>
        ) : (
          <span className="text-xs text-muted-foreground/40 font-mono">—</span>
        )}
      </TableCell>

      {/* Status label */}
      <TableCell className="hidden md:table-cell">
        {app.healthCheckEnabled ? (
          <span className={cn("text-xs font-medium", healthDotColors[healthStatus])}>
            {healthLabels[healthStatus]}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="pr-2 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {app.localUrl && (
              <>
                <DropdownMenuItem onClick={() => openUrl("local")}>
                  <Home className="mr-2 h-4 w-4" />
                  {app.remoteUrl ? "Open Local" : "Open in new tab"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyUrl("local")}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copied === "local" ? "Copied!" : app.remoteUrl ? "Copy Local URL" : "Copy URL"}
                </DropdownMenuItem>
              </>
            )}
            {app.remoteUrl && (
              <>
                <DropdownMenuItem onClick={() => openUrl("remote")}>
                  <Globe className="mr-2 h-4 w-4" />
                  {app.localUrl ? "Open Remote" : "Open in new tab"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyUrl("remote")}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copied === "remote" ? "Copied!" : app.localUrl ? "Copy Remote URL" : "Copy URL"}
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
                    <><PinOff className="mr-2 h-4 w-4" />Unpin from Quick Links</>
                  ) : (
                    <><Pin className="mr-2 h-4 w-4" />Pin to Quick Links</>
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
            {(canEdit || canDelete) && <DropdownMenuSeparator />}
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
            {!app.localUrl && !app.remoteUrl && (
              <DropdownMenuItem disabled>
                <ExternalLink className="mr-2 h-4 w-4" />
                No URL configured
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
