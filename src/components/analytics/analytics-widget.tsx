import { Link } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Clock, MousePointerClick, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalyticsSummary, useMostUsedApps } from "@/hooks/use-analytics";

/**
 * A compact analytics widget for the dashboard
 * Shows key metrics and links to full analytics page
 */
export function AnalyticsWidget() {
  const { data: summaryData, isLoading: isSummaryLoading } = useAnalyticsSummary("7d");
  const { data: mostUsedData, isLoading: isMostUsedLoading } = useMostUsedApps("7d", 3);

  const isLoading = isSummaryLoading || isMostUsedLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle className="text-lg">Analytics</CardTitle>
            </div>
          </div>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totals = summaryData?.totals;
  const topApps = mostUsedData?.apps || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle className="text-lg">Analytics</CardTitle>
          </div>
          <Link to="/analytics">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <MousePointerClick className="h-3 w-3" />
            </div>
            <div className="text-xl font-bold">
              {totals?.totalAccesses.toLocaleString() || 0}
            </div>
            <div className="text-xs text-muted-foreground">Accesses</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
            </div>
            <div className="text-xl font-bold">
              {totals?.averageUptime !== null ? `${totals.averageUptime.toFixed(0)}%` : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
            </div>
            <div className="text-xl font-bold">
              {totals?.averageResponseTime !== null ? `${totals.averageResponseTime}ms` : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">Avg Response</div>
          </div>
        </div>

        {/* Top Apps */}
        {topApps.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Most Used</div>
            <div className="space-y-2">
              {topApps.map((app, index) => (
                <div key={app.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-4">{index + 1}.</span>
                  <div className="flex-shrink-0 h-5 w-5 rounded bg-muted flex items-center justify-center">
                    {app.icon ? (
                      app.icon.startsWith("http") ? (
                        <img src={app.icon} alt="" className="h-3 w-3 object-contain" />
                      ) : (
                        <span className="text-xs">{app.icon}</span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {app.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="truncate flex-1">{app.name}</span>
                  <span className="text-muted-foreground">{app.totalAccesses}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {topApps.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No usage data yet. Start using your apps!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
