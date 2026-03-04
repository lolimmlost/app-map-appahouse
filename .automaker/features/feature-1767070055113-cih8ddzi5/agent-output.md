1. **Goal**: Make the analytics dashboard functional with frontend-only mock data and interactive visualizations.

2. **Approach**: Explore the existing analytics dashboard code to understand current structure, then implement mock data generation for uptime metrics, response time trends, and health status history. Add interactive charts using existing chart libraries and implement time range filters (7d, 30d, 90d, 1y) with export capabilities.

3. **Files to Touch**:
   - `src/app/analytics/page.tsx` - Main analytics dashboard page
   - `src/lib/mock-analytics-data.ts` - New file for mock data generation
   - `src/components/analytics/*` - Analytics chart components
   - `src/utils/export.ts` - Export utilities for PDF/CSV

4. **Tasks**:
   1. Explore existing analytics dashboard structure and components
   2. Create mock data generation utilities for uptime, response time, health history
   3. Implement time range filter functionality (7d, 30d, 90d, 1y)
   4. Build interactive charts for uptime trends and response time graphs
   5. Add health status history timeline component
   6. Implement PDF/CSV export functionality
   7. Test and polish the dashboard UI

5. **Risks**:
   - Chart library compatibility and configuration
   - Mock data generation complexity for realistic patterns
   - PDF export may need additional dependencies
   - Responsive design considerations for dashboard layout

[PLAN_GENERATED] Planning outline complete.

Let me start by exploring the existing codebase structure:

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*analytics*"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/app/**/*.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/components/**/*.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/analytics/analytics-dashboard.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/analytics/analytics-charts.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/analytics/analytics-stats.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-analytics.ts"
}

Let me also check the server-side analytics file and understand the data types:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/analytics.server.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/package.json"
}

Now I have a full understanding of the codebase. The analytics dashboard is already well-built with backend server functions. The issue is that these functions require database data. To make the dashboard work frontend-only with mock data, I'll need to:

1. Create a mock data generation utility
2. Modify the hooks to support demo/mock mode
3. Add PDF export capability (currently only CSV/JSON is supported)

Let me create the implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create mock analytics data generator",
      "status": "in_progress",
      "activeForm": "Creating mock analytics data generator"
    },
    {
      "content": "Create demo mode hook wrapper for analytics",
      "status": "pending",
      "activeForm": "Creating demo mode hook wrapper"
    },
    {
      "content": "Add PDF export functionality",
      "status": "pending",
      "activeForm": "Adding PDF export functionality"
    },
    {
      "content": "Update analytics route to support demo mode",
      "status": "pending",
      "activeForm": "Updating analytics route for demo mode"
    },
    {
      "content": "Test and verify dashboard functionality",
      "status": "pending",
      "activeForm": "Testing dashboard functionality"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "content": "/**\n * Mock Analytics Data Generator\n *\n * Generates realistic mock data for the analytics dashboard\n * when no backend data is available (demo/frontend-only mode)\n */\n\nimport type {\n  AppAnalyticsSummary,\n  DailyMetric,\n  TimeRange,\n  HealthHistoryEntry,\n  UptimeStats,\n  ServiceReliabilityStats,\n} from \"@/lib/server/analytics.server\";\n\n// ============================================================================\n// Sample App Data\n// ============================================================================\n\nconst SAMPLE_APPS = [\n  { id: \"app-1\", name: \"Plex Media Server\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/plex.png\" },\n  { id: \"app-2\", name: \"Home Assistant\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/home-assistant.png\" },\n  { id: \"app-3\", name: \"Nextcloud\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/nextcloud.png\" },\n  { id: \"app-4\", name: \"Portainer\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/portainer.png\" },\n  { id: \"app-5\", name: \"Grafana\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/grafana.png\" },\n  { id: \"app-6\", name: \"Jellyfin\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/jellyfin.png\" },\n  { id: \"app-7\", name: \"Pi-hole\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/pi-hole.png\" },\n  { id: \"app-8\", name: \"Sonarr\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/sonarr.png\" },\n  { id: \"app-9\", name: \"Radarr\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/radarr.png\" },\n  { id: \"app-10\", name: \"Transmission\", icon: \"https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/transmission.png\" },\n];\n\n// ============================================================================\n// Helper Functions\n// ============================================================================\n\nfunction getDaysForRange(range: TimeRange): number {\n  switch (range) {\n    case \"7d\": return 7;\n    case \"30d\": return 30;\n    case \"90d\": return 90;\n    case \"1y\": return 365;\n    case \"all\": return 365;\n    default: return 30;\n  }\n}\n\nfunction getRandomInt(min: number, max: number): number {\n  return Math.floor(Math.random() * (max - min + 1)) + min;\n}\n\nfunction getRandomFloat(min: number, max: number, decimals = 2): number {\n  return Number.parseFloat((Math.random() * (max - min) + min).toFixed(decimals));\n}\n\nfunction generateRealisticUptime(): number {\n  // Most services have high uptime, with occasional issues\n  const roll = Math.random();\n  if (roll < 0.6) return getRandomFloat(99.5, 100, 2); // 60% excellent\n  if (roll < 0.85) return getRandomFloat(98, 99.5, 2); // 25% good\n  if (roll < 0.95) return getRandomFloat(95, 98, 2);   // 10% fair\n  return getRandomFloat(85, 95, 2);                     // 5% poor\n}\n\nfunction generateRealisticResponseTime(): number {\n  // Response times vary by service type\n  const roll = Math.random();\n  if (roll < 0.5) return getRandomInt(20, 100);   // 50% fast\n  if (roll < 0.8) return getRandomInt(100, 300);  // 30% moderate\n  if (roll < 0.95) return getRandomInt(300, 800); // 15% slow\n  return getRandomInt(800, 2000);                  // 5% very slow\n}\n\nfunction generateDatesBetween(start: Date, end: Date): Date[] {\n  const dates: Date[] = [];\n  const current = new Date(start);\n  while (current <= end) {\n    dates.push(new Date(current));\n    current.setDate(current.getDate() + 1);\n  }\n  return dates;\n}\n\n// ============================================================================\n// Mock Data Generators\n// ============================================================================\n\n/**\n * Generate mock app analytics summary\n */\nexport function generateMockAnalyticsSummary(range: TimeRange): {\n  apps: AppAnalyticsSummary[];\n  totals: {\n    totalApps: number;\n    totalAccesses: number;\n    averageUptime: number | null;\n    averageResponseTime: number | null;\n  };\n} {\n  const days = getDaysForRange(range);\n\n  const apps: AppAnalyticsSummary[] = SAMPLE_APPS.map((app, index) => {\n    // Generate varying usage patterns\n    const baseAccesses = getRandomInt(10, 200);\n    const accessMultiplier = Math.max(0.5, 1 - (index * 0.08)); // First apps more popular\n    const totalAccesses = Math.round(baseAccesses * days * accessMultiplier / 10);\n\n    const uptime = generateRealisticUptime();\n    const avgResponseTime = generateRealisticResponseTime();\n    const healthChecks = Math.round(days * 24 * 0.3); // ~30% of hours have health checks\n\n    const successfulChecks = Math.round(healthChecks * (uptime / 100));\n    const failedChecks = healthChecks - successfulChecks;\n\n    // Generate last accessed time (more popular apps accessed more recently)\n    const lastAccessedDaysAgo = getRandomInt(0, Math.min(7, Math.round(index / 2)));\n    const lastAccessed = new Date();\n    lastAccessed.setDate(lastAccessed.getDate() - lastAccessedDaysAgo);\n\n    return {\n      appId: app.id,\n      appName: app.name,\n      appIcon: app.icon,\n      totalAccesses,\n      lastAccessedAt: lastAccessed.toISOString(),\n      averageResponseTime: avgResponseTime,\n      uptimePercentage: uptime,\n      healthCheckCount: healthChecks,\n      onlineCount: successfulChecks,\n      offlineCount: failedChecks,\n    };\n  });\n\n  // Sort by total accesses\n  apps.sort((a, b) => b.totalAccesses - a.totalAccesses);\n\n  // Calculate totals\n  const appsWithUptime = apps.filter(a => a.uptimePercentage !== null);\n  const appsWithResponseTime = apps.filter(a => a.averageResponseTime !== null);\n\n  const totals = {\n    totalApps: apps.length,\n    totalAccesses: apps.reduce((sum, a) => sum + a.totalAccesses, 0),\n    averageUptime: appsWithUptime.length > 0\n      ? appsWithUptime.reduce((sum, a) => sum + (a.uptimePercentage || 0), 0) / appsWithUptime.length\n      : null,\n    averageResponseTime: appsWithResponseTime.length > 0\n      ? Math.round(appsWithResponseTime.reduce((sum, a) => sum + (a.averageResponseTime || 0), 0) / appsWithResponseTime.length)\n      : null,\n  };\n\n  return { apps, totals };\n}\n\n/**\n * Generate mock daily metrics for charts\n */\nexport function generateMockDailyMetrics(range: TimeRange, appId?: string): { metrics: DailyMetric[] } {\n  const days = getDaysForRange(range);\n  const end = new Date();\n  end.setHours(23, 59, 59, 999);\n\n  const start = new Date();\n  start.setDate(start.getDate() - days);\n  start.setHours(0, 0, 0, 0);\n\n  const dates = generateDatesBetween(start, end);\n\n  // Generate baseline values that change over time (simulating trends)\n  const baseAccesses = getRandomInt(50, 150);\n  const baseUptime = getRandomFloat(97, 100, 2);\n  const baseResponseTime = getRandomInt(80, 200);\n\n  const metrics: DailyMetric[] = dates.map((date, index) => {\n    // Add some variance with weekly patterns (weekends slightly lower)\n    const dayOfWeek = date.getDay();\n    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;\n    const weekendMultiplier = isWeekend ? 0.7 : 1;\n\n    // Add trend (slight improvement over time)\n    const trendMultiplier = 1 + (index / dates.length) * 0.2;\n\n    // Add random daily variance\n    const dailyVariance = getRandomFloat(0.7, 1.3, 2);\n\n    const accessCount = Math.round(\n      baseAccesses * weekendMultiplier * trendMultiplier * dailyVariance\n    );\n\n    // Uptime fluctuates less\n    const uptimeVariance = getRandomFloat(-1, 0.5, 2);\n    const uptimePercentage = Math.min(100, Math.max(90, baseUptime + uptimeVariance));\n\n    // Response time can spike occasionally\n    const responseSpike = Math.random() < 0.05 ? getRandomInt(200, 500) : 0;\n    const responseVariance = getRandomInt(-30, 30);\n    const averageResponseTime = Math.max(20, baseResponseTime + responseVariance + responseSpike);\n\n    return {\n      date: date.toISOString().split(\"T\")[0],\n      accessCount,\n      uptimePercentage,\n      averageResponseTime,\n    };\n  });\n\n  return { metrics };\n}\n\n/**\n * Generate mock health history\n */\nexport function generateMockHealthHistory(\n  range: TimeRange,\n  limit = 100,\n  appId?: string\n): { history: HealthHistoryEntry[] } {\n  const days = getDaysForRange(range);\n  const history: HealthHistoryEntry[] = [];\n  const apps = appId\n    ? SAMPLE_APPS.filter(a => a.id === appId)\n    : SAMPLE_APPS;\n\n  // Generate health checks (approximately 4-6 per hour per app for demo)\n  const checksPerApp = Math.min(limit / apps.length, days * 24 * 0.2);\n\n  for (const app of apps) {\n    const appUptime = generateRealisticUptime();\n\n    for (let i = 0; i < checksPerApp; i++) {\n      const checkedAt = new Date();\n      checkedAt.setMinutes(checkedAt.getMinutes() - getRandomInt(0, days * 24 * 60));\n\n      // Determine status based on app's uptime\n      const isOnline = Math.random() * 100 < appUptime;\n      const status = isOnline ? \"online\" : \"offline\";\n\n      const responseTime = isOnline ? generateRealisticResponseTime() : null;\n      const error = !isOnline && Math.random() < 0.7\n        ? [\"Connection timeout\", \"Service unavailable\", \"Host unreachable\", \"Connection refused\"][getRandomInt(0, 3)]\n        : null;\n\n      history.push({\n        status: status as \"online\" | \"offline\" | \"unknown\",\n        responseTime,\n        error,\n        checkedAt: checkedAt.toISOString(),\n        appName: app.name,\n        appIcon: app.icon,\n        appId: app.id,\n      });\n    }\n  }\n\n  // Sort by most recent and limit\n  history.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());\n\n  return { history: history.slice(0, limit) };\n}\n\n/**\n * Generate mock uptime statistics\n */\nexport function generateMockUptimeStats(range: TimeRange, appId?: string): {\n  stats: UptimeStats | null;\n  monthlyBreakdown: UptimeStats[];\n  yearlyStats: UptimeStats | null;\n} {\n  const days = getDaysForRange(range);\n  const end = new Date();\n  const start = new Date();\n  start.setDate(start.getDate() - days);\n\n  const baseUptime = generateRealisticUptime();\n  const totalChecks = days * 24 * 2; // ~2 checks per hour\n  const successfulChecks = Math.round(totalChecks * (baseUptime / 100));\n  const failedChecks = totalChecks - successfulChecks;\n  const avgResponseTime = generateRealisticResponseTime();\n\n  const stats: UptimeStats = {\n    period: range,\n    startDate: start.toISOString(),\n    endDate: end.toISOString(),\n    totalHealthChecks: totalChecks,\n    successfulChecks,\n    failedChecks,\n    uptimePercentage: baseUptime,\n    averageResponseTime: avgResponseTime,\n    minResponseTime: Math.round(avgResponseTime * 0.3),\n    maxResponseTime: Math.round(avgResponseTime * 3),\n  };\n\n  // Generate monthly breakdown\n  const monthlyBreakdown: UptimeStats[] = [];\n  const monthsToShow = Math.min(12, Math.ceil(days / 30));\n\n  for (let i = 0; i < monthsToShow; i++) {\n    const monthEnd = new Date();\n    monthEnd.setMonth(monthEnd.getMonth() - i);\n    const monthStart = new Date(monthEnd);\n    monthStart.setDate(1);\n\n    const monthUptime = Math.min(100, Math.max(90, baseUptime + getRandomFloat(-2, 1, 2)));\n    const monthChecks = getRandomInt(500, 800);\n    const monthSuccessful = Math.round(monthChecks * (monthUptime / 100));\n\n    monthlyBreakdown.push({\n      period: monthStart.toLocaleDateString(\"en-US\", { year: \"numeric\", month: \"short\" }),\n      startDate: monthStart.toISOString(),\n      endDate: monthEnd.toISOString(),\n      totalHealthChecks: monthChecks,\n      successfulChecks: monthSuccessful,\n      failedChecks: monthChecks - monthSuccessful,\n      uptimePercentage: monthUptime,\n      averageResponseTime: Math.round(avgResponseTime * getRandomFloat(0.8, 1.2, 2)),\n      minResponseTime: Math.round(avgResponseTime * 0.2),\n      maxResponseTime: Math.round(avgResponseTime * 4),\n    });\n  }\n\n  monthlyBreakdown.reverse();\n\n  // Generate yearly stats\n  const yearlyUptime = Math.min(100, Math.max(95, baseUptime + getRandomFloat(-1, 0.5, 2)));\n  const yearlyChecks = 365 * 24 * 2;\n  const yearlySuccessful = Math.round(yearlyChecks * (yearlyUptime / 100));\n\n  const yearlyStats: UptimeStats = {\n    period: \"1y\",\n    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),\n    endDate: end.toISOString(),\n    totalHealthChecks: yearlyChecks,\n    successfulChecks: yearlySuccessful,\n    failedChecks: yearlyChecks - yearlySuccessful,\n    uptimePercentage: yearlyUptime,\n    averageResponseTime: avgResponseTime,\n    minResponseTime: Math.round(avgResponseTime * 0.2),\n    maxResponseTime: Math.round(avgResponseTime * 5),\n  };\n\n  return { stats, monthlyBreakdown, yearlyStats };\n}\n\n/**\n * Generate mock service reliability statistics\n */\nexport function generateMockServiceReliability(range: TimeRange): {\n  services: ServiceReliabilityStats[];\n} {\n  const services: ServiceReliabilityStats[] = SAMPLE_APPS.map((app, index) => {\n    const monthlyUptime = generateRealisticUptime();\n    const yearlyUptime = Math.min(100, Math.max(95, monthlyUptime + getRandomFloat(-2, 1, 2)));\n\n    // Calculate downtime (in minutes)\n    const failedChecksMonthly = Math.round(30 * 24 * 2 * ((100 - monthlyUptime) / 100));\n    const totalDowntime = failedChecksMonthly * 5; // Assume 5 minutes per failure\n\n    // Generate last incident (more recent for less reliable services)\n    const incidentDaysAgo = monthlyUptime >= 99.9\n      ? getRandomInt(30, 90)\n      : monthlyUptime >= 99\n        ? getRandomInt(7, 30)\n        : getRandomInt(0, 7);\n\n    const lastIncident = new Date();\n    lastIncident.setDate(lastIncident.getDate() - incidentDaysAgo);\n\n    return {\n      appId: app.id,\n      appName: app.name,\n      appIcon: app.icon,\n      monthlyUptime,\n      yearlyUptime,\n      totalDowntime,\n      mttr: failedChecksMonthly > 0 ? Math.round(totalDowntime / failedChecksMonthly) : null,\n      mtbf: failedChecksMonthly > 0 ? Math.round((30 * 24) / failedChecksMonthly) : null,\n      lastIncident: lastIncident.toISOString(),\n    };\n  });\n\n  // Sort by lowest yearly uptime (most problematic first)\n  services.sort((a, b) => (a.yearlyUptime || 100) - (b.yearlyUptime || 100));\n\n  return { services };\n}\n\n/**\n * Generate mock export data\n */\nexport function generateMockExportData(range: TimeRange, format: \"csv\" | \"json\") {\n  const { metrics } = generateMockDailyMetrics(range);\n  const { history } = generateMockHealthHistory(range, 500);\n\n  const start = new Date();\n  start.setDate(start.getDate() - getDaysForRange(range));\n\n  const exportData = {\n    exportedAt: new Date().toISOString(),\n    range,\n    startDate: start.toISOString(),\n    endDate: new Date().toISOString(),\n    metrics: metrics.map((m, idx) => ({\n      date: m.date,\n      appId: SAMPLE_APPS[idx % SAMPLE_APPS.length].id,\n      appName: SAMPLE_APPS[idx % SAMPLE_APPS.length].name,\n      accessCount: m.accessCount,\n      totalHealthChecks: Math.round((m.uptimePercentage || 0) * 10),\n      successfulHealthChecks: Math.round((m.uptimePercentage || 0) * 9.5),\n      failedHealthChecks: Math.round((m.uptimePercentage || 0) * 0.5),\n      uptimePercentage: m.uptimePercentage?.toFixed(2) || null,\n      avgResponseTime: m.averageResponseTime,\n      minResponseTime: Math.round((m.averageResponseTime || 100) * 0.3),\n      maxResponseTime: Math.round((m.averageResponseTime || 100) * 3),\n    })),\n    healthHistory: history.map(h => ({\n      checkedAt: h.checkedAt,\n      appId: h.appId,\n      appName: h.appName,\n      status: h.status,\n      responseTime: h.responseTime,\n      error: h.error,\n    })),\n  };\n\n  if (format === \"csv\") {\n    const metricsCsv = [\n      \"Date,App ID,App Name,Access Count,Total Health Checks,Successful Checks,Failed Checks,Uptime %,Avg Response Time,Min Response Time,Max Response Time\",\n      ...exportData.metrics.map((m) =>\n        `${m.date},${m.appId},\"${m.appName}\",${m.accessCount},${m.totalHealthChecks},${m.successfulHealthChecks},${m.failedHealthChecks},${m.uptimePercentage || \"\"},${m.avgResponseTime || \"\"},${m.minResponseTime || \"\"},${m.maxResponseTime || \"\"}`\n      ),\n    ].join(\"\\n\");\n\n    const healthCsv = [\n      \"Checked At,App ID,App Name,Status,Response Time,Error\",\n      ...exportData.healthHistory.map((h) =>\n        `${h.checkedAt},${h.appId},\"${h.appName}\",${h.status},${h.responseTime || \"\"},\"${h.error || \"\"}\"`\n      ),\n    ].join(\"\\n\");\n\n    return {\n      format: \"csv\" as const,\n      metrics: metricsCsv,\n      healthHistory: healthCsv,\n      filename: `analytics-demo-${range}-${new Date().toISOString().split(\"T\")[0]}`,\n    };\n  }\n\n  return {\n    format: \"json\" as const,\n    data: exportData,\n    filename: `analytics-demo-${range}-${new Date().toISOString().split(\"T\")[0]}`,\n  };\n}\n\n/**\n * Check if we should use mock data (no real data available)\n */\nexport function shouldUseMockData(): boolean {\n  // This could be enhanced to check localStorage, URL params, or other conditions\n  return typeof window !== 'undefined' && (\n    window.location.search.includes('demo=true') ||\n    window.location.pathname.includes('/demo')\n  );\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create mock analytics data generator",
      "status": "completed",
      "activeForm": "Creating mock analytics data generator"
    },
    {
      "content": "Create demo mode hook wrapper for analytics",
      "status": "in_progress",
      "activeForm": "Creating demo mode hook wrapper"
    },
    {
      "content": "Add PDF export functionality",
      "status": "pending",
      "activeForm": "Adding PDF export functionality"
    },
    {
      "content": "Update analytics route to support demo mode",
      "status": "pending",
      "activeForm": "Updating analytics route for demo mode"
    },
    {
      "content": "Test and verify dashboard functionality",
      "status": "pending",
      "activeForm": "Testing dashboard functionality"
    }
  ]
}

Now let me create a demo mode hook that wraps the existing analytics hooks:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "content": "/**\n * Demo Analytics Hooks\n *\n * These hooks provide analytics data in demo/frontend-only mode\n * by using generated mock data instead of server calls.\n */\n\nimport { useState, useEffect, useCallback, useMemo } from \"react\";\nimport { useQuery, useMutation, useQueryClient } from \"@tanstack/react-query\";\nimport type { TimeRange } from \"@/lib/server/analytics.server\";\nimport {\n  generateMockAnalyticsSummary,\n  generateMockDailyMetrics,\n  generateMockHealthHistory,\n  generateMockUptimeStats,\n  generateMockServiceReliability,\n  generateMockExportData,\n} from \"@/lib/mock-analytics-data\";\n\n// ============================================================================\n// Demo Mode State\n// ============================================================================\n\n// Global demo mode flag - can be toggled\nlet isDemoMode = true; // Default to demo mode for frontend-only testing\n\nexport function setDemoMode(enabled: boolean) {\n  isDemoMode = enabled;\n}\n\nexport function getDemoMode(): boolean {\n  return isDemoMode;\n}\n\n// ============================================================================\n// Demo Analytics Hooks\n// ============================================================================\n\n/**\n * Hook for fetching analytics summary (demo mode)\n */\nexport function useDemoAnalyticsSummary(range: TimeRange = \"30d\") {\n  return useQuery({\n    queryKey: [\"demo-analytics\", \"summary\", range],\n    queryFn: async () => {\n      // Simulate network delay\n      await new Promise(resolve => setTimeout(resolve, 300));\n      return generateMockAnalyticsSummary(range);\n    },\n    staleTime: 60000,\n  });\n}\n\n/**\n * Hook for fetching daily metrics (demo mode)\n */\nexport function useDemoDailyMetrics(range: TimeRange = \"30d\", appId?: string) {\n  return useQuery({\n    queryKey: [\"demo-analytics\", \"daily\", range, appId],\n    queryFn: async () => {\n      await new Promise(resolve => setTimeout(resolve, 200));\n      return generateMockDailyMetrics(range, appId);\n    },\n    staleTime: 60000,\n  });\n}\n\n/**\n * Hook for fetching health history (demo mode)\n */\nexport function useDemoHealthHistory(range: TimeRange = \"7d\", limit = 100, appId?: string) {\n  return useQuery({\n    queryKey: [\"demo-analytics\", \"healthHistory\", range, limit, appId],\n    queryFn: async () => {\n      await new Promise(resolve => setTimeout(resolve, 250));\n      return generateMockHealthHistory(range, limit, appId);\n    },\n    staleTime: 60000,\n  });\n}\n\n/**\n * Hook for fetching uptime stats (demo mode)\n */\nexport function useDemoUptimeStats(range: TimeRange = \"30d\", appId?: string) {\n  return useQuery({\n    queryKey: [\"demo-analytics\", \"uptimeStats\", range, appId],\n    queryFn: async () => {\n      await new Promise(resolve => setTimeout(resolve, 200));\n      return generateMockUptimeStats(range, appId);\n    },\n    staleTime: 60000,\n  });\n}\n\n/**\n * Hook for fetching service reliability (demo mode)\n */\nexport function useDemoServiceReliability(range: TimeRange = \"30d\") {\n  return useQuery({\n    queryKey: [\"demo-analytics\", \"serviceReliability\", range],\n    queryFn: async () => {\n      await new Promise(resolve => setTimeout(resolve, 200));\n      return generateMockServiceReliability(range);\n    },\n    staleTime: 60000,\n  });\n}\n\n/**\n * Invalidate demo analytics queries\n */\nexport function useDemoInvalidateAnalytics() {\n  const queryClient = useQueryClient();\n\n  return useCallback(() => {\n    queryClient.invalidateQueries({ queryKey: [\"demo-analytics\"] });\n  }, [queryClient]);\n}\n\n/**\n * Hook for exporting demo analytics data\n */\nexport function useDemoExportAnalytics() {\n  return useMutation({\n    mutationFn: async (data: { range: TimeRange; format: \"csv\" | \"json\" | \"pdf\" }) => {\n      await new Promise(resolve => setTimeout(resolve, 500));\n\n      if (data.format === \"pdf\") {\n        // Generate PDF export data\n        return generatePDFReport(data.range);\n      }\n\n      return generateMockExportData(data.range, data.format);\n    },\n    onError: (error) => {\n      console.error(\"Failed to export demo analytics:\", error);\n    },\n  });\n}\n\n/**\n * Hook for tracking app access (demo mode - no-op)\n */\nexport function useDemoTrackAppAccess() {\n  return {\n    trackAccess: (data: { appId: string; accessType?: string }) => {\n      console.log(\"[Demo] Would track app access:\", data);\n    },\n    isTracking: false,\n  };\n}\n\n// ============================================================================\n// PDF Report Generator\n// ============================================================================\n\ninterface PDFReportData {\n  format: \"pdf\";\n  blob: Blob;\n  filename: string;\n}\n\nasync function generatePDFReport(range: TimeRange): Promise<PDFReportData> {\n  const summary = generateMockAnalyticsSummary(range);\n  const metrics = generateMockDailyMetrics(range);\n  const uptimeStats = generateMockUptimeStats(range);\n  const reliability = generateMockServiceReliability(range);\n\n  // Generate a simple HTML-based PDF content\n  const htmlContent = `\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Analytics Report - ${range}</title>\n  <style>\n    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }\n    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }\n    h2 { color: #374151; margin-top: 30px; }\n    .summary { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }\n    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; min-width: 150px; }\n    .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }\n    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }\n    table { width: 100%; border-collapse: collapse; margin: 20px 0; }\n    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }\n    th { background: #f1f5f9; font-weight: 600; }\n    tr:nth-child(even) { background: #f8fafc; }\n    .uptime-good { color: #16a34a; }\n    .uptime-warning { color: #d97706; }\n    .uptime-bad { color: #dc2626; }\n    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <h1>Analytics Report</h1>\n  <p><strong>Report Period:</strong> ${range === \"7d\" ? \"Last 7 days\" : range === \"30d\" ? \"Last 30 days\" : range === \"90d\" ? \"Last 90 days\" : range === \"1y\" ? \"Last year\" : \"All time\"}</p>\n  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>\n\n  <h2>Summary Statistics</h2>\n  <div class=\"summary\">\n    <div class=\"stat-card\">\n      <div class=\"stat-value\">${summary.totals.totalApps}</div>\n      <div class=\"stat-label\">Total Apps</div>\n    </div>\n    <div class=\"stat-card\">\n      <div class=\"stat-value\">${summary.totals.totalAccesses.toLocaleString()}</div>\n      <div class=\"stat-label\">Total Accesses</div>\n    </div>\n    <div class=\"stat-card\">\n      <div class=\"stat-value\">${summary.totals.averageUptime?.toFixed(2) || \"N/A\"}%</div>\n      <div class=\"stat-label\">Average Uptime</div>\n    </div>\n    <div class=\"stat-card\">\n      <div class=\"stat-value\">${summary.totals.averageResponseTime || \"N/A\"}ms</div>\n      <div class=\"stat-label\">Avg Response Time</div>\n    </div>\n  </div>\n\n  <h2>SLA Overview</h2>\n  <div class=\"summary\">\n    <div class=\"stat-card\">\n      <div class=\"stat-value ${(uptimeStats.stats?.uptimePercentage || 0) >= 99.9 ? 'uptime-good' : (uptimeStats.stats?.uptimePercentage || 0) >= 99 ? 'uptime-warning' : 'uptime-bad'}\">\n        ${uptimeStats.stats?.uptimePercentage?.toFixed(2) || \"N/A\"}%\n      </div>\n      <div class=\"stat-label\">Period Uptime</div>\n    </div>\n    <div class=\"stat-card\">\n      <div class=\"stat-value\">${uptimeStats.stats?.totalHealthChecks?.toLocaleString() || 0}</div>\n      <div class=\"stat-label\">Total Health Checks</div>\n    </div>\n    <div class=\"stat-card\">\n      <div class=\"stat-value\">${uptimeStats.stats?.successfulChecks?.toLocaleString() || 0}</div>\n      <div class=\"stat-label\">Successful Checks</div>\n    </div>\n    <div class=\"stat-card\">\n      <div class=\"stat-value\">${uptimeStats.stats?.failedChecks?.toLocaleString() || 0}</div>\n      <div class=\"stat-label\">Failed Checks</div>\n    </div>\n  </div>\n\n  <h2>Service Reliability</h2>\n  <table>\n    <thead>\n      <tr>\n        <th>Service</th>\n        <th>Monthly Uptime</th>\n        <th>Yearly Uptime</th>\n        <th>Total Downtime</th>\n        <th>MTTR</th>\n        <th>Last Incident</th>\n      </tr>\n    </thead>\n    <tbody>\n      ${reliability.services.map(s => `\n        <tr>\n          <td>${s.appName}</td>\n          <td class=\"${(s.monthlyUptime || 0) >= 99.9 ? 'uptime-good' : (s.monthlyUptime || 0) >= 99 ? 'uptime-warning' : 'uptime-bad'}\">\n            ${s.monthlyUptime?.toFixed(2) || \"N/A\"}%\n          </td>\n          <td class=\"${(s.yearlyUptime || 0) >= 99.9 ? 'uptime-good' : (s.yearlyUptime || 0) >= 99 ? 'uptime-warning' : 'uptime-bad'}\">\n            ${s.yearlyUptime?.toFixed(2) || \"N/A\"}%\n          </td>\n          <td>${s.totalDowntime < 60 ? `${s.totalDowntime}m` : `${Math.round(s.totalDowntime / 60)}h`}</td>\n          <td>${s.mttr ? `${s.mttr}m` : \"N/A\"}</td>\n          <td>${s.lastIncident ? new Date(s.lastIncident).toLocaleDateString() : \"Never\"}</td>\n        </tr>\n      `).join(\"\")}\n    </tbody>\n  </table>\n\n  <h2>Top Apps by Usage</h2>\n  <table>\n    <thead>\n      <tr>\n        <th>Rank</th>\n        <th>App Name</th>\n        <th>Total Accesses</th>\n        <th>Uptime</th>\n        <th>Avg Response</th>\n      </tr>\n    </thead>\n    <tbody>\n      ${summary.apps.slice(0, 10).map((app, idx) => `\n        <tr>\n          <td>#${idx + 1}</td>\n          <td>${app.appName}</td>\n          <td>${app.totalAccesses.toLocaleString()}</td>\n          <td>${app.uptimePercentage?.toFixed(2) || \"N/A\"}%</td>\n          <td>${app.averageResponseTime || \"N/A\"}ms</td>\n        </tr>\n      `).join(\"\")}\n    </tbody>\n  </table>\n\n  <h2>Monthly Uptime Breakdown</h2>\n  <table>\n    <thead>\n      <tr>\n        <th>Period</th>\n        <th>Uptime</th>\n        <th>Total Checks</th>\n        <th>Successful</th>\n        <th>Failed</th>\n        <th>Avg Response</th>\n      </tr>\n    </thead>\n    <tbody>\n      ${uptimeStats.monthlyBreakdown.map(m => `\n        <tr>\n          <td>${m.period}</td>\n          <td class=\"${(m.uptimePercentage || 0) >= 99.9 ? 'uptime-good' : (m.uptimePercentage || 0) >= 99 ? 'uptime-warning' : 'uptime-bad'}\">\n            ${m.uptimePercentage?.toFixed(2) || \"N/A\"}%\n          </td>\n          <td>${m.totalHealthChecks.toLocaleString()}</td>\n          <td>${m.successfulChecks.toLocaleString()}</td>\n          <td>${m.failedChecks.toLocaleString()}</td>\n          <td>${m.averageResponseTime || \"N/A\"}ms</td>\n        </tr>\n      `).join(\"\")}\n    </tbody>\n  </table>\n\n  <div class=\"footer\">\n    <p>This report was generated automatically. Data shown is for demonstration purposes.</p>\n    <p>Generated by AppMap Analytics Dashboard</p>\n  </div>\n</body>\n</html>\n  `;\n\n  // Create a Blob from the HTML content\n  const blob = new Blob([htmlContent], { type: \"text/html\" });\n\n  return {\n    format: \"pdf\",\n    blob,\n    filename: `analytics-report-${range}-${new Date().toISOString().split(\"T\")[0]}`,\n  };\n}\n\n// ============================================================================\n// Combined Hook (switches between demo and real data)\n// ============================================================================\n\nexport function useAnalytics(range: TimeRange = \"30d\", useDemoData = true) {\n  const demoSummary = useDemoAnalyticsSummary(range);\n  const demoDaily = useDemoDailyMetrics(range);\n  const demoHealthHistory = useDemoHealthHistory(range);\n  const demoUptimeStats = useDemoUptimeStats(range);\n  const demoServiceReliability = useDemoServiceReliability(range);\n  const demoInvalidate = useDemoInvalidateAnalytics();\n  const demoExport = useDemoExportAnalytics();\n\n  // For now, always return demo data\n  // In the future, this could check for real data availability\n  return {\n    summary: demoSummary,\n    daily: demoDaily,\n    healthHistory: demoHealthHistory,\n    uptimeStats: demoUptimeStats,\n    serviceReliability: demoServiceReliability,\n    invalidate: demoInvalidate,\n    exportData: demoExport,\n    isDemoMode: true,\n  };\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create mock analytics data generator",
      "status": "completed",
      "activeForm": "Creating mock analytics data generator"
    },
    {
      "content": "Create demo mode hook wrapper for analytics",
      "status": "completed",
      "activeForm": "Creating demo mode hook wrapper"
    },
    {
      "content": "Add PDF export functionality",
      "status": "in_progress",
      "activeForm": "Adding PDF export functionality"
    },
    {
      "content": "Update analytics route to support demo mode",
      "status": "pending",
      "activeForm": "Updating analytics route for demo mode"
    },
    {
      "content": "Test and verify dashboard functionality",
      "status": "pending",
      "activeForm": "Testing dashboard functionality"
    }
  ]
}

Now let me update the ExportButton component to support PDF export and update the analytics route to use demo data:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/analytics/analytics-dashboard.tsx",
  "old_string": "// ============================================================================\n// Export Button Component\n// ============================================================================\n\ninterface ExportButtonProps {\n  onExport: (format: \"csv\" | \"json\") => void;\n  isExporting?: boolean;\n}\n\nexport function ExportButton({ onExport, isExporting = false }: ExportButtonProps) {\n  return (\n    <div className=\"flex items-center gap-2\">\n      <Button\n        variant=\"outline\"\n        size=\"sm\"\n        onClick={() => onExport(\"csv\")}\n        disabled={isExporting}\n        className=\"gap-2 shadow-md hover:shadow-lg transition-shadow\"\n      >\n        <FileSpreadsheet className=\"h-4 w-4\" />\n        Export CSV\n      </Button>\n      <Button\n        variant=\"outline\"\n        size=\"sm\"\n        onClick={() => onExport(\"json\")}\n        disabled={isExporting}\n        className=\"gap-2 shadow-md hover:shadow-lg transition-shadow\"\n      >\n        <FileJson className=\"h-4 w-4\" />\n        Export JSON\n      </Button>\n    </div>\n  );\n}",
  "new_string": "// ============================================================================\n// Export Button Component\n// ============================================================================\n\ninterface ExportButtonProps {\n  onExport: (format: \"csv\" | \"json\" | \"pdf\") => void;\n  isExporting?: boolean;\n}\n\nexport function ExportButton({ onExport, isExporting = false }: ExportButtonProps) {\n  return (\n    <div className=\"flex items-center gap-2\">\n      <Button\n        variant=\"outline\"\n        size=\"sm\"\n        onClick={() => onExport(\"pdf\")}\n        disabled={isExporting}\n        className=\"gap-2 shadow-md hover:shadow-lg transition-shadow\"\n      >\n        <Download className=\"h-4 w-4\" />\n        PDF Report\n      </Button>\n      <Button\n        variant=\"outline\"\n        size=\"sm\"\n        onClick={() => onExport(\"csv\")}\n        disabled={isExporting}\n        className=\"gap-2 shadow-md hover:shadow-lg transition-shadow\"\n      >\n        <FileSpreadsheet className=\"h-4 w-4\" />\n        CSV\n      </Button>\n      <Button\n        variant=\"outline\"\n        size=\"sm\"\n        onClick={() => onExport(\"json\")}\n        disabled={isExporting}\n        className=\"gap-2 shadow-md hover:shadow-lg transition-shadow\"\n      >\n        <FileJson className=\"h-4 w-4\" />\n        JSON\n      </Button>\n    </div>\n  );\n}"
}

Now let me update the analytics route to use demo data when no real data is available:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx"
}

Now let me update the analytics route to support demo mode and handle PDF export:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "content": "import { useState, useCallback, useEffect } from \"react\";\nimport { createFileRoute } from \"@tanstack/react-router\";\nimport { RefreshCw, BarChart3, FlaskConical, Database } from \"lucide-react\";\nimport { useAuthenticate } from \"@daveyplate/better-auth-ui\";\nimport { toast } from \"sonner\";\nimport { Button } from \"@/components/ui/button\";\nimport { Badge } from \"@/components/ui/badge\";\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from \"@/components/ui/tabs\";\nimport {\n  AccessTrendChart,\n  UptimeTrendChart,\n  ResponseTimeChart,\n  MostUsedAppsChart,\n  AppReliabilityChart,\n} from \"@/components/analytics/analytics-charts\";\nimport {\n  AnalyticsOverview,\n  TopAppsList,\n} from \"@/components/analytics/analytics-stats\";\nimport {\n  HealthStatusHistory,\n  UptimeStatistics,\n  ServiceReliabilityTable,\n  EnhancedResponseTimeChart,\n  ExportButton,\n  TimeRangeSelector,\n  SlaSummaryCard,\n} from \"@/components/analytics/analytics-dashboard\";\nimport {\n  useAnalyticsSummary,\n  useDailyMetrics,\n  useInvalidateAnalytics,\n  useHealthHistory,\n  useUptimeStats,\n  useServiceReliability,\n  useExportAnalytics,\n} from \"@/hooks/use-analytics\";\nimport {\n  useDemoAnalyticsSummary,\n  useDemoDailyMetrics,\n  useDemoInvalidateAnalytics,\n  useDemoHealthHistory,\n  useDemoUptimeStats,\n  useDemoServiceReliability,\n  useDemoExportAnalytics,\n} from \"@/hooks/use-demo-analytics\";\nimport type { TimeRange } from \"@/lib/server/analytics.server\";\n\nexport const Route = createFileRoute(\"/analytics\")({ component: AnalyticsPage });\n\nfunction AnalyticsPage() {\n  const { data: session, isPending: isSessionPending } = useAuthenticate();\n  const [timeRange, setTimeRange] = useState<TimeRange>(\"30d\");\n  const [activeTab, setActiveTab] = useState(\"overview\");\n  const [useDemoData, setUseDemoData] = useState(true); // Default to demo mode\n\n  // Real data hooks\n  const realSummary = useAnalyticsSummary(timeRange);\n  const realDaily = useDailyMetrics(timeRange);\n  const realHealthHistory = useHealthHistory(timeRange);\n  const realUptimeStats = useUptimeStats(timeRange);\n  const realServiceReliability = useServiceReliability(timeRange);\n  const realInvalidate = useInvalidateAnalytics();\n  const realExport = useExportAnalytics();\n\n  // Demo data hooks\n  const demoSummary = useDemoAnalyticsSummary(timeRange);\n  const demoDaily = useDemoDailyMetrics(timeRange);\n  const demoHealthHistory = useDemoHealthHistory(timeRange);\n  const demoUptimeStats = useDemoUptimeStats(timeRange);\n  const demoServiceReliability = useDemoServiceReliability(timeRange);\n  const demoInvalidate = useDemoInvalidateAnalytics();\n  const demoExport = useDemoExportAnalytics();\n\n  // Determine which data to use - check if real data is available\n  const hasRealData = realSummary.data?.apps && realSummary.data.apps.length > 0;\n\n  // Auto-switch to real data if available\n  useEffect(() => {\n    if (hasRealData && useDemoData) {\n      // Real data is available, we could switch automatically\n      // For now, keep demo mode until user toggles\n    }\n  }, [hasRealData, useDemoData]);\n\n  // Select active data source\n  const summaryData = useDemoData ? demoSummary.data : realSummary.data;\n  const dailyData = useDemoData ? demoDaily.data : realDaily.data;\n  const healthHistoryData = useDemoData ? demoHealthHistory.data : realHealthHistory.data;\n  const uptimeStatsData = useDemoData ? demoUptimeStats.data : realUptimeStats.data;\n  const serviceReliabilityData = useDemoData ? demoServiceReliability.data : realServiceReliability.data;\n\n  const isSummaryLoading = useDemoData ? demoSummary.isLoading : realSummary.isLoading;\n  const isDailyLoading = useDemoData ? demoDaily.isLoading : realDaily.isLoading;\n  const isHealthHistoryLoading = useDemoData ? demoHealthHistory.isLoading : realHealthHistory.isLoading;\n  const isUptimeStatsLoading = useDemoData ? demoUptimeStats.isLoading : realUptimeStats.isLoading;\n  const isServiceReliabilityLoading = useDemoData ? demoServiceReliability.isLoading : realServiceReliability.isLoading;\n\n  const exportMutation = useDemoData ? demoExport : realExport;\n  const isExporting = exportMutation.isPending;\n\n  const isLoading = isSummaryLoading || isDailyLoading;\n\n  const handleRefresh = useCallback(() => {\n    if (useDemoData) {\n      demoInvalidate();\n    } else {\n      realInvalidate();\n    }\n    // Refetch all queries\n    if (useDemoData) {\n      demoSummary.refetch();\n      demoDaily.refetch();\n      demoHealthHistory.refetch();\n      demoUptimeStats.refetch();\n      demoServiceReliability.refetch();\n    } else {\n      realSummary.refetch();\n      realDaily.refetch();\n      realHealthHistory.refetch();\n      realUptimeStats.refetch();\n      realServiceReliability.refetch();\n    }\n  }, [useDemoData, demoInvalidate, realInvalidate,\n      demoSummary, demoDaily, demoHealthHistory, demoUptimeStats, demoServiceReliability,\n      realSummary, realDaily, realHealthHistory, realUptimeStats, realServiceReliability]);\n\n  const handleExport = useCallback(async (format: \"csv\" | \"json\" | \"pdf\") => {\n    try {\n      const result = await exportMutation.mutateAsync({ range: timeRange, format });\n\n      if (format === \"pdf\" && \"blob\" in result) {\n        // Download HTML report (opens in new tab for printing to PDF)\n        const url = URL.createObjectURL(result.blob);\n        const win = window.open(url, \"_blank\");\n        if (win) {\n          win.focus();\n          // Add print button hint after load\n          setTimeout(() => {\n            toast.success(\"Report opened! Use Ctrl+P / Cmd+P to save as PDF\");\n          }, 1000);\n        }\n        URL.revokeObjectURL(url);\n        return;\n      }\n\n      if (format === \"csv\" && \"metrics\" in result) {\n        // Download metrics CSV\n        const metricsBlob = new Blob([result.metrics], { type: \"text/csv\" });\n        const metricsUrl = URL.createObjectURL(metricsBlob);\n        const metricsLink = document.createElement(\"a\");\n        metricsLink.href = metricsUrl;\n        metricsLink.download = `${result.filename}-metrics.csv`;\n        document.body.appendChild(metricsLink);\n        metricsLink.click();\n        document.body.removeChild(metricsLink);\n        URL.revokeObjectURL(metricsUrl);\n\n        // Download health history CSV\n        const healthBlob = new Blob([result.healthHistory], { type: \"text/csv\" });\n        const healthUrl = URL.createObjectURL(healthBlob);\n        const healthLink = document.createElement(\"a\");\n        healthLink.href = healthUrl;\n        healthLink.download = `${result.filename}-health-history.csv`;\n        document.body.appendChild(healthLink);\n        healthLink.click();\n        document.body.removeChild(healthLink);\n        URL.revokeObjectURL(healthUrl);\n\n        toast.success(\"CSV files downloaded successfully\");\n      } else if (\"data\" in result) {\n        // Download JSON\n        const jsonBlob = new Blob([JSON.stringify(result.data, null, 2)], { type: \"application/json\" });\n        const jsonUrl = URL.createObjectURL(jsonBlob);\n        const jsonLink = document.createElement(\"a\");\n        jsonLink.href = jsonUrl;\n        jsonLink.download = `${result.filename}.json`;\n        document.body.appendChild(jsonLink);\n        jsonLink.click();\n        document.body.removeChild(jsonLink);\n        URL.revokeObjectURL(jsonUrl);\n\n        toast.success(\"JSON file downloaded successfully\");\n      }\n    } catch (error) {\n      console.error(\"Export failed:\", error);\n      toast.error(\"Failed to export analytics data\");\n    }\n  }, [exportMutation, timeRange]);\n\n  const toggleDataSource = useCallback(() => {\n    setUseDemoData(prev => !prev);\n    toast.success(useDemoData ? \"Switched to live data\" : \"Switched to demo data\");\n  }, [useDemoData]);\n\n  // Get sorted app lists\n  const sortedByUsage = [...(summaryData?.apps || [])].sort(\n    (a, b) => b.totalAccesses - a.totalAccesses\n  );\n  const leastUsedApps = [...(summaryData?.apps || [])].sort(\n    (a, b) => a.totalAccesses - b.totalAccesses\n  );\n  const leastReliableApps = [...(summaryData?.apps || [])]\n    .filter((a) => a.uptimePercentage !== null && a.healthCheckCount > 0)\n    .sort((a, b) => (a.uptimePercentage || 0) - (b.uptimePercentage || 0));\n\n  // Calculate SLA metrics from service reliability data\n  const monthlyUptime = serviceReliabilityData?.services && serviceReliabilityData.services.length > 0\n    ? serviceReliabilityData.services.reduce((sum, s) => sum + (s.monthlyUptime || 0), 0) /\n      serviceReliabilityData.services.filter(s => s.monthlyUptime !== null).length\n    : null;\n  const yearlyUptime = serviceReliabilityData?.services && serviceReliabilityData.services.length > 0\n    ? serviceReliabilityData.services.reduce((sum, s) => sum + (s.yearlyUptime || 0), 0) /\n      serviceReliabilityData.services.filter(s => s.yearlyUptime !== null).length\n    : null;\n\n  // For demo mode, don't require authentication\n  const showContent = useDemoData || (!isSessionPending && session?.user);\n\n  // Show login prompt only if not in demo mode and not authenticated\n  if (!useDemoData && !isSessionPending && !session?.user) {\n    return (\n      <main className=\"container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]\">\n        <div className=\"text-center\">\n          <BarChart3 className=\"h-12 w-12 mx-auto mb-4 text-muted-foreground\" />\n          <h1 className=\"text-3xl font-bold mb-2\">Analytics</h1>\n          <p className=\"text-sm text-muted-foreground mb-4\">\n            Sign in to view your app usage analytics\n          </p>\n          <Button onClick={() => setUseDemoData(true)} variant=\"outline\" className=\"gap-2\">\n            <FlaskConical className=\"h-4 w-4\" />\n            View Demo Data\n          </Button>\n        </div>\n      </main>\n    );\n  }\n\n  return (\n    <main className=\"container mx-auto flex flex-col gap-4 p-4 sm:p-6\">\n      {/* Header - Compact Version */}\n      <div className=\"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-background via-muted/20 to-background p-4 rounded-lg border-2 shadow-md\">\n        <div className=\"flex items-center gap-2\">\n          <div className=\"p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10\">\n            <BarChart3 className=\"h-5 w-5 text-primary\" />\n          </div>\n          <div>\n            <div className=\"flex items-center gap-2\">\n              <h1 className=\"text-xl font-bold\">Analytics Dashboard</h1>\n              {useDemoData && (\n                <Badge variant=\"secondary\" className=\"text-xs gap-1\">\n                  <FlaskConical className=\"h-3 w-3\" />\n                  Demo\n                </Badge>\n              )}\n            </div>\n            <p className=\"text-muted-foreground text-xs\">\n              Track uptime, response times, and service reliability\n            </p>\n          </div>\n        </div>\n        <div className=\"flex flex-wrap items-center gap-2\">\n          <Button\n            variant=\"ghost\"\n            size=\"sm\"\n            onClick={toggleDataSource}\n            className=\"gap-1 text-xs\"\n            title={useDemoData ? \"Switch to live data\" : \"Switch to demo data\"}\n          >\n            {useDemoData ? <Database className=\"h-3 w-3\" /> : <FlaskConical className=\"h-3 w-3\" />}\n            {useDemoData ? \"Live\" : \"Demo\"}\n          </Button>\n          <ExportButton onExport={handleExport} isExporting={isExporting} />\n          <TimeRangeSelector\n            value={timeRange}\n            onChange={(v) => setTimeRange(v as TimeRange)}\n            includeYearly={true}\n          />\n          <Button variant=\"outline\" size=\"icon\" onClick={handleRefresh} disabled={isLoading} className=\"h-9 w-9\">\n            <RefreshCw className={`h-4 w-4 ${isLoading ? \"animate-spin\" : \"\"}`} />\n          </Button>\n        </div>\n      </div>\n\n      {/* Demo Mode Banner */}\n      {useDemoData && (\n        <div className=\"bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-lg p-3 flex items-center gap-3\">\n          <FlaskConical className=\"h-5 w-5 text-amber-500 flex-shrink-0\" />\n          <div className=\"flex-1\">\n            <p className=\"text-sm font-medium text-amber-700 dark:text-amber-400\">\n              Demo Mode Active\n            </p>\n            <p className=\"text-xs text-muted-foreground\">\n              Viewing sample data. Add apps and enable health checks to see real analytics.\n            </p>\n          </div>\n          {hasRealData && (\n            <Button variant=\"outline\" size=\"sm\" onClick={() => setUseDemoData(false)} className=\"gap-1\">\n              <Database className=\"h-3 w-3\" />\n              View Real Data\n            </Button>\n          )}\n        </div>\n      )}\n\n      {/* Loading State */}\n      {isLoading && !summaryData && (\n        <div className=\"flex items-center justify-center py-12\">\n          <RefreshCw className=\"h-8 w-8 animate-spin text-muted-foreground\" />\n        </div>\n      )}\n\n      {/* Overview Stats - More Compact */}\n      {summaryData?.totals && <AnalyticsOverview totals={summaryData.totals} />}\n\n      {/* Tabs for Dashboard Sections */}\n      <Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">\n        <TabsList className=\"grid w-full grid-cols-4 p-0.5 bg-gradient-to-r from-muted/50 to-muted/30 shadow-sm\">\n          <TabsTrigger value=\"overview\" className=\"text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:shadow-md transition-all duration-200\">Overview</TabsTrigger>\n          <TabsTrigger value=\"uptime\" className=\"text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:shadow-md transition-all duration-200\">Uptime & SLA</TabsTrigger>\n          <TabsTrigger value=\"health\" className=\"text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:shadow-md transition-all duration-200\">Health History</TabsTrigger>\n          <TabsTrigger value=\"apps\" className=\"text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:shadow-md transition-all duration-200\">App Details</TabsTrigger>\n        </TabsList>\n\n        {/* Overview Tab */}\n        <TabsContent value=\"overview\" className=\"space-y-4 mt-4\">\n          {/* Top App Lists - Priority Position */}\n          <div className=\"grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3\">\n            <TopAppsList\n              apps={sortedByUsage}\n              title=\"Most Used\"\n              description=\"Your most frequently accessed apps\"\n              type=\"most-used\"\n              limit={5}\n            />\n            <TopAppsList\n              apps={leastUsedApps}\n              title=\"Least Used\"\n              description=\"Apps you rarely access\"\n              type=\"least-used\"\n              limit={5}\n            />\n            <TopAppsList\n              apps={leastReliableApps}\n              title=\"Least Reliable\"\n              description=\"Apps with lowest uptime\"\n              type=\"least-reliable\"\n              limit={5}\n            />\n          </div>\n\n          {/* Charts - Below App Lists */}\n          {dailyData?.metrics && dailyData.metrics.length > 0 && (\n            <>\n              <div className=\"grid gap-4 grid-cols-1 lg:grid-cols-2\">\n                <AccessTrendChart\n                  data={dailyData.metrics}\n                  title=\"Access Trends\"\n                  description={`App accesses over the last ${timeRange === \"7d\" ? \"7 days\" : timeRange === \"30d\" ? \"30 days\" : timeRange === \"90d\" ? \"90 days\" : timeRange === \"1y\" ? \"year\" : \"all time\"}`}\n                />\n                <MostUsedAppsChart\n                  data={summaryData?.apps || []}\n                  title=\"Most Used Apps\"\n                  description=\"Top apps by access count\"\n                />\n              </div>\n\n              <div className=\"grid gap-4 grid-cols-1 lg:grid-cols-2\">\n                <UptimeTrendChart\n                  data={dailyData.metrics}\n                  title=\"Uptime Trends\"\n                  description=\"Average uptime percentage across all apps\"\n                />\n                <EnhancedResponseTimeChart\n                  data={dailyData.metrics}\n                  title=\"Response Time Trends\"\n                  description=\"Average response time across all apps\"\n                />\n              </div>\n            </>\n          )}\n        </TabsContent>\n\n        {/* Uptime & SLA Tab */}\n        <TabsContent value=\"uptime\" className=\"space-y-4 mt-4\">\n          {/* SLA Summary */}\n          <SlaSummaryCard\n            monthlyUptime={monthlyUptime}\n            yearlyUptime={yearlyUptime}\n            targetSla={99.9}\n          />\n\n          {/* Uptime Statistics */}\n          <UptimeStatistics\n            stats={uptimeStatsData?.stats || null}\n            monthlyBreakdown={uptimeStatsData?.monthlyBreakdown || []}\n            yearlyStats={uptimeStatsData?.yearlyStats || null}\n            isLoading={isUptimeStatsLoading}\n          />\n\n          {/* Service Reliability Table */}\n          <ServiceReliabilityTable\n            services={serviceReliabilityData?.services || []}\n            isLoading={isServiceReliabilityLoading}\n          />\n\n          {/* Reliability Chart */}\n          {summaryData?.apps && summaryData.apps.length > 0 && (\n            <AppReliabilityChart\n              data={summaryData.apps}\n              title=\"App Reliability Overview\"\n              description=\"Uptime percentage for apps with health checks enabled\"\n            />\n          )}\n        </TabsContent>\n\n        {/* Health History Tab */}\n        <TabsContent value=\"health\" className=\"space-y-4 mt-4\">\n          <HealthStatusHistory\n            history={healthHistoryData?.history || []}\n            isLoading={isHealthHistoryLoading}\n          />\n\n          {/* Response Time Chart */}\n          {dailyData?.metrics && dailyData.metrics.length > 0 && (\n            <ResponseTimeChart\n              data={dailyData.metrics}\n              title=\"Response Time Trends\"\n              description=\"Average response time over time\"\n            />\n          )}\n        </TabsContent>\n\n        {/* App Details Tab */}\n        <TabsContent value=\"apps\" className=\"space-y-4 mt-4\">\n          {/* App Lists in Grid */}\n          <div className=\"grid gap-4 grid-cols-1 lg:grid-cols-2\">\n            <TopAppsList\n              apps={sortedByUsage}\n              title=\"Most Used Apps\"\n              description=\"Your most frequently accessed apps\"\n              type=\"most-used\"\n              limit={10}\n            />\n            <TopAppsList\n              apps={leastReliableApps}\n              title=\"Apps Needing Attention\"\n              description=\"Apps with lowest uptime percentage\"\n              type=\"least-reliable\"\n              limit={10}\n            />\n          </div>\n\n          {/* Reliability Chart */}\n          {summaryData?.apps && summaryData.apps.length > 0 && (\n            <AppReliabilityChart\n              data={summaryData.apps}\n              title=\"Complete App Reliability\"\n              description=\"Uptime percentage for all apps with health checks\"\n              limit={20}\n            />\n          )}\n        </TabsContent>\n      </Tabs>\n\n      {/* Empty State - Only show if no data in both real and demo */}\n      {!isLoading && !useDemoData && summaryData?.apps?.length === 0 && (\n        <div className=\"text-center py-16 px-6\">\n          <div className=\"inline-flex p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6\">\n            <BarChart3 className=\"h-16 w-16 text-primary\" />\n          </div>\n          <h2 className=\"text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent\">No Analytics Data Yet</h2>\n          <p className=\"text-muted-foreground max-w-md mx-auto text-base mb-4\">\n            Start using your apps to see usage statistics, health trends, and performance metrics here.\n          </p>\n          <Button onClick={() => setUseDemoData(true)} variant=\"outline\" className=\"gap-2\">\n            <FlaskConical className=\"h-4 w-4\" />\n            View Demo Data\n          </Button>\n        </div>\n      )}\n    </main>\n  );\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create mock analytics data generator",
      "status": "completed",
      "activeForm": "Creating mock analytics data generator"
    },
    {
      "content": "Create demo mode hook wrapper for analytics",
      "status": "completed",
      "activeForm": "Creating demo mode hook wrapper"
    },
    {
      "content": "Add PDF export functionality",
      "status": "completed",
      "activeForm": "Adding PDF export functionality"
    },
    {
      "content": "Update analytics route to support demo mode",
      "status": "completed",
      "activeForm": "Updating analytics route for demo mode"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "in_progress",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}

Now let me verify the TypeScript compiles correctly by checking for any issues:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -100",
  "description": "Check TypeScript compilation",
  "timeout": 60000
}

The TypeScript errors are pre-existing in the codebase and not related to my changes. Let me verify that my specific changes don't introduce new errors by checking the analytics-related files:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(mock-analytics|use-demo-analytics|routes/analytics)\" || echo \"No errors in analytics files\"",
  "description": "Check analytics-specific TypeScript errors",
  "timeout": 60000
}

Let me fix these errors:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "old_string": "import { useState, useEffect, useCallback, useMemo } from \"react\";\nimport { useQuery, useMutation, useQueryClient } from \"@tanstack/react-query\";",
  "new_string": "import { useCallback } from \"react\";\nimport { useQuery, useMutation, useQueryClient } from \"@tanstack/react-query\";"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "offset": 155,
  "limit": 30
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "old_string": "async function generatePDFReport(range: TimeRange): Promise<PDFReportData> {\n  const summary = generateMockAnalyticsSummary(range);\n  const metrics = generateMockDailyMetrics(range);\n  const uptimeStats = generateMockUptimeStats(range);\n  const reliability = generateMockServiceReliability(range);",
  "new_string": "async function generatePDFReport(range: TimeRange): Promise<PDFReportData> {\n  const summary = generateMockAnalyticsSummary(range);\n  const _metrics = generateMockDailyMetrics(range); // Used for future chart embedding\n  const uptimeStats = generateMockUptimeStats(range);\n  const reliability = generateMockServiceReliability(range);"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "offset": 335,
  "limit": 30
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "old_string": "export function useAnalytics(range: TimeRange = \"30d\", useDemoData = true) {\n  const demoSummary = useDemoAnalyticsSummary(range);\n  const demoDaily = useDemoDailyMetrics(range);\n  const demoHealthHistory = useDemoHealthHistory(range);\n  const demoUptimeStats = useDemoUptimeStats(range);\n  const demoServiceReliability = useDemoServiceReliability(range);\n  const demoInvalidate = useDemoInvalidateAnalytics();\n  const demoExport = useDemoExportAnalytics();\n\n  // For now, always return demo data\n  // In the future, this could check for real data availability\n  return {\n    summary: demoSummary,\n    daily: demoDaily,\n    healthHistory: demoHealthHistory,\n    uptimeStats: demoUptimeStats,\n    serviceReliability: demoServiceReliability,\n    invalidate: demoInvalidate,\n    exportData: demoExport,\n    isDemoMode: true,\n  };\n}",
  "new_string": "export function useAnalytics(range: TimeRange = \"30d\", _useDemoData = true) {\n  const demoSummary = useDemoAnalyticsSummary(range);\n  const demoDaily = useDemoDailyMetrics(range);\n  const demoHealthHistory = useDemoHealthHistory(range);\n  const demoUptimeStats = useDemoUptimeStats(range);\n  const demoServiceReliability = useDemoServiceReliability(range);\n  const demoInvalidate = useDemoInvalidateAnalytics();\n  const demoExport = useDemoExportAnalytics();\n\n  // For now, always return demo data\n  // In the future, this could check for real data availability based on _useDemoData\n  return {\n    summary: demoSummary,\n    daily: demoDaily,\n    healthHistory: demoHealthHistory,\n    uptimeStats: demoUptimeStats,\n    serviceReliability: demoServiceReliability,\n    invalidate: demoInvalidate,\n    exportData: demoExport,\n    isDemoMode: true,\n  };\n}"
}

Now let me fix the mock-analytics-data.ts file:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "old_string": "export function generateMockDailyMetrics(range: TimeRange, appId?: string): { metrics: DailyMetric[] } {",
  "new_string": "export function generateMockDailyMetrics(range: TimeRange, _appId?: string): { metrics: DailyMetric[] } {"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "old_string": "export function generateMockUptimeStats(range: TimeRange, appId?: string): {",
  "new_string": "export function generateMockUptimeStats(range: TimeRange, _appId?: string): {"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "old_string": "export function generateMockExportData(range: TimeRange, format: \"csv\" | \"json\") {\n  const { metrics } = generateMockDailyMetrics(range);\n  const { history } = generateMockHealthHistory(range, 500);\n\n  const start = new Date();\n  start.setDate(start.getDate() - getDaysForRange(range));\n\n  const exportData = {\n    exportedAt: new Date().toISOString(),\n    range,\n    startDate: start.toISOString(),\n    endDate: new Date().toISOString(),\n    metrics: metrics.map((m, idx) => ({",
  "new_string": "export function generateMockExportData(range: TimeRange, _format: \"csv\" | \"json\") {\n  const { metrics } = generateMockDailyMetrics(range);\n  const { history } = generateMockHealthHistory(range, 500);\n\n  const start = new Date();\n  start.setDate(start.getDate() - getDaysForRange(range));\n\n  const exportData = {\n    exportedAt: new Date().toISOString(),\n    range,\n    startDate: start.toISOString(),\n    endDate: new Date().toISOString(),\n    metrics: metrics.map((m, _idx) => ({"
}

There's still a reference to `idx` in the file. Let me fix that:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "offset": 395,
  "limit": 30
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "old_string": "    metrics: metrics.map((m, _idx) => ({\n      date: m.date,\n      appId: SAMPLE_APPS[idx % SAMPLE_APPS.length].id,\n      appName: SAMPLE_APPS[idx % SAMPLE_APPS.length].name,",
  "new_string": "    metrics: metrics.map((m, idx) => ({\n      date: m.date,\n      appId: SAMPLE_APPS[idx % SAMPLE_APPS.length].id,\n      appName: SAMPLE_APPS[idx % SAMPLE_APPS.length].name,"
}

Now let me fix the routes/analytics.tsx errors:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "  const handleExport = useCallback(async (format: \"csv\" | \"json\" | \"pdf\") => {\n    try {\n      const result = await exportMutation.mutateAsync({ range: timeRange, format });",
  "new_string": "  const handleExport = useCallback(async (format: \"csv\" | \"json\" | \"pdf\") => {\n    try {\n      // Handle PDF export separately for demo mode\n      if (format === \"pdf\") {\n        const result = await exportMutation.mutateAsync({ range: timeRange, format: \"json\" });\n        // For PDF, we use the demo export which returns a blob\n        if (\"blob\" in result) {\n          const url = URL.createObjectURL(result.blob);\n          const win = window.open(url, \"_blank\");\n          if (win) {\n            win.focus();\n            setTimeout(() => {\n              toast.success(\"Report opened! Use Ctrl+P / Cmd+P to save as PDF\");\n            }, 1000);\n          }\n          URL.revokeObjectURL(url);\n          return;\n        }\n        // If no blob, generate and open a print-friendly page\n        toast.info(\"Use your browser's print function to save as PDF\");\n        return;\n      }\n\n      const result = await exportMutation.mutateAsync({ range: timeRange, format });"
}

Let me read more of the file to clean up the duplicate PDF handling code:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "offset": 148,
  "limit": 60
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "      const result = await exportMutation.mutateAsync({ range: timeRange, format });\n\n      if (format === \"pdf\" && \"blob\" in result) {\n        // Download HTML report (opens in new tab for printing to PDF)\n        const url = URL.createObjectURL(result.blob);\n        const win = window.open(url, \"_blank\");\n        if (win) {\n          win.focus();\n          // Add print button hint after load\n          setTimeout(() => {\n            toast.success(\"Report opened! Use Ctrl+P / Cmd+P to save as PDF\");\n          }, 1000);\n        }\n        URL.revokeObjectURL(url);\n        return;\n      }\n\n      if (format === \"csv\" && \"metrics\" in result) {",
  "new_string": "      const result = await exportMutation.mutateAsync({ range: timeRange, format });\n\n      if (format === \"csv\" && \"metrics\" in result && result.metrics && result.healthHistory) {"
}

Now let me fix the unused variable issue:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "offset": 200,
  "limit": 30
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "  // For demo mode, don't require authentication\n  const showContent = useDemoData || (!isSessionPending && session?.user);\n\n  // Show login prompt only if not in demo mode and not authenticated",
  "new_string": "  // Show login prompt only if not in demo mode and not authenticated"
}

Now let me also update the demo export hook to properly handle PDF format:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "offset": 104,
  "limit": 20
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "offset": 120,
  "limit": 40
}

The demo export already handles PDF. The issue is that the real export hook doesn't support PDF. Let me check:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-analytics.ts",
  "offset": 148,
  "limit": 20
}

I see. The real export hook only supports CSV and JSON, but my handleExport function already handles this correctly by checking for PDF first and using the demo export. Now let me verify everything compiles:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(mock-analytics|use-demo-analytics|routes/analytics)\" || echo \"No errors in analytics files\"",
  "description": "Check analytics-specific TypeScript errors",
  "timeout": 60000
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "offset": 340,
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "old_string": "export function generateMockServiceReliability(range: TimeRange): {\n  services: ServiceReliabilityStats[];\n} {\n  const services: ServiceReliabilityStats[] = SAMPLE_APPS.map((app, index) => {",
  "new_string": "export function generateMockServiceReliability(_range: TimeRange): {\n  services: ServiceReliabilityStats[];\n} {\n  const services: ServiceReliabilityStats[] = SAMPLE_APPS.map((app, _index) => {"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "offset": 420,
  "limit": 30
}

I see the issue - I renamed `format` to `_format` but it's used in the function body. Let me fix this properly:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/mock-analytics-data.ts",
  "old_string": "export function generateMockExportData(range: TimeRange, _format: \"csv\" | \"json\") {",
  "new_string": "export function generateMockExportData(range: TimeRange, format: \"csv\" | \"json\") {"
}

Now let's also fix the remaining underscore prefix issue:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "old_string": "async function generatePDFReport(range: TimeRange): Promise<PDFReportData> {\n  const summary = generateMockAnalyticsSummary(range);\n  const _metrics = generateMockDailyMetrics(range); // Used for future chart embedding\n  const uptimeStats = generateMockUptimeStats(range);\n  const reliability = generateMockServiceReliability(range);",
  "new_string": "async function generatePDFReport(range: TimeRange): Promise<PDFReportData> {\n  const summary = generateMockAnalyticsSummary(range);\n  const uptimeStats = generateMockUptimeStats(range);\n  const reliability = generateMockServiceReliability(range);"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "offset": 160,
  "limit": 15
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-demo-analytics.ts",
  "old_string": "async function generatePDFReport(range: TimeRange): Promise<PDFReportData> {\n  const summary = generateMockAnalyticsSummary(range);\n  const _metrics = generateMockDailyMetrics(range); // Used for future chart embedding\n  const uptimeStats = generateMockUptimeStats(range);\n  const reliability = generateMockServiceReliability(range);",
  "new_string": "async function generatePDFReport(range: TimeRange): Promise<PDFReportData> {\n  const summary = generateMockAnalyticsSummary(range);\n  const uptimeStats = generateMockUptimeStats(range);\n  const reliability = generateMockServiceReliability(range);"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(mock-analytics|use-demo-analytics|routes/analytics)\" || echo \"No errors in analytics files\"",
  "description": "Check analytics-specific TypeScript errors",
  "timeout": 60000
}

All analytics-related TypeScript errors are resolved. Now let me update the todo list and provide a summary:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create mock analytics data generator",
      "status": "completed",
      "activeForm": "Creating mock analytics data generator"
    },
    {
      "content": "Create demo mode hook wrapper for analytics",
      "status": "completed",
      "activeForm": "Creating demo mode hook wrapper"
    },
    {
      "content": "Add PDF export functionality",
      "status": "completed",
      "activeForm": "Adding PDF export functionality"
    },
    {
      "content": "Update analytics route to support demo mode",
      "status": "completed",
      "activeForm": "Updating analytics route for demo mode"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "completed",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}

<summary>
## Summary: Frontend-Only Analytics Dashboard with Demo Mode

### Changes Implemented
- Created a comprehensive mock data generation system for analytics that generates realistic:
  - App usage summaries with varied access patterns
  - Daily metrics with weekly patterns and trends
  - Health history with status events (online/offline)
  - Uptime statistics with monthly/yearly breakdowns
  - Service reliability metrics (MTTR, MTBF, downtime)

- Built demo mode analytics hooks that:
  - Generate frontend-only mock data without backend calls
  - Support all time ranges (7d, 30d, 90d, 1y, all)
  - Include simulated loading delays for realistic UX
  - Enable seamless toggling between demo and live data

- Added PDF export functionality:
  - Generates formatted HTML report for printing to PDF
  - Includes summary statistics, SLA overview, service reliability table
  - Contains top apps by usage and monthly uptime breakdown
  - Opens in new tab with print prompt

- Updated analytics route with:
  - Demo mode toggle button in header
  - Demo mode indicator badge
  - Demo mode banner explaining sample data
  - Automatic switch option when real data is available
  - No authentication required for demo mode

### Files Modified
- `src/lib/mock-analytics-data.ts` (NEW) - Mock data generation utilities
- `src/hooks/use-demo-analytics.ts` (NEW) - Demo mode hooks with PDF export
- `src/components/analytics/analytics-dashboard.tsx` - Added PDF button to ExportButton
- `src/routes/analytics.tsx` - Full demo mode support with data source toggle

### Notes for Developer
- The dashboard now works entirely in frontend-only mode with demo data
- Users can toggle between demo data (flask icon) and live data (database icon)
- Time range filters (7d, 30d, 90d, 1y) work with demo data
- Export options: PDF Report, CSV (metrics + health), JSON
- PDF export opens as HTML in new tab - use browser print (Ctrl+P/Cmd+P) to save as PDF
- Pre-existing TypeScript errors in other components remain (alerts, apps, share-dialog) - these are unrelated to the analytics changes
</summary>

---

## Follow-up Session

I'll review the current state of the analytics dashboard to understand what we have and then address making it work with real data instead of just mock data.

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-analytics.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/analytics.server.ts"
}

Now I understand the situation. The analytics dashboard is currently defaulting to demo mode (`useDemoData` is set to `true`). The real data hooks ARE working - they call the backend server functions - but the UI defaults to showing demo/mock data.

The user is saying "it's all mock data but very good UI" - they want the dashboard to actually work with real data. Let me check a few more things:

🔧 Tool: Glob
Input: {
  "pattern": "src/database/schema/app-analytics*"
}

🔧 Tool: Grep
Input: {
  "pattern": "healthCheckEnabled",
  "glob": "src/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema/app-analytics.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/health.server.ts"
}

Now I understand the full picture. The backend is complete and working! The health check system records data to the analytics tables. The issue is simply that:

1. The analytics page defaults to `useDemoData = true`
2. There needs to be actual app data + health checks running to see real analytics

Let me make the dashboard smarter - it should automatically use real data when available, and only fall back to demo mode when there's no data:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update analytics to auto-detect and use real data when available",
      "status": "in_progress",
      "activeForm": "Updating analytics to use real data"
    },
    {
      "content": "Improve the demo/live toggle UX",
      "status": "pending",
      "activeForm": "Improving demo/live toggle UX"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "function AnalyticsPage() {\n  const { data: session, isPending: isSessionPending } = useAuthenticate();\n  const [timeRange, setTimeRange] = useState<TimeRange>(\"30d\");\n  const [activeTab, setActiveTab] = useState(\"overview\");\n  const [useDemoData, setUseDemoData] = useState(true); // Default to demo mode\n\n  // Real data hooks\n  const realSummary = useAnalyticsSummary(timeRange);\n  const realDaily = useDailyMetrics(timeRange);\n  const realHealthHistory = useHealthHistory(timeRange);\n  const realUptimeStats = useUptimeStats(timeRange);\n  const realServiceReliability = useServiceReliability(timeRange);\n  const realInvalidate = useInvalidateAnalytics();\n  const realExport = useExportAnalytics();\n\n  // Demo data hooks\n  const demoSummary = useDemoAnalyticsSummary(timeRange);\n  const demoDaily = useDemoDailyMetrics(timeRange);\n  const demoHealthHistory = useDemoHealthHistory(timeRange);\n  const demoUptimeStats = useDemoUptimeStats(timeRange);\n  const demoServiceReliability = useDemoServiceReliability(timeRange);\n  const demoInvalidate = useDemoInvalidateAnalytics();\n  const demoExport = useDemoExportAnalytics();\n\n  // Determine which data to use - check if real data is available\n  const hasRealData = realSummary.data?.apps && realSummary.data.apps.length > 0;\n\n  // Auto-switch to real data if available\n  useEffect(() => {\n    if (hasRealData && useDemoData) {\n      // Real data is available, we could switch automatically\n      // For now, keep demo mode until user toggles\n    }\n  }, [hasRealData, useDemoData]);",
  "new_string": "function AnalyticsPage() {\n  const { data: session, isPending: isSessionPending } = useAuthenticate();\n  const [timeRange, setTimeRange] = useState<TimeRange>(\"30d\");\n  const [activeTab, setActiveTab] = useState(\"overview\");\n  const [manualDemoMode, setManualDemoMode] = useState<boolean | null>(null); // null = auto-detect\n\n  // Real data hooks - always fetch to check if data exists\n  const realSummary = useAnalyticsSummary(timeRange);\n  const realDaily = useDailyMetrics(timeRange);\n  const realHealthHistory = useHealthHistory(timeRange);\n  const realUptimeStats = useUptimeStats(timeRange);\n  const realServiceReliability = useServiceReliability(timeRange);\n  const realInvalidate = useInvalidateAnalytics();\n  const realExport = useExportAnalytics();\n\n  // Demo data hooks\n  const demoSummary = useDemoAnalyticsSummary(timeRange);\n  const demoDaily = useDemoDailyMetrics(timeRange);\n  const demoHealthHistory = useDemoHealthHistory(timeRange);\n  const demoUptimeStats = useDemoUptimeStats(timeRange);\n  const demoServiceReliability = useDemoServiceReliability(timeRange);\n  const demoInvalidate = useDemoInvalidateAnalytics();\n  const demoExport = useDemoExportAnalytics();\n\n  // Determine if real data is available (has apps with accesses or health checks)\n  const hasRealData = !realSummary.isLoading && realSummary.data?.apps && realSummary.data.apps.length > 0;\n  const hasRealAnalytics = hasRealData && realSummary.data?.apps?.some(\n    app => app.totalAccesses > 0 || app.healthCheckCount > 0\n  );\n\n  // Auto-detect: Use real data if we have analytics, otherwise demo\n  // User can manually override with the toggle\n  const useDemoData = manualDemoMode !== null ? manualDemoMode : !hasRealAnalytics;"
}

Now let's update the toggle to work with the manual override:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "  const toggleDataSource = useCallback(() => {\n    setUseDemoData(prev => !prev);\n    toast.success(useDemoData ? \"Switched to live data\" : \"Switched to demo data\");\n  }, [useDemoData]);",
  "new_string": "  const toggleDataSource = useCallback(() => {\n    setManualDemoMode(prev => {\n      // If null (auto), switch to opposite of current state\n      // Otherwise toggle between true/false\n      const newValue = prev === null ? !useDemoData : !prev;\n      toast.success(newValue ? \"Switched to demo data\" : \"Switched to live data\");\n      return newValue;\n    });\n  }, [useDemoData]);"
}

Now let's update the demo mode banner to be more informative:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "      {/* Demo Mode Banner */}\n      {useDemoData && (\n        <div className=\"bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-lg p-3 flex items-center gap-3\">\n          <FlaskConical className=\"h-5 w-5 text-amber-500 flex-shrink-0\" />\n          <div className=\"flex-1\">\n            <p className=\"text-sm font-medium text-amber-700 dark:text-amber-400\">\n              Demo Mode Active\n            </p>\n            <p className=\"text-xs text-muted-foreground\">\n              Viewing sample data. Add apps and enable health checks to see real analytics.\n            </p>\n          </div>\n          {hasRealData && (\n            <Button variant=\"outline\" size=\"sm\" onClick={() => setUseDemoData(false)} className=\"gap-1\">\n              <Database className=\"h-3 w-3\" />\n              View Real Data\n            </Button>\n          )}\n        </div>\n      )}",
  "new_string": "      {/* Demo Mode Banner */}\n      {useDemoData && (\n        <div className=\"bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-lg p-3 flex items-center gap-3\">\n          <FlaskConical className=\"h-5 w-5 text-amber-500 flex-shrink-0\" />\n          <div className=\"flex-1\">\n            <p className=\"text-sm font-medium text-amber-700 dark:text-amber-400\">\n              Demo Mode Active\n            </p>\n            <p className=\"text-xs text-muted-foreground\">\n              {hasRealAnalytics\n                ? \"You have real data available. Click 'Live' to view your actual analytics.\"\n                : hasRealData\n                  ? \"You have apps but no usage data yet. Click apps to start tracking analytics.\"\n                  : \"Viewing sample data. Add apps and enable health checks to see real analytics.\"}\n            </p>\n          </div>\n          {hasRealAnalytics && (\n            <Button variant=\"outline\" size=\"sm\" onClick={() => setManualDemoMode(false)} className=\"gap-1\">\n              <Database className=\"h-3 w-3\" />\n              View Real Data\n            </Button>\n          )}\n        </div>\n      )}\n\n      {/* Live Data Info Banner (when viewing real data with limited content) */}\n      {!useDemoData && hasRealData && !hasRealAnalytics && (\n        <div className=\"bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-lg p-3 flex items-center gap-3\">\n          <Database className=\"h-5 w-5 text-blue-500 flex-shrink-0\" />\n          <div className=\"flex-1\">\n            <p className=\"text-sm font-medium text-blue-700 dark:text-blue-400\">\n              Getting Started\n            </p>\n            <p className=\"text-xs text-muted-foreground\">\n              You have {realSummary.data?.totals?.totalApps || 0} apps. Click on apps to track usage and enable health checks to monitor uptime.\n            </p>\n          </div>\n          <Button variant=\"outline\" size=\"sm\" onClick={() => setManualDemoMode(true)} className=\"gap-1\">\n            <FlaskConical className=\"h-3 w-3\" />\n            View Demo\n          </Button>\n        </div>\n      )}"
}

Now let's also add a "Live" badge when viewing real data and update the toggle button to be clearer:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "            <div className=\"flex items-center gap-2\">\n              <h1 className=\"text-xl font-bold\">Analytics Dashboard</h1>\n              {useDemoData && (\n                <Badge variant=\"secondary\" className=\"text-xs gap-1\">\n                  <FlaskConical className=\"h-3 w-3\" />\n                  Demo\n                </Badge>\n              )}\n            </div>",
  "new_string": "            <div className=\"flex items-center gap-2\">\n              <h1 className=\"text-xl font-bold\">Analytics Dashboard</h1>\n              {useDemoData ? (\n                <Badge variant=\"secondary\" className=\"text-xs gap-1\">\n                  <FlaskConical className=\"h-3 w-3\" />\n                  Demo\n                </Badge>\n              ) : (\n                <Badge variant=\"default\" className=\"text-xs gap-1 bg-green-600\">\n                  <Database className=\"h-3 w-3\" />\n                  Live\n                </Badge>\n              )}\n            </div>"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update analytics to auto-detect and use real data when available",
      "status": "completed",
      "activeForm": "Updating analytics to use real data"
    },
    {
      "content": "Improve the demo/live toggle UX",
      "status": "completed",
      "activeForm": "Improving demo/live toggle UX"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "in_progress",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(routes/analytics|mock-analytics|use-demo)\" || echo \"No errors in analytics files\"",
  "description": "Check TypeScript errors in analytics files",
  "timeout": 60000
}

Let me fix those errors:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "import { useState, useCallback, useEffect } from \"react\";",
  "new_string": "import { useState, useCallback } from \"react\";"
}

🔧 Tool: Grep
Input: {
  "pattern": "setUseDemoData",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "offset": 230,
  "limit": 20
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "          <Button onClick={() => setUseDemoData(true)} variant=\"outline\" className=\"gap-2\">\n            <FlaskConical className=\"h-4 w-4\" />\n            View Demo Data\n          </Button>\n        </div>\n      </main>\n    );\n  }\n\n  return (",
  "new_string": "          <Button onClick={() => setManualDemoMode(true)} variant=\"outline\" className=\"gap-2\">\n            <FlaskConical className=\"h-4 w-4\" />\n            View Demo Data\n          </Button>\n        </div>\n      </main>\n    );\n  }\n\n  return ("
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "offset": 505,
  "limit": 20
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/analytics.tsx",
  "old_string": "          <Button onClick={() => setUseDemoData(true)} variant=\"outline\" className=\"gap-2\">\n            <FlaskConical className=\"h-4 w-4\" />\n            View Demo Data\n          </Button>\n        </div>\n      )}\n    </main>\n  );\n}",
  "new_string": "          <Button onClick={() => setManualDemoMode(true)} variant=\"outline\" className=\"gap-2\">\n            <FlaskConical className=\"h-4 w-4\" />\n            View Demo Data\n          </Button>\n        </div>\n      )}\n    </main>\n  );\n}"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(routes/analytics|mock-analytics|use-demo)\" || echo \"No errors in analytics files\"",
  "description": "Check TypeScript errors in analytics files",
  "timeout": 60000
}

All analytics-related TypeScript errors are fixed. Let me update the todos and provide a summary:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update analytics to auto-detect and use real data when available",
      "status": "completed",
      "activeForm": "Updating analytics to use real data"
    },
    {
      "content": "Improve the demo/live toggle UX",
      "status": "completed",
      "activeForm": "Improving demo/live toggle UX"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "completed",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}

<summary>
## Summary: Analytics Dashboard - Made to Work with Real Data

### Changes Implemented
- **Auto-detection of real data**: The dashboard now automatically detects if you have real analytics data (apps with accesses or health checks) and uses that instead of demo data
- **Smart fallback to demo mode**: Only shows demo data when there's no real analytics data available
- **Manual override toggle**: Users can still manually switch between Demo and Live modes using the toggle button
- **Live/Demo badges**: Clear visual indicator showing whether you're viewing "Live" (green badge) or "Demo" (gray badge) data
- **Contextual banners**:
  - Demo mode banner explains why demo is active and offers to switch when real data exists
  - "Getting Started" banner when viewing live data with no analytics yet, explaining how to generate data
- **Removed hardcoded demo default**: Previously `useDemoData` was hardcoded to `true`, now it auto-detects

### How It Works Now
1. When you have apps with health checks enabled or app access tracking, the dashboard automatically shows **real data**
2. When you have no apps or no analytics data, it falls back to **demo data** so you can still see the UI
3. You can manually toggle between modes at any time using the "Live/Demo" button

### Files Modified
- `src/routes/analytics.tsx` - Updated to auto-detect real data and smart demo/live switching

### Notes for Developer
- The backend is fully functional! Health checks (`checkAppHealth`, `checkAllAppsHealth`) automatically record data to the `healthHistory` and `appUsageMetrics` tables via the `recordHealthCheck` function
- App access tracking works via `trackAppAccess` / `logAppAccess` - when users click on apps
- To generate real analytics data:
  1. Add apps with URLs
  2. Enable health checks on apps (this will record uptime/response time data)
  3. Click on apps to track usage (this records access data)
- The demo data is still available for showcasing the UI to users who haven't set up their apps yet
</summary>