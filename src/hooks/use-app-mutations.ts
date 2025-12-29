import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createApp,
  updateApp,
  deleteApp,
  pinApp,
  updateAppOrder,
  bulkDeleteApps,
  bulkUpdateCategory,
  bulkToggleHealthCheck,
  bulkExportApps,
  bulkUpdateTags,
} from "@/lib/server/apps.server";
import type { AppFormData } from "@/components/apps";

type UseAppMutationsOptions = {
  /** Callback when form should be closed (after create/update) */
  onFormClose?: () => void;
  /** Callback when editing app should be cleared (after update) */
  onClearEditing?: () => void;
  /** Callback to clear selection state (after bulk operations) */
  onClearSelection?: () => void;
  /** Callback to exit selection mode (after bulk delete) */
  onExitSelectionMode?: () => void;
};

export function useAppMutations(options: UseAppMutationsOptions = {}) {
  const queryClient = useQueryClient();
  const { onFormClose, onClearEditing, onClearSelection, onExitSelectionMode } = options;

  // Helper to invalidate apps query
  const invalidateApps = () => {
    queryClient.invalidateQueries({ queryKey: ["apps"] });
  };

  // Create app mutation
  const createMutation = useMutation({
    mutationFn: (data: AppFormData) =>
      createApp({
        data: {
          name: data.name,
          description: data.description || null,
          icon: data.icon || null,
          localUrl: data.localUrl || null,
          remoteUrl: data.remoteUrl || null,
          categoryId: data.categoryId,
          tagIds: data.tagIds,
          healthCheckEnabled: data.healthCheckEnabled,
          healthCheckType: data.healthCheckType,
          healthCheckUrl: data.healthCheckUrl || null,
          healthCheckTTL: data.healthCheckTTL,
          uptimeKumaMonitorId: data.uptimeKumaMonitorId || null,
          notes: data.notes || null,
        },
      }),
    onSuccess: () => {
      invalidateApps();
      onFormClose?.();
    },
  });

  // Update app mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppFormData }) =>
      updateApp({
        data: {
          id,
          name: data.name,
          description: data.description || null,
          icon: data.icon || null,
          localUrl: data.localUrl || null,
          remoteUrl: data.remoteUrl || null,
          categoryId: data.categoryId,
          tagIds: data.tagIds,
          healthCheckEnabled: data.healthCheckEnabled,
          healthCheckType: data.healthCheckType,
          healthCheckUrl: data.healthCheckUrl || null,
          healthCheckTTL: data.healthCheckTTL,
          uptimeKumaMonitorId: data.uptimeKumaMonitorId || null,
          notes: data.notes || null,
        },
      }),
    onSuccess: () => {
      invalidateApps();
      onFormClose?.();
      onClearEditing?.();
    },
  });

  // Delete app mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApp({ data: { id } }),
    onSuccess: invalidateApps,
  });

  // Pin app mutation
  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      pinApp({ data: { id, pinned } }),
    onSuccess: invalidateApps,
  });

  // Reorder apps mutation
  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      updateAppOrder({ data: { orderedIds } }),
    onSuccess: invalidateApps,
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteApps({ data: { ids } }),
    onSuccess: () => {
      invalidateApps();
      onClearSelection?.();
      onExitSelectionMode?.();
    },
  });

  // Bulk update category mutation
  const bulkCategoryMutation = useMutation({
    mutationFn: (data: { ids: string[]; categoryId: string | null }) =>
      bulkUpdateCategory({ data }),
    onSuccess: () => {
      invalidateApps();
      onClearSelection?.();
    },
  });

  // Bulk toggle health check mutation
  const bulkHealthCheckMutation = useMutation({
    mutationFn: (data: { ids: string[]; enabled: boolean }) =>
      bulkToggleHealthCheck({ data }),
    onSuccess: () => {
      invalidateApps();
      onClearSelection?.();
    },
  });

  // Bulk export apps mutation
  const bulkExportMutation = useMutation({
    mutationFn: (ids: string[]) => bulkExportApps({ data: { ids } }),
    onSuccess: (result) => {
      // Download the JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `apps-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  // Bulk update tags mutation
  const bulkTagsMutation = useMutation({
    mutationFn: (data: { ids: string[]; tagIds: string[]; mode: "replace" | "append" }) =>
      bulkUpdateTags({ data }),
    onSuccess: () => {
      invalidateApps();
      onClearSelection?.();
    },
  });

  // Computed loading states
  const isFormLoading = createMutation.isPending || updateMutation.isPending;
  const isBulkLoading =
    bulkDeleteMutation.isPending ||
    bulkCategoryMutation.isPending ||
    bulkHealthCheckMutation.isPending ||
    bulkExportMutation.isPending ||
    bulkTagsMutation.isPending;

  return {
    // Primary mutations
    createMutation,
    updateMutation,
    deleteMutation,
    pinMutation,
    reorderMutation,
    // Bulk mutations
    bulkDeleteMutation,
    bulkCategoryMutation,
    bulkHealthCheckMutation,
    bulkExportMutation,
    bulkTagsMutation,
    // Loading states
    isFormLoading,
    isBulkLoading,
  };
}
