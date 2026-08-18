import { serverOnly$ } from "vite-env-only/macros";
import { betterAuth, type BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { genericOAuth } from "better-auth/plugins"

import { db } from "@/database/db.server"
import * as schema from "@/database/schema"

// Ensure this module is never imported on the client
const _serverOnly = serverOnly$(true);

// Parse trusted origins from environment variable (comma-separated)
// e.g. TRUSTED_ORIGINS=https://appmap.appahouse.com,http://localhost:4175
const trustedOrigins = process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : [];

// Optional Authentik (OIDC) SSO via Better Auth's genericOAuth plugin.
// Enabled only when all three env vars are present, so email/password-only
// deployments keep working without any Authentik config.
// Redirect URI to register in Authentik (strict): ${BETTER_AUTH_URL}/api/auth/oauth2/callback/authentik
const plugins: BetterAuthPlugin[] = [];
const authentikClientId = process.env.AUTHENTIK_CLIENT_ID;
const authentikClientSecret = process.env.AUTHENTIK_CLIENT_SECRET;
const authentikDiscoveryUrl = process.env.AUTHENTIK_DISCOVERY_URL;
if (authentikClientId && authentikClientSecret && authentikDiscoveryUrl) {
    plugins.push(
        genericOAuth({
            config: [
                {
                    providerId: "authentik",
                    clientId: authentikClientId,
                    clientSecret: authentikClientSecret,
                    discoveryUrl: authentikDiscoveryUrl,
                    scopes: ["openid", "email", "profile"],
                },
            ],
        })
    );
}

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4175',
    trustedOrigins,
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema
    }),
    emailAndPassword: {
        enabled: true
    },
    plugins
})
