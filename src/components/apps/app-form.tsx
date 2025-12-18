import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { X } from "lucide-react";
import type { App, Tag } from "@/database/schema/apps";
import type { Category } from "@/database/schema/categories";

export type AppFormData = {
  name: string;
  description: string;
  icon: string;
  localUrl: string;
  remoteUrl: string;
  categoryId: string | null;
  tagIds: string[];
  healthCheckEnabled: boolean;
  healthCheckType: "http" | "tcp" | "uptime_kuma";
  healthCheckUrl: string;
  uptimeKumaMonitorId: string;
  notes: string;
};

interface AppFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AppFormData) => void;
  app?: App | null;
  categories: Category[];
  tags: Tag[];
  isLoading?: boolean;
}

const initialFormData: AppFormData = {
  name: "",
  description: "",
  icon: "",
  localUrl: "",
  remoteUrl: "",
  categoryId: null,
  tagIds: [],
  healthCheckEnabled: false,
  healthCheckType: "http",
  healthCheckUrl: "",
  uptimeKumaMonitorId: "",
  notes: "",
};

export function AppForm({
  open,
  onOpenChange,
  onSubmit,
  app,
  categories,
  tags,
  isLoading = false,
}: AppFormProps) {
  const [formData, setFormData] = useState<AppFormData>(initialFormData);
  const isEditing = !!app;

  useEffect(() => {
    if (app) {
      setFormData({
        name: app.name,
        description: app.description ?? "",
        icon: app.icon ?? "",
        localUrl: app.localUrl ?? "",
        remoteUrl: app.remoteUrl ?? "",
        categoryId: app.categoryId ?? null,
        tagIds: [], // Will be populated from app.tags if available
        healthCheckEnabled: app.healthCheckEnabled ?? false,
        healthCheckType: app.healthCheckType ?? "http",
        healthCheckUrl: app.healthCheckUrl ?? "",
        uptimeKumaMonitorId: app.uptimeKumaMonitorId ?? "",
        notes: app.notes ?? "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [app, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit App" : "Add App"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your app configuration."
              : "Add a new app to your dashboard."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My App"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (URL or emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="https://... or emoji"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of this app"
              />
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">URLs</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="localUrl">Local URL</Label>
                <Input
                  id="localUrl"
                  type="url"
                  value={formData.localUrl}
                  onChange={(e) => setFormData({ ...formData, localUrl: e.target.value })}
                  placeholder="http://192.168.1.100:8080"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remoteUrl">Remote URL</Label>
                <Input
                  id="remoteUrl"
                  type="url"
                  value={formData.remoteUrl}
                  onChange={(e) => setFormData({ ...formData, remoteUrl: e.target.value })}
                  placeholder="https://app.example.com"
                />
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Organization</h3>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId ?? "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = formData.tagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      style={
                        tag.color
                          ? isSelected
                            ? { backgroundColor: tag.color, borderColor: tag.color }
                            : { borderColor: tag.color, color: tag.color }
                          : undefined
                      }
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
                {tags.length === 0 && (
                  <span className="text-sm text-muted-foreground">No tags available</span>
                )}
              </div>
            </div>
          </div>

          {/* Health Check */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Health Monitoring</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="healthCheckEnabled">Enable Health Check</Label>
                <p className="text-sm text-muted-foreground">
                  Monitor if this app is online
                </p>
              </div>
              <Switch
                id="healthCheckEnabled"
                checked={formData.healthCheckEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, healthCheckEnabled: checked })
                }
              />
            </div>

            {formData.healthCheckEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="healthCheckType">Check Type</Label>
                  <Select
                    value={formData.healthCheckType}
                    onValueChange={(value: "http" | "tcp" | "uptime_kuma") =>
                      setFormData({ ...formData, healthCheckType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP Ping</SelectItem>
                      <SelectItem value="tcp">TCP Ping</SelectItem>
                      <SelectItem value="uptime_kuma">Uptime Kuma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.healthCheckType !== "uptime_kuma" && (
                  <div className="space-y-2">
                    <Label htmlFor="healthCheckUrl">Health Check URL (optional)</Label>
                    <Input
                      id="healthCheckUrl"
                      value={formData.healthCheckUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, healthCheckUrl: e.target.value })
                      }
                      placeholder="Leave empty to use app URL"
                    />
                    <p className="text-xs text-muted-foreground">
                      Custom endpoint like /health or /api/status
                    </p>
                  </div>
                )}

                {formData.healthCheckType === "uptime_kuma" && (
                  <div className="space-y-2">
                    <Label htmlFor="uptimeKumaMonitorId">Uptime Kuma Monitor ID</Label>
                    <Input
                      id="uptimeKumaMonitorId"
                      value={formData.uptimeKumaMonitorId}
                      onChange={(e) =>
                        setFormData({ ...formData, uptimeKumaMonitorId: e.target.value })
                      }
                      placeholder="Monitor ID from Uptime Kuma"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Admin Notes</h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Markdown supported)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this app..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Add App"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
