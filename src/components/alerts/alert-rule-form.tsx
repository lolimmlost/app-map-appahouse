import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AlertRule, AlertConditions, AlertChannels } from "@/types/database";
import type { App } from "@/types/database";
import type { Integration } from "@/types/database";

export type AlertRuleFormData = {
  name: string;
  description: string;
  enabled: boolean;
  triggerType: "status_change" | "consecutive_failures" | "response_time" | "integration_status";
  appId: string | null;
  integrationId: string | null;
  conditions: AlertConditions;
  severity: "info" | "warning" | "critical";
  channels: AlertChannels;
  cooldownMinutes: number;
};

interface AlertRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AlertRuleFormData) => void;
  alertRule?: AlertRule | null;
  apps: App[];
  integrations: Integration[];
  isLoading?: boolean;
}

const initialFormData: AlertRuleFormData = {
  name: "",
  description: "",
  enabled: true,
  triggerType: "status_change",
  appId: null,
  integrationId: null,
  conditions: {},
  severity: "warning",
  channels: { inApp: true },
  cooldownMinutes: 15,
};

const COOLDOWN_OPTIONS = [
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 360, label: "6 hours" },
  { value: 1440, label: "24 hours" },
];

const FAILURE_THRESHOLD_OPTIONS = [
  { value: 2, label: "2 failures" },
  { value: 3, label: "3 failures" },
  { value: 5, label: "5 failures" },
  { value: 10, label: "10 failures" },
];

const RESPONSE_TIME_OPTIONS = [
  { value: 1000, label: "1 second" },
  { value: 2000, label: "2 seconds" },
  { value: 5000, label: "5 seconds" },
  { value: 10000, label: "10 seconds" },
  { value: 30000, label: "30 seconds" },
];

export function AlertRuleForm({
  open,
  onOpenChange,
  onSubmit,
  alertRule,
  apps,
  integrations,
  isLoading = false,
}: AlertRuleFormProps) {
  const [formData, setFormData] = useState<AlertRuleFormData>(initialFormData);
  const isEditing = !!alertRule;

  useEffect(() => {
    if (alertRule) {
      setFormData({
        name: alertRule.name,
        description: alertRule.description ?? "",
        enabled: alertRule.enabled ?? true,
        triggerType: alertRule.triggerType,
        appId: alertRule.appId,
        integrationId: alertRule.integrationId,
        conditions: (alertRule.conditions as AlertConditions) ?? {},
        severity: alertRule.severity ?? "warning",
        channels: (alertRule.channels as AlertChannels) ?? { inApp: true },
        cooldownMinutes: alertRule.cooldownMinutes ?? 15,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [alertRule, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateConditions = (updates: Partial<AlertConditions>) => {
    setFormData((prev) => ({
      ...prev,
      conditions: { ...prev.conditions, ...updates },
    }));
  };

  const updateChannels = (updates: Partial<AlertChannels>) => {
    setFormData((prev) => ({
      ...prev,
      channels: { ...prev.channels, ...updates },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Alert Rule" : "Create Alert Rule"}</DialogTitle>
          <DialogDescription>
            Configure an alert rule to get notified about app status changes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Critical App Down Alert"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this alert is for..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Trigger Conditions</h3>

            <div className="grid gap-2">
              <Label htmlFor="triggerType">Trigger Type *</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value: AlertRuleFormData["triggerType"]) => {
                  setFormData({ ...formData, triggerType: value, conditions: {} });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status_change">Status Change</SelectItem>
                  <SelectItem value="consecutive_failures">Consecutive Failures</SelectItem>
                  <SelectItem value="response_time">Response Time Threshold</SelectItem>
                  <SelectItem value="integration_status">Integration Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Selection */}
            {formData.triggerType !== "integration_status" ? (
              <div className="grid gap-2">
                <Label htmlFor="appId">Target App (leave empty for all apps)</Label>
                <Select
                  value={formData.appId ?? "all"}
                  onValueChange={(value) => {
                    setFormData({ ...formData, appId: value === "all" ? null : value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select app" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Apps</SelectItem>
                    {apps.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="integrationId">Target Integration (leave empty for all)</Label>
                <Select
                  value={formData.integrationId ?? "all"}
                  onValueChange={(value) => {
                    setFormData({ ...formData, integrationId: value === "all" ? null : value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Integrations</SelectItem>
                    {integrations.map((integration) => (
                      <SelectItem key={integration.id} value={integration.id}>
                        {integration.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Trigger-specific conditions */}
            {formData.triggerType === "status_change" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>From Status</Label>
                  <Select
                    value={formData.conditions.fromStatus ?? "any"}
                    onValueChange={(value) => {
                      updateConditions({
                        fromStatus: value === "any" ? undefined : (value as "online" | "offline" | "unknown"),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>To Status</Label>
                  <Select
                    value={formData.conditions.toStatus ?? "any"}
                    onValueChange={(value) => {
                      updateConditions({
                        toStatus: value === "any" ? undefined : (value as "online" | "offline" | "unknown"),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {formData.triggerType === "consecutive_failures" && (
              <div className="grid gap-2">
                <Label>Failure Threshold</Label>
                <Select
                  value={String(formData.conditions.failureThreshold ?? 3)}
                  onValueChange={(value) => {
                    updateConditions({ failureThreshold: Number(value) });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAILURE_THRESHOLD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Alert will trigger after this many consecutive health check failures.
                </p>
              </div>
            )}

            {formData.triggerType === "response_time" && (
              <div className="grid gap-2">
                <Label>Response Time Threshold</Label>
                <Select
                  value={String(formData.conditions.responseTimeThreshold ?? 5000)}
                  onValueChange={(value) => {
                    updateConditions({ responseTimeThreshold: Number(value) });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Alert will trigger when response time exceeds this threshold.
                </p>
              </div>
            )}
          </div>

          {/* Severity */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Alert Settings</h3>

            <div className="grid gap-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: "info" | "warning" | "critical") => {
                  setFormData({ ...formData, severity: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cooldown">Cooldown Period</Label>
              <Select
                value={String(formData.cooldownMinutes)}
                onValueChange={(value) => {
                  setFormData({ ...formData, cooldownMinutes: Number(value) });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cooldown" />
                </SelectTrigger>
                <SelectContent>
                  {COOLDOWN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Time to wait before sending another notification for the same alert.
              </p>
            </div>
          </div>

          {/* Notification Channels */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Notification Channels</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="inApp"
                  checked={formData.channels.inApp ?? true}
                  onCheckedChange={(checked) => updateChannels({ inApp: checked })}
                />
                <Label htmlFor="inApp">In-App Notifications</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="email"
                  checked={formData.channels.email ?? false}
                  onCheckedChange={(checked) => updateChannels({ email: checked })}
                />
                <Label htmlFor="email">Email</Label>
                <span className="text-xs text-muted-foreground">
                  (Configure in notification preferences)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="webhook"
                  checked={formData.channels.webhook ?? false}
                  onCheckedChange={(checked) => updateChannels({ webhook: checked })}
                />
                <Label htmlFor="webhook">Webhook</Label>
                <span className="text-xs text-muted-foreground">
                  (Configure in notification preferences)
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? "Saving..." : isEditing ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
