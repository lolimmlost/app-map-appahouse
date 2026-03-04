import { getRequest } from "@tanstack/react-start/server";
import { Errors } from "./errors";

/**
 * Session type from better-auth
 * Note: We define this manually to avoid importing auth at the module level
 */
export type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
} | null;

/**
 * Authenticated session with a guaranteed user
 */
export type AuthenticatedSession = NonNullable<AuthSession> & {
  user: NonNullable<NonNullable<AuthSession>["user"]>;
};

/**
 * Get the current session from the request headers.
 * This is a centralized utility for retrieving the session in server functions.
 * Uses dynamic import to prevent bundling auth/db into the client.
 *
 * @returns The session object or null if not authenticated
 */
export async function getSession(): Promise<AuthSession> {
  const { auth } = await import("@/lib/auth.server");
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

/**
 * Get the authenticated session or throw an AuthenticationError.
 * Use this for endpoints that require authentication.
 *
 * @throws AuthenticationError if not authenticated
 * @returns The authenticated session with a guaranteed user
 */
export async function getAuthenticatedSession(): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (!session?.user) {
    throw Errors.unauthorized();
  }
  return session as AuthenticatedSession;
}

/**
 * Get the session for optional authentication.
 * Use this for endpoints that work with or without authentication.
 *
 * @returns The session if authenticated, null otherwise
 */
export async function getOptionalSession(): Promise<AuthenticatedSession | null> {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  return session as AuthenticatedSession;
}
