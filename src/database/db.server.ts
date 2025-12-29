import { serverOnly$ } from "vite-env-only/macros";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import * as schema from "./schema";

// Ensure this module is never imported on the client
const _serverOnly = serverOnly$(true);

// Custom error class for database-related errors
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Validate DATABASE_URL environment variable
function validateDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new DatabaseError(
      "DATABASE_URL environment variable is not set. Please configure your database connection.",
      "MISSING_ENV"
    );
  }

  if (typeof databaseUrl !== "string" || databaseUrl.trim() === "") {
    throw new DatabaseError(
      "DATABASE_URL environment variable is empty or invalid.",
      "INVALID_ENV"
    );
  }

  // Basic URL format validation for PostgreSQL connection strings
  const postgresUrlPattern = /^postgres(ql)?:\/\/.+/i;
  if (!postgresUrlPattern.test(databaseUrl)) {
    throw new DatabaseError(
      "DATABASE_URL must be a valid PostgreSQL connection string (starting with postgres:// or postgresql://).",
      "INVALID_FORMAT"
    );
  }

  return databaseUrl;
}

// Validate and sanitize prepared statement parameters
export function validatePreparedStatementParams(params: unknown[]): void {
  for (let i = 0; i < params.length; i++) {
    const param = params[i];

    // Check for null prototype objects (potential prototype pollution)
    if (param !== null && typeof param === "object" && Object.getPrototypeOf(param) === null) {
      throw new DatabaseError(
        `Invalid parameter at index ${i}: null prototype objects are not allowed`,
        "INVALID_PARAM"
      );
    }

    // Check for functions (should never be passed to prepared statements)
    if (typeof param === "function") {
      throw new DatabaseError(
        `Invalid parameter at index ${i}: functions are not allowed as query parameters`,
        "INVALID_PARAM"
      );
    }

    // Check for symbols (not serializable)
    if (typeof param === "symbol") {
      throw new DatabaseError(
        `Invalid parameter at index ${i}: symbols are not allowed as query parameters`,
        "INVALID_PARAM"
      );
    }

    // Deep check for nested objects/arrays to prevent injection
    if (typeof param === "object" && param !== null) {
      validateNestedObject(param, i);
    }
  }
}

// Recursively validate nested objects for potential security issues
function validateNestedObject(obj: object, paramIndex: number, depth = 0): void {
  // Prevent deeply nested objects that could cause stack overflow
  if (depth > 10) {
    throw new DatabaseError(
      `Invalid parameter at index ${paramIndex}: object nesting too deep (max 10 levels)`,
      "INVALID_PARAM"
    );
  }

  // Check for __proto__ or constructor pollution attempts
  if ("__proto__" in obj || "constructor" in obj) {
    const keys = Object.keys(obj);
    if (keys.includes("__proto__") || keys.includes("constructor")) {
      throw new DatabaseError(
        `Invalid parameter at index ${paramIndex}: potential prototype pollution detected`,
        "SECURITY_VIOLATION"
      );
    }
  }

  // Recursively check nested objects/arrays
  for (const value of Object.values(obj)) {
    if (typeof value === "function") {
      throw new DatabaseError(
        `Invalid parameter at index ${paramIndex}: nested functions are not allowed`,
        "INVALID_PARAM"
      );
    }
    if (typeof value === "object" && value !== null) {
      validateNestedObject(value, paramIndex, depth + 1);
    }
  }
}

// Create a connection pool with error handling
function createConnectionPool(): Pool {
  const databaseUrl = validateDatabaseUrl();

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Fail fast if can't connect in 10 seconds
  });

  // Handle pool-level errors
  pool.on("error", (err: Error) => {
    console.error("Unexpected database pool error:", err);
  });

  return pool;
}

// Initialize connection pool
let pool: Pool;
try {
  pool = createConnectionPool();
} catch (error) {
  console.error("Failed to initialize database connection pool:", error);
  throw error;
}

// Create drizzle instance with the pool
export const db: NodePgDatabase<typeof schema> = drizzle({ client: pool, schema });

// Export pool for advanced use cases (e.g., transactions with error handling)
export { pool };

// Health check function to validate database connectivity
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  let client: PoolClient | null = null;

  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    const latency = Date.now() - startTime;

    return {
      connected: true,
      latency,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    console.error("Database connection check failed:", errorMessage);

    return {
      connected: false,
      error: errorMessage,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Graceful shutdown function for cleanup
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    console.log("Database connection pool closed successfully");
  } catch (error) {
    console.error("Error closing database connection pool:", error);
    throw new DatabaseError(
      "Failed to close database connection pool",
      "SHUTDOWN_ERROR",
      error instanceof Error ? error : undefined
    );
  }
}
