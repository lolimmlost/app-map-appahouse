import { ReactNode } from "react";
import { MoreVertical, Pencil, Trash2, RefreshCw, Maximize2, Square, RectangleHorizontal, Rows3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={cn("group relative h-full", className)}>
      {title && (
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="panel-label">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {headerActions}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-4")}>
        {children}
      </CardContent>
    </Card>
  );
}
