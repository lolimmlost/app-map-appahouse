import {
  Bell,
  MoreHorizontal,
  Pencil,
  Trash2,
  Activity,
  Clock,
  AlertTriangle,
  Zap,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AlertRule } from "@/types/database";
import type { App } from "@/types/database";
import type { Integration } from "@/types/database";

interface AlertRuleCardProps {
  alertRule: AlertRule & {
    app?: App | null;
    integration?: Integration | null;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}

const triggerTypeIcons = {
  status_change: Activity,
  consecutive_failures: AlertTriangle,
  response_time: Clock,
  integration_status: Server,
};

const triggerTypeLabels = {
  status_change: "Status Change",
  consecutive_failures: "Consecutive Failures",
  response_time: "Response Time",
  integration_status: "Integration Status",
};

const severityColors = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function AlertRuleCard({ alertRule, onEdit, onDelete, onToggle }: AlertRuleCardProps) {
  const TriggerIcon = triggerTypeIcons[alertRule.triggerType];
  const channels = (alertRule.channels as { email?: boolean; webhook?: boolean; inApp?: boolean }) ?? {};
  const conditions = (alertRule.conditions as {
    fromStatus?: string;
    toStatus?: string;
    failureThreshold?: number;
    responseTimeThreshold?: number;
  }) ?? {};

  const getConditionDescription = () => {
    switch (alertRule.triggerType) {
      case "status_change":
        const from = conditions.fromStatus ?? "any";
        const to = conditions.toStatus ?? "any";
        if (from === "any" && to === "any") {
          return "Any status change involving offline";
        }
        return `${from} → ${to}`;

      case "consecutive_failures":
        return `After ${conditions.failureThreshold ?? 3} consecutive failures`;

      case "response_time":
        const threshold = conditions.responseTimeThreshold ?? 5000;
        return `Response time > ${threshold >= 1000 ? `${threshold / 1000}s` : `${threshold}ms`}`;

      case "integration_status":
        return "Integration connection change";

      default:
        return "";
    }
  };

  const getTargetName = () => {
    if (alertRule.app) {
      return alertRule.app.name;
    }
    if (alertRule.integration) {
      return alertRule.integration.name;
    }
    return alertRule.triggerType === "integration_status" ? "All Integrations" : "All Apps";
  };

  return (
    <Card className={alertRule.enabled ? "" : "opacity-60"}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${severityColors[alertRule.severity ?? "warning"]}`}>
              <TriggerIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium leading-none">{alertRule.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {getTargetName()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={alertRule.enabled ?? true}
              onCheckedChange={onToggle}
              aria-label={alertRule.enabled ? "Disable alert" : "Enable alert"}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {alertRule.description && (
          <p className="text-sm text-muted-foreground mb-3">{alertRule.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {triggerTypeLabels[alertRule.triggerType]}
          </Badge>

          <Badge variant="outline" className="text-xs">
            {getConditionDescription()}
          </Badge>

          <Badge
            variant="outline"
            className={`text-xs ${severityColors[alertRule.severity ?? "warning"]}`}
          >
            {alertRule.severity ?? "warning"}
          </Badge>

          {alertRule.cooldownMinutes && (
            <Badge variant="outline" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {alertRule.cooldownMinutes}m cooldown
            </Badge>
          )}
        </div>

        {/* Notification channels */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">Channels:</span>
          {channels.inApp && (
            <Badge variant="secondary" className="text-xs">
              <Bell className="mr-1 h-3 w-3" />
              In-App
            </Badge>
          )}
          {channels.email && (
            <Badge variant="secondary" className="text-xs">
              Email
            </Badge>
          )}
          {channels.webhook && (
            <Badge variant="secondary" className="text-xs">
              <Zap className="mr-1 h-3 w-3" />
              Webhook
            </Badge>
          )}
          {!channels.inApp && !channels.email && !channels.webhook && (
            <span className="text-xs text-muted-foreground">None configured</span>
          )}
        </div>

        {alertRule.lastTriggeredAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Last triggered: {new Date(alertRule.lastTriggeredAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
