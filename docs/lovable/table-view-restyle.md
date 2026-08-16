# Lovable prompt — restyle the App "table view" into a Porttracker-style ops table

Restyle the app **table view** (`AppTable`) into a dense, information-rich ops
table in the spirit of **Porttracker** — a sysadmin-grade data table, not a
marketing list. Keep all existing shadcn/ui component logic and structure; only
change visual treatment and add columns for data that already exists on each app.
**Do NOT introduce new colors, fonts, or a new design language.** Everything must
work in light AND dark and use the exact tokens below.

---

## 1. Design tokens (already defined — use these, don't invent)

The theme is a **neutral grayscale base** (oklch) plus **semantic status accents**.
`font-mono` + `tabular-nums` is the house style for every identifier/host/port/time.

### Base tokens (`src/styles/styles.css`)
```css
:root {
  --radius: 0.625rem;               /* radius-sm/md/lg derive from this — RESPECT IT */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);      /* near-black — reserve for ONE primary action */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
  --ring: oklch(0.556 0 0);
}
```
Use via Tailwind classes: `bg-background text-foreground bg-card bg-muted
text-muted-foreground border-border hover:border-ring`.

### Status + accent tokens (`src/styles/custom.css`) — the ONLY colors allowed for state
```css
:root {
  --warning: hsl(38 92% 50%);   --success: hsl(142 76% 36%);
  --error:   hsl(0 84% 60%);    --info:    hsl(217 91% 60%);
  --status-online:  hsl(142 71% 45%);
  --status-offline: hsl(0 84% 60%);
  --status-unknown: hsl(220 9% 46%);
  --status-pending: hsl(45 93% 47%);
  /* Layered soft card depth (contact + ambient), warm-neutral */
  --shadow-card:
    0 1px 2px -1px rgb(16 18 24 / 0.08),
    0 3px 8px -2px rgb(16 18 24 / 0.06),
    0 12px 28px -8px rgb(16 18 24 / 0.07);
}
.dark {
  --warning: hsl(41 96% 62%); /* NOTE: in-repo dark --warning is a washed cream; use this readable value */
  --success: hsl(142 71% 45%); --error: hsl(0 72% 51%);
  --status-offline: hsl(0 72% 51%); --status-unknown: hsl(220 13% 50%);
  /* Dark depth = top-edge light catch + grounding shadow (shadows don't read on dark) */
  --shadow-card:
    inset 0 1px 0 0 rgb(255 255 255 / 0.05),
    0 1px 2px 0 rgb(0 0 0 / 0.45),
    0 12px 32px -12px rgb(0 0 0 / 0.65);
}
```
Exposed to Tailwind as: `text-success text-warning text-error text-info`,
`text-status-online text-status-offline text-status-pending text-status-unknown`
(and `bg-*` variants). **Reserve bright color strictly for real state** — a
neutral row uses `text-muted-foreground`, never a status color.

### Custom utilities (`src/styles/custom.css`) — reuse verbatim
```css
/* Column header micro-label */
@utility panel-label {
  font-size: 0.6875rem; line-height: 1rem; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--color-muted-foreground); font-weight: 500;
}
/* Wired-in status dot: fill + faint halo, driven by the text color.
   Usage: <span class="status-dot text-status-online" /> */
@utility status-dot {
  display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: 9999px;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in oklab, currentColor 16%, transparent);
}
/* Human card depth — theme-aware via the --shadow-card vars above */
@utility card-elevation { box-shadow: var(--shadow-card); }
@utility card-elevation-hover { box-shadow: var(--shadow-card-hover); }
```

---

## 2. The shadcn Table primitive we build on (`src/components/ui/table.tsx`)

Keep this primitive; style within it.
```tsx
function TableRow({ className, ...props }) {
  return <tr className={cn(
    "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
    className)} {...props} />;
}
function TableHead({ className, ...props }) {
  return <th className={cn(
    "text-muted-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap",
    className)} {...props} />;
}
function TableCell({ className, ...props }) {
  return <td className={cn("p-2 align-middle whitespace-nowrap", className)} {...props} />;
}
// also exports: Table (wraps in overflow-x-auto), TableHeader, TableBody, TableCaption
```

---

## 3. Current AppTable — the file to evolve (`src/components/apps/app-table.tsx`)

This is the exact styling in place today. Match it, then extend.

```tsx
const healthDotColors: Record<HealthStatus, string> = {
  online: "text-status-online",
  offline: "text-status-offline",
  unknown: "text-status-unknown",
  checking: "text-status-pending animate-pulse",
};
const healthLabels: Record<HealthStatus, string> = {
  online: "Online", offline: "Offline", unknown: "Unknown", checking: "Checking",
};

/* Container + header */
<div className="rounded-lg border bg-card card-elevation overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="panel-label w-8 pl-3" />        {/* health dot */}
        <TableHead className="panel-label">App</TableHead>
        <TableHead className="panel-label hidden md:table-cell">Category</TableHead>
        <TableHead className="panel-label hidden sm:table-cell">Local</TableHead>
        <TableHead className="panel-label hidden lg:table-cell">Remote</TableHead>
        <TableHead className="panel-label hidden md:table-cell">Status</TableHead>
        <TableHead className="w-8 pr-2" />                    {/* actions */}
      </TableRow>
    </TableHeader>

/* Health dot cell */
<TableCell className="pl-3">
  <span className={cn("status-dot", healthDotColors[healthStatus])} title={healthLabels[healthStatus]} />
</TableCell>

/* App name + icon */
<div className="flex items-center gap-2 min-w-0">
  <div className="flex items-center justify-center rounded-md bg-muted h-6 w-6 shrink-0">…icon…</div>
  <span className="font-medium truncate">{app.name}</span>
</div>

/* Category chip */
<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
  <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: app.category.color }} />
  {app.category.name}
</span>

/* Local / Remote — monospace host:port, clickable */
<button className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground max-w-[16rem] truncate">
  <Home className="h-3 w-3 shrink-0" /><span className="truncate">{hostLabel}</span>
</button>

/* Status label */
<span className={cn("text-xs font-medium", healthDotColors[healthStatus])}>{healthLabels[healthStatus]}</span>
```

`hostLabel()` strips protocol and returns `host[:port][/path]` (e.g.
`jelly.lan:8096`). Actions are a `DropdownMenu` (`⋯`) that reveals on
`group-hover`; selection mode adds a leading checkbox column. Keep both as-is.

---

## 4. Data available per app (surface MORE of it)

```ts
interface App {
  name; icon; localUrl; remoteUrl; notes; pinned;
  category?: { name; color };
  tags?: { tag: { name; color } }[];
  healthCheckEnabled: boolean;
  healthCheckType: "http" | "tcp" | "uptime_kuma" | null;
}
// runtime, passed in as maps keyed by app id:
type HealthStatus = "online" | "offline" | "unknown" | "checking";
type DependencyStatus = "healthy" | "degraded" | "offline";
// also on the runtime status: responseTime (ms), uptime (%), lastChecked (ISO)
```

---

## 5. Porttracker-style upgrades to make

1. **Split host and port** in Local/Remote: dim the host, emphasize `:PORT`,
   tiny muted protocol prefix. Right-align ports (`tabular-nums`) into a clean
   column. Keep it clickable + the mono treatment above.
2. **Protocol/type chip column** (`HTTP` / `TCP` / `KUMA`) — subtle outline
   badge, mono, uppercase, `text-muted-foreground border-border` (never colored).
3. **Metrics column** — `responseTime`ms + `uptime`%, `font-mono tabular-nums`,
   colored **only** when it signals state (slow → `text-warning`, down →
   `text-error`), otherwise `text-muted-foreground`. A tiny inline latency bar is welcome.
4. **Last-checked** — compact relative time (`2m ago`), mono, muted.
5. **Tags column** — `status-dot`-style color dot + label chips, no wrap, overflow `+N`.
6. **Status** — keep the `.status-dot`, pair with a compact pill using
   `bg-{success|warning|error}/10 text-{success|warning|error}` (tint bg + solid text).
7. **Sticky header** on scroll; header cells stay `.panel-label`.
8. **Sortable columns** (click header → asc/desc caret) + a top filter row: a
   search `Input` + quick filter `DropdownMenu`s (status, category, protocol).
   Reuse existing Input/Button/DropdownMenu components.
9. **Left status accent border** on each row that adopts the health color **only
   when a health check exists** (`border-l-2 border-status-*`), else transparent.
   Keep `hover:bg-muted/50`.
10. Keep the `⋯` actions menu and the selection checkbox column exactly as-is.

**Responsive:** shed columns gracefully — Metrics / Last-checked / Tags /
Protocol drop first; **App + Status + one URL always remain**. Never cause
horizontal page scroll (the `Table` primitive already wraps in `overflow-x-auto`).

**Deliverable:** mock the **before/after** of the table section first, then apply.
Show one **grouped-by-category** example (Category column hidden, group header
above each table) and one **flat/ungrouped** example (Category column visible).
```
