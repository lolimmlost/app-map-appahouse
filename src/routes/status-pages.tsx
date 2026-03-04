import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, BarChart3, RefreshCw } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusPageForm, StatusPageCard } from "@/components/status-page";
import {
  getStatusPages,
  createStatusPage,
  updateStatusPage,
  deleteStatusPage,
  regenerateAccessToken,
} from "@/lib/server/status-pages.server";
import type { StatusPage } from "@/database/schema/status-pages";

export const Route = createFileRoute("/status-pages")({
  component: StatusPagesPage,
});

function StatusPagesPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StatusPage | null>(null);

  // Fetch status pages
  const {
    data: pagesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["status-pages"],
    queryFn: () => getStatusPages(),
    enabled: !!session?.user,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createStatusPage>[0]["data"]) =>
      createStatusPage({ data }),
    onSuccess: () => {
      toast.success("Status page created successfully");
      queryClient.invalidateQueries({ queryKey: ["status-pages"] });
      setFormOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create status page");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateStatusPage>[0]["data"]) =>
      updateStatusPage({ data }),
    onSuccess: () => {
      toast.success("Status page updated successfully");
      queryClient.invalidateQueries({ queryKey: ["status-pages"] });
      setFormOpen(false);
      setEditingPage(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status page");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStatusPage({ data: { id } }),
    onSuccess: () => {
      toast.success("Status page deleted");
      queryClient.invalidateQueries({ queryKey: ["status-pages"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete status page");
    },
  });

  // Regenerate token mutation
  const regenerateTokenMutation = useMutation({
    mutationFn: (id: string) => regenerateAccessToken({ data: { id } }),
    onSuccess: (data) => {
      toast.success("Access token regenerated. New token URL copied to clipboard.");
      queryClient.invalidateQueries({ queryKey: ["status-pages"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate token");
    },
  });

  const handleSubmit = (data: any) => {
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (statusPage: StatusPage) => {
    setEditingPage(statusPage);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleRegenerateToken = (id: string) => {
    regenerateTokenMutation.mutate(id);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingPage(null);
    }
  };

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Status Pages</h1>
          <p className="text-muted-foreground mb-6">
            Create public status pages for your services
          </p>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your status pages
          </p>
        </div>
      </main>
    );
  }

  const statusPages = pagesData?.statusPages ?? [];

  return (
    <main className="container mx-auto flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Status Pages</h1>
          <p className="text-muted-foreground">
            Create and manage public status pages for your services
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Status Page
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : statusPages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No status pages yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first public status page to share the health status of your services with
            others. Choose which apps to display and customize the appearance.
          </p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Status Page
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statusPages.map((page) => (
            <StatusPageCard
              key={page.id}
              statusPage={page as any}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRegenerateToken={handleRegenerateToken}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <StatusPageForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmit}
        statusPage={editingPage}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </main>
  );
}
