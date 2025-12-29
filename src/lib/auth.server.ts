import { serverOnly$ } from "vite-env-only/macros";
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { db } from "@/database/db.server"
import * as schema from "@/database/schema"

// Ensure this module is never imported on the client
const _serverOnly = serverOnly$(true);

// Parse trusted origins from environment variable (comma-separated)
const trustedOrigins = process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:4175'];

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
    }
})
