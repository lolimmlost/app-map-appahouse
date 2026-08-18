import { cn } from "@/lib/utils";
import { uptimeTextClass, uptimeBgClass } from "@/components/apps/host";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UptimeDay {
  date: string;
  uptime: number; // 0-100
  status: "online" | "degraded" | "offline" | "unknown";
}

interface UptimeChartProps {
  data: UptimeDay[];
  days?: number;
  className?: string;
}

function getStatusColor(uptime: number): string {
  return uptimeBgClass(uptime);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UptimeChart({ data, days = 90, className }: UptimeChartProps) {
  // Generate placeholder data if we don't have enough
  const chartData: UptimeDay[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const existingData = data.find((d) => d.date.startsWith(dateStr));
    if (existingData) {
      chartData.push(existingData);
    } else {
      chartData.push({
        date: dateStr,
        uptime: 100,
        status: "unknown",
      });
    }
  }

  // Calculate overall uptime
  const validDays = chartData.filter((d) => d.status !== "unknown");
  const overallUptime =
    validDays.length > 0
      ? validDays.reduce((acc, d) => acc + d.uptime, 0) / validDays.length
      : 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{days} day uptime</span>
        <span className="text-sm font-medium text-success">
          {overallUptime.toFixed(2)}%
        </span>
      </div>

      <TooltipProvider>
        <div className="flex gap-0.5">
          {chartData.map((day, index) => (
            <Tooltip key={day.date} delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-8 flex-1 rounded-sm transition-all hover:scale-110 cursor-pointer",
                    day.status === "unknown" ? "bg-muted-foreground/50" : getStatusColor(day.uptime)
                  )}
                  style={{ minWidth: "2px", maxWidth: "8px" }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium">{formatDate(day.date)}</div>
                {day.status !== "unknown" ? (
                  <div>{day.uptime.toFixed(2)}% uptime</div>
                ) : (
                  <div className="text-muted-foreground">No data</div>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{days} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

interface UptimeSummaryProps {
  uptime: number;
  period: string;
  totalChecks?: number;
  avgResponseTime?: number;
  className?: string;
}

export function UptimeSummary({
  uptime,
  period,
  totalChecks,
  avgResponseTime,
  className,
}: UptimeSummaryProps) {
  const getUptimeColor = (value: number) => uptimeTextClass(value);

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="text-center">
        <div className={cn("text-3xl font-bold", getUptimeColor(uptime))}>
          {uptime.toFixed(2)}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">Uptime ({period})</div>
      </div>

      {avgResponseTime !== undefined && (
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">
            {avgResponseTime.toFixed(0)}
            <span className="text-sm text-muted-foreground ml-1">ms</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Avg Response</div>
        </div>
      )}

      {totalChecks !== undefined && (
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">
            {totalChecks.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total Checks</div>
        </div>
      )}
    </div>
  );
}
