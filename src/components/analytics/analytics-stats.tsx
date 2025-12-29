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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trendValue) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {trend && trendValue && (
              <span
                className={cn(
                  "flex items-center gap-0.5",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500"
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
          <Badge variant="secondary" className="ml-auto">
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
            className="ml-auto"
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {getIcon()}
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {displayApps.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No data available yet
          </div>
        ) : (
          <div className="space-y-3">
            {displayApps.map((app, index) => (
              <div
                key={app.appId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium text-muted-foreground w-6">
                  #{index + 1}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    {app.appIcon ? (
                      app.appIcon.startsWith("http") ? (
                        <img
                          src={app.appIcon}
                          alt={app.appName}
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <span className="text-sm">{app.appIcon}</span>
                      )
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        {app.appName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-medium truncate">{app.appName}</span>
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
