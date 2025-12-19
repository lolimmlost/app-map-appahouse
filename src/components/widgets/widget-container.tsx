import { ReactNode } from "react";
import { MoreVertical, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Widget } from "@/database/schema/widgets";

interface WidgetContainerProps {
  widget: Widget;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  headerActions?: ReactNode;
  className?: string;
}

export function WidgetContainer({
  widget,
  title,
  icon,
  children,
  isLoading,
  onRefresh,
  onEdit,
  onDelete,
  headerActions,
  className,
}: WidgetContainerProps) {
  return (
    <Card className={cn("group relative h-full", className)}>
      {title && (
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
