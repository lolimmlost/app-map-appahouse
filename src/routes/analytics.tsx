import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, BarChart3 } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  HealthStatusHistory,
  UptimeStatistics,
  ServiceReliabilityTable,
  EnhancedResponseTimeChart,
  ExportButton,
  TimeRangeSelector,
  SlaSummaryCard,
} from "@/components/analytics/analytics-dashboard";
import {
  useAnalyticsSummary,
  useDailyMetrics,
  useInvalidateAnalytics,
  useHealthHistory,
  useUptimeStats,
  useServiceReliability,
  useExportAnalytics,
} from "@/hooks/use-analytics";
import type { TimeRange } from "@/lib/server/analytics.server";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real data
  const summaryQuery = useAnalyticsSummary(timeRange);
  const dailyQuery = useDailyMetrics(timeRange);
  const healthHistoryQuery = useHealthHistory(timeRange);
  const uptimeStatsQuery = useUptimeStats(timeRange);
  const serviceReliabilityQuery = useServiceReliability(timeRange);
  const invalidate = useInvalidateAnalytics();
  const exportMutation = useExportAnalytics();

  const summaryData = summaryQuery.data;
  const dailyData = dailyQuery.data;
  const healthHistoryData = healthHistoryQuery.data;
  const uptimeStatsData = uptimeStatsQuery.data;
  const serviceReliabilityData = serviceReliabilityQuery.data;

  const isSummaryLoading = summaryQuery.isLoading;
  const isDailyLoading = dailyQuery.isLoading;
  const isHealthHistoryLoading = healthHistoryQuery.isLoading;
  const isUptimeStatsLoading = uptimeStatsQuery.isLoading;
  const isServiceReliabilityLoading = serviceReliabilityQuery.isLoading;

  const isExporting = exportMutation.isPending;

  const isLoading = isSummaryLoading || isDailyLoading;

  const handleRefresh = useCallback(() => {
    invalidate();
    summaryQuery.refetch();
    dailyQuery.refetch();
    healthHistoryQuery.refetch();
    uptimeStatsQuery.refetch();
    serviceReliabilityQuery.refetch();
  }, [invalidate, summaryQuery, dailyQuery, healthHistoryQuery, uptimeStatsQuery, serviceReliabilityQuery]);

  const handleExport = useCallback(async (format: "csv" | "json" | "pdf") => {
    try {
      if (format === "pdf") {
        toast.info("Use your browser's print function to save as PDF");
        return;
      }

      const result = await exportMutation.mutateAsync({ range: timeRange, format });

      if (format === "csv" && "metrics" in result && result.metrics && result.healthHistory) {
        // Download metrics CSV
        const metricsBlob = new Blob([result.metrics], { type: "text/csv" });
        const metricsUrl = URL.createObjectURL(metricsBlob);
        const metricsLink = document.createElement("a");
        metricsLink.href = metricsUrl;
        metricsLink.download = `${result.filename}-metrics.csv`;
        document.body.appendChild(metricsLink);
        metricsLink.click();
        document.body.removeChild(metricsLink);
        URL.revokeObjectURL(metricsUrl);

        // Download health history CSV
        const healthBlob = new Blob([result.healthHistory], { type: "text/csv" });
        const healthUrl = URL.createObjectURL(healthBlob);
        const healthLink = document.createElement("a");
        healthLink.href = healthUrl;
        healthLink.download = `${result.filename}-health-history.csv`;
        document.body.appendChild(healthLink);
        healthLink.click();
        document.body.removeChild(healthLink);
        URL.revokeObjectURL(healthUrl);

        toast.success("CSV files downloaded successfully");
      } else if ("data" in result) {
        // Download JSON
        const jsonBlob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement("a");
        jsonLink.href = jsonUrl;
        jsonLink.download = `${result.filename}.json`;
        document.body.appendChild(jsonLink);
        jsonLink.click();
        document.body.removeChild(jsonLink);
        URL.revokeObjectURL(jsonUrl);

        toast.success("JSON file downloaded successfully");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export analytics data");
    }
  }, [exportMutation, timeRange]);

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

  // Calculate SLA metrics from service reliability data
  const monthlyUptime = serviceReliabilityData?.services && serviceReliabilityData.services.length > 0
    ? serviceReliabilityData.services.reduce((sum, s) => sum + (s.monthlyUptime || 0), 0) /
      serviceReliabilityData.services.filter(s => s.monthlyUptime !== null).length
    : null;
  const yearlyUptime = serviceReliabilityData?.services && serviceReliabilityData.services.length > 0
    ? serviceReliabilityData.services.reduce((sum, s) => sum + (s.yearlyUptime || 0), 0) /
      serviceReliabilityData.services.filter(s => s.yearlyUptime !== null).length
    : null;

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to view your app usage analytics
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-background via-muted/20 to-background p-4 rounded-lg border-2 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-xs">
              Track uptime, response times, and service reliability
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton onExport={handleExport} isExporting={isExporting} />
          <TimeRangeSelector
            value={timeRange}
            onChange={(v) => setTimeRange(v as TimeRange)}
            includeYearly={true}
          />
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-9 w-9">
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

      {/* Overview Stats - More Compact */}
      {summaryData?.totals && <AnalyticsOverview totals={summaryData.totals} />}

      {/* Tabs for Dashboard Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-0.5 bg-gradient-to-r from-muted/50 to-muted/30 shadow-sm">
          <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:shadow-md transition-all duration-200">Overview</TabsTrigger>
          <TabsTrigger value="uptime" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:shadow-md transition-all duration-200">Uptime & SLA</TabsTrigger>
          <TabsTrigger value="health" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:shadow-md transition-all duration-200">Health History</TabsTrigger>
          <TabsTrigger value="apps" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:shadow-md transition-all duration-200">App Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Top App Lists - Priority Position */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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

          {/* Charts - Below App Lists */}
          {dailyData?.metrics && dailyData.metrics.length > 0 && (
            <>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <AccessTrendChart
                  data={dailyData.metrics}
                  title="Access Trends"
                  description={`App accesses over the last ${timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : timeRange === "90d" ? "90 days" : timeRange === "1y" ? "year" : "all time"}`}
                />
                <MostUsedAppsChart
                  data={summaryData?.apps || []}
                  title="Most Used Apps"
                  description="Top apps by access count"
                />
              </div>

              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <UptimeTrendChart
                  data={dailyData.metrics}
                  title="Uptime Trends"
                  description="Average uptime percentage across all apps"
                />
                <EnhancedResponseTimeChart
                  data={dailyData.metrics}
                  title="Response Time Trends"
                  description="Average response time across all apps"
                />
              </div>
            </>
          )}
        </TabsContent>

        {/* Uptime & SLA Tab */}
        <TabsContent value="uptime" className="space-y-4 mt-4">
          {/* SLA Summary */}
          <SlaSummaryCard
            monthlyUptime={monthlyUptime}
            yearlyUptime={yearlyUptime}
            targetSla={99.9}
          />

          {/* Uptime Statistics */}
          <UptimeStatistics
            stats={uptimeStatsData?.stats || null}
            monthlyBreakdown={uptimeStatsData?.monthlyBreakdown || []}
            yearlyStats={uptimeStatsData?.yearlyStats || null}
            isLoading={isUptimeStatsLoading}
          />

          {/* Service Reliability Table */}
          <ServiceReliabilityTable
            services={serviceReliabilityData?.services || []}
            isLoading={isServiceReliabilityLoading}
          />

          {/* Reliability Chart */}
          {summaryData?.apps && summaryData.apps.length > 0 && (
            <AppReliabilityChart
              data={summaryData.apps}
              title="App Reliability Overview"
              description="Uptime percentage for apps with health checks enabled"
            />
          )}
        </TabsContent>

        {/* Health History Tab */}
        <TabsContent value="health" className="space-y-4 mt-4">
          <HealthStatusHistory
            history={healthHistoryData?.history || []}
            isLoading={isHealthHistoryLoading}
          />

          {/* Response Time Chart */}
          {dailyData?.metrics && dailyData.metrics.length > 0 && (
            <ResponseTimeChart
              data={dailyData.metrics}
              title="Response Time Trends"
              description="Average response time over time"
            />
          )}
        </TabsContent>

        {/* App Details Tab */}
        <TabsContent value="apps" className="space-y-4 mt-4">
          {/* App Lists in Grid */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <TopAppsList
              apps={sortedByUsage}
              title="Most Used Apps"
              description="Your most frequently accessed apps"
              type="most-used"
              limit={10}
            />
            <TopAppsList
              apps={leastReliableApps}
              title="Apps Needing Attention"
              description="Apps with lowest uptime percentage"
              type="least-reliable"
              limit={10}
            />
          </div>

          {/* Reliability Chart */}
          {summaryData?.apps && summaryData.apps.length > 0 && (
            <AppReliabilityChart
              data={summaryData.apps}
              title="Complete App Reliability"
              description="Uptime percentage for all apps with health checks"
              limit={20}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {!isLoading && summaryData?.apps?.length === 0 && (
        <div className="text-center py-16 px-6">
          <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
            <BarChart3 className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">No Analytics Data Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-base mb-4">
            Start using your apps to see usage statistics, health trends, and performance metrics here.
          </p>
        </div>
      )}
    </main>
  );
}
