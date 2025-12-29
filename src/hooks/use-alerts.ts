import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAlertRules,
  getAlertRule,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  getAlertHistory,
  acknowledgeAlert,
  resolveAlert,
  bulkResolveAlerts,
  clearOldAlertHistory,
  getNotificationPreferences,
  updateNotificationPreferences,
  testWebhook,
  getInAppNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  clearAllNotifications,
} from "@/lib/server/alerts.server";
import type { AlertConditions, AlertChannels } from "@/types/database";

// ============================================================================
// Alert Rules Hooks
// ============================================================================

/**
 * Hook for fetching all alert rules
 */
export function useAlertRules() {
  return useQuery({
    queryKey: ["alertRules"],
    queryFn: () => getAlertRules(),
    select: (data) => data.alertRules,
  });
}

/**
 * Hook for fetching a single alert rule
 */
export function useAlertRule(id: string) {
  return useQuery({
    queryKey: ["alertRules", id],
    queryFn: () => getAlertRule({ data: { id } }),
    select: (data) => data.alertRule,
    enabled: !!id,
  });
}

/**
 * Hook for alert rule mutations (create, update, delete, toggle)
 */
export function useAlertRuleMutations(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options ?? {};

  const invalidateAlertRules = () => {
    queryClient.invalidateQueries({ queryKey: ["alertRules"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string | null;
      enabled?: boolean;
      triggerType: "status_change" | "consecutive_failures" | "response_time" | "integration_status";
      appId?: string | null;
      integrationId?: string | null;
      conditions?: AlertConditions;
      severity?: "info" | "warning" | "critical";
      channels?: AlertChannels;
      cooldownMinutes?: number;
    }) => createAlertRule({ data }),
    onSuccess: () => {
      invalidateAlertRules();
      onSuccess?.();
    },
    onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateAlertRule({ data: { id, data } }),
    onSuccess: () => {
      invalidateAlertRules();
      onSuccess?.();
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAlertRule({ data: { id } }),
    onSuccess: () => {
      invalidateAlertRules();
      onSuccess?.();
    },
    onError,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      toggleAlertRule({ data: { id, enabled } }),
    onSuccess: () => {
      invalidateAlertRules();
      onSuccess?.();
    },
    onError,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleMutation,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      toggleMutation.isPending,
  };
}

// ============================================================================
// Alert History Hooks
// ============================================================================

/**
 * Hook for fetching alert history
 */
export function useAlertHistory(options?: {
  limit?: number;
  status?: string;
  appId?: string;
}) {
  return useQuery({
    queryKey: ["alertHistory", options],
    queryFn: () => getAlertHistory({ data: options }),
    select: (data) => ({
      alerts: data.alertHistory,
      total: data.total,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook for alert history mutations (acknowledge, resolve)
 */
export function useAlertHistoryMutations(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options ?? {};

  const invalidateAlertHistory = () => {
    queryClient.invalidateQueries({ queryKey: ["alertHistory"] });
  };

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => acknowledgeAlert({ data: { id } }),
    onSuccess: () => {
      invalidateAlertHistory();
      onSuccess?.();
    },
    onError,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveAlert({ data: { id } }),
    onSuccess: () => {
      invalidateAlertHistory();
      onSuccess?.();
    },
    onError,
  });

  const bulkResolveMutation = useMutation({
    mutationFn: (ids: string[]) => bulkResolveAlerts({ data: { ids } }),
    onSuccess: () => {
      invalidateAlertHistory();
      onSuccess?.();
    },
    onError,
  });

  const clearOldMutation = useMutation({
    mutationFn: (daysToKeep?: number) => clearOldAlertHistory({ data: { daysToKeep } }),
    onSuccess: () => {
      invalidateAlertHistory();
      onSuccess?.();
    },
    onError,
  });

  return {
    acknowledgeMutation,
    resolveMutation,
    bulkResolveMutation,
    clearOldMutation,
    isLoading:
      acknowledgeMutation.isPending ||
      resolveMutation.isPending ||
      bulkResolveMutation.isPending ||
      clearOldMutation.isPending,
  };
}

// ============================================================================
// Notification Preferences Hooks
// ============================================================================

/**
 * Hook for fetching notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () => getNotificationPreferences(),
    select: (data) => data.preferences,
  });
}

/**
 * Hook for updating notification preferences
 */
export function useNotificationPreferencesMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options ?? {};

  return useMutation({
    mutationFn: (data: {
      globalEnabled?: boolean;
      emailEnabled?: boolean;
      emailAddress?: string | null;
      webhookEnabled?: boolean;
      webhookUrl?: string | null;
      webhookSecret?: string | null;
      webhookHeaders?: Record<string, string> | null;
      inAppEnabled?: boolean;
      inAppSound?: boolean;
      quietHoursEnabled?: boolean;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
      timezone?: string;
      digestEnabled?: boolean;
      digestFrequency?: string;
    }) => updateNotificationPreferences({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
      onSuccess?.();
    },
    onError,
  });
}

/**
 * Hook for testing webhook
 */
export function useTestWebhook() {
  return useMutation({
    mutationFn: (data: { webhookUrl: string; webhookSecret?: string; webhookHeaders?: Record<string, string> }) =>
      testWebhook({ data }),
  });
}

// ============================================================================
// In-App Notifications Hooks
// ============================================================================

/**
 * Hook for fetching in-app notifications
 */
export function useInAppNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["inAppNotifications", options],
    queryFn: () => getInAppNotifications({ data: options }),
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

/**
 * Hook for in-app notification mutations
 */
export function useInAppNotificationMutations(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const { onSuccess } = options ?? {};

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["inAppNotifications"] });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead({ data: { id } }),
    onSuccess: () => {
      invalidateNotifications();
      onSuccess?.();
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      invalidateNotifications();
      onSuccess?.();
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissNotification({ data: { id } }),
    onSuccess: () => {
      invalidateNotifications();
      onSuccess?.();
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => clearAllNotifications(),
    onSuccess: () => {
      invalidateNotifications();
      onSuccess?.();
    },
  });

  return {
    markReadMutation,
    markAllReadMutation,
    dismissMutation,
    clearAllMutation,
    isLoading:
      markReadMutation.isPending ||
      markAllReadMutation.isPending ||
      dismissMutation.isPending ||
      clearAllMutation.isPending,
  };
}

/**
 * Hook for getting unread notification count
 */
export function useUnreadNotificationCount() {
  const { data } = useInAppNotifications({ unreadOnly: true });
  return data?.unreadCount ?? 0;
}
