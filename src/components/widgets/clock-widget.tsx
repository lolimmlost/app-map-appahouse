import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";

interface ClockWidgetProps {
  widget: Widget & { config: WidgetConfig };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
}

export function ClockWidget({ widget, onEdit, onDelete }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date());

  const config = widget.config || {};
  const showSeconds = config.showSeconds ?? true;
  const format24h = config.format24h ?? false;
  const timezone = config.timezone;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone || undefined,
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <WidgetContainer
      widget={widget}
      title={config.title || "Clock"}
      icon={<Clock className="h-4 w-4" />}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="flex flex-col items-center justify-center py-4">
        <div className="text-4xl font-bold tabular-nums tracking-tight">
          {formatTime(time)}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {formatDate(time)}
        </div>
        {timezone && (
          <div className="text-xs text-muted-foreground mt-1">
            {timezone}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
