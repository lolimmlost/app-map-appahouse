import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Settings } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { updateWidget } from "@/lib/server/widgets.server";
import type { Widget, WidgetConfig } from "@/types/database";

interface ClockWidgetProps {
  widget: Widget & { config: WidgetConfig };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: "small" | "medium" | "large" | "full") => void;
}

const TIMEZONES = [
  { value: "", label: "Local Time" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
];

const DATE_FORMATS = [
  { value: "full", label: "Full (Monday, January 1, 2025)" },
  { value: "long", label: "Long (January 1, 2025)" },
  { value: "medium", label: "Medium (Jan 1, 2025)" },
  { value: "short", label: "Short (1/1/25)" },
  { value: "none", label: "Hide Date" },
];

export function ClockWidget({ widget, onEdit, onDelete, onResize }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const title = config.title || "Clock";
  const showSeconds = config.showSeconds ?? true;
  const format24h = config.format24h ?? false;
  const timezone = config.timezone || "";
  const dateFormat = config.dateFormat || "full";

  // Settings form state
  const [formTitle, setFormTitle] = useState(title);
  const [formShowSeconds, setFormShowSeconds] = useState(showSeconds);
  const [formFormat24h, setFormFormat24h] = useState(format24h);
  const [formTimezone, setFormTimezone] = useState(timezone);
  const [formDateFormat, setFormDateFormat] = useState(dateFormat);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset form when opening settings
  useEffect(() => {
    if (settingsOpen) {
      setFormTitle(title);
      setFormShowSeconds(showSeconds);
      setFormFormat24h(format24h);
      setFormTimezone(timezone);
      setFormDateFormat(dateFormat);
    }
  }, [settingsOpen, title, showSeconds, format24h, timezone, dateFormat]);

  const updateMutation = useMutation({
    mutationFn: (newConfig: WidgetConfig) =>
      updateWidget({
        data: {
          id: widget.id,
          config: newConfig,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      showSeconds: formShowSeconds,
      format24h: formFormat24h,
      timezone: formTimezone,
      dateFormat: formDateFormat,
    });
  };

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: showSeconds ? "2-digit" : undefined,
      hour12: !format24h,
      timeZone: timezone || undefined,
    };
    return date.toLocaleTimeString(undefined, options);
  };

  const formatDate = (date: Date) => {
    if (dateFormat === "none") return null;

    const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
      full: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
      long: { year: "numeric", month: "long", day: "numeric" },
      medium: { year: "numeric", month: "short", day: "numeric" },
      short: { year: "2-digit", month: "numeric", day: "numeric" },
    };

    const options: Intl.DateTimeFormatOptions = {
      ...formatMap[dateFormat] || formatMap.full,
      timeZone: timezone || undefined,
    };
    return date.toLocaleDateString(undefined, options);
  };

  const formattedDate = formatDate(time);

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={title}
        icon={<Clock className="h-4 w-4" />}
        onEdit={onEdit}
        onDelete={onDelete}
        onResize={onResize}
        headerActions={
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-3 w-3" />
          </Button>
        }
      >
        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-4xl font-bold tabular-nums tracking-tight">
            {formatTime(time)}
          </div>
          {formattedDate && (
            <div className="text-sm text-muted-foreground mt-2">
              {formattedDate}
            </div>
          )}
          {timezone && (
            <div className="text-xs text-muted-foreground mt-1">
              {TIMEZONES.find(tz => tz.value === timezone)?.label || timezone}
            </div>
          )}
        </div>
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock Settings</DialogTitle>
            <DialogDescription>
              Customize how the clock is displayed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="clock-title">Title</Label>
              <Input
                id="clock-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Clock"
              />
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="clock-timezone">Timezone</Label>
              <Select value={formTimezone} onValueChange={setFormTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value || "local"}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-2">
              <Label htmlFor="clock-date-format">Date Format</Label>
              <Select value={formDateFormat} onValueChange={setFormDateFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((df) => (
                    <SelectItem key={df.value} value={df.value}>
                      {df.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Format */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="clock-24h">24-Hour Format</Label>
                <p className="text-sm text-muted-foreground">
                  Use 24-hour time (14:00 vs 2:00 PM)
                </p>
              </div>
              <Switch
                id="clock-24h"
                checked={formFormat24h}
                onCheckedChange={setFormFormat24h}
              />
            </div>

            {/* Show Seconds */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="clock-seconds">Show Seconds</Label>
                <p className="text-sm text-muted-foreground">
                  Display seconds in the time
                </p>
              </div>
              <Switch
                id="clock-seconds"
                checked={formShowSeconds}
                onCheckedChange={setFormShowSeconds}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
