/**
 * Lazy database loader for server functions.
 *
 * IMPORTANT: This file should ONLY be imported inside createServerFn handlers,
 * never at the module top-level. This ensures pg is not bundled for the client.
 *
 * Usage inside a server function handler:
 *   const { db, schema, orm } = await import("./db");
 */

// Re-export everything needed from the database
export { db, pool } from "@/database/db.server";
export * as schema from "@/database/schema";

// Re-export commonly used drizzle-orm functions
export {
    eq,
    and,
    or,
    asc,
    desc,
    inArray,
    isNotNull,
    isNull,
    gte,
    lte,
    lt,
    sql
} from "drizzle-orm";
