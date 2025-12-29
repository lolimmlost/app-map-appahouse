/**
 * Lazy database loader for server functions.
 * This ensures the database module is only imported when actually needed,
 * preventing it from being bundled into the client.
 */

let cachedDb: Awaited<typeof import("@/database/db.server")> | null = null;

export async function getDb() {
    if (!cachedDb) {
        cachedDb = await import("@/database/db.server");
    }
    return cachedDb.db;
}

export async function getDbModule() {
    if (!cachedDb) {
        cachedDb = await import("@/database/db.server");
    }
    return cachedDb;
}
