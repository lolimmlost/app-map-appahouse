import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, BarChart3 } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AccessTrendChart,
  UptimeTrendChart,
  ResponseTimeChart,
  MostUsedAppsChart,
  AppReliabilityChart,
} from "@/components/analytics/analytics-charts";
import {
  AnalyticsOverview,
  TopAppsList,
} from "@/components/analytics/analytics-stats";
import {
  useAnalyticsSummary,
  useDailyMetrics,
  useInvalidateAnalytics,
} from "@/hooks/use-analytics";
import type { TimeRange } from "@/lib/server/analytics.server";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const invalidateAnalytics = useInvalidateAnalytics();

  // Fetch analytics data
  const { data: summaryData, isLoading: isSummaryLoading, refetch: refetchSummary } = useAnalyticsSummary(timeRange);
  const { data: dailyData, isLoading: isDailyLoading, refetch: refetchDaily } = useDailyMetrics(timeRange);

  const isLoading = isSummaryLoading || isDailyLoading;

  const handleRefresh = () => {
    invalidateAnalytics();
    refetchSummary();
    refetchDaily();
  };

  // Get sorted app lists
  const sortedByUsage = [...(summaryData?.apps || [])].sort(
    (a, b) => b.totalAccesses - a.totalAccesses
  );
  const leastUsedApps = [...(summaryData?.apps || [])].sort(
    (a, b) => a.totalAccesses - b.totalAccesses
  );
  const leastReliableApps = [...(summaryData?.apps || [])]
    .filter((a) => a.uptimePercentage !== null && a.healthCheckCount > 0)
    .sort((a, b) => (a.uptimePercentage || 0) - (b.uptimePercentage || 0));

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to view your app usage analytics
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track your app usage, health, and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !summaryData && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Overview Stats */}
      {summaryData?.totals && <AnalyticsOverview totals={summaryData.totals} />}

      {/* Charts Row 1 - Access Trends */}
      {dailyData?.metrics && dailyData.metrics.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <AccessTrendChart
            data={dailyData.metrics}
            title="Access Trends"
            description={`App accesses over the last ${timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : timeRange === "90d" ? "90 days" : "all time"}`}
          />
          <MostUsedAppsChart
            data={summaryData?.apps || []}
            title="Most Used Apps"
            description="Top apps by access count"
          />
        </div>
      )}

      {/* Charts Row 2 - Health Metrics */}
      {dailyData?.metrics && dailyData.metrics.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <UptimeTrendChart
            data={dailyData.metrics}
            title="Uptime Trends"
            description="Average uptime percentage across all apps"
          />
          <ResponseTimeChart
            data={dailyData.metrics}
            title="Response Time Trends"
            description="Average response time across all apps"
          />
        </div>
      )}

      {/* App Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopAppsList
          apps={sortedByUsage}
          title="Most Used"
          description="Your most frequently accessed apps"
          type="most-used"
          limit={5}
        />
        <TopAppsList
          apps={leastUsedApps}
          title="Least Used"
          description="Apps you rarely access"
          type="least-used"
          limit={5}
        />
        <TopAppsList
          apps={leastReliableApps}
          title="Least Reliable"
          description="Apps with lowest uptime"
          type="least-reliable"
          limit={5}
        />
      </div>

      {/* Reliability Chart */}
      {summaryData?.apps && summaryData.apps.length > 0 && (
        <AppReliabilityChart
          data={summaryData.apps}
          title="App Reliability Overview"
          description="Uptime percentage for apps with health checks enabled"
        />
      )}

      {/* Empty State */}
      {!isLoading && summaryData?.apps?.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Analytics Data Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start using your apps to see usage statistics, health trends, and performance metrics here.
          </p>
        </div>
      )}
    </main>
  );
}
