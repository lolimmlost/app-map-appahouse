import { ExternalLink } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";

interface IframeWidgetProps {
  widget: Widget & { config: WidgetConfig };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
}

export function IframeWidget({ widget, onEdit, onDelete }: IframeWidgetProps) {
  const config = widget.config || {};
  const url = config.url || "";

  const normalizedUrl = url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `http://${url}`;

  return (
    <WidgetContainer
      widget={widget}
      title={config.title || "Embed"}
      icon={<ExternalLink className="h-4 w-4" />}
      onEdit={onEdit}
      onDelete={onDelete}
      className="overflow-hidden"
    >
      {!url ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          No URL configured
        </div>
      ) : (
        <div className="-mx-6 -mb-6 mt-2">
          <iframe
            src={normalizedUrl}
            className="w-full h-48 border-0"
            title={config.title || "Embedded content"}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </WidgetContainer>
  );
}
