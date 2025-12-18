import { ExternalLink, Bookmark } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Button } from "@/components/ui/button";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";

interface BookmarksWidgetProps {
  widget: Widget & { config: WidgetConfig };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
}

export function BookmarksWidget({ widget, onEdit, onDelete }: BookmarksWidgetProps) {
  const config = widget.config || {};
  const bookmarks = config.bookmarks || [];

  const handleOpen = (url: string) => {
    const normalizedUrl = url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `http://${url}`;
    window.open(normalizedUrl, "_blank");
  };

  return (
    <WidgetContainer
      widget={widget}
      title={config.title || "Bookmarks"}
      icon={<Bookmark className="h-4 w-4" />}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {bookmarks.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          No bookmarks configured
        </div>
      ) : (
        <div className="space-y-1.5">
          {bookmarks.map((bookmark, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-auto py-2 px-2"
              onClick={() => handleOpen(bookmark.url)}
            >
              <div className="flex items-center gap-2 min-w-0">
                {bookmark.icon ? (
                  bookmark.icon.startsWith("http") ? (
                    <img
                      src={bookmark.icon}
                      alt=""
                      className="h-4 w-4 object-contain flex-shrink-0"
                    />
                  ) : (
                    <span className="text-sm flex-shrink-0">{bookmark.icon}</span>
                  )
                ) : (
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{bookmark.name}</span>
              </div>
            </Button>
          ))}
        </div>
      )}
    </WidgetContainer>
  );
}
