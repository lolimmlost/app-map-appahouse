# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Documentation
- Added a **`docs/`** guide set: quick start, configuration reference, deployment
  (Docker / Compose / Coolify), Authentik SSO (admin UI + API), and an FAQ.
- Added **`CONTRIBUTING.md`** and linked the guides from the README and the issue
  chooser.

## [1.0.0] - 2026-08-18

First stable release — a self-hosted app dashboard and ops console for the
homelab.

### Authentication
- Email/password auth via Better Auth, with an account settings view.
- **Authentik SSO (OIDC)** as an optional sign-in method via Better Auth
  `genericOAuth`, gated behind `VITE_AUTHENTIK_ENABLED` so it's off unless
  configured. Signing in with Authentik links to an existing account by email,
  and lands you on the dashboard.

### Apps & dashboard
- App cards with separate **local and remote URLs**, health status, and quick
  actions; grid **and** table (porttracker-style) views with a toggle.
- **Drag-and-drop reordering** for apps and widgets.
- Pinned-apps **quick links bar**, bulk actions, and a share dialog.
- **Service auto-discovery** and right-click context menus.
- **Dependency graph** view for visualizing relationships between apps.
- Ops-console shell with a left system sidebar and cross-dashboard filters.

### Widgets
- System stats (CPU / RAM / disk), Weather, Docker containers, TrueNAS,
  Uptime Kuma, Jellyfin, and *arr service widgets.
- Widget **resizing** and responsive grid layout; denser, more scannable
  panels with monospaced stat values.

### Integrations & search
- **SearXNG** search integration with a web-search escape hatch in the command
  palette.
- Configurable **link groups** / quick links.
- HTTP/HTTPS toggle for integration URLs.

### Analytics & status
- Analytics page brought into the ops-console visual language.
- Status pages support.

### Platform & deployment
- **Docker / Coolify** deployment (multi-stage build, Nitro server output).
- Zod validation on server functions; Dependabot for dependency updates.
- Command palette, "What's new" changelog surface, light/dark + custom themes,
  and broad mobile-responsiveness work.

[1.0.0]: https://github.com/lolimmlost/app-map-appahouse/releases/tag/v1.0.0
