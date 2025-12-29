
🔧 Tool: Task
Input: {
  "description": "Explore codebase structure",
  "prompt": "I need to explore the codebase to understand its structure, particularly focusing on:\n1. Finding the db.ts file mentioned in the feature request\n2. Understanding the existing database connection patterns\n3. Looking at how error handling is done elsewhere in the codebase\n\nPlease search for:\n1. db.ts file(s) in the codebase\n2. Any database-related configuration files\n3. Existing error handling patterns\n\nReturn the file paths found and a summary of the current database implementation.",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/db.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/database*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.config.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.env*"
}

🔧 Tool: Grep
Input: {
  "pattern": "export.*error.*handler|catch.*Error|throw new Error",
  "output_mode": "files_with_matches",
  "type": "ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/drizzle.config.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/.env.example"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/src/database/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/src/lib/server/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/widgets.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/user-settings.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/categories.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/src/database/schema/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/health.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integrations.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema/apps.ts",
  "limit": 80
}

🔧 Tool: Bash
Input: {
  "command": "find /home/default/Desktop/dev/app-map-appahouse/src -type f -name \"*.ts\" -o -name \"*.tsx\" | head -20",
  "description": "List TypeScript files in src directory"
}

Now let me read the current db.ts file to see exactly what needs to be modified:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.ts"
}

Now let me look at how other parts of the codebase handle errors and check if there are any existing error handling utilities:

🔧 Tool: Glob
Input: {
  "pattern": "**/errors*.ts",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/utils*.ts",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/user-settings.ts"
}

Let me also check the project's package.json to see what testing framework is used and if playwright is installed:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/package.json"
}

🔧 Tool: Glob
Input: {
  "pattern": "playwright.config.*",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

The project uses Vitest for testing, not Playwright. Let me check for vitest config and look for existing tests to understand the testing patterns:

🔧 Tool: Glob
Input: {
  "pattern": "vitest.config.*",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.test.ts",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.spec.ts",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src"
}

Let me check for vite.config.ts which may include vitest configuration:

🔧 Tool: Glob
Input: {
  "pattern": "vite.config.*",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/vite.config.ts"
}

Now I have a good understanding of the codebase. Let me implement the feature - adding database connection error handling and prepared statement sanitization validation in db.ts.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Implement database connection error handling in db.ts",
      "status": "in_progress",
      "activeForm": "Implementing database connection error handling"
    },
    {
      "content": "Add prepared statement sanitization validation",
      "status": "pending",
      "activeForm": "Adding prepared statement sanitization validation"
    },
    {
      "content": "Create verification test for the new functionality",
      "status": "pending",
      "activeForm": "Creating verification test"
    },
    {
      "content": "Run tests and verify functionality",
      "status": "pending",
      "activeForm": "Running tests and verifying functionality"
    }
  ]
}

Now let me implement the enhanced db.ts with proper error handling and connection validation:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/db.ts",
  "old_string": "import { drizzle } from \"drizzle-orm/node-postgres\";\nimport * as schema from \"./schema\";\n\nexport const db = drizzle(process.env.DATABASE_URL!, { schema });",
  "new_string": "import { drizzle, type NodePgDatabase } from \"drizzle-orm/node-postgres\";\nimport { Pool, type PoolClient } from \"pg\";\nimport * as schema from \"./schema\";\n\n// Custom error class for database-related errors\nexport class DatabaseError extends Error {\n  constructor(\n    message: string,\n    public readonly code?: string,\n    public readonly cause?: Error\n  ) {\n    super(message);\n    this.name = \"DatabaseError\";\n  }\n}\n\n// Validate DATABASE_URL environment variable\nfunction validateDatabaseUrl(): string {\n  const databaseUrl = process.env.DATABASE_URL;\n\n  if (!databaseUrl) {\n    throw new DatabaseError(\n      \"DATABASE_URL environment variable is not set. Please configure your database connection.\",\n      \"MISSING_ENV\"\n    );\n  }\n\n  if (typeof databaseUrl !== \"string\" || databaseUrl.trim() === \"\") {\n    throw new DatabaseError(\n      \"DATABASE_URL environment variable is empty or invalid.\",\n      \"INVALID_ENV\"\n    );\n  }\n\n  // Basic URL format validation for PostgreSQL connection strings\n  const postgresUrlPattern = /^postgres(ql)?:\\/\\/.+/i;\n  if (!postgresUrlPattern.test(databaseUrl)) {\n    throw new DatabaseError(\n      \"DATABASE_URL must be a valid PostgreSQL connection string (starting with postgres:// or postgresql://).\",\n      \"INVALID_FORMAT\"\n    );\n  }\n\n  return databaseUrl;\n}\n\n// Validate and sanitize prepared statement parameters\nexport function validatePreparedStatementParams(params: unknown[]): void {\n  for (let i = 0; i < params.length; i++) {\n    const param = params[i];\n\n    // Check for null prototype objects (potential prototype pollution)\n    if (param !== null && typeof param === \"object\" && Object.getPrototypeOf(param) === null) {\n      throw new DatabaseError(\n        `Invalid parameter at index ${i}: null prototype objects are not allowed`,\n        \"INVALID_PARAM\"\n      );\n    }\n\n    // Check for functions (should never be passed to prepared statements)\n    if (typeof param === \"function\") {\n      throw new DatabaseError(\n        `Invalid parameter at index ${i}: functions are not allowed as query parameters`,\n        \"INVALID_PARAM\"\n      );\n    }\n\n    // Check for symbols (not serializable)\n    if (typeof param === \"symbol\") {\n      throw new DatabaseError(\n        `Invalid parameter at index ${i}: symbols are not allowed as query parameters`,\n        \"INVALID_PARAM\"\n      );\n    }\n\n    // Deep check for nested objects/arrays to prevent injection\n    if (typeof param === \"object\" && param !== null) {\n      validateNestedObject(param, i);\n    }\n  }\n}\n\n// Recursively validate nested objects for potential security issues\nfunction validateNestedObject(obj: object, paramIndex: number, depth = 0): void {\n  // Prevent deeply nested objects that could cause stack overflow\n  if (depth > 10) {\n    throw new DatabaseError(\n      `Invalid parameter at index ${paramIndex}: object nesting too deep (max 10 levels)`,\n      \"INVALID_PARAM\"\n    );\n  }\n\n  // Check for __proto__ or constructor pollution attempts\n  if (\"__proto__\" in obj || \"constructor\" in obj) {\n    const keys = Object.keys(obj);\n    if (keys.includes(\"__proto__\") || keys.includes(\"constructor\")) {\n      throw new DatabaseError(\n        `Invalid parameter at index ${paramIndex}: potential prototype pollution detected`,\n        \"SECURITY_VIOLATION\"\n      );\n    }\n  }\n\n  // Recursively check nested objects/arrays\n  for (const value of Object.values(obj)) {\n    if (typeof value === \"function\") {\n      throw new DatabaseError(\n        `Invalid parameter at index ${paramIndex}: nested functions are not allowed`,\n        \"INVALID_PARAM\"\n      );\n    }\n    if (typeof value === \"object\" && value !== null) {\n      validateNestedObject(value, paramIndex, depth + 1);\n    }\n  }\n}\n\n// Create a connection pool with error handling\nfunction createConnectionPool(): Pool {\n  const databaseUrl = validateDatabaseUrl();\n\n  const pool = new Pool({\n    connectionString: databaseUrl,\n    max: 10, // Maximum number of clients in the pool\n    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds\n    connectionTimeoutMillis: 10000, // Fail fast if can't connect in 10 seconds\n  });\n\n  // Handle pool-level errors\n  pool.on(\"error\", (err: Error) => {\n    console.error(\"Unexpected database pool error:\", err);\n  });\n\n  return pool;\n}\n\n// Initialize connection pool\nlet pool: Pool;\ntry {\n  pool = createConnectionPool();\n} catch (error) {\n  console.error(\"Failed to initialize database connection pool:\", error);\n  throw error;\n}\n\n// Create drizzle instance with the pool\nexport const db: NodePgDatabase<typeof schema> = drizzle({ client: pool, schema });\n\n// Export pool for advanced use cases (e.g., transactions with error handling)\nexport { pool };\n\n// Health check function to validate database connectivity\nexport async function checkDatabaseConnection(): Promise<{\n  connected: boolean;\n  latency?: number;\n  error?: string;\n}> {\n  const startTime = Date.now();\n  let client: PoolClient | null = null;\n\n  try {\n    client = await pool.connect();\n    await client.query(\"SELECT 1\");\n    const latency = Date.now() - startTime;\n\n    return {\n      connected: true,\n      latency,\n    };\n  } catch (error) {\n    const errorMessage = error instanceof Error ? error.message : \"Unknown database error\";\n    console.error(\"Database connection check failed:\", errorMessage);\n\n    return {\n      connected: false,\n      error: errorMessage,\n    };\n  } finally {\n    if (client) {\n      client.release();\n    }\n  }\n}\n\n// Graceful shutdown function for cleanup\nexport async function closeDatabaseConnection(): Promise<void> {\n  try {\n    await pool.end();\n    console.log(\"Database connection pool closed successfully\");\n  } catch (error) {\n    console.error(\"Error closing database connection pool:\", error);\n    throw new DatabaseError(\n      \"Failed to close database connection pool\",\n      \"SHUTDOWN_ERROR\",\n      error instanceof Error ? error : undefined\n    );\n  }\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Implement database connection error handling in db.ts",
      "status": "completed",
      "activeForm": "Implementing database connection error handling"
    },
    {
      "content": "Add prepared statement sanitization validation",
      "status": "completed",
      "activeForm": "Adding prepared statement sanitization validation"
    },
    {
      "content": "Create verification test for the new functionality",
      "status": "in_progress",
      "activeForm": "Creating verification test"
    },
    {
      "content": "Run tests and verify functionality",
      "status": "pending",
      "activeForm": "Running tests and verifying functionality"
    }
  ]
}

Now let me create a verification test using Vitest (since this project uses Vitest, not Playwright):

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/db.test.ts",
  "content": "import { describe, it, expect, vi, beforeEach, afterEach } from \"vitest\";\nimport {\n  DatabaseError,\n  validatePreparedStatementParams,\n} from \"./db\";\n\ndescribe(\"DatabaseError\", () => {\n  it(\"should create a DatabaseError with message\", () => {\n    const error = new DatabaseError(\"Test error message\");\n    expect(error.message).toBe(\"Test error message\");\n    expect(error.name).toBe(\"DatabaseError\");\n    expect(error.code).toBeUndefined();\n    expect(error.cause).toBeUndefined();\n  });\n\n  it(\"should create a DatabaseError with message and code\", () => {\n    const error = new DatabaseError(\"Test error\", \"TEST_CODE\");\n    expect(error.message).toBe(\"Test error\");\n    expect(error.code).toBe(\"TEST_CODE\");\n  });\n\n  it(\"should create a DatabaseError with message, code, and cause\", () => {\n    const cause = new Error(\"Original error\");\n    const error = new DatabaseError(\"Wrapped error\", \"WRAP_CODE\", cause);\n    expect(error.message).toBe(\"Wrapped error\");\n    expect(error.code).toBe(\"WRAP_CODE\");\n    expect(error.cause).toBe(cause);\n  });\n\n  it(\"should be an instance of Error\", () => {\n    const error = new DatabaseError(\"Test\");\n    expect(error instanceof Error).toBe(true);\n    expect(error instanceof DatabaseError).toBe(true);\n  });\n});\n\ndescribe(\"validatePreparedStatementParams\", () => {\n  it(\"should accept valid primitive parameters\", () => {\n    expect(() =>\n      validatePreparedStatementParams([\"string\", 123, true, null, undefined])\n    ).not.toThrow();\n  });\n\n  it(\"should accept valid object parameters\", () => {\n    expect(() =>\n      validatePreparedStatementParams([{ name: \"test\", value: 123 }])\n    ).not.toThrow();\n  });\n\n  it(\"should accept valid array parameters\", () => {\n    expect(() =>\n      validatePreparedStatementParams([[1, 2, 3], [\"a\", \"b\", \"c\"]])\n    ).not.toThrow();\n  });\n\n  it(\"should accept Date objects\", () => {\n    expect(() =>\n      validatePreparedStatementParams([new Date()])\n    ).not.toThrow();\n  });\n\n  it(\"should reject function parameters\", () => {\n    expect(() =>\n      validatePreparedStatementParams([() => {}])\n    ).toThrow(DatabaseError);\n    expect(() =>\n      validatePreparedStatementParams([() => {}])\n    ).toThrow(\"functions are not allowed\");\n  });\n\n  it(\"should reject symbol parameters\", () => {\n    expect(() =>\n      validatePreparedStatementParams([Symbol(\"test\")])\n    ).toThrow(DatabaseError);\n    expect(() =>\n      validatePreparedStatementParams([Symbol(\"test\")])\n    ).toThrow(\"symbols are not allowed\");\n  });\n\n  it(\"should reject null prototype objects\", () => {\n    const nullProtoObj = Object.create(null);\n    nullProtoObj.name = \"test\";\n    expect(() =>\n      validatePreparedStatementParams([nullProtoObj])\n    ).toThrow(DatabaseError);\n    expect(() =>\n      validatePreparedStatementParams([nullProtoObj])\n    ).toThrow(\"null prototype objects are not allowed\");\n  });\n\n  it(\"should reject nested functions\", () => {\n    expect(() =>\n      validatePreparedStatementParams([{ nested: { fn: () => {} } }])\n    ).toThrow(DatabaseError);\n    expect(() =>\n      validatePreparedStatementParams([{ nested: { fn: () => {} } }])\n    ).toThrow(\"nested functions are not allowed\");\n  });\n\n  it(\"should reject deeply nested objects beyond limit\", () => {\n    // Create object with 12 levels of nesting (exceeds 10 level limit)\n    let obj: Record<string, unknown> = { value: \"test\" };\n    for (let i = 0; i < 12; i++) {\n      obj = { nested: obj };\n    }\n    expect(() => validatePreparedStatementParams([obj])).toThrow(DatabaseError);\n    expect(() => validatePreparedStatementParams([obj])).toThrow(\n      \"object nesting too deep\"\n    );\n  });\n\n  it(\"should reject objects with __proto__ key\", () => {\n    const maliciousObj = JSON.parse('{\"__proto__\": {\"polluted\": true}}');\n    expect(() => validatePreparedStatementParams([maliciousObj])).toThrow(\n      DatabaseError\n    );\n    expect(() => validatePreparedStatementParams([maliciousObj])).toThrow(\n      \"prototype pollution\"\n    );\n  });\n\n  it(\"should reject objects with constructor key\", () => {\n    const maliciousObj = { constructor: { polluted: true } };\n    expect(() => validatePreparedStatementParams([maliciousObj])).toThrow(\n      DatabaseError\n    );\n    expect(() => validatePreparedStatementParams([maliciousObj])).toThrow(\n      \"prototype pollution\"\n    );\n  });\n\n  it(\"should include parameter index in error message\", () => {\n    const params = [\"valid\", \"also valid\", () => {}];\n    expect(() => validatePreparedStatementParams(params)).toThrow(\n      \"at index 2\"\n    );\n  });\n\n  it(\"should validate nested arrays correctly\", () => {\n    expect(() =>\n      validatePreparedStatementParams([[1, 2, [3, 4, [5, 6]]]])\n    ).not.toThrow();\n  });\n\n  it(\"should reject arrays containing functions\", () => {\n    expect(() =>\n      validatePreparedStatementParams([[1, 2, () => {}]])\n    ).toThrow(DatabaseError);\n  });\n});\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Implement database connection error handling in db.ts",
      "status": "completed",
      "activeForm": "Implementing database connection error handling"
    },
    {
      "content": "Add prepared statement sanitization validation",
      "status": "completed",
      "activeForm": "Adding prepared statement sanitization validation"
    },
    {
      "content": "Create verification test for the new functionality",
      "status": "completed",
      "activeForm": "Creating verification test"
    },
    {
      "content": "Run tests and verify functionality",
      "status": "in_progress",
      "activeForm": "Running tests and verifying functionality"
    }
  ]
}

Now let me run the tests:

🔧 Tool: Bash
Input: {
  "command": "npm test -- src/database/db.test.ts 2>&1",
  "description": "Run vitest tests for db.ts",
  "timeout": 120000
}

All 18 tests pass. Let me also run the TypeScript compiler to verify there are no type errors in the updated db.ts:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --skipLibCheck 2>&1 | head -50",
  "description": "Check TypeScript for errors",
  "timeout": 60000
}

The TypeScript errors are pre-existing errors in other components, not related to my changes in db.ts. Let me verify specifically that my db.ts file has no TypeScript errors:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --skipLibCheck src/database/db.ts 2>&1",
  "description": "Check db.ts for TypeScript errors",
  "timeout": 60000
}

No errors in db.ts! Now let me verify the build works properly as well:

🔧 Tool: Bash
Input: {
  "command": "npm run build 2>&1 | tail -30",
  "description": "Verify build works",
  "timeout": 120000
}

Build is successful! Now let me clean up the test file since this was a verification test:

🔧 Tool: Bash
Input: {
  "command": "rm /home/default/Desktop/dev/app-map-appahouse/src/database/db.test.ts",
  "description": "Delete verification test file"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Implement database connection error handling in db.ts",
      "status": "completed",
      "activeForm": "Implementing database connection error handling"
    },
    {
      "content": "Add prepared statement sanitization validation",
      "status": "completed",
      "activeForm": "Adding prepared statement sanitization validation"
    },
    {
      "content": "Create verification test for the new functionality",
      "status": "completed",
      "activeForm": "Creating verification test"
    },
    {
      "content": "Run tests and verify functionality",
      "status": "completed",
      "activeForm": "Running tests and verifying functionality"
    }
  ]
}

<summary>
## Summary: Add database connection error handling and implement prepared statement sanitization validation

### Changes Implemented
1. **Custom DatabaseError class**: Added a specialized error class with error codes and cause tracking for better error handling and debugging
2. **DATABASE_URL validation**: Replaced `process.env.DATABASE_URL!` non-null assertion with proper validation that:
   - Checks if the environment variable is set
   - Validates it's not empty
   - Validates the PostgreSQL URL format (postgres:// or postgresql://)
3. **Connection pool with error handling**: Replaced direct drizzle connection with a configured Pool that includes:
   - Maximum 10 concurrent connections
   - 30-second idle timeout
   - 10-second connection timeout
   - Pool-level error event handler
4. **Prepared statement sanitization validation**: Added `validatePreparedStatementParams()` function that:
   - Rejects function parameters
   - Rejects symbol parameters  
   - Rejects null prototype objects (potential prototype pollution)
   - Validates nested objects up to 10 levels deep
   - Detects `__proto__` and `constructor` pollution attempts
5. **Health check function**: Added `checkDatabaseConnection()` that returns connection status, latency, and any errors
6. **Graceful shutdown**: Added `closeDatabaseConnection()` for proper cleanup

### Files Modified
- `/home/default/Desktop/dev/app-map-appahouse/src/database/db.ts` - Complete rewrite with error handling

### Verification Status
- ✅ Created and ran 18 Vitest unit tests covering:
  - DatabaseError class instantiation and inheritance
  - Valid primitive, object, array, and Date parameters
  - Rejection of functions, symbols, null prototype objects
  - Nested object validation and depth limiting
  - Prototype pollution detection (__proto__, constructor keys)
  - Parameter index tracking in error messages
- ✅ All 18 tests passed
- ✅ TypeScript compilation successful (no errors in db.ts)
- ✅ Build completed successfully
- ✅ Verification test file deleted after successful testing

### Notes for Developer
- The `validatePreparedStatementParams()` function is exported and can be used before executing raw SQL queries to add an extra layer of security
- The `checkDatabaseConnection()` function can be used for health checks or startup validation
- The `pool` is exported for advanced use cases like manual transaction handling
- The `closeDatabaseConnection()` function should be called during graceful application shutdown
- Error codes include: `MISSING_ENV`, `INVALID_ENV`, `INVALID_FORMAT`, `INVALID_PARAM`, `SECURITY_VIOLATION`, `SHUTDOWN_ERROR`
</summary>