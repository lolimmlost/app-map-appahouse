import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Webhook,
  Volume2,
  Moon,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  useNotificationPreferences,
  useNotificationPreferencesMutation,
  useTestWebhook,
} from "@/hooks/use-alerts";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

const DIGEST_FREQUENCIES = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export function NotificationPreferencesForm() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useNotificationPreferencesMutation({
    onSuccess: () => {
      toast.success("Preferences saved");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save preferences");
    },
  });
  const testWebhookMutation = useTestWebhook();

  const [formData, setFormData] = useState({
    globalEnabled: true,
    emailEnabled: false,
    emailAddress: "",
    webhookEnabled: false,
    webhookUrl: "",
    webhookSecret: "",
    inAppEnabled: true,
    inAppSound: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    timezone: "UTC",
    digestEnabled: false,
    digestFrequency: "daily",
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        globalEnabled: preferences.globalEnabled ?? true,
        emailEnabled: preferences.emailEnabled ?? false,
        emailAddress: preferences.emailAddress ?? "",
        webhookEnabled: preferences.webhookEnabled ?? false,
        webhookUrl: preferences.webhookUrl ?? "",
        webhookSecret: preferences.webhookSecret ?? "",
        inAppEnabled: preferences.inAppEnabled ?? true,
        inAppSound: preferences.inAppSound ?? true,
        quietHoursEnabled: preferences.quietHoursEnabled ?? false,
        quietHoursStart: preferences.quietHoursStart ?? "22:00",
        quietHoursEnd: preferences.quietHoursEnd ?? "07:00",
        timezone: preferences.timezone ?? "UTC",
        digestEnabled: preferences.digestEnabled ?? false,
        digestFrequency: preferences.digestFrequency ?? "daily",
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleTestWebhook = () => {
    if (!formData.webhookUrl) return;

    testWebhookMutation.mutate({
      webhookUrl: formData.webhookUrl,
      webhookSecret: formData.webhookSecret || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Control all notifications globally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="globalEnabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Turn off to disable all notifications
              </p>
            </div>
            <Switch
              id="globalEnabled"
              checked={formData.globalEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, globalEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App Notifications
          </CardTitle>
          <CardDescription>
            Notifications displayed within the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="inAppEnabled">Enable In-App Notifications</Label>
            </div>
            <Switch
              id="inAppEnabled"
              checked={formData.inAppEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, inAppEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="inAppSound" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Sound
              </Label>
              <p className="text-sm text-muted-foreground">
                Play a sound when notifications arrive
              </p>
            </div>
            <Switch
              id="inAppSound"
              checked={formData.inAppSound}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, inAppSound: checked })
              }
              disabled={!formData.inAppEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive alerts via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailEnabled">Enable Email Notifications</Label>
            <Switch
              id="emailEnabled"
              checked={formData.emailEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, emailEnabled: checked })
              }
            />
          </div>

          {formData.emailEnabled && (
            <div className="grid gap-2">
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input
                id="emailAddress"
                type="email"
                placeholder="your@email.com"
                value={formData.emailAddress}
                onChange={(e) =>
                  setFormData({ ...formData, emailAddress: e.target.value })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Notifications
          </CardTitle>
          <CardDescription>
            Send alerts to a custom endpoint (Slack, Discord, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhookEnabled">Enable Webhook Notifications</Label>
            <Switch
              id="webhookEnabled"
              checked={formData.webhookEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, webhookEnabled: checked })
              }
            />
          </div>

          {formData.webhookEnabled && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={formData.webhookUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, webhookUrl: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="webhookSecret">Webhook Secret (optional)</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  placeholder="Secret for signing payloads"
                  value={formData.webhookSecret}
                  onChange={(e) =>
                    setFormData({ ...formData, webhookSecret: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  If provided, requests will include an X-AppMap-Signature header
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestWebhook}
                  disabled={!formData.webhookUrl || testWebhookMutation.isPending}
                >
                  {testWebhookMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Webhook"
                  )}
                </Button>

                {testWebhookMutation.data && (
                  <span
                    className={`flex items-center gap-1 text-sm ${
                      testWebhookMutation.data.success ? "text-success" : "text-error"
                    }`}
                  >
                    {testWebhookMutation.data.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testWebhookMutation.data.message}
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quietHoursEnabled">Enable Quiet Hours</Label>
            <Switch
              id="quietHoursEnabled"
              checked={formData.quietHoursEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, quietHoursEnabled: checked })
              }
            />
          </div>

          {formData.quietHoursEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quietHoursStart">Start Time</Label>
                  <Input
                    id="quietHoursStart"
                    type="time"
                    value={formData.quietHoursStart}
                    onChange={(e) =>
                      setFormData({ ...formData, quietHoursStart: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quietHoursEnd">End Time</Label>
                  <Input
                    id="quietHoursEnd"
                    type="time"
                    value={formData.quietHoursEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, quietHoursEnd: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Digest Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Notification Digest
          </CardTitle>
          <CardDescription>
            Batch notifications into periodic summaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="digestEnabled">Enable Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary instead of individual notifications
              </p>
            </div>
            <Switch
              id="digestEnabled"
              checked={formData.digestEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, digestEnabled: checked })
              }
            />
          </div>

          {formData.digestEnabled && (
            <div className="grid gap-2">
              <Label htmlFor="digestFrequency">Frequency</Label>
              <Select
                value={formData.digestFrequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, digestFrequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {DIGEST_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
