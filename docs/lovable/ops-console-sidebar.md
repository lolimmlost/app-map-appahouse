# Lovable follow-up — wrap the ops table in a console shell with a left system sidebar

The table (`src/components/apps/app-table.tsx`) is great — keep it exactly as-is
(split host:port, protocol chips, latency bar, metrics, tags, sticky sortable
headers, filter toolbar, status pill, health-accent border). This is ONE
iteration: wrap it in an **ops-console layout** with a **left sidebar** carrying
system + fleet info, and make the sidebar drive the table's filters. Do not
restyle the table or change tokens.

## Reuse what already exists
- `src/components/ui/sidebar.tsx` (shadcn sidebar primitive) — use
  `SidebarProvider / Sidebar / SidebarHeader / SidebarContent / SidebarGroup /
  SidebarGroupLabel / SidebarMenu / SidebarMenuButton / SidebarTrigger / SidebarInset`.
  It's already themed via the `--sidebar-*` tokens — don't hand-roll a panel.
- `src/components/ui/progress.tsx` for resource meters.
- Tokens ONLY: `text-status-online/offline/pending/unknown`,
  `text-success/warning/error/info` (+ `/10` tint bg), `.panel-label`,
  `.status-dot`, `.card-elevation`, `font-mono tabular-nums`, `--radius`.
  Reserve bright color strictly for real state; neutral = `text-muted-foreground`.
- Reuse `hostParts()` from `src/components/apps/host.ts` to derive hosts.

## Layout
```
SidebarProvider
├─ Sidebar (collapsible="icon", left)         ← new: system + fleet info
└─ SidebarInset
   ├─ slim top bar (h-12): SidebarTrigger · global search · overall status dot · Refresh
   └─ the existing <AppTable/> as the main content (drop its own before/after demo sections)
```
Sidebar is sticky, has its own scroll, collapses to icons on toggle, and becomes
a Sheet/off-canvas on mobile (the primitive handles this).

## Sidebar contents (top → bottom)
1. **Header** — small brand mark + `.panel-label` "OPS CONSOLE".
2. **Fleet health** (`SidebarGroup`): four compact rows — Online / Checking /
   Offline / Unknown — each a `.status-dot` in the matching color + label +
   `font-mono tabular-nums` count. Above them, a thin **stacked bar** (h-1.5,
   rounded) showing the mix by segment color. Counts derive from `statuses`.
3. **System** (`SidebarGroup`): resource meters using `Progress` — CPU, Memory,
   Disk, Temp. Label + mono value on the right; bar colored only over threshold
   (`[&>div]:bg-warning` ≥70%, `[&>div]:bg-error` ≥90%, else
   `[&>div]:bg-muted-foreground/40`). Pull from a new mock `system-data.ts`.
4. **Hosts** (`SidebarGroup`, this is the porttracker-y bit): list distinct hosts
   derived from each app's `localUrl` via `hostParts`. Each row = rollup
   `.status-dot` (worst status among that host's services) + host in `font-mono`
   + service count. Clicking a host filters the table to that host.
5. **Categories** (`SidebarGroup`): category name + count; click filters the table.
   Active filter row gets `bg-sidebar-accent text-sidebar-accent-foreground`.

## Wire the sidebar to the table (important)
Lift the table's filters into the page (or a small store) so the sidebar can
drive them. Add controlled props to `AppTable` and keep its internal defaults:
```ts
interface AppTableProps {
  apps: App[];
  statuses: Record<string, RuntimeStatus>;
  hideCategory?: boolean;
  selectable?: boolean;
  groupByCategory?: boolean;
  showToolbar?: boolean;
  // NEW — controlled filters (optional; fall back to internal state if absent)
  query?: string;                 onQueryChange?: (v: string) => void;
  statusFilter?: HealthStatus[];  onStatusFilterChange?: (v: HealthStatus[]) => void;
  categoryFilter?: string[];      onCategoryFilterChange?: (v: string[]) => void;
  hostFilter?: string[];          onHostFilterChange?: (v: string[]) => void;  // add host to the row filter predicate
}
```
Extend the existing `rows` predicate with a host match (compare
`hostParts(app.localUrl)?.host` against `hostFilter`). Selecting a host or
category in the sidebar sets the corresponding controlled filter; the table's
own toolbar stays in sync (show active filters as removable chips in the top bar).

## New mock data — add `src/lib/system-data.ts`
```ts
export interface SystemResource { label: string; value: number; unit?: string; } // value = percent
export const resources: SystemResource[] = [
  { label: "CPU",    value: 37 },
  { label: "Memory", value: 71 },
  { label: "Disk",   value: 88 },
  { label: "Temp",   value: 54, unit: "°C" },
];
export const host = { name: "nas-01", uptimeDays: 42, load: [0.42, 0.55, 0.61] };
```
Derive fleet counts and host rollups from the existing `apps` + `statuses` —
don't duplicate that data.

## Deliverable
Update `src/routes/index.tsx` to render the console shell (replace the
before/after demo with the live shell). Mock the collapsed + expanded sidebar and
one host-filtered state. Keep everything theme-aware (light + dark) and make sure
the page body never scrolls horizontally.
```
