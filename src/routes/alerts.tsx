import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Bell, History, Settings, RefreshCw } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertRuleForm, type AlertRuleFormData } from "@/components/alerts/alert-rule-form";
import { AlertRuleCard } from "@/components/alerts/alert-rule-card";
import { AlertHistoryList } from "@/components/alerts/alert-history-list";
import { NotificationPreferencesForm } from "@/components/alerts/notification-preferences-form";
import {
  useAlertRules,
  useAlertRuleMutations,
  useAlertHistory,
  useAlertHistoryMutations,
} from "@/hooks/use-alerts";
import { getApps } from "@/lib/server/apps.server";
import { getIntegrationsForAlerts } from "@/lib/server/alerts.server";
import type { AlertRule } from "@/types/database";

export const Route = createFileRoute("/alerts")({ component: AlertsPage });

function AlertsPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const [activeTab, setActiveTab] = useState("rules");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

  // Fetch alert rules
  const { data: alertRules, isLoading: isLoadingRules } = useAlertRules();

  // Fetch apps for the form dropdown
  const { data: appsData } = useQuery({
    queryKey: ["apps"],
    queryFn: () => getApps(),
    enabled: !!session?.user,
  });

  // Fetch integrations for the form dropdown
  const { data: integrationsData } = useQuery({
    queryKey: ["integrationsForAlerts"],
    queryFn: () => getIntegrationsForAlerts(),
    enabled: !!session?.user,
  });

  // Fetch alert history
  const { data: historyData, isLoading: isLoadingHistory } = useAlertHistory({
    status: historyStatusFilter === "all" ? undefined : historyStatusFilter,
  });

  // Alert rule mutations
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleMutation,
    isLoading: isMutating,
  } = useAlertRuleMutations({
    onSuccess: () => {
      setIsFormOpen(false);
      setEditingRule(null);
      toast.success(editingRule ? "Alert rule updated" : "Alert rule created");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save alert rule");
    },
  });

  // Alert history mutations
  const {
    acknowledgeMutation,
    resolveMutation,
    bulkResolveMutation,
    clearOldMutation,
  } = useAlertHistoryMutations({
    onSuccess: () => {
      toast.success("Alert updated");
    },
  });

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsFormOpen(true);
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm("Are you sure you want to delete this alert rule?")) {
      deleteMutation.mutate(ruleId, {
        onSuccess: () => toast.success("Alert rule deleted"),
      });
    }
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    toggleMutation.mutate(
      { id: ruleId, enabled },
      {
        onSuccess: () => toast.success(enabled ? "Alert enabled" : "Alert disabled"),
      }
    );
  };

  const handleFormSubmit = (data: AlertRuleFormData) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
        <div className="text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-2">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your alerts and notifications
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage alert rules and notification preferences
          </p>
        </div>
        {activeTab === "rules" && (
          <Button onClick={handleCreateRule} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Alert Rule
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Rules</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Alert Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          {isLoadingRules ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !alertRules || alertRules.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Alert Rules</h3>
              <p className="text-muted-foreground mb-4">
                Create your first alert rule to get notified about app status changes.
              </p>
              <Button onClick={handleCreateRule}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert Rule
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {alertRules.map((rule: any) => (
                <AlertRuleCard
                  key={rule.id}
                  alertRule={rule}
                  onEdit={() => handleEditRule(rule)}
                  onDelete={() => handleDeleteRule(rule.id)}
                  onToggle={(enabled) => handleToggleRule(rule.id, enabled)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Alert History Tab */}
        <TabsContent value="history" className="mt-6">
          <AlertHistoryList
            alerts={historyData?.alerts ?? []}
            isLoading={isLoadingHistory}
            onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
            onResolve={(id) => resolveMutation.mutate(id)}
            onBulkResolve={(ids) => bulkResolveMutation.mutate(ids)}
            onClearOld={(days) => clearOldMutation.mutate(days)}
            selectedStatus={historyStatusFilter}
            onStatusChange={setHistoryStatusFilter}
          />
        </TabsContent>

        {/* Notification Preferences Tab */}
        <TabsContent value="preferences" className="mt-6">
          <NotificationPreferencesForm />
        </TabsContent>
      </Tabs>

      {/* Alert Rule Form Dialog */}
      <AlertRuleForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        alertRule={editingRule}
        apps={appsData?.apps ?? []}
        integrations={integrationsData?.integrations ?? []}
        isLoading={isMutating}
      />
    </main>
  );
}
