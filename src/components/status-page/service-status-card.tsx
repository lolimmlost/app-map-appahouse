import { cn } from "@/lib/utils";
import { StatusIndicator, type StatusType } from "./status-indicator";
import { Clock, Zap, TrendingUp } from "lucide-react";

interface ServiceStatusCardProps {
  name: string;
  description?: string;
  icon?: string;
  status: StatusType;
  responseTime?: number;
  uptime?: number;
  lastChecked?: string;
  groupName?: string;
  categoryName?: string;
  categoryColor?: string;
  showMetrics?: boolean;
  layout?: "list" | "grid" | "compact";
  className?: string;
}

export function ServiceStatusCard({
  name,
  description,
  icon,
  status,
  responseTime,
  uptime,
  lastChecked,
  groupName,
  categoryName,
  categoryColor,
  showMetrics = true,
  layout = "list",
  className,
}: ServiceStatusCardProps) {
  const formatLastChecked = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (layout === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-between py-2 px-3 rounded-md bg-card/50 hover:bg-card transition-colors",
          className
        )}
      >
        <div className="flex items-center gap-2">
          {icon && <img src={icon} alt="" className="h-4 w-4 object-contain" />}
          <span className="text-sm font-medium">{name}</span>
        </div>
        <StatusIndicator status={status} size="sm" />
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div
        className={cn(
          "flex flex-col p-4 rounded-lg border bg-card hover:border-ring transition-colors",
          className
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <img src={icon} alt="" className="h-8 w-8 object-contain rounded" />
            )}
            <div>
              <h3 className="font-medium text-sm">{name}</h3>
              {categoryName && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: categoryColor ? `${categoryColor}20` : undefined,
                    color: categoryColor,
                  }}
                >
                  {categoryName}
                </span>
              )}
            </div>
          </div>
          <StatusIndicator status={status} size="md" />
        </div>

        {description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{description}</p>
        )}

        {showMetrics && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">
            {responseTime !== undefined && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span className="font-mono tabular-nums">{responseTime}ms</span>
              </span>
            )}
            {uptime !== undefined && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="font-mono tabular-nums">{uptime.toFixed(2)}%</span>
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default list layout
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border bg-card hover:border-ring transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <img src={icon} alt="" className="h-10 w-10 object-contain rounded" />
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{name}</h3>
            {categoryName && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: categoryColor ? `${categoryColor}20` : undefined,
                  color: categoryColor,
                }}
              >
                {categoryName}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {showMetrics && (
          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            {responseTime !== undefined && (
              <span className="flex items-center gap-1" title="Response time">
                <Zap className="h-4 w-4" />
                <span className="font-mono tabular-nums">{responseTime}ms</span>
              </span>
            )}
            {uptime !== undefined && (
              <span className="flex items-center gap-1" title="Uptime (30 days)">
                <TrendingUp className="h-4 w-4" />
                <span className="font-mono tabular-nums">{uptime.toFixed(2)}%</span>
              </span>
            )}
            {lastChecked && (
              <span className="flex items-center gap-1" title="Last checked">
                <Clock className="h-4 w-4" />
                {formatLastChecked(lastChecked)}
              </span>
            )}
          </div>
        )}
        <StatusIndicator status={status} size="md" showLabel />
      </div>
    </div>
  );
}

interface ServiceGroupProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}

export function ServiceGroup({ name, children, className }: ServiceGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {name}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
