import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save, RefreshCw, Palette, LayoutGrid, Activity, Search } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeEditor } from "@/components/theme/theme-editor";
import { getUserSettings, updateUserSettings } from "@/lib/server/user-settings.server";
import type { UserSettings } from "@/types/database";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

type SettingsFormData = {
  defaultView: "grid" | "list" | "compact";
  gridColumns: number;
  showHealthDots: boolean;
  healthBarStyle: "dot" | "border" | "none";
  theme: string;
  searxngEnabled: boolean;
  searxngUrl: string;
};

const defaultSettings: SettingsFormData = {
  defaultView: "grid",
  gridColumns: 4,
  showHealthDots: true,
  healthBarStyle: "dot",
  theme: "system",
  searxngEnabled: false,
  searxngUrl: "",
};

function SettingsPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const queryClient = useQueryClient();
  const { theme, setTheme, themes } = useTheme();

  const [formData, setFormData] = useState<SettingsFormData>(defaultSettings);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch user settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
    enabled: !!session?.user,
    staleTime: 30000,
  });

  // Update form when settings load
  useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings;
      setFormData({
        defaultView: s.defaultView ?? "grid",
        gridColumns: s.gridColumns ?? 4,
        showHealthDots: s.showHealthDots ?? true,
        healthBarStyle: s.healthBarStyle ?? "dot",
        theme: s.theme ?? "system",
        searxngEnabled: s.searxngEnabled ?? false,
        searxngUrl: s.searxngUrl ?? "",
      });
    }
  }, [settingsData?.settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (data: SettingsFormData) =>
      updateUserSettings({
        data: {
          defaultView: data.defaultView,
          gridColumns: data.gridColumns,
          showHealthDots: data.showHealthDots,
          healthBarStyle: data.healthBarStyle,
          theme: data.theme,
          searxngEnabled: data.searxngEnabled,
          searxngUrl: data.searxngUrl,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      setIsDirty(false);
    },
  });

  const handleChange = <K extends keyof SettingsFormData>(
    key: K,
    value: SettingsFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);

    // Apply theme change immediately
    if (key === "theme") {
      setTheme(value as string);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access settings
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex flex-col gap-6 p-4 sm:p-6 max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Customize your dashboard experience</p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending} className="w-full sm:w-auto">
          {saveMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {isLoading && !settingsData ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize how your dashboard looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Color Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Select light, dark, or system preference
                  </p>
                </div>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => handleChange("theme", value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Theme Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Theme Editor</CardTitle>
              </div>
              <CardDescription>Choose a preset theme or customize colors</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeEditor />
            </CardContent>
          </Card>

          {/* Layout */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                <CardTitle>Layout</CardTitle>
              </div>
              <CardDescription>Configure your dashboard layout preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default View</Label>
                  <p className="text-sm text-muted-foreground">
                    How apps are displayed by default
                  </p>
                </div>
                <Select
                  value={formData.defaultView}
                  onValueChange={(value: "grid" | "list" | "compact") =>
                    handleChange("defaultView", value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Grid Columns</Label>
                  <p className="text-sm text-muted-foreground">
                    Number of columns in grid view (on large screens)
                  </p>
                </div>
                <Select
                  value={String(formData.gridColumns)}
                  onValueChange={(value) => handleChange("gridColumns", parseInt(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 columns</SelectItem>
                    <SelectItem value="3">3 columns</SelectItem>
                    <SelectItem value="4">4 columns</SelectItem>
                    <SelectItem value="5">5 columns</SelectItem>
                    <SelectItem value="6">6 columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Health Checks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>Health Indicators</CardTitle>
              </div>
              <CardDescription>Configure how health status is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Health Indicators</Label>
                  <p className="text-sm text-muted-foreground">
                    Display health status on app cards
                  </p>
                </div>
                <Switch
                  checked={formData.showHealthDots}
                  onCheckedChange={(checked) => handleChange("showHealthDots", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Indicator Style</Label>
                  <p className="text-sm text-muted-foreground">
                    How health status is visualized
                  </p>
                </div>
                <Select
                  value={formData.healthBarStyle}
                  onValueChange={(value: "dot" | "border" | "none") =>
                    handleChange("healthBarStyle", value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dot">Dot indicator</SelectItem>
                    <SelectItem value="border">Colored border</SelectItem>
                    <SelectItem value="none">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Web Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <CardTitle>Web Search</CardTitle>
              </div>
              <CardDescription>Search the web from the command palette using SearXNG</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable SearXNG Search</Label>
                  <p className="text-sm text-muted-foreground">
                    Show web results in the command palette (Cmd+K)
                  </p>
                </div>
                <Switch
                  checked={formData.searxngEnabled}
                  onCheckedChange={(checked) => handleChange("searxngEnabled", checked)}
                />
              </div>
              {formData.searxngEnabled && (
                <div className="space-y-2">
                  <Label>SearXNG Instance URL</Label>
                  <Input
                    placeholder="https://search.example.com"
                    value={formData.searxngUrl}
                    onChange={(e) => handleChange("searxngUrl", e.target.value)}
                  />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Use a URL reachable by <strong>both this server and your browser</strong> —
                      when behind a reverse proxy, that&rsquo;s the public/proxied address
                      (e.g. <code className="font-mono">https://search.example.com</code>), not an
                      internal-only LAN address. The server fetches inline results from it, and the
                      &ldquo;Search on SearXNG&rdquo; action opens it directly in your browser.
                    </p>
                    <p>
                      Inline results also require the JSON API enabled on the instance
                      (<code className="font-mono">search.formats: [html, json]</code>). Without it,
                      the direct search action still works.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
