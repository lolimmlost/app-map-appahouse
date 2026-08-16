# Prompt — unify the dashboard into one holistic ops console

The dense **ops table** and **left console sidebar** now set the visual language:
tight spacing, `rounded-lg` panels, `panel-label` headers, `status-dot`, monospace
technical values, borders-over-shadow. But the rest of the dashboard (app cards,
widgets, quick links) still reads like a roomy marketing layout — **big `rounded-xl`
corners, `gap-6`/`py-6` padding, ad-hoc `text-sm font-semibold` headings**. Do a
**cohesion pass** so the whole app feels like one integrated control panel. Keep all
component logic/structure; change only visual treatment. No new colors or fonts;
light + dark must both hold.

## The reference language (already correct — match everything to this)
- Panels: `rounded-lg border bg-card card-elevation`, tight internal padding.
- Section/column headers: `.panel-label` (uppercase 0.6875rem micro-label).
- State: `.status-dot` + `text-status-*` / `text-success|warning|error`.
- Identifiers/hosts/ports/latency/%: `font-mono tabular-nums`.
- One radius system driven by `--radius` (currently `0.625rem`).

## The specific inconsistencies to fix

### 1. Radius — kill `rounded-xl`, standardize on the token scale
`rounded-xl` (0.75rem) is *larger* than `--radius` (0.625rem), which is why cards
feel bloated next to the table.
- **Panels/cards** → `rounded-lg` (= `--radius`).
- **Controls, chips, inputs, icon buttons** → `rounded-md`.
- `src/components/ui/card.tsx`: `rounded-xl` → `rounded-lg`.
- Sweep for any other `rounded-xl`/`rounded-2xl` on surfaces and drop to `rounded-lg`.
- **Optional token tightening** (mock before/after): drop `--radius` to `0.5rem` in
  `src/styles/styles.css` for a sharper sysadmin feel — everything inherits it.

### 2. Density — the Card primitive is the main offender
`src/components/ui/card.tsx` is `flex flex-col gap-6 rounded-xl border py-6
card-elevation`, with `CardHeader`/`CardContent` at `px-6`.
- `gap-6` → `gap-4`, `py-6` → `py-4`, header/content `px-6` → `px-4`.
- Goal: cards sit at the same rhythm as the table rows and sidebar sections
  (`gap-3/4`, `p-3/4`), not a full 24px box.

### 3. Elevation — one depth language, used sparingly
Right now depth is mixed: `card-elevation` on some surfaces, `shadow-sm` on quick
links (`src/components/apps/quick-links-bar.tsx` item: `rounded-lg border bg-card
p-1 … shadow-sm`), plain borders elsewhere.
- Top-level panels (table, sidebar, widgets, analytics blocks): `card-elevation`.
- Small/nested/among-many items (quick-link chips, app cards in a grid): **border
  only**, no shadow — replace `shadow-sm`/`shadow-md` with the border.
- Reserve elevation to separate a panel from the page, not to decorate every tile.

### 4. Section headers — `panel-label` everywhere
- `src/components/widgets/widget-container.tsx`: the `CardTitle` is `text-sm
  font-medium` → give the widget a header row using `.panel-label` (matching the
  sidebar's "System"/"Fleet" heads).
- `src/components/apps/app-grid.tsx`: category group header is `text-sm
  font-semibold` → `.panel-label` (keep the colored category dot/icon).
- Any other `text-sm font-semibold` section head → `.panel-label`.

### 5. Widgets — reskin `WidgetContainer` to the panel look
Same `Card` base means widgets inherit the roomy box. After the Card density fix,
also: header row = `.panel-label` title + right-aligned status/actions; body uses
the tight rhythm; technical values (`%`, bytes, temps, hostnames, ports) in
`font-mono tabular-nums` (the system-stats/docker widgets partly do this — make it
uniform).

### 6. Quick links + header + dialogs
- Quick-link items: `rounded-lg` → keep, drop `shadow-sm`, rely on border; align
  padding to the chip rhythm.
- Header (`src/components/header.tsx`) and dialogs (`ui/dialog.tsx` already
  `rounded-lg` — good): confirm radius/spacing match; nudge only if they stand out.

## Spacing rhythm (apply globally)
Collapse to a small scale: **`gap-2` inside a row, `gap-3`/`gap-4` between sections,
`p-3`/`p-4` inside panels.** No `gap-6`/`py-6`/`p-6` on dashboard surfaces (dialogs
may keep a bit more breathing room).

## Guardrails
- Keep all component logic, props, handlers, data-testids.
- Tokens only — no new colors; reuse `--color-*`, `--radius`, `card-elevation`,
  `panel-label`, `status-dot`, status/semantic colors.
- Must read correctly in light AND dark; no horizontal page scroll.

## Deliverable
1. A short **audit** listing every surface touched and its before/after (radius,
   padding, header, elevation).
2. Mock **before/after** of: an app-card grid, a widget, the quick-links bar, and
   the table+sidebar together on one screen — proving they now read as one system.
3. Then apply.
