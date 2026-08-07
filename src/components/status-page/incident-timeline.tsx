import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock } from "lucide-react";

type IncidentSeverity = "minor" | "major" | "critical";
type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

interface IncidentUpdate {
  id: string;
  message: string;
  status: IncidentStatus;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  message?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  startedAt: string | Date;
  resolvedAt?: string | Date | null;
  updates?: IncidentUpdate[];
}

interface IncidentTimelineProps {
  incidents: Incident[];
  maxItems?: number;
  showEmpty?: boolean;
  className?: string;
}

const severityConfig: Record<IncidentSeverity, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  minor: {
    icon: Info,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  major: {
    icon: AlertCircle,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  critical: {
    icon: AlertTriangle,
    color: "text-error",
    bg: "bg-error/10",
  },
};

const statusConfig: Record<IncidentStatus, { icon: typeof Clock; color: string; label: string }> = {
  investigating: {
    icon: Clock,
    color: "text-warning",
    label: "Investigating",
  },
  identified: {
    icon: AlertCircle,
    color: "text-warning",
    label: "Identified",
  },
  monitoring: {
    icon: Info,
    color: "text-info",
    label: "Monitoring",
  },
  resolved: {
    icon: CheckCircle,
    color: "text-success",
    label: "Resolved",
  },
};

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return formatDate(date);
}

interface IncidentCardProps {
  incident: Incident;
  expanded?: boolean;
  className?: string;
}

export function IncidentCard({ incident, expanded = false, className }: IncidentCardProps) {
  const severity = severityConfig[incident.severity];
  const status = statusConfig[incident.status];
  const SeverityIcon = severity.icon;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        severity.bg,
        "border-border/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          <SeverityIcon className={cn("h-5 w-5 mt-0.5", severity.color)} />
          <div>
            <h3 className="font-semibold">{incident.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{formatRelativeTime(incident.startedAt)}</span>
              <span className="text-border">|</span>
              <span className={cn("flex items-center gap-1", status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {incident.message && (
        <p className="text-sm text-muted-foreground mb-3 pl-8">{incident.message}</p>
      )}

      {/* Updates Timeline */}
      {expanded && incident.updates && incident.updates.length > 0 && (
        <div className="mt-4 pl-8 border-l-2 border-border/50 ml-2 space-y-3">
          {incident.updates.map((update) => {
            const updateStatus = statusConfig[update.status];
            const UpdateIcon = updateStatus.icon;

            return (
              <div key={update.id} className="relative pl-4">
                <div
                  className={cn(
                    "absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background",
                    updateStatus.color.replace("text-", "bg-")
                  )}
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("font-medium", updateStatus.color)}>
                      {updateStatus.label}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(update.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{update.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function IncidentTimeline({ incidents, maxItems = 5, showEmpty = true, className }: IncidentTimelineProps) {
  const displayedIncidents = incidents.slice(0, maxItems);

  if (incidents.length === 0 && showEmpty) {
    return (
      <div className={cn("text-center py-8", className)}>
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
        <h3 className="font-medium text-lg mb-1">No active incidents</h3>
        <p className="text-sm text-muted-foreground">
          All systems are operating normally
        </p>
      </div>
    );
  }

  if (incidents.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-warning" />
        Active Incidents
      </h2>
      <div className="space-y-3">
        {displayedIncidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} expanded />
        ))}
      </div>
      {incidents.length > maxItems && (
        <p className="text-sm text-muted-foreground text-center">
          And {incidents.length - maxItems} more incident{incidents.length - maxItems !== 1 ? "s" : ""}...
        </p>
      )}
    </div>
  );
}
