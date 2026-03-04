/**
 * Mock Analytics Data Generator
 *
 * Generates realistic mock data for the analytics dashboard
 * when no backend data is available (demo/frontend-only mode)
 */

import type {
  AppAnalyticsSummary,
  DailyMetric,
  TimeRange,
  HealthHistoryEntry,
  UptimeStats,
  ServiceReliabilityStats,
} from "@/lib/server/analytics.server";

// ============================================================================
// Sample App Data
// ============================================================================

const SAMPLE_APPS = [
  { id: "app-1", name: "Plex Media Server", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/plex.png" },
  { id: "app-2", name: "Home Assistant", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/home-assistant.png" },
  { id: "app-3", name: "Nextcloud", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/nextcloud.png" },
  { id: "app-4", name: "Portainer", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/portainer.png" },
  { id: "app-5", name: "Grafana", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/grafana.png" },
  { id: "app-6", name: "Jellyfin", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/jellyfin.png" },
  { id: "app-7", name: "Pi-hole", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/pi-hole.png" },
  { id: "app-8", name: "Sonarr", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/sonarr.png" },
  { id: "app-9", name: "Radarr", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/radarr.png" },
  { id: "app-10", name: "Transmission", icon: "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/transmission.png" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getDaysForRange(range: TimeRange): number {
  switch (range) {
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
    case "1y": return 365;
    case "all": return 365;
    default: return 30;
  }
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals = 2): number {
  return Number.parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateRealisticUptime(): number {
  // Most services have high uptime, with occasional issues
  const roll = Math.random();
  if (roll < 0.6) return getRandomFloat(99.5, 100, 2); // 60% excellent
  if (roll < 0.85) return getRandomFloat(98, 99.5, 2); // 25% good
  if (roll < 0.95) return getRandomFloat(95, 98, 2);   // 10% fair
  return getRandomFloat(85, 95, 2);                     // 5% poor
}

function generateRealisticResponseTime(): number {
  // Response times vary by service type
  const roll = Math.random();
  if (roll < 0.5) return getRandomInt(20, 100);   // 50% fast
  if (roll < 0.8) return getRandomInt(100, 300);  // 30% moderate
  if (roll < 0.95) return getRandomInt(300, 800); // 15% slow
  return getRandomInt(800, 2000);                  // 5% very slow
}

function generateDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate mock app analytics summary
 */
export function generateMockAnalyticsSummary(range: TimeRange): {
  apps: AppAnalyticsSummary[];
  totals: {
    totalApps: number;
    totalAccesses: number;
    averageUptime: number | null;
    averageResponseTime: number | null;
  };
} {
  const days = getDaysForRange(range);

  const apps: AppAnalyticsSummary[] = SAMPLE_APPS.map((app, index) => {
    // Generate varying usage patterns
    const baseAccesses = getRandomInt(10, 200);
    const accessMultiplier = Math.max(0.5, 1 - (index * 0.08)); // First apps more popular
    const totalAccesses = Math.round(baseAccesses * days * accessMultiplier / 10);

    const uptime = generateRealisticUptime();
    const avgResponseTime = generateRealisticResponseTime();
    const healthChecks = Math.round(days * 24 * 0.3); // ~30% of hours have health checks

    const successfulChecks = Math.round(healthChecks * (uptime / 100));
    const failedChecks = healthChecks - successfulChecks;

    // Generate last accessed time (more popular apps accessed more recently)
    const lastAccessedDaysAgo = getRandomInt(0, Math.min(7, Math.round(index / 2)));
    const lastAccessed = new Date();
    lastAccessed.setDate(lastAccessed.getDate() - lastAccessedDaysAgo);

    return {
      appId: app.id,
      appName: app.name,
      appIcon: app.icon,
      totalAccesses,
      lastAccessedAt: lastAccessed.toISOString(),
      averageResponseTime: avgResponseTime,
      uptimePercentage: uptime,
      healthCheckCount: healthChecks,
      onlineCount: successfulChecks,
      offlineCount: failedChecks,
    };
  });

  // Sort by total accesses
  apps.sort((a, b) => b.totalAccesses - a.totalAccesses);

  // Calculate totals
  const appsWithUptime = apps.filter(a => a.uptimePercentage !== null);
  const appsWithResponseTime = apps.filter(a => a.averageResponseTime !== null);

  const totals = {
    totalApps: apps.length,
    totalAccesses: apps.reduce((sum, a) => sum + a.totalAccesses, 0),
    averageUptime: appsWithUptime.length > 0
      ? appsWithUptime.reduce((sum, a) => sum + (a.uptimePercentage || 0), 0) / appsWithUptime.length
      : null,
    averageResponseTime: appsWithResponseTime.length > 0
      ? Math.round(appsWithResponseTime.reduce((sum, a) => sum + (a.averageResponseTime || 0), 0) / appsWithResponseTime.length)
      : null,
  };

  return { apps, totals };
}

/**
 * Generate mock daily metrics for charts
 */
export function generateMockDailyMetrics(range: TimeRange, _appId?: string): { metrics: DailyMetric[] } {
  const days = getDaysForRange(range);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const dates = generateDatesBetween(start, end);

  // Generate baseline values that change over time (simulating trends)
  const baseAccesses = getRandomInt(50, 150);
  const baseUptime = getRandomFloat(97, 100, 2);
  const baseResponseTime = getRandomInt(80, 200);

  const metrics: DailyMetric[] = dates.map((date, index) => {
    // Add some variance with weekly patterns (weekends slightly lower)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 0.7 : 1;

    // Add trend (slight improvement over time)
    const trendMultiplier = 1 + (index / dates.length) * 0.2;

    // Add random daily variance
    const dailyVariance = getRandomFloat(0.7, 1.3, 2);

    const accessCount = Math.round(
      baseAccesses * weekendMultiplier * trendMultiplier * dailyVariance
    );

    // Uptime fluctuates less
    const uptimeVariance = getRandomFloat(-1, 0.5, 2);
    const uptimePercentage = Math.min(100, Math.max(90, baseUptime + uptimeVariance));

    // Response time can spike occasionally
    const responseSpike = Math.random() < 0.05 ? getRandomInt(200, 500) : 0;
    const responseVariance = getRandomInt(-30, 30);
    const averageResponseTime = Math.max(20, baseResponseTime + responseVariance + responseSpike);

    return {
      date: date.toISOString().split("T")[0],
      accessCount,
      uptimePercentage,
      averageResponseTime,
    };
  });

  return { metrics };
}

/**
 * Generate mock health history
 */
export function generateMockHealthHistory(
  range: TimeRange,
  limit = 100,
  appId?: string
): { history: HealthHistoryEntry[] } {
  const days = getDaysForRange(range);
  const history: HealthHistoryEntry[] = [];
  const apps = appId
    ? SAMPLE_APPS.filter(a => a.id === appId)
    : SAMPLE_APPS;

  // Generate health checks (approximately 4-6 per hour per app for demo)
  const checksPerApp = Math.min(limit / apps.length, days * 24 * 0.2);

  for (const app of apps) {
    const appUptime = generateRealisticUptime();

    for (let i = 0; i < checksPerApp; i++) {
      const checkedAt = new Date();
      checkedAt.setMinutes(checkedAt.getMinutes() - getRandomInt(0, days * 24 * 60));

      // Determine status based on app's uptime
      const isOnline = Math.random() * 100 < appUptime;
      const status = isOnline ? "online" : "offline";

      const responseTime = isOnline ? generateRealisticResponseTime() : null;
      const error = !isOnline && Math.random() < 0.7
        ? ["Connection timeout", "Service unavailable", "Host unreachable", "Connection refused"][getRandomInt(0, 3)]
        : null;

      history.push({
        status: status as "online" | "offline" | "unknown",
        responseTime,
        error,
        checkedAt: checkedAt.toISOString(),
        appName: app.name,
        appIcon: app.icon,
        appId: app.id,
      });
    }
  }

  // Sort by most recent and limit
  history.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());

  return { history: history.slice(0, limit) };
}

/**
 * Generate mock uptime statistics
 */
export function generateMockUptimeStats(range: TimeRange, _appId?: string): {
  stats: UptimeStats | null;
  monthlyBreakdown: UptimeStats[];
  yearlyStats: UptimeStats | null;
} {
  const days = getDaysForRange(range);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const baseUptime = generateRealisticUptime();
  const totalChecks = days * 24 * 2; // ~2 checks per hour
  const successfulChecks = Math.round(totalChecks * (baseUptime / 100));
  const failedChecks = totalChecks - successfulChecks;
  const avgResponseTime = generateRealisticResponseTime();

  const stats: UptimeStats = {
    period: range,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    totalHealthChecks: totalChecks,
    successfulChecks,
    failedChecks,
    uptimePercentage: baseUptime,
    averageResponseTime: avgResponseTime,
    minResponseTime: Math.round(avgResponseTime * 0.3),
    maxResponseTime: Math.round(avgResponseTime * 3),
  };

  // Generate monthly breakdown
  const monthlyBreakdown: UptimeStats[] = [];
  const monthsToShow = Math.min(12, Math.ceil(days / 30));

  for (let i = 0; i < monthsToShow; i++) {
    const monthEnd = new Date();
    monthEnd.setMonth(monthEnd.getMonth() - i);
    const monthStart = new Date(monthEnd);
    monthStart.setDate(1);

    const monthUptime = Math.min(100, Math.max(90, baseUptime + getRandomFloat(-2, 1, 2)));
    const monthChecks = getRandomInt(500, 800);
    const monthSuccessful = Math.round(monthChecks * (monthUptime / 100));

    monthlyBreakdown.push({
      period: monthStart.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
      totalHealthChecks: monthChecks,
      successfulChecks: monthSuccessful,
      failedChecks: monthChecks - monthSuccessful,
      uptimePercentage: monthUptime,
      averageResponseTime: Math.round(avgResponseTime * getRandomFloat(0.8, 1.2, 2)),
      minResponseTime: Math.round(avgResponseTime * 0.2),
      maxResponseTime: Math.round(avgResponseTime * 4),
    });
  }

  monthlyBreakdown.reverse();

  // Generate yearly stats
  const yearlyUptime = Math.min(100, Math.max(95, baseUptime + getRandomFloat(-1, 0.5, 2)));
  const yearlyChecks = 365 * 24 * 2;
  const yearlySuccessful = Math.round(yearlyChecks * (yearlyUptime / 100));

  const yearlyStats: UptimeStats = {
    period: "1y",
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
    endDate: end.toISOString(),
    totalHealthChecks: yearlyChecks,
    successfulChecks: yearlySuccessful,
    failedChecks: yearlyChecks - yearlySuccessful,
    uptimePercentage: yearlyUptime,
    averageResponseTime: avgResponseTime,
    minResponseTime: Math.round(avgResponseTime * 0.2),
    maxResponseTime: Math.round(avgResponseTime * 5),
  };

  return { stats, monthlyBreakdown, yearlyStats };
}

/**
 * Generate mock service reliability statistics
 */
export function generateMockServiceReliability(_range: TimeRange): {
  services: ServiceReliabilityStats[];
} {
  const services: ServiceReliabilityStats[] = SAMPLE_APPS.map((app, _index) => {
    const monthlyUptime = generateRealisticUptime();
    const yearlyUptime = Math.min(100, Math.max(95, monthlyUptime + getRandomFloat(-2, 1, 2)));

    // Calculate downtime (in minutes)
    const failedChecksMonthly = Math.round(30 * 24 * 2 * ((100 - monthlyUptime) / 100));
    const totalDowntime = failedChecksMonthly * 5; // Assume 5 minutes per failure

    // Generate last incident (more recent for less reliable services)
    const incidentDaysAgo = monthlyUptime >= 99.9
      ? getRandomInt(30, 90)
      : monthlyUptime >= 99
        ? getRandomInt(7, 30)
        : getRandomInt(0, 7);

    const lastIncident = new Date();
    lastIncident.setDate(lastIncident.getDate() - incidentDaysAgo);

    return {
      appId: app.id,
      appName: app.name,
      appIcon: app.icon,
      monthlyUptime,
      yearlyUptime,
      totalDowntime,
      mttr: failedChecksMonthly > 0 ? Math.round(totalDowntime / failedChecksMonthly) : null,
      mtbf: failedChecksMonthly > 0 ? Math.round((30 * 24) / failedChecksMonthly) : null,
      lastIncident: lastIncident.toISOString(),
    };
  });

  // Sort by lowest yearly uptime (most problematic first)
  services.sort((a, b) => (a.yearlyUptime || 100) - (b.yearlyUptime || 100));

  return { services };
}

/**
 * Generate mock export data
 */
export function generateMockExportData(range: TimeRange, format: "csv" | "json") {
  const { metrics } = generateMockDailyMetrics(range);
  const { history } = generateMockHealthHistory(range, 500);

  const start = new Date();
  start.setDate(start.getDate() - getDaysForRange(range));

  const exportData = {
    exportedAt: new Date().toISOString(),
    range,
    startDate: start.toISOString(),
    endDate: new Date().toISOString(),
    metrics: metrics.map((m, idx) => ({
      date: m.date,
      appId: SAMPLE_APPS[idx % SAMPLE_APPS.length].id,
      appName: SAMPLE_APPS[idx % SAMPLE_APPS.length].name,
      accessCount: m.accessCount,
      totalHealthChecks: Math.round((m.uptimePercentage || 0) * 10),
      successfulHealthChecks: Math.round((m.uptimePercentage || 0) * 9.5),
      failedHealthChecks: Math.round((m.uptimePercentage || 0) * 0.5),
      uptimePercentage: m.uptimePercentage?.toFixed(2) || null,
      avgResponseTime: m.averageResponseTime,
      minResponseTime: Math.round((m.averageResponseTime || 100) * 0.3),
      maxResponseTime: Math.round((m.averageResponseTime || 100) * 3),
    })),
    healthHistory: history.map(h => ({
      checkedAt: h.checkedAt,
      appId: h.appId,
      appName: h.appName,
      status: h.status,
      responseTime: h.responseTime,
      error: h.error,
    })),
  };

  if (format === "csv") {
    const metricsCsv = [
      "Date,App ID,App Name,Access Count,Total Health Checks,Successful Checks,Failed Checks,Uptime %,Avg Response Time,Min Response Time,Max Response Time",
      ...exportData.metrics.map((m) =>
        `${m.date},${m.appId},"${m.appName}",${m.accessCount},${m.totalHealthChecks},${m.successfulHealthChecks},${m.failedHealthChecks},${m.uptimePercentage || ""},${m.avgResponseTime || ""},${m.minResponseTime || ""},${m.maxResponseTime || ""}`
      ),
    ].join("\n");

    const healthCsv = [
      "Checked At,App ID,App Name,Status,Response Time,Error",
      ...exportData.healthHistory.map((h) =>
        `${h.checkedAt},${h.appId},"${h.appName}",${h.status},${h.responseTime || ""},"${h.error || ""}"`
      ),
    ].join("\n");

    return {
      format: "csv" as const,
      metrics: metricsCsv,
      healthHistory: healthCsv,
      filename: `analytics-demo-${range}-${new Date().toISOString().split("T")[0]}`,
    };
  }

  return {
    format: "json" as const,
    data: exportData,
    filename: `analytics-demo-${range}-${new Date().toISOString().split("T")[0]}`,
  };
}

/**
 * Check if we should use mock data (no real data available)
 */
export function shouldUseMockData(): boolean {
  // This could be enhanced to check localStorage, URL params, or other conditions
  return typeof window !== 'undefined' && (
    window.location.search.includes('demo=true') ||
    window.location.pathname.includes('/demo')
  );
}
