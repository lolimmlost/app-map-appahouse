# Quick start

Get App Map running locally in about five minutes. You need **Node 22** (see
[`.nvmrc`](../.nvmrc)) and a **PostgreSQL** database you can connect to.

> Just want to deploy it? Skip to the [deployment guide](./deployment.md).

## 1. Clone and install

```bash
git clone https://github.com/lolimmlost/app-map-appahouse.git
cd app-map-appahouse
npm ci
```

## 2. Get a database

App Map needs a PostgreSQL 14+ database. Any of these work:

- **Local Postgres** you already run — create an empty database and grab its URL.
- **Docker** — one command spins one up:
  ```bash
  docker run -d --name appmap-db \
    -e POSTGRES_USER=appmap -e POSTGRES_PASSWORD=appmap -e POSTGRES_DB=appmap \
    -p 5432:5432 postgres:16
  ```
  Connection string: `postgresql://appmap:appmap@localhost:5432/appmap`
- **A managed provider** (Neon, Supabase, etc.) — copy the connection string.

## 3. Configure the environment

```bash
cp .env.example .env
```

Open `.env` and set the two required values:

```bash
DATABASE_URL="postgresql://appmap:appmap@localhost:5432/appmap"
BETTER_AUTH_SECRET="paste-a-long-random-string-here"
```

Generate a secret with:

```bash
openssl rand -base64 32
```

Everything else in `.env` is optional for local development. See the
[configuration reference](./configuration.md) for the full list.

## 4. Create the schema

```bash
npm run db:push
```

This applies the Drizzle schema to your database. If prompted about creating
enums, choose the **create** option (press Enter). See
[database & migrations](./configuration.md#database--migrations) if you hit issues.

## 5. Run it

```bash
npm run dev
```

Open **http://localhost:4175**. Create an account with email + password on the
sign-up screen — the first account is a normal user; there is no separate admin
setup step.

## Next steps

- **Add your services** — click *Add app* and give each one a name, a local
  and/or remote URL, and an optional icon.
- **Turn on widgets** — system stats, Docker, Uptime Kuma, TrueNAS, Jellyfin, the
  *arr stack, and weather. Configure each from its widget settings.
- **Enable SSO** (optional) — wire up [Authentik single sign-on](./authentik-sso.md).
- **Deploy** — build a container and ship it with the [deployment guide](./deployment.md).

Stuck? Check the [FAQ & troubleshooting](./faq.md).
