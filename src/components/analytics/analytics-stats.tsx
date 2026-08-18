import { Activity, Clock, MousePointerClick, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppAnalyticsSummary } from "@/lib/server/analytics.server";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden card-elevation">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-4">
        <CardTitle className="panel-label">{title}</CardTitle>
        {icon && <div className="text-muted-foreground/70">{icon}</div>}
      </CardHeader>
      <CardContent className="pt-2 pb-3 px-4">
        <div className="text-xl font-mono font-bold tabular-nums">{value}</div>
        {(description || trendValue) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {trend && trendValue && (
              <span
                className={cn(
                  "flex items-center gap-0.5 font-mono tabular-nums font-medium",
                  trend === "up" && "text-success",
                  trend === "down" && "text-error"
                )}
              >
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend === "down" ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {trendValue}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AnalyticsOverviewProps {
  totals: {
    totalApps: number;
    totalAccesses: number;
    averageUptime: number | null;
    averageResponseTime: number | null;
  } | null;
}

export function AnalyticsOverview({ totals }: AnalyticsOverviewProps) {
  if (!totals) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Apps"
        value={totals.totalApps}
        description="Apps being tracked"
        icon={<Activity className="h-4 w-4" />}
      />
      <StatCard
        title="Total Accesses"
        value={totals.totalAccesses.toLocaleString()}
        description="In selected period"
        icon={<MousePointerClick className="h-4 w-4" />}
      />
      <StatCard
        title="Average Uptime"
        value={totals.averageUptime !== null ? `${totals.averageUptime.toFixed(1)}%` : "N/A"}
        description="Across all apps with health checks"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Avg Response Time"
        value={totals.averageResponseTime !== null ? `${totals.averageResponseTime}ms` : "N/A"}
        description="Average response time"
        icon={<Clock className="h-4 w-4" />}
      />
    </div>
  );
}

interface TopAppsListProps {
  apps: AppAnalyticsSummary[];
  title: string;
  description?: string;
  type: "most-used" | "least-used" | "least-reliable";
  limit?: number;
}

export function TopAppsList({
  apps,
  title,
  description,
  type,
  limit = 5,
}: TopAppsListProps) {
  const displayApps = apps.slice(0, limit);

  const getValueDisplay = (app: AppAnalyticsSummary) => {
    switch (type) {
      case "most-used":
      case "least-used":
        return (
          <Badge variant="secondary" className="ml-auto font-mono tabular-nums">
            {app.totalAccesses} {app.totalAccesses === 1 ? "access" : "accesses"}
          </Badge>
        );
      case "least-reliable":
        return (
          <Badge
            variant={
              (app.uptimePercentage || 0) >= 99
                ? "default"
                : (app.uptimePercentage || 0) >= 95
                ? "secondary"
                : "destructive"
            }
            className="ml-auto font-mono tabular-nums"
          >
            {app.uptimePercentage !== null ? `${app.uptimePercentage.toFixed(1)}%` : "N/A"}
          </Badge>
        );
    }
  };

  const getIcon = () => {
    switch (type) {
      case "most-used":
        return <TrendingUp className="h-5 w-5" />;
      case "least-used":
        return <TrendingDown className="h-5 w-5" />;
      case "least-reliable":
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  // Subtle semantic tint + accent color per list type (on-token, no gradients).
  const getGradientClass = () => {
    switch (type) {
      case "most-used":
        return "bg-info/5 [&_svg]:text-info";
      case "least-used":
        return "bg-warning/5 [&_svg]:text-warning";
      case "least-reliable":
        return "bg-error/5 [&_svg]:text-error";
    }
  };

  const getEmptyStateIcon = () => {
    switch (type) {
      case "most-used":
        return <TrendingUp className="h-12 w-12 opacity-30" />;
      case "least-used":
        return <TrendingDown className="h-12 w-12 opacity-30" />;
      case "least-reliable":
        return <AlertTriangle className="h-12 w-12 opacity-30" />;
    }
  };

  const getEmptyStateMessage = () => {
    switch (type) {
      case "most-used":
        return "No usage data yet";
      case "least-used":
        return "No apps tracked yet";
      case "least-reliable":
        return "No health data available";
    }
  };

  return (
    <Card className="overflow-hidden card-elevation">
      <CardHeader className={cn("pb-2 pt-3 px-4 border-b border-border", getGradientClass())}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </div>
        {description && <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-3 pb-4 px-4">
        {displayApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            {getEmptyStateIcon()}
            <p className="text-sm text-muted-foreground mt-3">{getEmptyStateMessage()}</p>
            <p className="text-xs text-muted-foreground mt-1">Data will appear as apps are used</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {displayApps.map((app, index) => (
              <div
                key={app.appId}
                className="group flex items-center gap-2 p-2 rounded-md border hover:border-ring hover:bg-muted/50 transition-colors"
              >
                <span className="font-mono tabular-nums text-xs font-bold text-muted-foreground/60 w-5">
                  #{index + 1}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-7 w-7 rounded-md bg-muted flex items-center justify-center">
                    {app.appIcon ? (
                      app.appIcon.startsWith("http") ? (
                        <img
                          src={app.appIcon}
                          alt={app.appName}
                          className="h-4 w-4 object-contain"
                        />
                      ) : (
                        <span className="text-sm">{app.appIcon}</span>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {app.appName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-medium truncate text-xs">{app.appName}</span>
                </div>
                {getValueDisplay(app)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AppDetailsCardProps {
  app: AppAnalyticsSummary;
}

export function AppDetailsCard({ app }: AppDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            {app.appIcon ? (
              app.appIcon.startsWith("http") ? (
                <img
                  src={app.appIcon}
                  alt={app.appName}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <span className="text-2xl">{app.appIcon}</span>
              )
            ) : (
              <span className="text-xl font-semibold text-muted-foreground">
                {app.appName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <CardTitle>{app.appName}</CardTitle>
            <CardDescription>
              Last accessed:{" "}
              {app.lastAccessedAt
                ? new Date(app.lastAccessedAt).toLocaleDateString()
                : "Never"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Accesses</div>
            <div className="text-xl font-semibold">{app.totalAccesses.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Uptime</div>
            <div className="text-xl font-semibold">
              {app.uptimePercentage !== null ? `${app.uptimePercentage.toFixed(1)}%` : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Response</div>
            <div className="text-xl font-semibold">
              {app.averageResponseTime !== null ? `${app.averageResponseTime}ms` : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Health Checks</div>
            <div className="text-xl font-semibold">{app.healthCheckCount.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
