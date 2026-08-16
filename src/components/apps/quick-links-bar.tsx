import { Home, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTrackAppAccess } from "@/hooks/use-analytics";
import { useScrollGuard } from "@/hooks/use-scroll-guard";
import type { App } from "@/types/database";
import type { Category } from "@/types/database";
import type { HealthStatus } from "./app-card";

export type AppWithCategory = App & {
  category?: Category | null;
};

interface QuickLinksBarProps {
  apps: AppWithCategory[];
  healthStatuses?: Record<string, HealthStatus>;
  healthBarStyle?: "dot" | "border" | "none";
  className?: string;
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

export function QuickLinksBar({
  apps,
  healthStatuses = {},
  healthBarStyle = "dot",
  className,
}: QuickLinksBarProps) {
  const { trackAccess } = useTrackAppAccess();
  const { isScrolling } = useScrollGuard();

  if (apps.length === 0) {
    return null;
  }

  const normalizeUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    let fullUrl = trimmed;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      fullUrl = `http://${trimmed}`;
    }

    try {
      new URL(fullUrl);
      return fullUrl;
    } catch {
      return null;
    }
  };

  const handleOpenUrl = (appId: string, url: string | null, urlType: "primary" | "local" | "remote" = "primary") => {
    if (isScrolling()) return;
    if (url) {
      const normalized = normalizeUrl(url);
      if (normalized) {
        const accessType = urlType === "local" ? "open_local" : urlType === "remote" ? "open_remote" : "click";
        trackAccess({ appId, accessType });
        window.open(normalized, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2", className)}>
      {apps.map((app) => {
        const hasLocalUrl = !!app.localUrl?.trim();
        const hasRemoteUrl = !!app.remoteUrl?.trim();
        const hasBothUrls = hasLocalUrl && hasRemoteUrl;
        const primaryUrl = app.localUrl || app.remoteUrl;
        const healthStatus = app.healthCheckEnabled
          ? (healthStatuses[app.id] ?? "unknown")
          : null;

        return (
          <div
            key={app.id}
            className={cn(
              "relative flex items-center gap-0.5 sm:gap-0.5 gap-1 rounded-md border bg-card p-1 sm:p-1 p-1.5 overflow-hidden transition-colors hover:border-ring hover:bg-muted/40",
              healthBarStyle === "border" && healthStatus && [
                "border-2",
                healthBorderColors[healthStatus]
              ]
            )}
          >
            {/* Health indicator - dot style */}
            {healthBarStyle === "dot" && healthStatus && (
              <div
                className={cn(
                  "absolute -right-1 -top-1 h-2.5 w-2.5 sm:h-2.5 sm:w-2.5 h-3 w-3 rounded-full border border-background",
                  healthColors[healthStatus]
                )}
              />
            )}

            {/* App icon/name button - larger touch target on mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 sm:h-8 px-2.5 sm:px-2 gap-2 sm:gap-1.5 min-w-0 flex-1 sm:flex-initial"
              onClick={() => handleOpenUrl(app.id, primaryUrl, "primary")}
              title={app.name}
            >
              {app.icon ? (
                app.icon.startsWith("http") ? (
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="h-5 w-5 sm:h-4 sm:w-4 object-contain"
                  />
                ) : (
                  <span className="text-base sm:text-sm">{app.icon}</span>
                )
              ) : (
                <span className="h-5 w-5 sm:h-4 sm:w-4 flex items-center justify-center text-xs font-semibold text-muted-foreground bg-muted rounded">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-sm sm:text-xs font-medium truncate sm:max-w-[80px]">
                {app.name}
              </span>
            </Button>

            {/* Show separate buttons when both URLs available - larger on mobile */}
            {hasBothUrls && (
              <>
                <div className="h-5 sm:h-4 w-px bg-border shrink-0" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-7 sm:w-7 shrink-0"
                  onClick={() => handleOpenUrl(app.id, app.localUrl, "local")}
                  title="Local"
                >
                  <Home className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-7 sm:w-7 shrink-0"
                  onClick={() => handleOpenUrl(app.id, app.remoteUrl, "remote")}
                  title="Remote"
                >
                  <Globe className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </Button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
