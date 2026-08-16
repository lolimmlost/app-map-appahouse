import { Fragment, useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, ChevronsUpDown, ExternalLink, MoreVertical,
  Copy, Pencil, Trash2, StickyNote, Home, Globe, Pin, PinOff, Share2, Users,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTrackAppAccess } from "@/hooks/use-analytics";
import { hostParts, normalizeUrl, relativeTime } from "./host";
import type { AppWithRelations } from "./app-grid";
import type { HealthStatus, DependencyStatus } from "./app-card";
import type { App, Tag } from "@/types/database";

/** Live + aggregated metrics for one app, keyed by app id upstream. */
export interface AppMetrics {
  responseTime?: number;      // live latency (ms) from health_cache
  uptime?: number | null;     // 30d uptime % from app_usage_metrics
  lastChecked?: string;       // ISO, from health_cache
}

const healthDotColors: Record<HealthStatus, string> = {
  online: "text-status-online",
  offline: "text-status-offline",
  unknown: "text-status-unknown",
  checking: "text-status-pending animate-pulse",
};
const healthLabels: Record<HealthStatus, string> = {
  online: "Online", offline: "Offline", unknown: "Unknown", checking: "Checking",
};
const healthPill: Record<HealthStatus, string> = {
  online: "bg-success/10 text-success",
  offline: "bg-error/10 text-error",
  unknown: "bg-muted text-muted-foreground",
  checking: "bg-warning/10 text-warning",
};
const rowAccent: Record<HealthStatus, string> = {
  online: "border-status-online",
  offline: "border-status-offline",
  unknown: "border-status-unknown",
  checking: "border-status-pending",
};
const dependencyStatusColors: Record<DependencyStatus, string> = {
  healthy: "text-status-online",
  degraded: "text-warning",
  offline: "text-status-offline",
};
const protocolLabels: Record<string, string> = {
  http: "HTTP", tcp: "TCP", uptime_kuma: "KUMA",
};

type SortKey = "name" | "category" | "status" | "responseTime" | "uptime" | "lastChecked";
type SortDir = "asc" | "desc";

function normalizeTags(app: AppWithRelations): Tag[] {
  const raw = (app as { tags?: unknown }).tags;
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => (t && typeof t === "object" && "tag" in t ? (t as { tag: Tag }).tag : (t as Tag)));
}

function HostCell({ url }: { url?: string | null }) {
  const parts = hostParts(url);
  const normalized = normalizeUrl(url);
  const { trackAccess } = useTrackAppAccess();
  if (!parts || !normalized) {
    return <span className="font-mono text-xs text-muted-foreground/40">—</span>;
  }
  return (
    <a
      href={normalized}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="group/host inline-flex w-full items-baseline gap-1 font-mono text-xs tabular-nums"
      title={url ?? undefined}
    >
      {parts.protocol && parts.protocol !== "http" ? (
        <span className="hidden text-[10px] text-muted-foreground/60 lg:inline">{parts.protocol}://</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-muted-foreground group-hover/host:text-foreground">
        {parts.host}
        {parts.path ? <span className="text-muted-foreground/50">{parts.path}</span> : null}
      </span>
      {parts.port ? (
        <span className="shrink-0 text-right font-medium text-foreground tabular-nums">:{parts.port}</span>
      ) : null}
      <ExternalLink className="size-3 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover/host:opacity-100" />
    </a>
  );
}

function LatencyBar({ ms }: { ms: number }) {
  const pct = Math.min(100, Math.round((ms / 800) * 100));
  const tone = ms >= 1000 ? "bg-error" : ms >= 500 ? "bg-warning" : "bg-muted-foreground/40";
  return (
    <span className="mt-1 block h-0.5 w-12 overflow-hidden rounded-full bg-muted">
      <span className={cn("block h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
    </span>
  );
}

function SortHeader({
  label, sortKey, active, dir, onSort, className,
}: {
  label: string; sortKey: SortKey; active: SortKey; dir: SortDir;
  onSort: (key: SortKey) => void; className?: string;
}) {
  const isActive = active === sortKey;
  const Icon = !isActive ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "panel-label inline-flex items-center gap-1 transition-colors hover:text-foreground",
          isActive && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </TableHead>
  );
}

export interface AppTableProps {
  apps: AppWithRelations[];
  healthStatuses?: Record<string, HealthStatus>;
  metrics?: Record<string, AppMetrics>;
  dependencyStatuses?: Record<string, DependencyStatus>;
  groupByCategory?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectApp?: (app: App) => void;
  onEditApp?: (app: App) => void;
  onDeleteApp?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPinApp?: (app: App, pinned: boolean) => void;
  onShareApp?: (app: App) => void;
}

export function AppTable({
  apps,
  healthStatuses = {},
  metrics = {},
  dependencyStatuses = {},
  groupByCategory = false,
  selectionMode = false,
  selectedIds = new Set(),
  onSelectApp,
  onEditApp,
  onDeleteApp,
  onViewNotes,
  onPinApp,
  onShareApp,
}: AppTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<HealthStatus[]>([]);
  const [protocolFilter, setProtocolFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const categories = useMemo(
    () => Array.from(new Set(apps.map((a) => a.category?.name).filter(Boolean) as string[])),
    [apps],
  );

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = apps.filter((app) => {
      const st = healthStatuses[app.id] ?? "unknown";
      if (q && !`${app.name} ${app.localUrl ?? ""} ${app.remoteUrl ?? ""}`.toLowerCase().includes(q)) return false;
      if (statusFilter.length && !statusFilter.includes(st)) return false;
      if (protocolFilter.length && !protocolFilter.includes(app.healthCheckType ?? "none")) return false;
      if (categoryFilter.length && !categoryFilter.includes(app.category?.name ?? "")) return false;
      return true;
    });

    const value = (app: AppWithRelations): string | number => {
      const m = metrics[app.id];
      switch (sortKey) {
        case "category": return app.category?.name ?? "";
        case "status": return healthStatuses[app.id] ?? "unknown";
        case "responseTime": return m?.responseTime ?? Number.MAX_SAFE_INTEGER;
        case "uptime": return m?.uptime ?? -1;
        case "lastChecked": return m?.lastChecked ?? "";
        default: return app.name.toLowerCase();
      }
    };

    return [...filtered].sort((a, b) => {
      const av = value(a); const bv = value(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [apps, healthStatuses, metrics, query, statusFilter, protocolFilter, categoryFilter, sortKey, sortDir]);

  const groups = useMemo(() => {
    if (!groupByCategory) return [{ name: "", items: rows }];
    const map = new Map<string, AppWithRelations[]>();
    for (const app of rows) {
      const key = app.category?.name ?? "Uncategorized";
      map.set(key, [...(map.get(key) ?? []), app]);
    }
    return Array.from(map, ([name, items]) => ({ name, items }));
  }, [rows, groupByCategory]);

  const showCategory = !groupByCategory;
  const colCount =
    (selectionMode ? 1 : 0) + 1 /*dot*/ + 1 /*app*/ + (showCategory ? 1 : 0) +
    1 /*type*/ + 1 /*local*/ + 1 /*remote*/ + 1 /*tags*/ + 1 /*metrics*/ +
    1 /*checked*/ + 1 /*status*/ + 1 /*actions*/;

  const renderRows = (items: AppWithRelations[]) =>
    items.map((app) => (
      <AppRow
        key={app.id}
        app={app}
        health={healthStatuses[app.id] ?? "unknown"}
        metric={metrics[app.id]}
        dependency={dependencyStatuses[app.id]}
        showCategory={showCategory}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(app.id)}
        onSelect={onSelectApp}
        onEdit={onEditApp}
        onDelete={onDeleteApp}
        onViewNotes={onViewNotes}
        onPin={onPinApp}
        onShare={onShareApp}
      />
    ));

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card card-elevation">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter apps, hosts, ports…"
          className="h-8 min-w-0 max-w-xs font-mono text-xs"
        />
        <div className="flex shrink-0 items-center gap-1.5">
          <FilterMenu
            label="Status"
            options={["online", "offline", "checking", "unknown"]}
            selected={statusFilter}
            onToggle={(v) => setStatusFilter((s) => toggle(s, v as HealthStatus))}
          />
          {categories.length ? (
            <FilterMenu
              label="Category"
              options={categories}
              selected={categoryFilter}
              onToggle={(v) => setCategoryFilter((s) => toggle(s, v))}
            />
          ) : null}
          <FilterMenu
            label="Protocol"
            options={["http", "tcp", "uptime_kuma"]}
            selected={protocolFilter}
            onToggle={(v) => setProtocolFilter((s) => toggle(s, v))}
          />
        </div>
      </div>

      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b [&_tr]:border-border">
          <TableRow className="hover:bg-transparent">
            {selectionMode ? <TableHead className="w-8 pl-3" /> : null}
            <TableHead className="w-7 pl-3 pr-0" />
            <SortHeader label="App" sortKey="name" active={sortKey} dir={sortDir} onSort={onSort} />
            {showCategory ? (
              <SortHeader label="Category" sortKey="category" active={sortKey} dir={sortDir} onSort={onSort} className="hidden md:table-cell" />
            ) : null}
            <TableHead className="panel-label hidden lg:table-cell">Type</TableHead>
            <TableHead className="panel-label">Local</TableHead>
            <TableHead className="panel-label hidden sm:table-cell">Remote</TableHead>
            <TableHead className="panel-label hidden xl:table-cell">Tags</TableHead>
            <SortHeader label="Metrics" sortKey="responseTime" active={sortKey} dir={sortDir} onSort={onSort} className="hidden text-right lg:table-cell [&>button]:justify-end" />
            <SortHeader label="Checked" sortKey="lastChecked" active={sortKey} dir={sortDir} onSort={onSort} className="hidden text-right xl:table-cell [&>button]:justify-end" />
            <SortHeader label="Status" sortKey="status" active={sortKey} dir={sortDir} onSort={onSort} />
            <TableHead className="w-10 pr-3" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) =>
            group.name ? (
              <Fragment key={group.name}>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colCount} className="bg-muted/40 py-1.5 pl-3">
                    <span className="panel-label">
                      {group.name}
                      <span className="ml-2 font-mono normal-case tracking-normal text-muted-foreground/70">
                        {group.items.length}
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
                {renderRows(group.items)}
              </Fragment>
            ) : (
              <Fragment key="__flat">{renderRows(group.items)}</Fragment>
            ),
          )}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="py-10 text-center text-xs text-muted-foreground">
                No apps match the current filters.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

interface AppRowProps {
  app: AppWithRelations & {
    isOwner?: boolean;
    sharedBy?: { id: string; name: string; email: string; image?: string | null };
    permissions?: { canEdit?: boolean; canDelete?: boolean };
  };
  health: HealthStatus;
  metric?: AppMetrics;
  dependency?: DependencyStatus;
  showCategory: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect?: (app: App) => void;
  onEdit?: (app: App) => void;
  onDelete?: (app: App) => void;
  onViewNotes?: (app: App) => void;
  onPin?: (app: App, pinned: boolean) => void;
  onShare?: (app: App) => void;
}

function AppRow({
  app, health, metric, dependency, showCategory,
  selectionMode, isSelected, onSelect, onEdit, onDelete, onViewNotes, onPin, onShare,
}: AppRowProps) {
  const { trackAccess } = useTrackAppAccess();
  const [copied, setCopied] = useState<"local" | "remote" | null>(null);

  const isOwner = app.isOwner !== false;
  const canEdit = isOwner || app.permissions?.canEdit;
  const canDelete = isOwner || app.permissions?.canDelete;
  const tags = normalizeTags(app);
  const visibleTags = tags.slice(0, 2);
  const overflow = tags.length - visibleTags.length;

  const ms = metric?.responseTime;
  const slow = typeof ms === "number" && ms >= 500;
  const down = health === "offline";
  const uptime = metric?.uptime;
  const uptimeTone =
    typeof uptime !== "number" ? "text-muted-foreground"
      : uptime < 90 ? "text-error"
      : uptime < 99 ? "text-warning"
      : "text-muted-foreground";

  const primaryUrl = app.localUrl || app.remoteUrl;
  const hasValidUrl = !!normalizeUrl(primaryUrl);

  const openUrl = (which: "local" | "remote") => {
    const url = which === "local" ? app.localUrl : app.remoteUrl;
    const normalized = normalizeUrl(url);
    if (normalized) {
      trackAccess({ appId: app.id, accessType: which === "local" ? "open_local" : "open_remote" });
      window.open(normalized, "_blank", "noopener,noreferrer");
    }
  };
  const copyUrl = async (which: "local" | "remote") => {
    const url = which === "local" ? app.localUrl : app.remoteUrl;
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    }
  };
  const openPrimary = () => {
    if (selectionMode) { onSelect?.(app); return; }
    const normalized = normalizeUrl(primaryUrl);
    if (normalized) {
      trackAccess({ appId: app.id, accessType: "click" });
      window.open(normalized, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      data-testid={`app-row-${app.id}`}
      className={cn(
        "group border-l-2",
        app.healthCheckEnabled ? rowAccent[health] : "border-l-transparent",
        (hasValidUrl || selectionMode) && "cursor-pointer",
        isSelected && "bg-primary/5",
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("a") || target.closest('[role="menu"]')) return;
        openPrimary();
      }}
    >
      {selectionMode ? (
        <TableCell className="w-8 pl-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(app)}
            aria-label={`Select ${app.name}`}
          />
        </TableCell>
      ) : null}

      <TableCell className="w-7 pl-3 pr-0">
        {app.healthCheckEnabled ? (
          <span className={cn("status-dot", healthDotColors[health])} title={healthLabels[health]} />
        ) : (
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/25" title="No health check" />
        )}
      </TableCell>

      <TableCell className="min-w-[10rem]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md border border-border bg-muted text-[11px] text-muted-foreground overflow-hidden">
            {app.icon ? (
              app.icon.startsWith("http")
                ? <img src={app.icon} alt="" className="h-3.5 w-3.5 object-contain" />
                : <span>{app.icon}</span>
            ) : (
              <span className="font-mono text-[10px]">{app.name.charAt(0).toUpperCase()}</span>
            )}
          </span>
          <span className="truncate text-[13px] font-medium">{app.name}</span>
          {app.notes ? <StickyNote className="h-3 w-3 shrink-0 text-muted-foreground" /> : null}
          {!isOwner ? <Users className="h-3 w-3 shrink-0 text-muted-foreground" title={`Shared by ${app.sharedBy?.name || "another user"}`} /> : null}
          {dependency && dependency !== "healthy" ? (
            <span
              className={cn("status-dot size-1.5 shrink-0", dependencyStatusColors[dependency])}
              title={dependency === "degraded" ? "Optional dependency is offline" : "Required dependency is offline"}
            />
          ) : null}
        </div>
      </TableCell>

      {showCategory ? (
        <TableCell className="hidden md:table-cell">
          {app.category ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: app.category.color ?? "var(--color-muted-foreground)" }} />
              {app.category.name}
            </span>
          ) : <span className="text-xs text-muted-foreground/40">—</span>}
        </TableCell>
      ) : null}

      <TableCell className="hidden lg:table-cell">
        <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {protocolLabels[app.healthCheckType ?? ""] ?? "—"}
        </span>
      </TableCell>

      <TableCell className="max-w-[13rem]"><HostCell url={app.localUrl} /></TableCell>
      <TableCell className="hidden max-w-[13rem] sm:table-cell"><HostCell url={app.remoteUrl} /></TableCell>

      <TableCell className="hidden xl:table-cell">
        <div className="flex flex-nowrap items-center gap-1">
          {visibleTags.map((tag) => (
            <span key={tag.id ?? tag.name} className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color ?? "var(--color-muted-foreground)" }} />
              {tag.name}
            </span>
          ))}
          {overflow > 0 ? <span className="font-mono text-[10px] text-muted-foreground">+{overflow}</span> : null}
          {tags.length === 0 ? <span className="text-[10px] text-muted-foreground/40">—</span> : null}
        </div>
      </TableCell>

      <TableCell className="hidden text-right lg:table-cell">
        <div className="inline-flex flex-col items-end">
          <span className={cn("font-mono text-xs tabular-nums", down ? "text-error" : slow ? "text-warning" : "text-muted-foreground")}>
            {typeof ms === "number" ? `${ms}ms` : "—"}
            {typeof uptime === "number" ? <span className={cn("ml-2", uptimeTone)}>{uptime.toFixed(2)}%</span> : null}
          </span>
          {typeof ms === "number" ? <LatencyBar ms={ms} /> : null}
        </div>
      </TableCell>

      <TableCell className="hidden text-right xl:table-cell">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{relativeTime(metric?.lastChecked)}</span>
      </TableCell>

      <TableCell>
        {app.healthCheckEnabled ? (
          <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium", healthPill[health])}>
            <span className={cn("status-dot size-1.5", healthDotColors[health])} />
            {healthLabels[health]}
          </span>
        ) : <span className="text-xs text-muted-foreground/40">—</span>}
      </TableCell>

      <TableCell className="w-10 pr-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="size-4" />
              <span className="sr-only">Actions for {app.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {app.localUrl ? (
              <>
                <DropdownMenuItem onClick={() => openUrl("local")}>
                  <Home className="mr-2 h-4 w-4" />{app.remoteUrl ? "Open Local" : "Open in new tab"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyUrl("local")}>
                  <Copy className="mr-2 h-4 w-4" />{copied === "local" ? "Copied!" : app.remoteUrl ? "Copy Local URL" : "Copy URL"}
                </DropdownMenuItem>
              </>
            ) : null}
            {app.remoteUrl ? (
              <>
                <DropdownMenuItem onClick={() => openUrl("remote")}>
                  <Globe className="mr-2 h-4 w-4" />{app.localUrl ? "Open Remote" : "Open in new tab"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyUrl("remote")}>
                  <Copy className="mr-2 h-4 w-4" />{copied === "remote" ? "Copied!" : app.localUrl ? "Copy Remote URL" : "Copy URL"}
                </DropdownMenuItem>
              </>
            ) : null}
            {app.notes && onViewNotes ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewNotes(app)}>
                  <StickyNote className="mr-2 h-4 w-4" />View notes
                </DropdownMenuItem>
              </>
            ) : null}
            {onPin && isOwner ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onPin(app, !app.pinned)}>
                  {app.pinned ? <><PinOff className="mr-2 h-4 w-4" />Unpin from Quick Links</> : <><Pin className="mr-2 h-4 w-4" />Pin to Quick Links</>}
                </DropdownMenuItem>
              </>
            ) : null}
            {onShare && isOwner ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onShare(app)}>
                  <Share2 className="mr-2 h-4 w-4" />Share
                </DropdownMenuItem>
              </>
            ) : null}
            {(canEdit || canDelete) ? <DropdownMenuSeparator /> : null}
            {onEdit && canEdit ? (
              <DropdownMenuItem onClick={() => onEdit(app)}>
                <Pencil className="mr-2 h-4 w-4" />Edit
              </DropdownMenuItem>
            ) : null}
            {onDelete && canDelete ? (
              <DropdownMenuItem onClick={() => onDelete(app)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            ) : null}
            {!app.localUrl && !app.remoteUrl ? (
              <DropdownMenuItem disabled>
                <ExternalLink className="mr-2 h-4 w-4" />No URL configured
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function FilterMenu({
  label, options, selected, onToggle,
}: {
  label: string; options: string[]; selected: string[]; onToggle: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          {label}
          {selected.length ? <span className="font-mono text-[10px] text-muted-foreground">{selected.length}</span> : null}
          <ChevronsUpDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="panel-label">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={() => onToggle(option)}
            onSelect={(e) => e.preventDefault()}
            className="text-xs capitalize"
          >
            {option.replace("_", " ")}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
