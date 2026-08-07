import { cn } from "@/lib/utils";

export type StatusType = "online" | "offline" | "degraded" | "unknown" | "maintenance";

interface StatusIndicatorProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; bgColor: string; label: string; pulseColor: string }> = {
  online: {
    color: "text-success",
    bgColor: "bg-success",
    pulseColor: "bg-success",
    label: "Operational",
  },
  offline: {
    color: "text-error",
    bgColor: "bg-error",
    pulseColor: "bg-error",
    label: "Outage",
  },
  degraded: {
    color: "text-warning",
    bgColor: "bg-warning",
    pulseColor: "bg-warning",
    label: "Degraded",
  },
  unknown: {
    color: "text-muted-foreground",
    bgColor: "bg-muted-foreground",
    pulseColor: "bg-muted",
    label: "Unknown",
  },
  maintenance: {
    color: "text-info",
    bgColor: "bg-info",
    pulseColor: "bg-info",
    label: "Maintenance",
  },
};

const sizeConfig = {
  sm: { dot: "h-2 w-2", text: "text-xs" },
  md: { dot: "h-3 w-3", text: "text-sm" },
  lg: { dot: "h-4 w-4", text: "text-base" },
};

export function StatusIndicator({ status, size = "md", showLabel = false, className }: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex">
        {/* Pulse animation for online status */}
        {status === "online" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.pulseColor
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full", sizes.dot, config.bgColor)} />
      </span>
      {showLabel && (
        <span className={cn("font-medium", sizes.text, config.color)}>{config.label}</span>
      )}
    </div>
  );
}

interface OverallStatusBannerProps {
  status: StatusType;
  message?: string;
  className?: string;
}

const bannerConfig: Record<StatusType, { bg: string; border: string; text: string }> = {
  online: {
    bg: "bg-success/10",
    border: "border-success/20",
    text: "text-success",
  },
  offline: {
    bg: "bg-error/10",
    border: "border-error/20",
    text: "text-error",
  },
  degraded: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    text: "text-warning",
  },
  unknown: {
    bg: "bg-muted-foreground/10",
    border: "border-border/20",
    text: "text-muted-foreground",
  },
  maintenance: {
    bg: "bg-info/10",
    border: "border-info/20",
    text: "text-info",
  },
};

const statusMessages: Record<StatusType, string> = {
  online: "All systems operational",
  offline: "Major outage detected",
  degraded: "Some systems experiencing issues",
  unknown: "Unable to determine system status",
  maintenance: "Scheduled maintenance in progress",
};

export function OverallStatusBanner({ status, message, className }: OverallStatusBannerProps) {
  const config = bannerConfig[status];
  const displayMessage = message || statusMessages[status];

  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex items-center gap-3",
        config.bg,
        config.border,
        className
      )}
    >
      <StatusIndicator status={status} size="lg" />
      <span className={cn("font-medium text-lg", config.text)}>{displayMessage}</span>
    </div>
  );
}
