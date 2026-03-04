import { useState } from "react";
import { Link, Copy, ExternalLink, MoreVertical, Pencil, Trash2, RefreshCw, Eye, EyeOff, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { StatusPage } from "@/database/schema/status-pages";

interface StatusPageCardProps {
  statusPage: StatusPage & {
    apps?: Array<{ id: string; appId: string; app: { name: string; icon?: string | null } }>;
  };
  onEdit: (statusPage: StatusPage) => void;
  onDelete: (id: string) => void;
  onRegenerateToken: (id: string) => void;
}

export function StatusPageCard({
  statusPage,
  onEdit,
  onDelete,
  onRegenerateToken,
}: StatusPageCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);

  const publicUrl = `/status/${statusPage.slug}`;
  const tokenUrl = `/status/${statusPage.slug}?token=${statusPage.accessToken}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(window.location.origin + text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRegenerateToken = () => {
    setShowTokenDialog(false);
    onRegenerateToken(statusPage.id);
  };

  return (
    <>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {statusPage.title}
                {statusPage.password && (
                  <Lock className="h-4 w-4 text-muted-foreground" title="Password protected" />
                )}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <span>/status/{statusPage.slug}</span>
                <Badge variant={statusPage.isPublic ? "default" : "secondary"} className="text-xs">
                  {statusPage.isPublic ? "Public" : "Private"}
                </Badge>
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(publicUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Status Page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(publicUrl, "Public URL")}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Public URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(tokenUrl, "Token URL")}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Token URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(statusPage)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowTokenDialog(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Token
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          {statusPage.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {statusPage.description}
            </p>
          )}

          {statusPage.apps && statusPage.apps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {statusPage.apps.length} service{statusPage.apps.length !== 1 ? "s" : ""} monitored
              </p>
              <div className="flex -space-x-2">
                {statusPage.apps.slice(0, 5).map((spa) => (
                  <div
                    key={spa.id}
                    className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden"
                    title={spa.app.name}
                  >
                    {spa.app.icon ? (
                      <img src={spa.app.icon} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium">{spa.app.name[0]}</span>
                    )}
                  </div>
                ))}
                {statusPage.apps.length > 5 && (
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">+{statusPage.apps.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(publicUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(statusPage)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status Page?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{statusPage.title}"? This action cannot be undone.
              The public URL will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(statusPage.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Token Confirmation Dialog */}
      <AlertDialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Access Token?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the current token URL. Anyone using the old token URL will no
              longer be able to access this status page. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateToken}>
              Regenerate Token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
