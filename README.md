# App Map

A self-hosted **app dashboard and ops console** for the homelab — one place to see
your services, their health, and live metrics, with widgets for the tools you already
run (Uptime Kuma, Docker, TrueNAS, Jellyfin, the *arr stack, and more).

Built with TanStack Start, React, and Better Auth. Deploys as a single container.

> Status: **v1.0.0** — first stable release. See [`CHANGELOG.md`](./CHANGELOG.md).

---

## Features

- **App catalog** — cards with separate local/remote URLs, health status, and quick
  actions; grid **and** table (porttracker-style) views with real metrics.
- **Drag-and-drop** reordering for apps and widgets, pinned quick-links bar, bulk
  actions, and a share dialog.
- **Service auto-discovery**, right-click context menus, and a **dependency graph**.
- **Widgets** — system stats (CPU/RAM/disk), weather, Docker, TrueNAS, Uptime Kuma,
  Jellyfin, and *arr services; resizable and responsive.
- **Search & links** — SearXNG integration with a command-palette web-search escape
  hatch, plus configurable link groups.
- **Analytics** and **status pages**.
- **Auth** — email/password via Better Auth, with **optional Authentik SSO (OIDC)**.

---

## Tech stack

| | |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (Nitro server) + React |
| Routing | [TanStack Router](https://tanstack.com/router) (file-based) |
| Data | [TanStack Query](https://tanstack.com/query) |
| Auth | [Better Auth](https://better-auth.com) + [better-auth-ui](https://better-auth-ui.com) |
| Database | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team) |
| Styling | Tailwind CSS |
| Tooling | Vite, [Biome](https://biomejs.dev), Vitest, Playwright |

Requires **Node 22** (see `.nvmrc`) and a **PostgreSQL** database.

---

## Getting started

```bash
# 1. Install dependencies
npm ci

# 2. Configure environment
cp .env.example .env
#    then edit .env — at minimum set DATABASE_URL and BETTER_AUTH_SECRET

# 3. Apply the database schema
npm run db:push

# 4. Run the dev server (http://localhost:4175)
npm run dev
```

### Build & run for production

```bash
npm run build
npm start          # serves the Nitro output on PORT (default 3000)
```

---

## Configuration

All configuration is via environment variables. Copy `.env.example` and fill it in.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. |
| `BETTER_AUTH_SECRET` | ✅ | Secret used to sign sessions. Generate a long random value. |
| `BETTER_AUTH_URL` | prod | Public origin used to build auth redirect/callback URLs. Falls back to `http://localhost:4175`. |
| `TRUSTED_ORIGINS` | prod | Comma-separated trusted origins (LAN + public domain). |
| `AUTHENTIK_CLIENT_ID` | SSO | OAuth2 client ID from Authentik. |
| `AUTHENTIK_CLIENT_SECRET` | SSO | OAuth2 client secret from Authentik. |
| `AUTHENTIK_DISCOVERY_URL` | SSO | `https://<authentik-host>/application/o/<app-slug>/.well-known/openid-configuration` |
| `VITE_AUTHENTIK_ENABLED` | SSO | **Build-time** flag (`"true"`) that shows the Authentik button on the login screen. |

### Authentik SSO (optional)

SSO is off unless configured. The three server-side `AUTHENTIK_*` vars enable the
provider; when any is missing the app falls back to email/password with no code
change. The login button is gated on `VITE_AUTHENTIK_ENABLED`, which is **baked into
the client bundle at build time** — set it as a *build* variable, not a runtime one.

Register this redirect URI in the Authentik OAuth2 provider (strict match):

```
${BETTER_AUTH_URL}/api/auth/oauth2/callback/authentik
```

> **Access control:** protected routes require a session but do not check roles —
> anyone Authentik authenticates can use the app. Restrict access with an Authentik
> **Application → group binding**.

---

## Deployment

Ships as a multi-stage **Docker** image (`Dockerfile`) producing a Nitro server
bundle, suitable for Coolify, Docker Compose, or any container host. A
`docker-compose.yml` is included for local/simple deployments.

Build-time public flags (anything `VITE_*`) must be passed as Docker **build args** —
they are inlined by Vite during `npm run build`, not read at runtime.

---

## Database migrations

Schema lives in `src/database/schema` and migrations in `drizzle/`.

```bash
npm run db:push       # push the current schema to the database
npx drizzle-kit generate   # generate a migration from schema changes
```

---

## Testing

```bash
npm test              # unit + integration (Vitest)
npm run test:e2e      # end-to-end (Playwright)
npm run check         # Biome lint + format check
```

---

## Contributing

Issues and pull requests are welcome — see
[`.github/`](./.github) for bug-report and feature-request templates. Please run
`npm run check` before opening a PR. Security reports: see [`SECURITY.md`](./SECURITY.md).

## License

[MIT](./LICENSE) © AppaHouse
