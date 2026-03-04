import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatusIndicator,
  OverallStatusBanner,
  ServiceStatusCard,
  ServiceGroup,
  IncidentTimeline,
  PasswordGate,
  type StatusType,
} from "@/components/status-page";
import {
  getPublicStatusPage,
  getPublicStatusPageHealth,
  refreshPublicStatusPageHealth,
} from "@/lib/server/status-pages.server";

export const Route = createFileRoute("/status/$slug")({
  component: PublicStatusPage,
});

function PublicStatusPage() {
  const { slug } = Route.useParams();
  const searchParams = Route.useSearch() as { token?: string };
  const accessToken = searchParams.token;

  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [hasTriggeredInitialRefresh, setHasTriggeredInitialRefresh] = useState(false);

  // Fetch status page data
  const {
    data: pageData,
    isLoading: isPageLoading,
    error: pageError,
    refetch: refetchPage,
  } = useQuery({
    queryKey: ["public-status-page", slug, accessToken, password],
    queryFn: () =>
      getPublicStatusPage({
        data: {
          slug: accessToken ? undefined : slug,
          accessToken,
          password: password || undefined,
        },
      }),
    retry: false,
  });

  // Fetch health data
  const {
    data: healthData,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["public-status-page-health", pageData?.id, accessToken],
    queryFn: () =>
      getPublicStatusPageHealth({
        data: {
          statusPageId: pageData?.id || "",
          accessToken,
        },
      }),
    enabled: !!pageData?.id && !pageData?.requiresPassword,
    refetchInterval: (pageData?.displayOptions?.refreshInterval || 60) * 1000,
  });

  // Handle refresh - performs live health checks and then refetches
  const handleRefresh = async () => {
    setLastRefresh(new Date());

    // First, trigger live health checks if we have the page data
    if (pageData?.id) {
      try {
        await refreshPublicStatusPageHealth({
          data: {
            statusPageId: pageData.id,
            accessToken,
          },
        });
      } catch (error) {
        console.error("Failed to refresh health:", error);
      }
    }

    // Then refetch to get the updated data
    await Promise.all([refetchPage(), refetchHealth()]);
  };

  // Auto-refresh based on display options
  useEffect(() => {
    if (!pageData || pageData.requiresPassword) return;

    const interval = (pageData.displayOptions?.refreshInterval || 60) * 1000;
    const timer = setInterval(() => {
      setLastRefresh(new Date());
    }, interval);

    return () => clearInterval(timer);
  }, [pageData]);

  // Handle password submission
  const handlePasswordSubmit = (pwd: string) => {
    setPassword(pwd);
    setPasswordError("");
  };

  // Check for password error
  useEffect(() => {
    if (pageError?.message === "Invalid password") {
      setPasswordError("Incorrect password. Please try again.");
    }
  }, [pageError]);

  // Trigger live health check if all services show "unknown" status (no cached data)
  useEffect(() => {
    if (
      !hasTriggeredInitialRefresh &&
      pageData?.id &&
      !pageData?.requiresPassword &&
      healthData &&
      !isHealthLoading
    ) {
      // Check if all health results are "unknown" - indicates no cached data
      const allUnknown = healthData.healthResults.length > 0 &&
        healthData.healthResults.every((r) => r.status === "unknown");

      if (allUnknown) {
        setHasTriggeredInitialRefresh(true);
        // Trigger a live health check to populate the cache
        refreshPublicStatusPageHealth({
          data: {
            statusPageId: pageData.id,
            accessToken,
          },
        }).then(() => {
          // Refetch the health data after live check completes
          refetchHealth();
          setLastRefresh(new Date());
        }).catch(console.error);
      } else {
        setHasTriggeredInitialRefresh(true);
      }
    }
  }, [pageData, healthData, isHealthLoading, hasTriggeredInitialRefresh, accessToken, refetchHealth]);

  // Show loading state
  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading status page...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (pageError && pageError.message !== "Invalid password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Status Page Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The status page you're looking for doesn't exist or is not publicly available.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Show password gate
  if (pageData?.requiresPassword) {
    return (
      <PasswordGate
        title={pageData.title}
        branding={pageData.branding as any}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
        isLoading={isPageLoading}
      />
    );
  }

  if (!pageData) {
    return null;
  }

  const branding = pageData.branding as {
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    showPoweredBy?: boolean;
    headerText?: string;
    footerText?: string;
  } | null;

  const displayOptions = pageData.displayOptions as {
    showResponseTime?: boolean;
    showUptime?: boolean;
    showLastChecked?: boolean;
    showIncidents?: boolean;
    groupByCategory?: boolean;
    layout?: "list" | "grid" | "compact";
  } | null;

  // Build health status map
  const healthMap = new Map<string, { status: StatusType; responseTime?: number; lastChecked?: string }>();
  const uptimeMap = new Map<string, { uptime: number; checks: number; avgResponseTime: number }>();

  if (healthData) {
    for (const result of healthData.healthResults) {
      healthMap.set(result.appId, {
        status: result.status as StatusType,
        responseTime: result.responseTime,
        lastChecked: result.lastChecked,
      });
    }
    for (const [appId, stats] of Object.entries(healthData.uptimeStats)) {
      uptimeMap.set(appId, stats);
    }
  }

  // Calculate overall status
  const getOverallStatus = (): StatusType => {
    if (!healthData || healthData.healthResults.length === 0) return "unknown";

    const statuses = healthData.healthResults.map((r) => r.status);
    const offlineCount = statuses.filter((s) => s === "offline").length;
    const unknownCount = statuses.filter((s) => s === "unknown").length;

    if (offlineCount > 0) {
      return offlineCount > statuses.length / 2 ? "offline" : "degraded";
    }
    if (unknownCount === statuses.length) return "unknown";
    return "online";
  };

  const overallStatus = getOverallStatus();

  // Group apps by category or group name
  const groupedApps = new Map<string, typeof pageData.apps>();
  if (displayOptions?.groupByCategory) {
    for (const app of pageData.apps) {
      const groupKey = app.groupName || app.categoryName || "Other";
      const existing = groupedApps.get(groupKey) || [];
      existing.push(app);
      groupedApps.set(groupKey, existing);
    }
  } else {
    groupedApps.set("All Services", pageData.apps);
  }

  const formatLastRefresh = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    return `${Math.floor(diffSecs / 60)}m ago`;
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundColor: branding?.backgroundColor || undefined,
        color: branding?.textColor || undefined,
      }}
    >
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {branding?.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt={pageData.title}
                  className="h-10 w-auto object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold">{pageData.title}</h1>
                {branding?.headerText && (
                  <p className="text-sm text-muted-foreground">{branding.headerText}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {formatLastRefresh()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isHealthLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isHealthLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overall Status Banner */}
        <OverallStatusBanner status={overallStatus} />

        {/* Description */}
        {pageData.description && (
          <p className="text-muted-foreground">{pageData.description}</p>
        )}

        {/* Active Incidents */}
        {displayOptions?.showIncidents !== false && pageData.incidents && pageData.incidents.length > 0 && (
          <IncidentTimeline
            incidents={pageData.incidents.map((inc) => ({
              ...inc,
              severity: inc.severity as "minor" | "major" | "critical",
              status: inc.status as "investigating" | "identified" | "monitoring" | "resolved",
            }))}
          />
        )}

        {/* Services */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Services</h2>

          {displayOptions?.layout === "grid" ? (
            <div className="space-y-8">
              {Array.from(groupedApps.entries()).map(([groupName, apps]) => (
                <div key={groupName}>
                  {groupedApps.size > 1 && (
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {groupName}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apps.map((app) => {
                      const health = healthMap.get(app.appId);
                      const uptime = uptimeMap.get(app.appId);

                      return (
                        <ServiceStatusCard
                          key={app.id}
                          name={app.displayName}
                          description={app.publicDescription || undefined}
                          icon={app.icon || undefined}
                          status={health?.status || "unknown"}
                          responseTime={displayOptions?.showResponseTime !== false ? health?.responseTime : undefined}
                          uptime={displayOptions?.showUptime !== false ? uptime?.uptime : undefined}
                          lastChecked={displayOptions?.showLastChecked !== false ? health?.lastChecked : undefined}
                          categoryName={app.categoryName || undefined}
                          categoryColor={app.categoryColor || undefined}
                          layout="grid"
                          showMetrics={displayOptions?.showResponseTime !== false || displayOptions?.showUptime !== false}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : displayOptions?.layout === "compact" ? (
            <div className="space-y-6">
              {Array.from(groupedApps.entries()).map(([groupName, apps]) => (
                <div key={groupName}>
                  {groupedApps.size > 1 && (
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {groupName}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {apps.map((app) => {
                      const health = healthMap.get(app.appId);
                      return (
                        <ServiceStatusCard
                          key={app.id}
                          name={app.displayName}
                          icon={app.icon || undefined}
                          status={health?.status || "unknown"}
                          layout="compact"
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedApps.entries()).map(([groupName, apps]) => (
                <ServiceGroup key={groupName} name={groupedApps.size > 1 ? groupName : ""}>
                  {apps.map((app) => {
                    const health = healthMap.get(app.appId);
                    const uptime = uptimeMap.get(app.appId);

                    return (
                      <ServiceStatusCard
                        key={app.id}
                        name={app.displayName}
                        description={app.publicDescription || undefined}
                        icon={app.icon || undefined}
                        status={health?.status || "unknown"}
                        responseTime={displayOptions?.showResponseTime !== false ? health?.responseTime : undefined}
                        uptime={displayOptions?.showUptime !== false ? uptime?.uptime : undefined}
                        lastChecked={displayOptions?.showLastChecked !== false ? health?.lastChecked : undefined}
                        categoryName={app.categoryName || undefined}
                        categoryColor={app.categoryColor || undefined}
                        layout="list"
                        showMetrics={displayOptions?.showResponseTime !== false || displayOptions?.showUptime !== false}
                      />
                    );
                  })}
                </ServiceGroup>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            {branding?.footerText && <span>{branding.footerText}</span>}
            {branding?.showPoweredBy !== false && (
              <span className="flex items-center gap-1">
                Powered by{" "}
                <a
                  href="/"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  App Map
                  <ExternalLink className="h-3 w-3" />
                </a>
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
