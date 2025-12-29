import {
  Container,
  HardDrive,
  ExternalLink,
  Check,
  Import,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { DiscoveredService } from "@/lib/server/discovery.server";

interface DiscoveredServiceCardProps {
  service: DiscoveredService;
  selected: boolean;
  onSelect: () => void;
  onImport: () => void;
}

export function DiscoveredServiceCard({
  service,
  selected,
  onSelect,
  onImport,
}: DiscoveredServiceCardProps) {
  const isImported = !!service.existingAppId;
  const isRunning = service.status === "running";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isImported
          ? "bg-muted/30 border-muted"
          : isRunning
          ? "bg-success/5 border-success/20 hover:border-success/40"
          : "hover:bg-muted/50"
      )}
    >
      {/* Selection checkbox - only for non-imported services */}
      {!isImported && (
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="shrink-0"
        />
      )}

      {/* Icon */}
      <div className="shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
        {service.iconUrl ? (
          <img
            src={service.iconUrl}
            alt={service.displayName}
            className="h-8 w-8 object-contain"
            onError={(e) => {
              // Fallback to source icon on error
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement?.querySelector("svg")?.classList.remove("hidden");
            }}
          />
        ) : null}
        <span className={service.iconUrl ? "hidden" : ""}>
          {service.source === "docker" ? (
            <Container className="h-5 w-5 text-muted-foreground" />
          ) : (
            <HardDrive className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{service.displayName}</span>

          {/* Status indicator */}
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              isRunning ? "bg-status-online" : "bg-status-unknown"
            )}
            title={service.status}
          />

          {/* Already imported badge */}
          {isImported && (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Check className="h-3 w-3" />
              Added
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Source badge */}
          <Badge variant="outline" className="text-xs py-0 h-5">
            {service.source === "docker" ? (
              <>
                <Container className="h-3 w-3 mr-1" />
                {service.integrationName}
              </>
            ) : (
              <>
                <HardDrive className="h-3 w-3 mr-1" />
                {service.integrationName}
              </>
            )}
          </Badge>

          {/* Image name for Docker */}
          {service.image && (
            <span className="truncate">{service.image}</span>
          )}

          {/* Ports */}
          {service.ports.length > 0 && (
            <div className="flex items-center gap-1">
              {service.ports.slice(0, 3).map((port, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs py-0 h-5 font-mono"
                >
                  :{port.hostPort || port.port}
                </Badge>
              ))}
              {service.ports.length > 3 && (
                <span className="text-xs">+{service.ports.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Link to portal if available */}
        {service.truenasPortal && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(service.truenasPortal, "_blank")}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}

        {/* Import button */}
        {!isImported && (
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            className="gap-1"
          >
            <Import className="h-4 w-4" />
            Import
          </Button>
        )}
      </div>
    </div>
  );
}
