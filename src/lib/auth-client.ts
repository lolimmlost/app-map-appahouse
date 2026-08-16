import { createAuthClient } from "better-auth/react"
import { genericOAuthClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: typeof window !== 'undefined'
        ? window.location.origin
        : process.env.BETTER_AUTH_URL || 'http://localhost:4175',
    plugins: [genericOAuthClient()]
})

export const { signIn, signOut, signUp, useSession } = authClient
