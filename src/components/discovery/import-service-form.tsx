import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Container, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { importDiscoveredService, type DiscoveredService } from "@/lib/server/discovery";
import { getCategories } from "@/lib/server/categories";

interface ImportServiceFormProps {
  service: DiscoveredService;
  open: boolean;
  onClose: (success?: boolean) => void;
}

export function ImportServiceForm({
  service,
  open,
  onClose,
}: ImportServiceFormProps) {
  // Get the best URL from the service
  const getDefaultUrl = () => {
    if (service.truenasPortal) return service.truenasPortal;
    const webPort = service.ports.find((p) => p.isWebUI) || service.ports[0];
    if (webPort) {
      const port = webPort.hostPort || webPort.port;
      return `http://localhost:${port}`;
    }
    return "";
  };

  const [name, setName] = useState(service.displayName);
  const [localUrl, setLocalUrl] = useState(getDefaultUrl());
  const [categoryId, setCategoryId] = useState<string>("");
  const [healthCheckEnabled, setHealthCheckEnabled] = useState(false);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: open,
  });

  const categories = categoriesData?.categories || [];

  // Import mutation
  const importMutation = useMutation({
    mutationFn: () =>
      importDiscoveredService({
        data: {
          service,
          name,
          localUrl: localUrl || undefined,
          categoryId: categoryId || undefined,
          healthCheckEnabled,
        },
      }),
    onSuccess: () => {
      onClose(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    importMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Import Service
          </DialogTitle>
          <DialogDescription>
            Add this discovered service to your dashboard
          </DialogDescription>
        </DialogHeader>

        {/* Service Preview */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="shrink-0 h-12 w-12 rounded-lg bg-background flex items-center justify-center overflow-hidden">
            {service.iconUrl ? (
              <img
                src={service.iconUrl}
                alt={service.displayName}
                className="h-10 w-10 object-contain"
              />
            ) : service.source === "docker" ? (
              <Container className="h-6 w-6 text-muted-foreground" />
            ) : (
              <HardDrive className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{service.displayName}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs py-0 h-5">
                {service.source === "docker" ? "Docker" : "TrueNAS"}
              </Badge>
              {service.image && <span>{service.image}</span>}
              {service.ports.length > 0 && (
                <span className="font-mono">
                  :{service.ports[0].hostPort || service.ports[0].port}
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="import-name">App Name *</Label>
            <Input
              id="import-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter app name"
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="import-url">Local URL</Label>
            <Input
              id="import-url"
              type="url"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="http://192.168.1.100:8080"
            />
            <p className="text-xs text-muted-foreground">
              The URL to access this service on your local network
            </p>
          </div>

          {/* Port suggestions */}
          {service.ports.length > 1 && (
            <div className="space-y-2">
              <Label>Available Ports</Label>
              <div className="flex flex-wrap gap-2">
                {service.ports.map((port, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-mono"
                    onClick={() => {
                      const hostPort = port.hostPort || port.port;
                      // Try to extract host from current URL or use localhost
                      try {
                        const url = new URL(localUrl || "http://localhost");
                        url.port = String(hostPort);
                        setLocalUrl(url.toString().replace(/\/$/, ""));
                      } catch {
                        setLocalUrl(`http://localhost:${hostPort}`);
                      }
                    }}
                  >
                    :{port.hostPort || port.port}
                    {port.isWebUI && " (web)"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="import-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Health Check */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="import-health">Enable Health Check</Label>
              <p className="text-sm text-muted-foreground">
                Monitor if this service is reachable
              </p>
            </div>
            <Switch
              id="import-health"
              checked={healthCheckEnabled}
              onCheckedChange={setHealthCheckEnabled}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name || importMutation.isPending}>
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </DialogFooter>

          {importMutation.isError && (
            <p className="text-sm text-destructive text-center">
              {importMutation.error instanceof Error
                ? importMutation.error.message
                : "Failed to import service"}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
