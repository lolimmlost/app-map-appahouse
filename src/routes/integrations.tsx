import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import {
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  Plug,
  CheckCircle,
  XCircle,
  Loader2,
  Server,
  Film,
  Tv,
  Music,
  Activity,
  Container,
  MonitorCog,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration,
} from "@/lib/server/integrations";
import type { Integration } from "@/database/schema/integrations";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
});

type IntegrationType =
  | "uptime_kuma"
  | "radarr"
  | "sonarr"
  | "lidarr"
  | "jellyfin"
  | "docker"
  | "proxmox"
  | "portainer";

const integrationTypes: {
  value: IntegrationType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "uptime_kuma",
    label: "Uptime Kuma",
    icon: <Activity className="h-4 w-4" />,
    description: "Monitor uptime and status",
  },
  {
    value: "radarr",
    label: "Radarr",
    icon: <Film className="h-4 w-4" />,
    description: "Movie collection manager",
  },
  {
    value: "sonarr",
    label: "Sonarr",
    icon: <Tv className="h-4 w-4" />,
    description: "TV series collection manager",
  },
  {
    value: "lidarr",
    label: "Lidarr",
    icon: <Music className="h-4 w-4" />,
    description: "Music collection manager",
  },
  {
    value: "jellyfin",
    label: "Jellyfin",
    icon: <Server className="h-4 w-4" />,
    description: "Media server",
  },
  {
    value: "docker",
    label: "Docker",
    icon: <Container className="h-4 w-4" />,
    description: "Container runtime",
  },
  {
    value: "proxmox",
    label: "Proxmox",
    icon: <MonitorCog className="h-4 w-4" />,
    description: "Virtualization platform",
  },
  {
    value: "portainer",
    label: "Portainer",
    icon: <Container className="h-4 w-4" />,
    description: "Container management UI",
  },
];

type IntegrationFormData = {
  type: IntegrationType;
  name: string;
  url: string;
  apiKey: string;
  username: string;
  password: string;
  enabled: boolean;
};

const initialFormData: IntegrationFormData = {
  type: "uptime_kuma",
  name: "",
  url: "",
  apiKey: "",
  username: "",
  password: "",
  enabled: true,
};

function IntegrationsPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<IntegrationFormData>(initialFormData);
  const [testResults, setTestResults] = useState<Record<string, { loading: boolean; success?: boolean; message?: string }>>({});
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch integrations
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => getIntegrations(),
    enabled: !!session?.user,
  });

  // Create integration mutation
  const createMutation = useMutation({
    mutationFn: (data: IntegrationFormData) =>
      createIntegration({
        data: {
          type: data.type,
          name: data.name,
          url: data.url,
          apiKey: data.apiKey || null,
          username: data.username || null,
          password: data.password || null,
          enabled: data.enabled,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      handleCloseForm();
    },
  });

  // Update integration mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: IntegrationFormData }) =>
      updateIntegration({
        data: {
          id,
          data: {
            type: data.type,
            name: data.name,
            url: data.url,
            apiKey: data.apiKey || null,
            username: data.username || null,
            password: data.password || null,
            enabled: data.enabled,
          },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      handleCloseForm();
    },
  });

  // Delete integration mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIntegration({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  // Test integration mutation
  const testMutation = useMutation({
    mutationFn: (id: string) => testIntegration({ data: { id } }),
    onMutate: (id) => {
      setTestResults((prev) => ({ ...prev, [id]: { loading: true } }));
    },
    onSuccess: (result, id) => {
      setTestResults((prev) => ({
        ...prev,
        [id]: { loading: false, success: result.success, message: result.message },
      }));
    },
    onError: (error, id) => {
      setTestResults((prev) => ({
        ...prev,
        [id]: { loading: false, success: false, message: error.message },
      }));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIntegration) {
      updateMutation.mutate({ id: editingIntegration.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData({
      type: integration.type as IntegrationType,
      name: integration.name,
      url: integration.url,
      apiKey: integration.apiKey ?? "",
      username: integration.username ?? "",
      password: integration.password ?? "",
      enabled: integration.enabled ?? true,
    });
    setFormOpen(true);
  };

  const handleDelete = (integration: Integration) => {
    if (confirm(`Are you sure you want to delete "${integration.name}"?`)) {
      deleteMutation.mutate(integration.id);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingIntegration(null);
    setFormData(initialFormData);
    setShowApiKey(false);
  };

  const handleOpenForm = () => {
    setFormData(initialFormData);
    setEditingIntegration(null);
    setFormOpen(true);
  };

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-4 sm:p-6 min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your integrations
          </p>
        </div>
      </main>
    );
  }

  const integrations = integrationsData?.integrations ?? [];

  const getTypeInfo = (type: string) => {
    return integrationTypes.find((t) => t.value === type) || integrationTypes[0];
  };

  return (
    <main className="container mx-auto flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Connect your homelab services
          </p>
        </div>

        <Button onClick={handleOpenForm} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Integrations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : integrations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No integrations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your first service to get started
            </p>
            <Button onClick={handleOpenForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => {
            const typeInfo = getTypeInfo(integration.type);
            const testResult = testResults[integration.id];

            return (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        {typeInfo.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{typeInfo.label}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={integration.enabled ? "default" : "secondary"}>
                      {integration.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground truncate">
                    {integration.url}
                  </div>

                  {/* Test Result */}
                  {testResult && (
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        testResult.loading
                          ? "text-muted-foreground"
                          : testResult.success
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {testResult.loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : testResult.success ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          {testResult.message}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          {testResult.message}
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => testMutation.mutate(integration.id)}
                      disabled={testResult?.loading}
                    >
                      {testResult?.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plug className="h-4 w-4" />
                      )}
                      <span className="ml-2">Test</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(integration)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(integration)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Integration Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? "Edit Integration" : "Add Integration"}
            </DialogTitle>
            <DialogDescription>
              {editingIntegration
                ? "Update your integration configuration."
                : "Connect a new service to your dashboard."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="type">Service Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: IntegrationType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {integrationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Radarr Instance"
                required
              />
            </div>

            {/* URL with HTTP/HTTPS toggle */}
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.url.startsWith("https://") ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 px-3"
                  onClick={() => {
                    const url = formData.url;
                    if (url.startsWith("http://")) {
                      setFormData({ ...formData, url: url.replace("http://", "https://") });
                    } else if (url.startsWith("https://")) {
                      setFormData({ ...formData, url: url.replace("https://", "http://") });
                    } else if (url) {
                      setFormData({ ...formData, url: "https://" + url });
                    }
                  }}
                  title={formData.url.startsWith("https://") ? "Using HTTPS (secure)" : "Using HTTP (insecure)"}
                >
                  {formData.url.startsWith("https://") ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="http://192.168.1.100:7878"
                  required
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Click the {formData.url.startsWith("https://") ? <Lock className="h-3 w-3 inline" /> : <Unlock className="h-3 w-3 inline" />} button to toggle between HTTP and HTTPS
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Enter API key if required"
                  autoComplete="off"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Username/Password for some integrations */}
            {(formData.type === "proxmox" || formData.type === "portainer" || formData.type === "jellyfin") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">
                    {formData.type === "jellyfin" ? "Jellyfin Username" : "Username"}
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder={formData.type === "jellyfin" ? "Your Jellyfin username" : "admin"}
                  />
                  {formData.type === "jellyfin" && (
                    <p className="text-xs text-muted-foreground">
                      For Sessions/Now Playing to work, use username/password instead of API key
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {formData.type === "jellyfin" ? "Jellyfin Password" : "Password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}

            {/* Enabled Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Disable to temporarily stop using this integration
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !formData.name ||
                  !formData.url
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingIntegration
                  ? "Update"
                  : "Add Integration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
