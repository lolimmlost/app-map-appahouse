# Authentik single sign-on (SSO)

App Map has optional [Authentik](https://goauthentik.io) SSO via OpenID Connect,
built on Better Auth's `genericOAuth` provider (provider id `authentik`). It's off
by default: with no `AUTHENTIK_*` variables set, the app runs on email/password
with no code change.

Signing in with Authentik links to an existing account with the same email (or
creates one) and drops the user straight on the dashboard.

**What you'll end up with:** four values to set on App Map —
`AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`, `AUTHENTIK_DISCOVERY_URL`, and the
build flag `VITE_AUTHENTIK_ENABLED=true`.

Throughout, substitute your own hosts:

| Placeholder | Meaning | Example |
|---|---|---|
| `<authentik-host>` | your Authentik base URL | `https://auth.example.com` |
| `<app-url>` | App Map's public origin | `https://appmap.example.com` |
| `<app-slug>` | the Authentik application slug you choose | `appmap` |

The **redirect URI** App Map expects (register it exactly) is:

```
<app-url>/api/auth/oauth2/callback/authentik
```

The **discovery URL** you'll hand back to App Map is:

```
<authentik-host>/application/o/<app-slug>/.well-known/openid-configuration
```

---

## Option A — Authentik admin UI

1. **Providers → Create → OAuth2/OpenID Provider.**
   - Name: `App Map`
   - Authorization flow: `default-provider-authorization-implicit-consent`
     (or the explicit-consent flow if you want a consent screen)
   - Client type: **Confidential**
   - Redirect URIs: add `<app-url>/api/auth/oauth2/callback/authentik` with
     **Strict** matching mode
   - Signing key: pick any certificate keypair that has a private key — this is
     **required** so the discovery document exposes a JWKS and signs the id_token
   - Scopes: ensure `openid`, `email`, and `profile` are included
2. **Applications → Create.**
   - Name: `App Map`, Slug: `<app-slug>`
   - Provider: the provider you just created
   - Launch URL (optional): `<app-url>/auth/sign-in`
3. **Copy the credentials** from the provider page: `Client ID` and `Client Secret`.

That's the four values. Jump to [set them on App Map](#set-the-values-on-app-map).

---

## Option B — Authentik API (scriptable)

If you provision Authentik from automation, the same result via `curl` + `jq`.
You need a superuser **API token** (Directory → Tokens & App passwords → Create,
intent **API**).

```bash
#!/usr/bin/env bash
set -euo pipefail

AUTHENTIK_URL="https://auth.example.com"     # <authentik-host>
AUTHENTIK_API_TOKEN="REPLACE_ME"
APP_URL="https://appmap.example.com"         # <app-url>
APP_NAME="App Map"
APP_SLUG="appmap"                            # <app-slug>

REDIRECT_URI="${APP_URL%/}/api/auth/oauth2/callback/authentik"

api() { local m=$1 p=$2; shift 2
  curl -sS -X "$m" "${AUTHENTIK_URL%/}${p}" \
    -H "Authorization: Bearer ${AUTHENTIK_API_TOKEN}" \
    -H "Content-Type: application/json" "$@"; }

# 1. Authorization flow
AUTH_FLOW=$(api GET "/api/v3/flows/instances/?slug=default-provider-authorization-implicit-consent" \
  | jq -r '.results[0].pk // empty')

# 2. Invalidation flow (required on Authentik 2024.8+, harmless earlier)
INVAL_FLOW=$(api GET "/api/v3/flows/instances/?designation=invalidation&ordering=slug" \
  | jq -r '.results[0].pk // empty')

# 3. OIDC scope mappings: openid, email, profile
SCOPES=$(api GET "/api/v3/propertymappings/provider/scope/?page_size=100")
SCOPE_PKS=$(echo "$SCOPES" | jq -c \
  '[.results[] | select(.scope_name=="openid" or .scope_name=="email" or .scope_name=="profile") | .pk]')

# 4. A signing key (must have a private key)
SIGNING_KEY=$(api GET "/api/v3/crypto/certificatekeypairs/?has_key=true&ordering=name" \
  | jq -r '.results[0].pk // empty')

# 5. Create the provider
BODY=$(jq -n --arg name "$APP_NAME" --arg af "$AUTH_FLOW" --arg inf "$INVAL_FLOW" \
  --arg ru "$REDIRECT_URI" --arg sk "$SIGNING_KEY" --argjson pm "$SCOPE_PKS" \
  '{ name:$name, client_type:"confidential", authorization_flow:$af,
     redirect_uris:[{matching_mode:"strict", url:$ru}], property_mappings:$pm,
     signing_key:$sk, sub_mode:"hashed_user_id", include_claims_in_id_token:true }
   + (if $inf!="" then {invalidation_flow:$inf} else {} end)')
PROVIDER_PK=$(api POST "/api/v3/providers/oauth2/" -d "$BODY" | jq -r '.pk')

# 6. Create the application bound to the provider
api POST "/api/v3/core/applications/" -d "$(jq -n \
  --arg name "$APP_NAME" --arg slug "$APP_SLUG" --argjson prov "$PROVIDER_PK" \
  --arg launch "${APP_URL%/}/auth/sign-in" \
  '{ name:$name, slug:$slug, provider:$prov, meta_launch_url:$launch }')" >/dev/null

# 7. Read back the credentials
CREDS=$(api GET "/api/v3/providers/oauth2/${PROVIDER_PK}/")
echo "AUTHENTIK_CLIENT_ID=$(echo "$CREDS" | jq -r '.client_id')"
echo "AUTHENTIK_CLIENT_SECRET=$(echo "$CREDS" | jq -r '.client_secret')"
echo "AUTHENTIK_DISCOVERY_URL=${AUTHENTIK_URL%/}/application/o/${APP_SLUG}/.well-known/openid-configuration"
echo "VITE_AUTHENTIK_ENABLED=true"
```

> **Version note:** Authentik ≥ 2024.4 expects `redirect_uris` as an array of
> `{ matching_mode, url }` objects (as above). Older versions expect a
> newline-delimited string. On older instances, `propertymappings/provider/scope/`
> may instead be `propertymappings/scope/`.

### Multiple origins

If App Map answers on more than one origin (public + LAN), register every callback
on the provider — the client id/secret and discovery URL don't change:

```bash
api PATCH "/api/v3/providers/oauth2/${PROVIDER_PK}/" -d '{
  "redirect_uris": [
    { "matching_mode": "strict", "url": "https://appmap.example.com/api/auth/oauth2/callback/authentik" },
    { "matching_mode": "strict", "url": "http://10.0.0.5:4175/api/auth/oauth2/callback/authentik" }
  ]
}'
```

---

## Set the values on App Map

Set these on the App Map service:

| Variable | Value | Kind |
|---|---|---|
| `AUTHENTIK_CLIENT_ID` | from above | runtime |
| `AUTHENTIK_CLIENT_SECRET` | from above | runtime (secret) |
| `AUTHENTIK_DISCOVERY_URL` | `<authentik-host>/application/o/<app-slug>/.well-known/openid-configuration` | runtime |
| `VITE_AUTHENTIK_ENABLED` | `true` | **build** — baked into the client bundle |

Then **rebuild** (not just restart). `VITE_AUTHENTIK_ENABLED` is inlined at build
time, so the button only appears in a freshly built bundle. See
[deployment → build-time flags](./deployment.md#build-time-flags). The three
`AUTHENTIK_*` secrets are runtime-only and a restart is enough for them alone — but
the first time you turn SSO on you need the rebuild for the flag.

---

## Access control

> **Important:** App Map's protected routes require a session but do **not** check
> roles or groups. Anyone Authentik authenticates gets full access.

Your allowlist is the Authentik **application binding**:

- An application with **no policy bindings** lets in *everyone* who can
  authenticate to Authentik.
- To restrict, bind the application to a group. Once any binding exists,
  non-matching users are denied at Authentik before a session is ever created.

```bash
GROUP_PK=$(api GET "/api/v3/core/groups/?name=appmap-users" | jq -r '.results[0].pk')
APP_PK=$(api GET "/api/v3/core/applications/?slug=appmap" | jq -r '.results[0].pk')
api POST "/api/v3/policies/bindings/" -d "$(jq -n --arg t "$APP_PK" --arg g "$GROUP_PK" \
  '{ target:$t, group:$g, order:0, enabled:true }')"
```

---

## Verify it works

1. **Discovery document resolves and is signed:**
   ```bash
   curl -sS "<authentik-host>/application/o/<app-slug>/.well-known/openid-configuration" \
     | jq '{issuer, authorization_endpoint, token_endpoint, jwks_uri}'
   ```
   All four fields should be present. Empty or 404 → wrong slug, or the application
   isn't bound to the provider.
2. **End to end:** open `<app-url>/auth/sign-in` → the **"Sign in with Authentik"** button
   should appear → click it → authenticate at Authentik → land back on the App Map
   dashboard, signed in.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| No Authentik button on the login page | `VITE_AUTHENTIK_ENABLED` wasn't a **build** arg, or you restarted instead of rebuilding. |
| Button appears, but clicking errors at Authentik | Redirect URI mismatch — it must be `<app-url>/api/auth/oauth2/callback/authentik`, strict match. |
| `invalid_client` / token errors | Wrong `AUTHENTIK_CLIENT_ID`/`SECRET`, or provider isn't confidential. |
| id_token verification fails | Provider has no signing key — attach a keypair with a private key. |
| Discovery URL 404s | Wrong `<app-slug>`, or the application isn't bound to the provider. |
| "Access denied" for some users | An application group binding exists and they're not in the group (this is the allowlist working). |

## Turn it off / roll back

Unset (or set to `false`) `VITE_AUTHENTIK_ENABLED` and remove the `AUTHENTIK_*`
variables, then rebuild. App Map falls back to email/password with no code change.
To remove the Authentik side, delete the application and provider:

```bash
APP_PK=$(api GET "/api/v3/core/applications/?slug=appmap" | jq -r '.results[0].pk')
api DELETE "/api/v3/core/applications/${APP_PK}/"
api DELETE "/api/v3/providers/oauth2/${PROVIDER_PK}/"
```
