import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApps } from "@/lib/server/apps.server";
import type { StatusPage, StatusPageBranding, StatusPageDisplayOptions } from "@/database/schema/status-pages";

interface StatusPageFormData {
  title: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  password?: string;
  branding: StatusPageBranding;
  displayOptions: StatusPageDisplayOptions;
  appIds: string[];
}

interface StatusPageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StatusPageFormData) => void;
  statusPage?: StatusPage | null;
  isLoading?: boolean;
}

export function StatusPageForm({
  open,
  onOpenChange,
  onSubmit,
  statusPage,
  isLoading,
}: StatusPageFormProps) {
  const isEditing = !!statusPage;

  // Fetch user's apps
  const { data: appsData } = useQuery({
    queryKey: ["apps"],
    queryFn: () => getApps(),
    enabled: open,
  });

  const [formData, setFormData] = useState<StatusPageFormData>(() => ({
    title: statusPage?.title || "",
    slug: statusPage?.slug || "",
    description: statusPage?.description || "",
    isPublic: statusPage?.isPublic ?? true,
    password: "",
    branding: (statusPage?.branding as StatusPageBranding) || {
      primaryColor: "#3b82f6",
      showPoweredBy: true,
    },
    displayOptions: (statusPage?.displayOptions as StatusPageDisplayOptions) || {
      showResponseTime: true,
      showUptime: true,
      showLastChecked: true,
      showIncidents: true,
      groupByCategory: true,
      layout: "list",
      refreshInterval: 60,
    },
    appIds: [],
  }));

  const [selectedApps, setSelectedApps] = useState<Set<string>>(() => {
    // Initialize with existing apps when editing
    if (statusPage?.apps && Array.isArray(statusPage.apps)) {
      return new Set(statusPage.apps.map((spa: { appId?: string; app?: { id?: string } }) =>
        spa.appId || spa.app?.id
      ).filter(Boolean) as string[]);
    }
    return new Set();
  });

  // Reset selected apps when the dialog opens/closes or when editing different status page
  useEffect(() => {
    if (open && statusPage?.apps && Array.isArray(statusPage.apps)) {
      setSelectedApps(new Set(statusPage.apps.map((spa: { appId?: string; app?: { id?: string } }) =>
        spa.appId || spa.app?.id
      ).filter(Boolean) as string[]));
    } else if (open && !statusPage) {
      // Creating new status page, reset to empty
      setSelectedApps(new Set());
    }
  }, [open, statusPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      appIds: Array.from(selectedApps),
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const toggleApp = (appId: string) => {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const apps = appsData?.apps || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Status Page" : "Create Status Page"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your public status page settings."
              : "Create a new public status page to share your service health status."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="apps">Apps</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 min-h-0 max-h-[60vh] pr-4">
              <TabsContent value="general" className="space-y-4 mt-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="My Status Page"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/status/</span>
                    <Input
                      id="slug"
                      placeholder="my-status-page"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only lowercase letters, numbers, and hyphens
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of your services..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublic">Public Access</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow anyone with the URL to view this page
                    </p>
                  </div>
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isPublic: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password Protection (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave empty for no password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Visitors will need to enter this password to view the status page
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="apps" className="space-y-4 mt-4 pb-4">
                <p className="text-sm text-muted-foreground">
                  Select the apps to display on this status page.
                </p>

                {apps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No apps found. Create some apps first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50"
                      >
                        <Checkbox
                          id={`app-${app.id}`}
                          checked={selectedApps.has(app.id)}
                          onCheckedChange={() => toggleApp(app.id)}
                        />
                        <label
                          htmlFor={`app-${app.id}`}
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                          {app.icon && (
                            <img src={app.icon} alt="" className="h-8 w-8 rounded object-contain" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{app.name}</div>
                            {app.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {app.description}
                              </div>
                            )}
                          </div>
                          {app.healthCheckEnabled && (
                            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                              Health Check
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  {selectedApps.size} app{selectedApps.size !== 1 ? "s" : ""} selected
                </p>
              </TabsContent>

              <TabsContent value="branding" className="space-y-4 mt-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={formData.branding.logoUrl || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, logoUrl: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        className="w-12 h-10 p-1"
                        value={formData.branding.primaryColor || "#3b82f6"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, primaryColor: e.target.value },
                          }))
                        }
                      />
                      <Input
                        value={formData.branding.primaryColor || "#3b82f6"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, primaryColor: e.target.value },
                          }))
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        className="w-12 h-10 p-1"
                        value={formData.branding.backgroundColor || "#09090b"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, backgroundColor: e.target.value },
                          }))
                        }
                      />
                      <Input
                        value={formData.branding.backgroundColor || "#09090b"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, backgroundColor: e.target.value },
                          }))
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerText">Header Text</Label>
                  <Input
                    id="headerText"
                    placeholder="Service Status"
                    value={formData.branding.headerText || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, headerText: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    placeholder="Copyright 2024"
                    value={formData.branding.footerText || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, footerText: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showPoweredBy">Show "Powered by App Map"</Label>
                    <p className="text-xs text-muted-foreground">
                      Display attribution in the footer
                    </p>
                  </div>
                  <Switch
                    id="showPoweredBy"
                    checked={formData.branding.showPoweredBy !== false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, showPoweredBy: checked },
                      }))
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="display" className="space-y-4 mt-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="layout">Layout Style</Label>
                  <Select
                    value={formData.displayOptions.layout || "list"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayOptions: { ...prev.displayOptions, layout: value as "list" | "grid" | "compact" },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refreshInterval">Auto-Refresh Interval (seconds)</Label>
                  <Input
                    id="refreshInterval"
                    type="number"
                    min={30}
                    max={300}
                    value={formData.displayOptions.refreshInterval || 60}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayOptions: { ...prev.displayOptions, refreshInterval: Number.parseInt(e.target.value) || 60 },
                      }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>Display Options</Label>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Response Time</span>
                    <Switch
                      checked={formData.displayOptions.showResponseTime !== false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOptions: { ...prev.displayOptions, showResponseTime: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Uptime Percentage</span>
                    <Switch
                      checked={formData.displayOptions.showUptime !== false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOptions: { ...prev.displayOptions, showUptime: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Last Checked Time</span>
                    <Switch
                      checked={formData.displayOptions.showLastChecked !== false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOptions: { ...prev.displayOptions, showLastChecked: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Active Incidents</span>
                    <Switch
                      checked={formData.displayOptions.showIncidents !== false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOptions: { ...prev.displayOptions, showIncidents: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Group by Category</span>
                    <Switch
                      checked={formData.displayOptions.groupByCategory !== false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOptions: { ...prev.displayOptions, groupByCategory: checked },
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title || !formData.slug}>
              {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Status Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
