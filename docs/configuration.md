# Configuration reference

All configuration is through environment variables. Copy [`.env.example`](../.env.example)
to `.env` and fill it in. In production, set these on your host (Coolify, Docker,
systemd, etc.) rather than shipping a `.env` file.

## Environment variables

| Variable | Required | Kind | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | runtime | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/db`. |
| `BETTER_AUTH_SECRET` | ✅ | runtime (secret) | Signs and encrypts sessions. Use a long random value; **rotating it logs everyone out.** |
| `BETTER_AUTH_URL` | prod | runtime | Public origin used to build auth redirect/callback URLs, e.g. `https://appmap.example.com`. Falls back to `http://localhost:4175`. |
| `TRUSTED_ORIGINS` | prod | runtime | Comma-separated origins allowed to make authenticated requests (LAN + public domain). e.g. `https://appmap.example.com,http://10.0.0.5:4175`. |
| `AUTHENTIK_CLIENT_ID` | SSO | runtime | OAuth2 client ID from your Authentik provider. |
| `AUTHENTIK_CLIENT_SECRET` | SSO | runtime (secret) | OAuth2 client secret from your Authentik provider. |
| `AUTHENTIK_DISCOVERY_URL` | SSO | runtime | `https://<authentik-host>/application/o/<app-slug>/.well-known/openid-configuration`. |
| `VITE_AUTHENTIK_ENABLED` | SSO | **build** | Set to `"true"` to render the "Sign in with Authentik" button. Inlined at build time — see the warning below. |
| `PORT` | — | runtime | Port the production server listens on. Defaults to `3000`. |
| `NODE_ENV` | — | runtime | `production` in deployed environments; set automatically in most hosts. |

### Runtime vs. build variables ⚠️

There are two kinds of variables and they are **not interchangeable**:

- **Runtime** variables (everything except `VITE_*`) are read when the server
  starts. Changing one only needs a **restart**.
- **Build** variables — anything starting with `VITE_` — are read by Vite during
  `npm run build` and **baked into the client JavaScript bundle**. They cannot be
  changed at runtime. Changing one needs a full **rebuild**.

The single most common SSO mistake is setting `VITE_AUTHENTIK_ENABLED=true` as a
runtime-only variable and wondering why the login button never appears. If you use
Docker or Coolify, it must be passed as a **build argument** — see the
[deployment guide](./deployment.md#build-time-flags).

## Minimal local `.env`

```bash
DATABASE_URL="postgresql://appmap:appmap@localhost:5432/appmap"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
```

## Minimal production `.env`

```bash
DATABASE_URL="postgresql://appmap:strongpass@db:5432/appmap"
BETTER_AUTH_SECRET="<a long random secret>"
BETTER_AUTH_URL="https://appmap.example.com"
TRUSTED_ORIGINS="https://appmap.example.com"
PORT="3000"
```

Add the `AUTHENTIK_*` + `VITE_AUTHENTIK_ENABLED` block only if you want SSO
(see the [Authentik guide](./authentik-sso.md)).

## Database & migrations

The schema lives in `src/database/schema`; generated migrations live in `drizzle/`.

```bash
npm run db:push        # apply the current schema to the database (dev + first deploy)
npm run db:generate    # generate a migration file from schema changes
```

`db:push` diffs your schema against the live database and applies the difference.
On a fresh database it creates every table. If it prompts about whether an enum is
**created** or **renamed**, choose **create** unless you know you're renaming one.

**Troubleshooting**

- *Connection errors* — verify `DATABASE_URL`, network access to the host, and that
  the database is running.
- *Permission errors* — the database user needs `CREATE TABLE`, `CREATE TYPE`, and
  `CREATE INDEX`.
- *"No changes"* — the schema is already applied; nothing to do.
