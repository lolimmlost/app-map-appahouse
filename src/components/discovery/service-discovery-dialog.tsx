import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Radar,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Container,
  HardDrive,
  Import,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { DiscoveredServiceCard } from "./discovered-service-card";
import { ImportServiceForm } from "./import-service-form";
import {
  discoverServices,
  bulkImportServices,
  type DiscoveredService,
} from "@/lib/server/discovery";

interface ServiceDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterSource = "all" | "docker" | "truenas";
type FilterStatus = "all" | "running" | "stopped";

export function ServiceDiscoveryDialog({
  open,
  onOpenChange,
}: ServiceDiscoveryDialogProps) {
  const queryClient = useQueryClient();
  const [filterSource, setFilterSource] = useState<FilterSource>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [importingService, setImportingService] = useState<DiscoveredService | null>(null);

  // Fetch discovered services
  const {
    data: discoveryData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["discovered-services"],
    queryFn: () => discoverServices(),
    enabled: open,
    staleTime: 30000,
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: (services: DiscoveredService[]) =>
      bulkImportServices({ data: { services } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["discovered-services"] });
      setSelectedServices(new Set());
    },
  });

  const services = discoveryData?.services || [];
  const errors = discoveryData?.errors || [];
  const integrationCount = discoveryData?.integrationCount || { docker: 0, truenas: 0 };

  // Filter services
  const filteredServices = services.filter((service) => {
    if (filterSource !== "all" && service.source !== filterSource) return false;
    if (filterStatus !== "all" && service.status !== filterStatus) return false;
    return true;
  });

  // Services that can be imported (not already imported)
  const importableServices = filteredServices.filter((s) => !s.existingAppId);

  // Toggle service selection
  const toggleSelection = (serviceId: string) => {
    const newSelection = new Set(selectedServices);
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId);
    } else {
      newSelection.add(serviceId);
    }
    setSelectedServices(newSelection);
  };

  // Select all importable services
  const selectAll = () => {
    setSelectedServices(new Set(importableServices.map((s) => s.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedServices(new Set());
  };

  // Handle bulk import
  const handleBulkImport = () => {
    const servicesToImport = services.filter((s) => selectedServices.has(s.id));
    bulkImportMutation.mutate(servicesToImport);
  };

  // Handle single import
  const handleImport = (service: DiscoveredService) => {
    setImportingService(service);
  };

  // Handle import form close
  const handleImportFormClose = (success?: boolean) => {
    setImportingService(null);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["discovered-services"] });
    }
  };

  const runningCount = services.filter((s) => s.status === "running").length;
  const importedCount = services.filter((s) => s.existingAppId).length;

  return (
    <>
      <Dialog open={open && !importingService} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5" />
              Discover Services
            </DialogTitle>
            <DialogDescription>
              Auto-discover services from Docker and TrueNAS integrations
            </DialogDescription>
          </DialogHeader>

          {/* Stats and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {integrationCount.docker > 0 && (
                <span className="flex items-center gap-1">
                  <Container className="h-4 w-4" />
                  {integrationCount.docker} Docker
                </span>
              )}
              {integrationCount.truenas > 0 && (
                <span className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  {integrationCount.truenas} TrueNAS
                </span>
              )}
              {services.length > 0 && (
                <>
                  <span>|</span>
                  <span>{runningCount} running</span>
                  <span>{importedCount} imported</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={filterSource}
                onValueChange={(v) => setFilterSource(v as FilterSource)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="docker">Docker</SelectItem>
                  <SelectItem value="truenas">TrueNAS</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as FilterStatus)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              <div className="flex items-center gap-2 font-medium mb-1">
                <AlertCircle className="h-4 w-4" />
                Some integrations failed
              </div>
              <ul className="list-disc list-inside">
                {errors.map((e, i) => (
                  <li key={i}>
                    {e.integration}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Discovering services...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm">Failed to discover services</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground">
                {integrationCount.docker === 0 && integrationCount.truenas === 0 ? (
                  <>
                    <Plug className="h-12 w-12" />
                    <div className="text-center">
                      <p className="font-medium">No integrations configured</p>
                      <p className="text-sm mb-4">
                        Add Docker or TrueNAS integrations to discover services
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          window.location.href = "/integrations";
                        }}
                      >
                        <Plug className="h-4 w-4 mr-2" />
                        Add Integration
                      </Button>
                    </div>
                  </>
                ) : services.length === 0 ? (
                  <>
                    <Radar className="h-12 w-12" />
                    <div className="text-center">
                      <p className="font-medium">No services found</p>
                      <p className="text-sm">
                        No running containers or apps detected from your integrations
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Radar className="h-12 w-12" />
                    <div className="text-center">
                      <p className="font-medium">No matching services</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredServices.map((service) => (
                  <DiscoveredServiceCard
                    key={service.id}
                    service={service}
                    selected={selectedServices.has(service.id)}
                    onSelect={() => toggleSelection(service.id)}
                    onImport={() => handleImport(service)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {importableServices.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {selectedServices.size > 0 ? (
                  <>
                    <Badge variant="secondary">
                      {selectedServices.size} selected
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select all ({importableServices.length})
                  </Button>
                )}
              </div>

              <Button
                onClick={handleBulkImport}
                disabled={selectedServices.size === 0 || bulkImportMutation.isPending}
              >
                {bulkImportMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Import className="h-4 w-4 mr-2" />
                    Import {selectedServices.size > 0 ? `(${selectedServices.size})` : "Selected"}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Import success message */}
          {bulkImportMutation.isSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Successfully imported {bulkImportMutation.data.imported.length} services
              {bulkImportMutation.data.failed.length > 0 && (
                <span className="text-destructive">
                  ({bulkImportMutation.data.failed.length} failed)
                </span>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import form dialog */}
      {importingService && (
        <ImportServiceForm
          service={importingService}
          open={!!importingService}
          onClose={handleImportFormClose}
        />
      )}
    </>
  );
}
