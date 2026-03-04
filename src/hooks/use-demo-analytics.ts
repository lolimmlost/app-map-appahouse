/**
 * Demo Analytics Hooks
 *
 * These hooks provide analytics data in demo/frontend-only mode
 * by using generated mock data instead of server calls.
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TimeRange } from "@/lib/server/analytics.server";
import {
  generateMockAnalyticsSummary,
  generateMockDailyMetrics,
  generateMockHealthHistory,
  generateMockUptimeStats,
  generateMockServiceReliability,
  generateMockExportData,
} from "@/lib/mock-analytics-data";

// ============================================================================
// Demo Mode State
// ============================================================================

// Global demo mode flag - can be toggled
let isDemoMode = true; // Default to demo mode for frontend-only testing

export function setDemoMode(enabled: boolean) {
  isDemoMode = enabled;
}

export function getDemoMode(): boolean {
  return isDemoMode;
}

// ============================================================================
// Demo Analytics Hooks
// ============================================================================

/**
 * Hook for fetching analytics summary (demo mode)
 */
export function useDemoAnalyticsSummary(range: TimeRange = "30d") {
  return useQuery({
    queryKey: ["demo-analytics", "summary", range],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockAnalyticsSummary(range);
    },
    staleTime: 60000,
  });
}

/**
 * Hook for fetching daily metrics (demo mode)
 */
export function useDemoDailyMetrics(range: TimeRange = "30d", appId?: string) {
  return useQuery({
    queryKey: ["demo-analytics", "daily", range, appId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return generateMockDailyMetrics(range, appId);
    },
    staleTime: 60000,
  });
}

/**
 * Hook for fetching health history (demo mode)
 */
export function useDemoHealthHistory(range: TimeRange = "7d", limit = 100, appId?: string) {
  return useQuery({
    queryKey: ["demo-analytics", "healthHistory", range, limit, appId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 250));
      return generateMockHealthHistory(range, limit, appId);
    },
    staleTime: 60000,
  });
}

/**
 * Hook for fetching uptime stats (demo mode)
 */
export function useDemoUptimeStats(range: TimeRange = "30d", appId?: string) {
  return useQuery({
    queryKey: ["demo-analytics", "uptimeStats", range, appId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return generateMockUptimeStats(range, appId);
    },
    staleTime: 60000,
  });
}

/**
 * Hook for fetching service reliability (demo mode)
 */
export function useDemoServiceReliability(range: TimeRange = "30d") {
  return useQuery({
    queryKey: ["demo-analytics", "serviceReliability", range],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return generateMockServiceReliability(range);
    },
    staleTime: 60000,
  });
}

/**
 * Invalidate demo analytics queries
 */
export function useDemoInvalidateAnalytics() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["demo-analytics"] });
  }, [queryClient]);
}

/**
 * Hook for exporting demo analytics data
 */
export function useDemoExportAnalytics() {
  return useMutation({
    mutationFn: async (data: { range: TimeRange; format: "csv" | "json" | "pdf" }) => {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (data.format === "pdf") {
        // Generate PDF export data
        return generatePDFReport(data.range);
      }

      return generateMockExportData(data.range, data.format);
    },
    onError: (error) => {
      console.error("Failed to export demo analytics:", error);
    },
  });
}

/**
 * Hook for tracking app access (demo mode - no-op)
 */
export function useDemoTrackAppAccess() {
  return {
    trackAccess: (data: { appId: string; accessType?: string }) => {
      console.log("[Demo] Would track app access:", data);
    },
    isTracking: false,
  };
}

// ============================================================================
// PDF Report Generator
// ============================================================================

interface PDFReportData {
  format: "pdf";
  blob: Blob;
  filename: string;
}

async function generatePDFReport(range: TimeRange): Promise<PDFReportData> {
  const summary = generateMockAnalyticsSummary(range);
  const uptimeStats = generateMockUptimeStats(range);
  const reliability = generateMockServiceReliability(range);

  // Generate a simple HTML-based PDF content
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Analytics Report - ${range}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .summary { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; min-width: 150px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    .uptime-good { color: #16a34a; }
    .uptime-warning { color: #d97706; }
    .uptime-bad { color: #dc2626; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <h1>Analytics Report</h1>
  <p><strong>Report Period:</strong> ${range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : range === "90d" ? "Last 90 days" : range === "1y" ? "Last year" : "All time"}</p>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

  <h2>Summary Statistics</h2>
  <div class="summary">
    <div class="stat-card">
      <div class="stat-value">${summary.totals.totalApps}</div>
      <div class="stat-label">Total Apps</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${summary.totals.totalAccesses.toLocaleString()}</div>
      <div class="stat-label">Total Accesses</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${summary.totals.averageUptime?.toFixed(2) || "N/A"}%</div>
      <div class="stat-label">Average Uptime</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${summary.totals.averageResponseTime || "N/A"}ms</div>
      <div class="stat-label">Avg Response Time</div>
    </div>
  </div>

  <h2>SLA Overview</h2>
  <div class="summary">
    <div class="stat-card">
      <div class="stat-value ${(uptimeStats.stats?.uptimePercentage || 0) >= 99.9 ? 'uptime-good' : (uptimeStats.stats?.uptimePercentage || 0) >= 99 ? 'uptime-warning' : 'uptime-bad'}">
        ${uptimeStats.stats?.uptimePercentage?.toFixed(2) || "N/A"}%
      </div>
      <div class="stat-label">Period Uptime</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${uptimeStats.stats?.totalHealthChecks?.toLocaleString() || 0}</div>
      <div class="stat-label">Total Health Checks</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${uptimeStats.stats?.successfulChecks?.toLocaleString() || 0}</div>
      <div class="stat-label">Successful Checks</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${uptimeStats.stats?.failedChecks?.toLocaleString() || 0}</div>
      <div class="stat-label">Failed Checks</div>
    </div>
  </div>

  <h2>Service Reliability</h2>
  <table>
    <thead>
      <tr>
        <th>Service</th>
        <th>Monthly Uptime</th>
        <th>Yearly Uptime</th>
        <th>Total Downtime</th>
        <th>MTTR</th>
        <th>Last Incident</th>
      </tr>
    </thead>
    <tbody>
      ${reliability.services.map(s => `
        <tr>
          <td>${s.appName}</td>
          <td class="${(s.monthlyUptime || 0) >= 99.9 ? 'uptime-good' : (s.monthlyUptime || 0) >= 99 ? 'uptime-warning' : 'uptime-bad'}">
            ${s.monthlyUptime?.toFixed(2) || "N/A"}%
          </td>
          <td class="${(s.yearlyUptime || 0) >= 99.9 ? 'uptime-good' : (s.yearlyUptime || 0) >= 99 ? 'uptime-warning' : 'uptime-bad'}">
            ${s.yearlyUptime?.toFixed(2) || "N/A"}%
          </td>
          <td>${s.totalDowntime < 60 ? `${s.totalDowntime}m` : `${Math.round(s.totalDowntime / 60)}h`}</td>
          <td>${s.mttr ? `${s.mttr}m` : "N/A"}</td>
          <td>${s.lastIncident ? new Date(s.lastIncident).toLocaleDateString() : "Never"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h2>Top Apps by Usage</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>App Name</th>
        <th>Total Accesses</th>
        <th>Uptime</th>
        <th>Avg Response</th>
      </tr>
    </thead>
    <tbody>
      ${summary.apps.slice(0, 10).map((app, idx) => `
        <tr>
          <td>#${idx + 1}</td>
          <td>${app.appName}</td>
          <td>${app.totalAccesses.toLocaleString()}</td>
          <td>${app.uptimePercentage?.toFixed(2) || "N/A"}%</td>
          <td>${app.averageResponseTime || "N/A"}ms</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h2>Monthly Uptime Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Period</th>
        <th>Uptime</th>
        <th>Total Checks</th>
        <th>Successful</th>
        <th>Failed</th>
        <th>Avg Response</th>
      </tr>
    </thead>
    <tbody>
      ${uptimeStats.monthlyBreakdown.map(m => `
        <tr>
          <td>${m.period}</td>
          <td class="${(m.uptimePercentage || 0) >= 99.9 ? 'uptime-good' : (m.uptimePercentage || 0) >= 99 ? 'uptime-warning' : 'uptime-bad'}">
            ${m.uptimePercentage?.toFixed(2) || "N/A"}%
          </td>
          <td>${m.totalHealthChecks.toLocaleString()}</td>
          <td>${m.successfulChecks.toLocaleString()}</td>
          <td>${m.failedChecks.toLocaleString()}</td>
          <td>${m.averageResponseTime || "N/A"}ms</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>This report was generated automatically. Data shown is for demonstration purposes.</p>
    <p>Generated by AppMap Analytics Dashboard</p>
  </div>
</body>
</html>
  `;

  // Create a Blob from the HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });

  return {
    format: "pdf",
    blob,
    filename: `analytics-report-${range}-${new Date().toISOString().split("T")[0]}`,
  };
}

// ============================================================================
// Combined Hook (switches between demo and real data)
// ============================================================================

export function useAnalytics(range: TimeRange = "30d", _useDemoData = true) {
  const demoSummary = useDemoAnalyticsSummary(range);
  const demoDaily = useDemoDailyMetrics(range);
  const demoHealthHistory = useDemoHealthHistory(range);
  const demoUptimeStats = useDemoUptimeStats(range);
  const demoServiceReliability = useDemoServiceReliability(range);
  const demoInvalidate = useDemoInvalidateAnalytics();
  const demoExport = useDemoExportAnalytics();

  // For now, always return demo data
  // In the future, this could check for real data availability based on _useDemoData
  return {
    summary: demoSummary,
    daily: demoDaily,
    healthHistory: demoHealthHistory,
    uptimeStats: demoUptimeStats,
    serviceReliability: demoServiceReliability,
    invalidate: demoInvalidate,
    exportData: demoExport,
    isDemoMode: true,
  };
}
