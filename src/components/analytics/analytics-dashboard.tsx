import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  XCircle,
  Zap,
  Calendar,
  Server,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  HealthHistoryEntry,
  UptimeStats,
  ServiceReliabilityStats,
  DailyMetric,
} from "@/lib/server/analytics.server";

// ============================================================================
// Health Status History Component
// ============================================================================

interface HealthStatusHistoryProps {
  history: HealthHistoryEntry[];
  isLoading?: boolean;
  onFilterChange?: (appId: string | undefined) => void;
}

export function HealthStatusHistory({
  history,
  isLoading = false,
  onFilterChange,
}: HealthStatusHistoryProps) {
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>(undefined);

  // Get unique apps for filter
  const uniqueApps = useMemo(() => {
    const apps = new Map<string, { name: string; icon: string | null }>();
    for (const h of history) {
      if (!apps.has(h.appId)) {
        apps.set(h.appId, { name: h.appName, icon: h.appIcon });
      }
    }
    return Array.from(apps.entries()).map(([id, app]) => ({
      id,
      ...app,
    }));
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (!selectedAppId) return history;
    return history.filter((h) => h.appId === selectedAppId);
  }, [history, selectedAppId]);

  const handleAppChange = (value: string) => {
    const appId = value === "all" ? undefined : value;
    setSelectedAppId(appId);
    onFilterChange?.(appId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Online</Badge>;
      case "offline":
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 pb-3 pt-3 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-green-600 dark:text-green-500" />
              Health Status History
            </CardTitle>
            <CardDescription className="text-xs">Recent health check events across all services</CardDescription>
          </div>
          <Select value={selectedAppId || "all"} onValueChange={handleAppChange}>
            <SelectTrigger className="w-[180px] shadow-sm">
              <SelectValue placeholder="Filter by app" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Apps</SelectItem>
              {uniqueApps.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p>No health check history available</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredHistory.map((entry, index) => (
                <div
                  key={`${entry.appId}-${entry.checkedAt}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 hover:shadow-md transition-all duration-200 hover:border-primary/30"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(entry.status)}
                  </div>
                  <div className="flex-shrink-0 h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    {entry.appIcon ? (
                      entry.appIcon.startsWith("http") ? (
                        <img src={entry.appIcon} alt="" className="h-5 w-5 object-contain" />
                      ) : (
                        <span className="text-sm">{entry.appIcon}</span>
                      )
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        {entry.appName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{entry.appName}</span>
                      {getStatusBadge(entry.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(entry.checkedAt)}
                      </span>
                      {entry.responseTime !== null && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {entry.responseTime}ms
                        </span>
                      )}
                    </div>
                    {entry.error && (
                      <p className="text-xs text-red-500 mt-1 truncate">{entry.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Uptime Statistics Component
// ============================================================================

interface UptimeStatisticsProps {
  stats: UptimeStats | null;
  monthlyBreakdown: UptimeStats[];
  yearlyStats: UptimeStats | null;
  isLoading?: boolean;
}

export function UptimeStatistics({
  stats,
  monthlyBreakdown,
  yearlyStats,
  isLoading = false,
}: UptimeStatisticsProps) {
  const getUptimeColor = (percentage: number | null) => {
    if (percentage === null) return "text-muted-foreground";
    if (percentage >= 99.9) return "text-green-500";
    if (percentage >= 99) return "text-green-400";
    if (percentage >= 95) return "text-yellow-500";
    return "text-red-500";
  };

  const getSlaStatus = (percentage: number | null) => {
    if (percentage === null) return { label: "N/A", variant: "secondary" as const };
    if (percentage >= 99.99) return { label: "Excellent", variant: "default" as const };
    if (percentage >= 99.9) return { label: "Good", variant: "default" as const };
    if (percentage >= 99) return { label: "Fair", variant: "secondary" as const };
    return { label: "Poor", variant: "destructive" as const };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Uptime Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 pb-3 pt-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          Uptime Statistics
        </CardTitle>
        <CardDescription className="text-xs">SLA metrics and reliability statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className={cn("text-3xl font-bold", getUptimeColor(stats.uptimePercentage))}>
                      {stats.uptimePercentage !== null ? `${stats.uptimePercentage.toFixed(2)}%` : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Uptime</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold">
                      {stats.averageResponseTime !== null ? `${stats.averageResponseTime}ms` : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Avg Response</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold text-green-500">
                      {stats.successfulChecks.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Successful Checks</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold text-red-500">
                      {stats.failedChecks.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Failed Checks</div>
                  </div>
                </div>

                {stats.uptimePercentage !== null && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uptime Progress</span>
                      <Badge variant={getSlaStatus(stats.uptimePercentage).variant}>
                        {getSlaStatus(stats.uptimePercentage).label}
                      </Badge>
                    </div>
                    <Progress value={stats.uptimePercentage} className="h-3" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg border">
                    <div className="text-muted-foreground">Min Response Time</div>
                    <div className="font-semibold">
                      {stats.minResponseTime !== null ? `${stats.minResponseTime}ms` : "N/A"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="text-muted-foreground">Max Response Time</div>
                    <div className="font-semibold">
                      {stats.maxResponseTime !== null ? `${stats.maxResponseTime}ms` : "N/A"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No uptime data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="mt-4">
            {monthlyBreakdown.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, "Uptime"]}
                      />
                      <Bar
                        dataKey="uptimePercentage"
                        fill="hsl(142, 76%, 36%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {monthlyBreakdown.map((month) => (
                      <div
                        key={month.period}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{month.period}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={getUptimeColor(month.uptimePercentage)}>
                            {month.uptimePercentage !== null
                              ? `${month.uptimePercentage.toFixed(2)}%`
                              : "N/A"}
                          </span>
                          <span className="text-muted-foreground">
                            {month.totalHealthChecks} checks
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No monthly data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="yearly" className="mt-4">
            {yearlyStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                    <div className={cn("text-4xl font-bold", getUptimeColor(yearlyStats.uptimePercentage))}>
                      {yearlyStats.uptimePercentage !== null
                        ? `${yearlyStats.uptimePercentage.toFixed(3)}%`
                        : "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Yearly Uptime</div>
                    <Badge variant={getSlaStatus(yearlyStats.uptimePercentage).variant} className="mt-2">
                      {getSlaStatus(yearlyStats.uptimePercentage).label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg border flex justify-between">
                    <span className="text-muted-foreground">Total Health Checks</span>
                    <span className="font-semibold">{yearlyStats.totalHealthChecks.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-lg border flex justify-between">
                    <span className="text-muted-foreground">Successful Checks</span>
                    <span className="font-semibold text-green-500">
                      {yearlyStats.successfulChecks.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border flex justify-between">
                    <span className="text-muted-foreground">Failed Checks</span>
                    <span className="font-semibold text-red-500">
                      {yearlyStats.failedChecks.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border flex justify-between">
                    <span className="text-muted-foreground">Avg Response Time</span>
                    <span className="font-semibold">
                      {yearlyStats.averageResponseTime !== null
                        ? `${yearlyStats.averageResponseTime}ms`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No yearly data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Service Reliability Table Component
// ============================================================================

interface ServiceReliabilityTableProps {
  services: ServiceReliabilityStats[];
  isLoading?: boolean;
}

export function ServiceReliabilityTable({
  services,
  isLoading = false,
}: ServiceReliabilityTableProps) {
  const getUptimeBadge = (percentage: number | null) => {
    if (percentage === null) return <Badge variant="secondary">N/A</Badge>;
    if (percentage >= 99.9) return <Badge variant="default" className="bg-green-500">99.9%+</Badge>;
    if (percentage >= 99) return <Badge variant="default" className="bg-green-400">{percentage.toFixed(1)}%</Badge>;
    if (percentage >= 95) return <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>;
    return <Badge variant="destructive">{percentage.toFixed(1)}%</Badge>;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 pb-3 pt-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-4 w-4 text-purple-600 dark:text-purple-500" />
          Service Reliability
        </CardTitle>
        <CardDescription className="text-xs">Detailed SLA metrics for each service</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No services with health checks enabled</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.appId}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 hover:shadow-md transition-all duration-200 hover:border-primary/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {service.appIcon ? (
                        service.appIcon.startsWith("http") ? (
                          <img src={service.appIcon} alt="" className="h-6 w-6 object-contain" />
                        ) : (
                          <span className="text-lg">{service.appIcon}</span>
                        )
                      ) : (
                        <span className="font-medium text-muted-foreground">
                          {service.appName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{service.appName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Last incident: {formatDate(service.lastIncident)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">Monthly Uptime</div>
                      <div className="font-semibold mt-1">
                        {getUptimeBadge(service.monthlyUptime)}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">Yearly Uptime</div>
                      <div className="font-semibold mt-1">
                        {getUptimeBadge(service.yearlyUptime)}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">Total Downtime</div>
                      <div className="font-semibold mt-1">{formatDuration(service.totalDowntime)}</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">MTTR</div>
                      <div className="font-semibold mt-1">
                        {service.mttr !== null ? `${service.mttr}m` : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Enhanced Response Time Chart with Min/Max
// ============================================================================

interface EnhancedResponseTimeChartProps {
  data: DailyMetric[];
  title?: string;
  description?: string;
}

export function EnhancedResponseTimeChart({
  data,
  title = "Response Time Trends",
  description = "Response time metrics over time",
}: EnhancedResponseTimeChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.averageResponseTime !== null)
      .map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        avg: d.averageResponseTime || 0,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No response time data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 pb-2 pt-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`${value}ms`, "Avg Response"]}
              />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="hsl(221, 83%, 53%)"
                fillOpacity={1}
                fill="url(#responseTimeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export Button Component
// ============================================================================

interface ExportButtonProps {
  onExport: (format: "csv" | "json" | "pdf") => void;
  isExporting?: boolean;
}

export function ExportButton({ onExport, isExporting = false }: ExportButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport("pdf")}
        disabled={isExporting}
        className="gap-2 shadow-md hover:shadow-lg transition-shadow"
      >
        <Download className="h-4 w-4" />
        PDF Report
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport("csv")}
        disabled={isExporting}
        className="gap-2 shadow-md hover:shadow-lg transition-shadow"
      >
        <FileSpreadsheet className="h-4 w-4" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport("json")}
        disabled={isExporting}
        className="gap-2 shadow-md hover:shadow-lg transition-shadow"
      >
        <FileJson className="h-4 w-4" />
        JSON
      </Button>
    </div>
  );
}

// ============================================================================
// Time Range Selector Component
// ============================================================================

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  includeYearly?: boolean;
}

export function TimeRangeSelector({
  value,
  onChange,
  includeYearly = true,
}: TimeRangeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Time range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
        {includeYearly && <SelectItem value="1y">Last year</SelectItem>}
        <SelectItem value="all">All time</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// SLA Summary Card Component
// ============================================================================

interface SlaSummaryCardProps {
  monthlyUptime: number | null;
  yearlyUptime: number | null;
  targetSla?: number;
}

export function SlaSummaryCard({
  monthlyUptime,
  yearlyUptime,
  targetSla = 99.9,
}: SlaSummaryCardProps) {
  const isMonthlyMet = monthlyUptime !== null && monthlyUptime >= targetSla;
  const isYearlyMet = yearlyUptime !== null && yearlyUptime >= targetSla;

  return (
    <Card className="shadow-lg border-2 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 pb-3 pt-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-green-600 dark:text-green-500" />
          SLA Summary
        </CardTitle>
        <CardDescription className="text-xs">Target: {targetSla}% uptime</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={cn(
              "p-4 rounded-lg border-2 text-center transition-colors",
              isMonthlyMet
                ? "border-green-500/50 bg-green-500/10"
                : monthlyUptime !== null
                ? "border-red-500/50 bg-red-500/10"
                : "border-muted"
            )}
          >
            <div className="text-2xl font-bold">
              {monthlyUptime !== null ? `${monthlyUptime.toFixed(2)}%` : "N/A"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Monthly Uptime</div>
            {monthlyUptime !== null && (
              <div className="mt-2">
                {isMonthlyMet ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    SLA Met
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Below Target
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "p-4 rounded-lg border-2 text-center transition-colors",
              isYearlyMet
                ? "border-green-500/50 bg-green-500/10"
                : yearlyUptime !== null
                ? "border-red-500/50 bg-red-500/10"
                : "border-muted"
            )}
          >
            <div className="text-2xl font-bold">
              {yearlyUptime !== null ? `${yearlyUptime.toFixed(2)}%` : "N/A"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Yearly Uptime</div>
            {yearlyUptime !== null && (
              <div className="mt-2">
                {isYearlyMet ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    SLA Met
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Below Target
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
