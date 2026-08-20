# Deployment

App Map ships as a single **multi-stage Docker image** built from the
[`Dockerfile`](../Dockerfile). It produces a [Nitro](https://nitro.build) server
bundle and serves on `PORT` (default **3000**). Any container host works —
Coolify, Docker Compose, Kubernetes, or plain `docker run`.

Before you start, have a PostgreSQL database reachable from the container and the
values from the [configuration reference](./configuration.md) ready.

## Build-time flags ⚠️

Public flags — anything starting with `VITE_` — are **inlined into the client
bundle by Vite during the build**. They are *not* read at runtime. You must pass
them as Docker **build arguments**, or the feature they gate will be missing from
the shipped bundle no matter what you set at runtime.

The `Dockerfile` declares each one as an `ARG`/`ENV` pair before `npm run build`:

```dockerfile
ARG VITE_AUTHENTIK_ENABLED
ENV VITE_AUTHENTIK_ENABLED=$VITE_AUTHENTIK_ENABLED
```

So a build that enables the Authentik button looks like:

```bash
docker build --build-arg VITE_AUTHENTIK_ENABLED=true -t appmap .
```

## Docker (standalone)

```bash
# Build (add --build-arg VITE_AUTHENTIK_ENABLED=true for SSO)
docker build -t appmap .

# Run
docker run -d --name appmap -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/appmap" \
  -e BETTER_AUTH_SECRET="<long random secret>" \
  -e BETTER_AUTH_URL="https://appmap.example.com" \
  -e TRUSTED_ORIGINS="https://appmap.example.com" \
  appmap
```

Run `npm run db:push` against the database once before first boot (or from inside
the container) to create the schema.

## Docker Compose

A [`docker-compose.yml`](../docker-compose.yml) is included for local or simple
deployments — it defines an `app-map` service and a `postgres` service. Copy
`.env.example` to `.env`, fill it in, then:

```bash
docker compose up -d --build app-map postgres
```

For SSO, pass the build arg through Compose on the `app-map` service:

```yaml
services:
  app-map:
    build:
      context: .
      args:
        VITE_AUTHENTIK_ENABLED: "true"
```

## Coolify

App Map deploys cleanly on Coolify with the **Dockerfile** build pack.

1. **Build pack:** choose **Dockerfile** (not Nixpacks — see the note below).
2. **Port:** expose **3000**.
3. **Environment variables:** set the runtime values —
   `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TRUSTED_ORIGINS`,
   and the three `AUTHENTIK_*` secrets if using SSO.
4. **Build variables:** set `VITE_AUTHENTIK_ENABLED=true` as a **build** variable
   (Coolify passes it as a Docker build arg). A runtime-only value will not work.
5. **Deploy.** A code change or a changed `VITE_*` flag needs a full **rebuild**;
   a changed runtime secret only needs a **restart**.

> **Nixpacks note:** if you started on the Nixpacks build pack and the build fails
> pulling a Node version, switch to **Dockerfile** and remove any
> `NIXPACKS_NODE_VERSION` variable. The repo `Dockerfile` pins Node 22 and handles
> the whole build, so there's nothing to configure.

## After deploying

- Visit your public URL and create the first account.
- Restrict who can sign in — if you enabled Authentik, bind the application to a
  group (see [Authentik SSO → access control](./authentik-sso.md#access-control)).
  Protected routes require a session but do **not** check roles, so Authentik's
  application binding is your allowlist.
- Confirm health checks: the server responds on `PORT` once Nitro has booted.
