import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { App } from "@/database/schema/apps";

interface AppNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: App | null;
}

export function AppNotesDialog({ open, onOpenChange, app }: AppNotesDialogProps) {
  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {app.icon && (
              app.icon.startsWith("http") ? (
                <img src={app.icon} alt="" className="h-6 w-6 object-contain" />
              ) : (
                <span>{app.icon}</span>
              )
            )}
            {app.name} - Notes
          </DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {app.notes ? (
            <div className="whitespace-pre-wrap">{app.notes}</div>
          ) : (
            <p className="text-muted-foreground">No notes for this app.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
