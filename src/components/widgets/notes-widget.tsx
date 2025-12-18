import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote, Pencil, Check, X } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateWidget } from "@/lib/server/widgets";
import type { Widget, WidgetConfig } from "@/database/schema/widgets";

interface NotesWidgetProps {
  widget: Widget & { config: WidgetConfig };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
}

export function NotesWidget({ widget, onEdit, onDelete }: NotesWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(widget.config?.content || "");
  const queryClient = useQueryClient();

  const config = widget.config || {};

  const updateMutation = useMutation({
    mutationFn: (newContent: string) =>
      updateWidget({
        data: {
          id: widget.id,
          config: { ...config, content: newContent },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(content);
  };

  const handleCancel = () => {
    setContent(config.content || "");
    setIsEditing(false);
  };

  return (
    <WidgetContainer
      widget={widget}
      title={config.title || "Notes"}
      icon={<StickyNote className="h-4 w-4" />}
      onEdit={onEdit}
      onDelete={onDelete}
      headerActions={
        !isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      }
    >
      <div className="p-2 h-full">
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full min-h-[120px] resize-none text-sm"
            placeholder="Write your notes here..."
            autoFocus
          />
        ) : (
          <div className="text-sm whitespace-pre-wrap text-muted-foreground h-full overflow-auto">
            {config.content || (
              <span className="italic">Click the pencil to add notes...</span>
            )}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
