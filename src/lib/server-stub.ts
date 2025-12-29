/**
 * This file provides empty stubs for server-only modules when bundled for the client.
 * The actual implementations are in the .server.ts files.
 */

// Empty exports - these will be replaced with actual implementations on the server
export const db = null
export const pool = null
export const auth = null

// Type exports for client-side type checking
export type { App, Category, Tag, Integration, Widget, AlertRule } from "@/types/database"
