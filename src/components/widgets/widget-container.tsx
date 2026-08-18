import { ReactNode } from "react";
import { MoreVertical, Pencil, Trash2, RefreshCw, Maximize2, Square, RectangleHorizontal, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Widget, WidgetConfig } from "@/types/database";

type WidgetSize = "small" | "medium" | "large" | "full";

interface WidgetContainerProps {
  widget: Widget;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: WidgetSize) => void;
  headerActions?: ReactNode;
  className?: string;
}

const SIZE_OPTIONS: { value: WidgetSize; label: string; icon: typeof Square }[] = [
  { value: "small", label: "Small (1 col)", icon: Square },
  { value: "medium", label: "Medium (2 col)", icon: RectangleHorizontal },
  { value: "large", label: "Large (3 col)", icon: Rows3 },
  { value: "full", label: "Full Width", icon: Maximize2 },
];

export function WidgetContainer({
  widget,
  title,
  icon,
  children,
  isLoading,
  onRefresh,
  onEdit,
  onDelete,
  onResize,
  headerActions,
  className,
}: WidgetContainerProps) {
  const currentSize = (widget.config as WidgetConfig)?.size || "small";

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card card-elevation",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground [&>svg]:h-3.5 [&>svg]:w-3.5">
            {icon}
            <span className="panel-label truncate">{title}</span>
          </div>
          <div className="flex items-center gap-0.5 text-xs">
            {headerActions}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
              </Button>
            )}
            {(onEdit || onDelete || onResize) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onResize && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Maximize2 className="mr-2 h-4 w-4" />
                          Size
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {SIZE_OPTIONS.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() => onResize(widget, option.value)}
                              className={cn(currentSize === option.value && "bg-accent")}
                            >
                              <option.icon className="mr-2 h-4 w-4" />
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(widget)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(widget)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 p-3">
        {children}
      </div>
    </div>
  );
}
