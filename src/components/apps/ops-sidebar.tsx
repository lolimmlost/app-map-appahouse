import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cpu, MemoryStick, HardDrive, Thermometer, Server, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { hostParts } from "./host";
import type { HealthStatus } from "./app-card";
import type { AppWithRelations } from "./app-grid";
import type { Category } from "@/types/database";
import { getLocalSystemStats } from "@/lib/server/system-stats.server";

/** Ordered worst → best, used for host rollups. */
const STATUS_RANK: Record<HealthStatus, number> = { offline: 0, checking: 1, unknown: 2, online: 3 };

const fleetRows: { key: HealthStatus; label: string; dot: string; seg: string }[] = [
  { key: "online", label: "Online", dot: "text-status-online", seg: "bg-status-online" },
  { key: "checking", label: "Checking", dot: "text-status-pending", seg: "bg-status-pending" },
  { key: "offline", label: "Offline", dot: "text-status-offline", seg: "bg-status-offline" },
  { key: "unknown", label: "Unknown", dot: "text-status-unknown", seg: "bg-status-unknown" },
];

function usageBarClass(usage: number): string {
  if (usage >= 90) return "[&>div]:bg-error";
  if (usage >= 75) return "[&>div]:bg-warning";
  return "[&>div]:bg-muted-foreground/50";
}

function Meter({
  icon: Icon, label, usage, value,
}: {
  icon: typeof Cpu; label: string; usage: number; value: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-mono tabular-nums text-foreground">{value}</span>
      </div>
      <Progress value={usage} className={cn("h-1.5", usageBarClass(usage))} />
    </div>
  );
}

interface OpsSidebarProps {
  apps: AppWithRelations[];
  categories: Category[];
  healthStatuses: Record<string, HealthStatus>;
  enabled: boolean;
  activeStatus: HealthStatus | null;
  activeHost: string | null;
  activeCategoryId: string | null;
  onToggleStatus: (s: HealthStatus) => void;
  onToggleHost: (h: string) => void;
  onToggleCategory: (id: string) => void;
  onClose?: () => void;
}

export function OpsSidebar({
  apps,
  categories,
  healthStatuses,
  enabled,
  activeStatus,
  activeHost,
  activeCategoryId,
  onToggleStatus,
  onToggleHost,
  onToggleCategory,
  onClose,
}: OpsSidebarProps) {
  const { data: stats } = useQuery({
    queryKey: ["local-system-stats"],
    queryFn: () => getLocalSystemStats(),
    enabled,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const statusOf = (id: string): HealthStatus => healthStatuses[id] ?? "unknown";

  const fleet = useMemo(() => {
    const counts: Record<HealthStatus, number> = { online: 0, offline: 0, checking: 0, unknown: 0 };
    for (const app of apps) counts[statusOf(app.id)]++;
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, healthStatuses]);

  const hosts = useMemo(() => {
    const map = new Map<string, { count: number; worst: HealthStatus }>();
    for (const app of apps) {
      const host = hostParts(app.localUrl)?.host ?? hostParts(app.remoteUrl)?.host;
      if (!host) continue;
      const st = statusOf(app.id);
      const cur = map.get(host);
      if (!cur) map.set(host, { count: 1, worst: st });
      else {
        cur.count++;
        if (STATUS_RANK[st] < STATUS_RANK[cur.worst]) cur.worst = st;
      }
    }
    return Array.from(map, ([host, v]) => ({ host, ...v })).sort((a, b) => a.host.localeCompare(b.host));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, healthStatuses]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of apps) if (app.categoryId) map.set(app.categoryId, (map.get(app.categoryId) ?? 0) + 1);
    return map;
  }, [apps]);

  const total = apps.length || 1;
  const dotColor = (s: HealthStatus) => fleetRows.find((r) => r.key === s)!.dot;

  const disk = stats?.disks?.slice().sort((a, b) => b.usage - a.usage)[0];
  const fmtGB = (b: number) => `${(b / 1024 ** 3).toFixed(1)}G`;

  return (
    <aside className="flex w-full lg:w-60 shrink-0 flex-col gap-5 rounded-lg border bg-card card-elevation p-3 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="panel-label">Ops Console</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground truncate">
            <Server className="h-3 w-3 shrink-0" />
            {stats?.hostname ?? "…"}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Fleet health */}
      <section className="space-y-2">
        <p className="panel-label">Fleet</p>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          {fleetRows.map((r) =>
            fleet[r.key] > 0 ? (
              <span key={r.key} className={cn("h-full", r.seg)} style={{ width: `${(fleet[r.key] / total) * 100}%` }} />
            ) : null
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {fleetRows.map((r) => {
            const active = activeStatus === r.key;
            return (
              <button
                key={r.key}
                onClick={() => onToggleStatus(r.key)}
                className={cn(
                  "flex items-center justify-between rounded-md px-1.5 py-0.5 text-xs transition-colors hover:bg-muted",
                  active && "bg-muted"
                )}
              >
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className={cn("status-dot size-1.5", r.dot)} />
                  {r.label}
                </span>
                <span className="font-mono tabular-nums text-foreground">{fleet[r.key]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* System resources */}
      <section className="space-y-2.5">
        <p className="panel-label">System</p>
        {stats ? (
          <>
            <Meter icon={Cpu} label="CPU" usage={stats.cpu.usage} value={`${stats.cpu.usage}%`} />
            <Meter icon={MemoryStick} label="Memory" usage={stats.ram.usage} value={`${fmtGB(stats.ram.used)}/${fmtGB(stats.ram.total)}`} />
            {disk && <Meter icon={HardDrive} label="Disk" usage={disk.usage} value={`${disk.usage}%`} />}
            {typeof stats.cpu.temperature === "number" && (
              <Meter icon={Thermometer} label="Temp" usage={Math.min(100, stats.cpu.temperature)} value={`${stats.cpu.temperature}°C`} />
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60">Loading…</p>
        )}
      </section>

      {/* Hosts */}
      {hosts.length > 0 && (
        <section className="space-y-1.5">
          <p className="panel-label">Hosts</p>
          <ul className="space-y-0.5">
            {hosts.map((h) => {
              const active = activeHost === h.host;
              return (
                <li key={h.host}>
                  <button
                    onClick={() => onToggleHost(h.host)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-muted",
                      active && "bg-muted"
                    )}
                  >
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span className={cn("status-dot size-1.5 shrink-0", dotColor(h.worst))} />
                      <span className="truncate font-mono text-muted-foreground">{h.host}</span>
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground/70">{h.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="space-y-1.5">
          <p className="panel-label">Categories</p>
          <ul className="space-y-0.5">
            {categories.map((c) => {
              const count = categoryCounts.get(c.id) ?? 0;
              if (count === 0) return null;
              const active = activeCategoryId === c.id;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onToggleCategory(c.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-muted",
                      active && "bg-muted"
                    )}
                  >
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color ?? "var(--color-muted-foreground)" }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground/70">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </aside>
  );
}
