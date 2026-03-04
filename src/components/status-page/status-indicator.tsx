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
    color: "text-green-500",
    bgColor: "bg-green-500",
    pulseColor: "bg-green-400",
    label: "Operational",
  },
  offline: {
    color: "text-red-500",
    bgColor: "bg-red-500",
    pulseColor: "bg-red-400",
    label: "Outage",
  },
  degraded: {
    color: "text-yellow-500",
    bgColor: "bg-yellow-500",
    pulseColor: "bg-yellow-400",
    label: "Degraded",
  },
  unknown: {
    color: "text-gray-400",
    bgColor: "bg-gray-400",
    pulseColor: "bg-gray-300",
    label: "Unknown",
  },
  maintenance: {
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    pulseColor: "bg-blue-400",
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
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
  },
  offline: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
  },
  degraded: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
  },
  unknown: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    text: "text-gray-400",
  },
  maintenance: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
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
