import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AlertHistory } from "@/types/database";

interface AlertHistoryListProps {
  alerts: AlertHistory[];
  isLoading: boolean;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onBulkResolve: (ids: string[]) => void;
  onClearOld: (daysToKeep?: number) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const statusColors = {
  active: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  acknowledged: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  silenced: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const severityColors = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  critical: "text-red-500",
};

export function AlertHistoryList({
  alerts,
  isLoading,
  onAcknowledge,
  onResolve,
  onBulkResolve,
  onClearOld,
  selectedStatus,
  onStatusChange,
}: AlertHistoryListProps) {
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAlerts(newSelected);
  };

  const selectAll = () => {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(alerts.map((a) => a.id)));
    }
  };

  const handleBulkResolve = () => {
    onBulkResolve(Array.from(selectedAlerts));
    setSelectedAlerts(new Set());
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const getNotificationStatus = (alert: AlertHistory) => {
    const notifications = alert.notificationsSent as {
      email?: { sent: boolean };
      webhook?: { sent: boolean };
      inApp?: { sent: boolean };
    } | null;

    if (!notifications) return null;

    const sent: string[] = [];
    if (notifications.email?.sent) sent.push("Email");
    if (notifications.webhook?.sent) sent.push("Webhook");
    if (notifications.inApp?.sent) sent.push("In-App");

    return sent.length > 0 ? sent.join(", ") : null;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Alert History</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            {selectedAlerts.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleBulkResolve}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolve Selected ({selectedAlerts.size})
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={selectAll}>
                  {selectedAlerts.size === alerts.length ? "Deselect All" : "Select All"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onClearOld(7)}>
                  Clear alerts older than 7 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onClearOld(30)}>
                  Clear alerts older than 30 days
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No alerts found</p>
            <p className="text-sm mt-1">Alerts will appear here when they are triggered</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const SeverityIcon = severityIcons[alert.severity];
              const isSelected = selectedAlerts.has(alert.id);

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isSelected ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(alert.id)}
                        className="rounded"
                      />
                      <SeverityIcon
                        className={`h-5 w-5 ${severityColors[alert.severity]}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium">{alert.alertName}</span>
                        <Badge
                          variant="outline"
                          className={statusColors[alert.status ?? "active"]}
                        >
                          {alert.status ?? "active"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {alert.appName || alert.integrationName || "Unknown"}:{" "}
                        {alert.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(alert.triggeredAt)}
                        </span>

                        {alert.resolvedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Resolved: {formatDate(alert.resolvedAt)}
                          </span>
                        )}

                        {getNotificationStatus(alert) && (
                          <span>Notified via: {getNotificationStatus(alert)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {alert.status === "active" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAcknowledge(alert.id)}
                            title="Acknowledge"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onResolve(alert.id)}
                            title="Resolve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {alert.status === "acknowledged" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResolve(alert.id)}
                          title="Resolve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
