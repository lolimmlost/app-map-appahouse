import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyMetric, AppAnalyticsSummary } from "@/lib/server/analytics.server";

interface AccessTrendChartProps {
  data: DailyMetric[];
  title?: string;
  description?: string;
}

export function AccessTrendChart({
  data,
  title = "Access Trends",
  description = "App accesses over time",
}: AccessTrendChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [data]);

  return (
    <Card className="card-elevation">
      <CardHeader className="border-b border-border pb-2 pt-3 px-4">
        <CardTitle className="panel-label">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="accessCount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Accesses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface UptimeTrendChartProps {
  data: DailyMetric[];
  title?: string;
  description?: string;
}

export function UptimeTrendChart({
  data,
  title = "Uptime Trends",
  description = "Health uptime percentage over time",
}: UptimeTrendChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.uptimePercentage !== null)
      .map((d) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        uptimePercentage: d.uptimePercentage ? Math.round(d.uptimePercentage * 10) / 10 : 0,
      }));
  }, [data]);

  return (
    <Card className="card-elevation">
      <CardHeader className="bg-success/5 border-b border-border pb-2 pt-3 px-4">
        <CardTitle className="panel-label">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value}%`, "Uptime"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="uptimePercentage"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                dot={false}
                name="Uptime %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface ResponseTimeChartProps {
  data: DailyMetric[];
  title?: string;
  description?: string;
}

export function ResponseTimeChart({
  data,
  title = "Response Times",
  description = "Average response time over time",
}: ResponseTimeChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.averageResponseTime !== null)
      .map((d) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        responseTime: d.averageResponseTime || 0,
      }));
  }, [data]);

  return (
    <Card className="card-elevation">
      <CardHeader className="bg-info/5 border-b border-border pb-2 pt-3 px-4">
        <CardTitle className="panel-label">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value}ms`, "Avg Response"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                dot={false}
                name="Avg Response (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface MostUsedAppsChartProps {
  data: AppAnalyticsSummary[];
  title?: string;
  description?: string;
  limit?: number;
}


export function MostUsedAppsChart({
  data,
  title = "Most Used Apps",
  description = "Apps by access frequency",
  limit = 8,
}: MostUsedAppsChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((a) => a.totalAccesses > 0)
      .slice(0, limit)
      .map((a) => ({
        name: a.appName.length > 15 ? `${a.appName.slice(0, 15)}...` : a.appName,
        value: a.totalAccesses,
        fullName: a.appName,
      }));
  }, [data, limit]);

  if (chartData.length === 0) {
    return (
      <Card className="card-elevation">
        <CardHeader className="border-b border-border pb-2 pt-3 px-4">
          <CardTitle className="panel-label">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-3 px-4">
          <div className="h-[240px] flex items-center justify-center text-muted-foreground">
            No usage data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevation">
      <CardHeader className="border-b border-border pb-2 pt-3 px-4">
        <CardTitle className="panel-label">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string, entry: { payload?: { fullName?: string } }) => [
                  `${value} accesses`,
                  entry.payload?.fullName || name,
                ]}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface AppReliabilityChartProps {
  data: AppAnalyticsSummary[];
  title?: string;
  description?: string;
  limit?: number;
}

export function AppReliabilityChart({
  data,
  title = "App Reliability",
  description = "Apps by uptime percentage",
  limit = 8,
}: AppReliabilityChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((a) => a.uptimePercentage !== null && a.healthCheckCount > 0)
      .sort((a, b) => (b.uptimePercentage || 0) - (a.uptimePercentage || 0))
      .slice(0, limit)
      .map((a) => ({
        name: a.appName.length > 15 ? `${a.appName.slice(0, 15)}...` : a.appName,
        uptime: Math.round((a.uptimePercentage || 0) * 10) / 10,
        fullName: a.appName,
      }));
  }, [data, limit]);

  if (chartData.length === 0) {
    return (
      <Card className="card-elevation">
        <CardHeader className="border-b border-border pb-2 pt-3 px-4">
          <CardTitle className="panel-label">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-3 px-4">
          <div className="h-[240px] flex items-center justify-center text-muted-foreground">
            No health check data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevation">
      <CardHeader className="border-b border-border pb-2 pt-3 px-4">
        <CardTitle className="panel-label">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string, entry: { payload?: { fullName?: string } }) => [
                  `${value}%`,
                  entry.payload?.fullName || name,
                ]}
              />
              <Bar dataKey="uptime" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
