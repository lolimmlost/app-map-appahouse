# FAQ & troubleshooting

Common questions and the fixes for the things people hit most often. If your issue
isn't here, search the [issues](https://github.com/lolimmlost/app-map-appahouse/issues)
or open a [bug report](https://github.com/lolimmlost/app-map-appahouse/issues/new/choose).

## General

**What is App Map?**
A self-hosted dashboard and ops console for a homelab — one place to see your
services, their health, and live metrics, with widgets for tools you already run
(Uptime Kuma, Docker, TrueNAS, Jellyfin, the *arr stack, and more).

**Is it multi-user?**
Yes — it uses [Better Auth](https://better-auth.com) with email/password and
optional Authentik SSO. Each user's apps and layout are their own.

**Does it have roles / admins?**
No. Protected routes require a signed-in session but don't check roles. If you need
to restrict *who* can sign in, put App Map behind Authentik and use an application
group binding — see [access control](./authentik-sso.md#access-control).

**Where does it store data?**
PostgreSQL. Nothing app-specific is kept on the filesystem, so back up the database.

## Setup

**What do I actually need to run it?**
Node 22 and a PostgreSQL 14+ database. That's it — see the
[quick start](./quick-start.md).

**Which port does it run on?**
`4175` in development (`npm run dev`). In production the Nitro server listens on
`PORT`, default `3000`.

**`npm run db:push` asks whether an enum is created or renamed — which do I pick?**
On a fresh database, choose **create**. Only pick rename if you're deliberately
renaming an existing enum.

**I get a database connection error.**
Check `DATABASE_URL`, that the host is reachable from where the app runs, and that
the database is up. In Docker, `localhost` inside the container is *not* your host —
use the service name or host IP.

## Authentication & SSO

**The "Sign in with Authentik" button doesn't appear.**
`VITE_AUTHENTIK_ENABLED` is a **build-time** flag baked into the client bundle. If
you set it as a runtime variable, or you restarted instead of rebuilding, the button
won't be there. Pass it as a Docker **build arg** and rebuild. Full details:
[build-time flags](./deployment.md#build-time-flags).

**I log in with Authentik but land back on the login page.**
Make sure you're on a build that includes the post-login redirect fix (v1.0.0+) and
that `BETTER_AUTH_URL` matches the origin you're actually visiting. A mismatch
between `BETTER_AUTH_URL` / `TRUSTED_ORIGINS` and the real URL breaks the session
hand-off.

**Authentik login errors with a redirect mismatch.**
The redirect URI registered in Authentik must be exactly
`<app-url>/api/auth/oauth2/callback/authentik` with strict matching. See the
[Authentik guide](./authentik-sso.md).

**Can I use a different OIDC provider (Keycloak, Auth0, …)?**
The current build wires up Authentik specifically via Better Auth's `genericOAuth`
plugin. Other OIDC providers are close but not turnkey today — open a feature
request if you want one.

## Deployment

**Restart vs. rebuild — what's the difference?**
Runtime variables (everything except `VITE_*`) take effect on a **restart**.
Build variables (`VITE_*`) are compiled into the client bundle and need a full
**rebuild**. When in doubt about a `VITE_` flag, rebuild.

**Coolify build fails on the Node version.**
Switch the build pack from Nixpacks to **Dockerfile** and remove any
`NIXPACKS_NODE_VERSION` variable. The repo `Dockerfile` pins Node 22.
See [deployment → Coolify](./deployment.md#coolify).

**Do I need to run migrations on every deploy?**
Only when the schema changed. `npm run db:push` is a no-op when the database already
matches the schema.

## Widgets & integrations

**A widget shows no data.**
Most widgets call an external service (Docker, Uptime Kuma, TrueNAS, Jellyfin, an
*arr app, a weather API). Check that service's URL/token in the widget settings and
that the service is reachable from the App Map server, not just your browser.

**Search isn't returning web results.**
Web search uses a [SearXNG](https://docs.searxng.org) instance you configure. Point
it at a reachable SearXNG URL; without one, only local app/link search works.

## Contributing & reporting

**How do I report a bug or request a feature?**
Use the [issue templates](https://github.com/lolimmlost/app-map-appahouse/issues/new/choose).
For security issues, **don't** open a public issue — see [`SECURITY.md`](../SECURITY.md).

**How do I contribute code?**
See [`CONTRIBUTING.md`](../CONTRIBUTING.md). In short: branch, run `npm run check`
and the tests, then open a PR.
