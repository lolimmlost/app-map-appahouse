import { useState } from "react";
import { ExternalLink, Copy, MoreVertical, Pencil, Trash2, StickyNote } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { App, Tag } from "@/database/schema/apps";
import type { Category } from "@/database/schema/categories";

export type HealthStatus = "online" | "offline" | "unknown" | "checking";

interface AppCardProps {
  app: App & {
    category?: Category | null;
    tags?: Tag[];
  };
  healthStatus?: HealthStatus;
  healthBarStyle?: "dot" | "border" | "none";
  onEdit?: (app: App) => void;
  onDelete?: (app: App) => void;
  onViewNotes?: (app: App) => void;
}

const healthColors: Record<HealthStatus, string> = {
  online: "bg-green-500",
  offline: "bg-red-500",
  unknown: "bg-gray-400",
  checking: "bg-yellow-500 animate-pulse",
};

const healthBorderColors: Record<HealthStatus, string> = {
  online: "border-green-500",
  offline: "border-red-500",
  unknown: "border-gray-400",
  checking: "border-yellow-500",
};

export function AppCard({
  app,
  healthStatus = "unknown",
  healthBarStyle = "dot",
  onEdit,
  onDelete,
  onViewNotes,
}: AppCardProps) {
  const [copied, setCopied] = useState(false);

  const primaryUrl = app.localUrl || app.remoteUrl;

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

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (primaryUrl) {
      await navigator.clipboard.writeText(primaryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenApp = (e: React.MouseEvent) => {
    // Don't open if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menu"]')) {
      return;
    }

    if (primaryUrl) {
      const url = normalizeUrl(primaryUrl);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
  };

  const borderClass = healthBarStyle === "border" && app.healthCheckEnabled
    ? healthBorderColors[healthStatus]
    : "border-border";

  const hasValidUrl = primaryUrl && normalizeUrl(primaryUrl);

  return (
    <Card
      className={cn(
        "group relative transition-all",
        hasValidUrl && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
        !hasValidUrl && "opacity-75",
        healthBarStyle === "border" && app.healthCheckEnabled && "border-2",
        borderClass
      )}
      onClick={handleOpenApp}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="relative flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              {app.icon ? (
                app.icon.startsWith("http") ? (
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <span className="text-2xl">{app.icon}</span>
                )
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{app.name}</h3>
              {app.notes && (
                <StickyNote className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {app.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {app.description}
              </p>
            )}
            {app.category && (
              <Badge
                variant="secondary"
                className="mt-2 text-xs"
                style={app.category.color ? { backgroundColor: app.category.color } : undefined}
              >
                {app.category.name}
              </Badge>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleOpenApp}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyUrl}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy URL"}
              </DropdownMenuItem>
              {app.notes && onViewNotes && (
                <DropdownMenuItem onClick={() => onViewNotes(app)}>
                  <StickyNote className="mr-2 h-4 w-4" />
                  View notes
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(app)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
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

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
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
  );
}
