
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing error handling patterns",
      "status": "in_progress",
      "activeForm": "Exploring codebase structure and error handling patterns"
    },
    {
      "content": "Design error class hierarchy and middleware architecture",
      "status": "pending",
      "activeForm": "Designing error class hierarchy and middleware architecture"
    },
    {
      "content": "Implement custom error classes (AppError, AuthorizationError, ValidationError, etc.)",
      "status": "pending",
      "activeForm": "Implementing custom error classes"
    },
    {
      "content": "Create server function wrapper/decorator for consistent error handling",
      "status": "pending",
      "activeForm": "Creating server function wrapper/decorator"
    },
    {
      "content": "Add logging utility for error handling",
      "status": "pending",
      "activeForm": "Adding logging utility for error handling"
    },
    {
      "content": "Document usage patterns and migration guide",
      "status": "pending",
      "activeForm": "Documenting usage patterns and migration guide"
    }
  ]
}

Let me first explore the codebase to understand the existing structure and error handling patterns.

🔧 Tool: Bash
Input: {
  "command": "find . -type f -name \"*.ts\" -o -name \"*.tsx\" | head -50",
  "description": "List TypeScript files in the codebase"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.tsx"
}

Let me search for source files in the app directory, excluding node_modules:

🔧 Tool: Bash
Input: {
  "command": "find . -type f \\( -name \"*.ts\" -o -name \"*.tsx\" \\) -not -path \"*/node_modules/*\" -not -path \"*/.nitro/*\" | head -100",
  "description": "List app TypeScript files excluding node_modules"
}

🔧 Tool: Bash
Input: {
  "command": "find . -type f \\( -name \"*.ts\" -o -name \"*.tsx\" \\) -not -path \"*/node_modules/*\" -not -path \"*/.nitro/*\" | wc -l",
  "description": "Count app TypeScript files"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/server/**/*.ts",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*server*.ts",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

Now I can see the server files. Let me explore these files to understand the current error handling patterns:

🔧 Tool: Grep
Input: {
  "pattern": "throw new Error",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Grep
Input: {
  "pattern": "try \\{",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src",
  "output_mode": "count"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts"
}

Now let me look at a few more server files to understand the patterns better, especially the auth-utils file and how errors are currently handled:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/auth-utils.server.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/categories.server.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/index.server.ts"
}

Let me also look at some more complex server files to understand the error patterns better:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/status-pages.server.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/analytics.server.ts",
  "limit": 200
}

Now let me check the project structure to understand how TypeScript is configured:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/tsconfig.json"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/package.json"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/lib/",
  "description": "List files in lib directory"
}

Now I have a good understanding of the codebase. Let me update the todo list and start implementing the error handling system:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing error handling patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and error handling patterns"
    },
    {
      "content": "Implement custom error classes (AppError, AuthorizationError, ValidationError, etc.)",
      "status": "in_progress",
      "activeForm": "Implementing custom error classes"
    },
    {
      "content": "Create server function wrapper/decorator for consistent error handling",
      "status": "pending",
      "activeForm": "Creating server function wrapper/decorator"
    },
    {
      "content": "Add logging utility for error handling",
      "status": "pending",
      "activeForm": "Adding logging utility for error handling"
    },
    {
      "content": "Update auth-utils.server.ts to use new error classes",
      "status": "pending",
      "activeForm": "Updating auth-utils.server.ts with new error classes"
    },
    {
      "content": "Update index.server.ts to export new utilities",
      "status": "pending",
      "activeForm": "Updating index.server.ts exports"
    }
  ]
}

Now let me create the centralized error handling system. I'll start by creating the error classes:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/errors.ts",
  "content": "/**\n * Centralized Error Handling System\n *\n * This module provides a hierarchical error class system for consistent error handling\n * across all server functions. It includes:\n *\n * - Custom error classes with HTTP status codes and error codes\n * - Client-safe error responses (no sensitive data leaked)\n * - Structured error logging\n * - Type-safe error handling\n *\n * Error Hierarchy:\n * - AppError (base class for all application errors)\n *   - AuthenticationError (401) - User not authenticated\n *   - AuthorizationError (403) - User not authorized to perform action\n *   - NotFoundError (404) - Resource not found\n *   - ValidationError (400) - Input validation failed\n *   - ConflictError (409) - Resource conflict (e.g., duplicate)\n *   - RateLimitError (429) - Too many requests\n *   - ExternalServiceError (502) - External service failure\n *   - InternalError (500) - Unexpected server error\n */\n\n// ============================================================================\n// Error Codes\n// ============================================================================\n\n/**\n * Standardized error codes for client-side error handling\n */\nexport const ErrorCode = {\n  // Authentication errors (401)\n  UNAUTHORIZED: \"UNAUTHORIZED\",\n  SESSION_EXPIRED: \"SESSION_EXPIRED\",\n  INVALID_CREDENTIALS: \"INVALID_CREDENTIALS\",\n\n  // Authorization errors (403)\n  FORBIDDEN: \"FORBIDDEN\",\n  INSUFFICIENT_PERMISSIONS: \"INSUFFICIENT_PERMISSIONS\",\n  ACCESS_DENIED: \"ACCESS_DENIED\",\n\n  // Not found errors (404)\n  NOT_FOUND: \"NOT_FOUND\",\n  APP_NOT_FOUND: \"APP_NOT_FOUND\",\n  CATEGORY_NOT_FOUND: \"CATEGORY_NOT_FOUND\",\n  USER_NOT_FOUND: \"USER_NOT_FOUND\",\n  WIDGET_NOT_FOUND: \"WIDGET_NOT_FOUND\",\n  INTEGRATION_NOT_FOUND: \"INTEGRATION_NOT_FOUND\",\n  ALERT_NOT_FOUND: \"ALERT_NOT_FOUND\",\n  STATUS_PAGE_NOT_FOUND: \"STATUS_PAGE_NOT_FOUND\",\n  TAG_NOT_FOUND: \"TAG_NOT_FOUND\",\n  SHARE_NOT_FOUND: \"SHARE_NOT_FOUND\",\n  API_KEY_NOT_FOUND: \"API_KEY_NOT_FOUND\",\n  SAVED_VIEW_NOT_FOUND: \"SAVED_VIEW_NOT_FOUND\",\n  DEPENDENCY_NOT_FOUND: \"DEPENDENCY_NOT_FOUND\",\n  INCIDENT_NOT_FOUND: \"INCIDENT_NOT_FOUND\",\n  NOTIFICATION_NOT_FOUND: \"NOTIFICATION_NOT_FOUND\",\n\n  // Validation errors (400)\n  VALIDATION_ERROR: \"VALIDATION_ERROR\",\n  INVALID_INPUT: \"INVALID_INPUT\",\n  MISSING_REQUIRED_FIELD: \"MISSING_REQUIRED_FIELD\",\n  INVALID_FORMAT: \"INVALID_FORMAT\",\n  INVALID_SLUG: \"INVALID_SLUG\",\n  INVALID_PASSWORD: \"INVALID_PASSWORD\",\n  SELF_REFERENCE_ERROR: \"SELF_REFERENCE_ERROR\",\n\n  // Conflict errors (409)\n  CONFLICT: \"CONFLICT\",\n  DUPLICATE_ENTRY: \"DUPLICATE_ENTRY\",\n  ALREADY_EXISTS: \"ALREADY_EXISTS\",\n  CIRCULAR_DEPENDENCY: \"CIRCULAR_DEPENDENCY\",\n  ALREADY_SHARED: \"ALREADY_SHARED\",\n\n  // Rate limit errors (429)\n  RATE_LIMIT_EXCEEDED: \"RATE_LIMIT_EXCEEDED\",\n  TOO_MANY_REQUESTS: \"TOO_MANY_REQUESTS\",\n\n  // External service errors (502)\n  EXTERNAL_SERVICE_ERROR: \"EXTERNAL_SERVICE_ERROR\",\n  REQUEST_TIMEOUT: \"REQUEST_TIMEOUT\",\n  CONNECTION_FAILED: \"CONNECTION_FAILED\",\n  API_ERROR: \"API_ERROR\",\n\n  // Internal errors (500)\n  INTERNAL_ERROR: \"INTERNAL_ERROR\",\n  DATABASE_ERROR: \"DATABASE_ERROR\",\n  UNEXPECTED_ERROR: \"UNEXPECTED_ERROR\",\n} as const;\n\nexport type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];\n\n// ============================================================================\n// Error Context Type\n// ============================================================================\n\n/**\n * Additional context that can be attached to errors for debugging\n * This is logged but NOT sent to clients\n */\nexport interface ErrorContext {\n  /** The operation that was being performed */\n  operation?: string;\n  /** The resource type involved (e.g., 'app', 'category') */\n  resourceType?: string;\n  /** The resource ID involved */\n  resourceId?: string;\n  /** The user ID involved */\n  userId?: string;\n  /** Additional metadata for debugging */\n  metadata?: Record<string, unknown>;\n  /** The original error if this wraps another error */\n  cause?: Error;\n}\n\n// ============================================================================\n// Base Error Class\n// ============================================================================\n\n/**\n * Base application error class\n *\n * All custom errors should extend this class.\n * Provides consistent error structure with HTTP status codes,\n * error codes, and context for logging.\n */\nexport class AppError extends Error {\n  /** HTTP status code */\n  public readonly statusCode: number;\n\n  /** Machine-readable error code */\n  public readonly code: ErrorCodeType;\n\n  /** Whether this error is operational (expected) vs programming error */\n  public readonly isOperational: boolean;\n\n  /** Additional context for logging (not sent to client) */\n  public readonly context: ErrorContext;\n\n  /** Timestamp when the error occurred */\n  public readonly timestamp: Date;\n\n  constructor(\n    message: string,\n    statusCode: number = 500,\n    code: ErrorCodeType = ErrorCode.INTERNAL_ERROR,\n    context: ErrorContext = {},\n    isOperational: boolean = true\n  ) {\n    super(message);\n\n    // Maintains proper stack trace for where error was thrown\n    Error.captureStackTrace(this, this.constructor);\n\n    this.name = this.constructor.name;\n    this.statusCode = statusCode;\n    this.code = code;\n    this.isOperational = isOperational;\n    this.context = context;\n    this.timestamp = new Date();\n\n    // Ensure instanceof works correctly\n    Object.setPrototypeOf(this, new.target.prototype);\n  }\n\n  /**\n   * Convert error to a client-safe response object\n   * This excludes sensitive debugging information\n   */\n  toClientResponse(): {\n    error: string;\n    code: ErrorCodeType;\n    statusCode: number;\n  } {\n    return {\n      error: this.message,\n      code: this.code,\n      statusCode: this.statusCode,\n    };\n  }\n\n  /**\n   * Convert error to a detailed log object\n   * Includes all context for debugging\n   */\n  toLogObject(): Record<string, unknown> {\n    return {\n      name: this.name,\n      message: this.message,\n      code: this.code,\n      statusCode: this.statusCode,\n      isOperational: this.isOperational,\n      context: this.context,\n      timestamp: this.timestamp.toISOString(),\n      stack: this.stack,\n      cause: this.context.cause\n        ? {\n            name: this.context.cause.name,\n            message: this.context.cause.message,\n            stack: this.context.cause.stack,\n          }\n        : undefined,\n    };\n  }\n}\n\n// ============================================================================\n// Authentication Errors (401)\n// ============================================================================\n\n/**\n * Error thrown when user is not authenticated\n *\n * Use for:\n * - Missing session/token\n * - Expired session\n * - Invalid credentials\n */\nexport class AuthenticationError extends AppError {\n  constructor(\n    message: string = \"Unauthorized\",\n    code: ErrorCodeType = ErrorCode.UNAUTHORIZED,\n    context: ErrorContext = {}\n  ) {\n    super(message, 401, code, context);\n  }\n}\n\n// ============================================================================\n// Authorization Errors (403)\n// ============================================================================\n\n/**\n * Error thrown when user lacks permission for an action\n *\n * Use for:\n * - Accessing resources owned by others\n * - Performing actions without required permissions\n * - Accessing restricted features\n */\nexport class AuthorizationError extends AppError {\n  constructor(\n    message: string = \"Access denied\",\n    code: ErrorCodeType = ErrorCode.FORBIDDEN,\n    context: ErrorContext = {}\n  ) {\n    super(message, 403, code, context);\n  }\n}\n\n// ============================================================================\n// Not Found Errors (404)\n// ============================================================================\n\n/**\n * Error thrown when a requested resource doesn't exist\n *\n * Use for:\n * - Resource lookup failures\n * - Missing database records\n * - Invalid IDs\n */\nexport class NotFoundError extends AppError {\n  constructor(\n    message: string = \"Resource not found\",\n    code: ErrorCodeType = ErrorCode.NOT_FOUND,\n    context: ErrorContext = {}\n  ) {\n    super(message, 404, code, context);\n  }\n}\n\n// ============================================================================\n// Validation Errors (400)\n// ============================================================================\n\n/**\n * Error thrown when input validation fails\n *\n * Use for:\n * - Invalid input format\n * - Missing required fields\n * - Business rule violations\n */\nexport class ValidationError extends AppError {\n  /** Detailed validation errors by field */\n  public readonly fieldErrors?: Record<string, string[]>;\n\n  constructor(\n    message: string = \"Validation failed\",\n    code: ErrorCodeType = ErrorCode.VALIDATION_ERROR,\n    context: ErrorContext = {},\n    fieldErrors?: Record<string, string[]>\n  ) {\n    super(message, 400, code, context);\n    this.fieldErrors = fieldErrors;\n  }\n\n  override toClientResponse(): {\n    error: string;\n    code: ErrorCodeType;\n    statusCode: number;\n    fieldErrors?: Record<string, string[]>;\n  } {\n    return {\n      ...super.toClientResponse(),\n      ...(this.fieldErrors && { fieldErrors: this.fieldErrors }),\n    };\n  }\n}\n\n// ============================================================================\n// Conflict Errors (409)\n// ============================================================================\n\n/**\n * Error thrown when a resource conflict occurs\n *\n * Use for:\n * - Duplicate entries\n * - Unique constraint violations\n * - Circular dependencies\n */\nexport class ConflictError extends AppError {\n  constructor(\n    message: string = \"Resource conflict\",\n    code: ErrorCodeType = ErrorCode.CONFLICT,\n    context: ErrorContext = {}\n  ) {\n    super(message, 409, code, context);\n  }\n}\n\n// ============================================================================\n// Rate Limit Errors (429)\n// ============================================================================\n\n/**\n * Error thrown when rate limits are exceeded\n *\n * Use for:\n * - API rate limiting\n * - Too many failed attempts\n * - Resource abuse prevention\n */\nexport class RateLimitError extends AppError {\n  /** When the rate limit will reset */\n  public readonly retryAfter?: number;\n\n  constructor(\n    message: string = \"Too many requests\",\n    code: ErrorCodeType = ErrorCode.RATE_LIMIT_EXCEEDED,\n    context: ErrorContext = {},\n    retryAfter?: number\n  ) {\n    super(message, 429, code, context);\n    this.retryAfter = retryAfter;\n  }\n\n  override toClientResponse(): {\n    error: string;\n    code: ErrorCodeType;\n    statusCode: number;\n    retryAfter?: number;\n  } {\n    return {\n      ...super.toClientResponse(),\n      ...(this.retryAfter && { retryAfter: this.retryAfter }),\n    };\n  }\n}\n\n// ============================================================================\n// External Service Errors (502)\n// ============================================================================\n\n/**\n * Error thrown when external service communication fails\n *\n * Use for:\n * - Third-party API failures\n * - Network timeouts\n * - Service unavailability\n */\nexport class ExternalServiceError extends AppError {\n  /** Name of the external service that failed */\n  public readonly serviceName?: string;\n\n  constructor(\n    message: string = \"External service error\",\n    code: ErrorCodeType = ErrorCode.EXTERNAL_SERVICE_ERROR,\n    context: ErrorContext = {},\n    serviceName?: string\n  ) {\n    super(message, 502, code, context);\n    this.serviceName = serviceName;\n  }\n}\n\n// ============================================================================\n// Internal Errors (500)\n// ============================================================================\n\n/**\n * Error thrown for unexpected internal errors\n *\n * Use for:\n * - Programming errors (should be rare)\n * - Database connection failures\n * - Unexpected exceptions\n *\n * Note: These errors are NOT operational and indicate bugs\n */\nexport class InternalError extends AppError {\n  constructor(\n    message: string = \"An unexpected error occurred\",\n    code: ErrorCodeType = ErrorCode.INTERNAL_ERROR,\n    context: ErrorContext = {}\n  ) {\n    // isOperational = false for internal errors\n    super(message, 500, code, context, false);\n  }\n}\n\n// ============================================================================\n// Error Factory Functions\n// ============================================================================\n\n/**\n * Factory functions for creating common errors with consistent messages\n */\nexport const Errors = {\n  // Authentication\n  unauthorized: (context?: ErrorContext) =>\n    new AuthenticationError(\"Unauthorized\", ErrorCode.UNAUTHORIZED, context),\n\n  sessionExpired: (context?: ErrorContext) =>\n    new AuthenticationError(\"Session expired\", ErrorCode.SESSION_EXPIRED, context),\n\n  invalidCredentials: (context?: ErrorContext) =>\n    new AuthenticationError(\"Invalid credentials\", ErrorCode.INVALID_CREDENTIALS, context),\n\n  // Authorization\n  accessDenied: (context?: ErrorContext) =>\n    new AuthorizationError(\"Access denied\", ErrorCode.ACCESS_DENIED, context),\n\n  insufficientPermissions: (resource?: string, context?: ErrorContext) =>\n    new AuthorizationError(\n      resource ? `You don't have permission to access this ${resource}` : \"Insufficient permissions\",\n      ErrorCode.INSUFFICIENT_PERMISSIONS,\n      context\n    ),\n\n  // Not Found\n  notFound: (resourceType: string, resourceId?: string, context?: ErrorContext) =>\n    new NotFoundError(\n      `${resourceType} not found`,\n      ErrorCode.NOT_FOUND,\n      { ...context, resourceType, resourceId }\n    ),\n\n  appNotFound: (appId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"App not found\", ErrorCode.APP_NOT_FOUND, { ...context, resourceType: \"app\", resourceId: appId }),\n\n  categoryNotFound: (categoryId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Category not found\", ErrorCode.CATEGORY_NOT_FOUND, { ...context, resourceType: \"category\", resourceId: categoryId }),\n\n  userNotFound: (userId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"User not found. Make sure they have an account.\", ErrorCode.USER_NOT_FOUND, { ...context, resourceType: \"user\", resourceId: userId }),\n\n  widgetNotFound: (widgetId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Widget not found\", ErrorCode.WIDGET_NOT_FOUND, { ...context, resourceType: \"widget\", resourceId: widgetId }),\n\n  integrationNotFound: (integrationId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Integration not found\", ErrorCode.INTEGRATION_NOT_FOUND, { ...context, resourceType: \"integration\", resourceId: integrationId }),\n\n  alertNotFound: (alertId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Alert rule not found\", ErrorCode.ALERT_NOT_FOUND, { ...context, resourceType: \"alert\", resourceId: alertId }),\n\n  statusPageNotFound: (pageId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Status page not found\", ErrorCode.STATUS_PAGE_NOT_FOUND, { ...context, resourceType: \"statusPage\", resourceId: pageId }),\n\n  tagNotFound: (tagId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Tag not found\", ErrorCode.TAG_NOT_FOUND, { ...context, resourceType: \"tag\", resourceId: tagId }),\n\n  shareNotFound: (shareId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Share not found or you don't have permission to access it\", ErrorCode.SHARE_NOT_FOUND, { ...context, resourceType: \"share\", resourceId: shareId }),\n\n  apiKeyNotFound: (keyId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"API key not found\", ErrorCode.API_KEY_NOT_FOUND, { ...context, resourceType: \"apiKey\", resourceId: keyId }),\n\n  savedViewNotFound: (viewId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Saved view not found\", ErrorCode.SAVED_VIEW_NOT_FOUND, { ...context, resourceType: \"savedView\", resourceId: viewId }),\n\n  dependencyNotFound: (depId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Dependency not found\", ErrorCode.DEPENDENCY_NOT_FOUND, { ...context, resourceType: \"dependency\", resourceId: depId }),\n\n  incidentNotFound: (incidentId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Incident not found\", ErrorCode.INCIDENT_NOT_FOUND, { ...context, resourceType: \"incident\", resourceId: incidentId }),\n\n  notificationNotFound: (notificationId?: string, context?: ErrorContext) =>\n    new NotFoundError(\"Notification not found\", ErrorCode.NOTIFICATION_NOT_FOUND, { ...context, resourceType: \"notification\", resourceId: notificationId }),\n\n  // Validation\n  validationFailed: (message: string, fieldErrors?: Record<string, string[]>, context?: ErrorContext) =>\n    new ValidationError(message, ErrorCode.VALIDATION_ERROR, context, fieldErrors),\n\n  invalidInput: (message: string, context?: ErrorContext) =>\n    new ValidationError(message, ErrorCode.INVALID_INPUT, context),\n\n  invalidSlug: (context?: ErrorContext) =>\n    new ValidationError(\n      \"Slug must contain only lowercase letters, numbers, and hyphens\",\n      ErrorCode.INVALID_SLUG,\n      context\n    ),\n\n  invalidPassword: (context?: ErrorContext) =>\n    new ValidationError(\"Invalid password\", ErrorCode.INVALID_PASSWORD, context),\n\n  selfReference: (message: string, context?: ErrorContext) =>\n    new ValidationError(message, ErrorCode.SELF_REFERENCE_ERROR, context),\n\n  missingRequiredField: (fieldName: string, context?: ErrorContext) =>\n    new ValidationError(\n      `Missing required field: ${fieldName}`,\n      ErrorCode.MISSING_REQUIRED_FIELD,\n      { ...context, metadata: { field: fieldName } }\n    ),\n\n  // Conflict\n  duplicateEntry: (resourceType: string, context?: ErrorContext) =>\n    new ConflictError(\n      `A ${resourceType} with this identifier already exists`,\n      ErrorCode.DUPLICATE_ENTRY,\n      { ...context, resourceType }\n    ),\n\n  alreadyExists: (message: string, context?: ErrorContext) =>\n    new ConflictError(message, ErrorCode.ALREADY_EXISTS, context),\n\n  circularDependency: (message?: string, context?: ErrorContext) =>\n    new ConflictError(\n      message || \"Adding this dependency would create a circular dependency\",\n      ErrorCode.CIRCULAR_DEPENDENCY,\n      context\n    ),\n\n  alreadyShared: (resourceType: string, context?: ErrorContext) =>\n    new ConflictError(\n      `This ${resourceType} is already shared with this user`,\n      ErrorCode.ALREADY_SHARED,\n      { ...context, resourceType }\n    ),\n\n  // Rate Limit\n  rateLimitExceeded: (retryAfter?: number, context?: ErrorContext) =>\n    new RateLimitError(\"Too many requests. Please try again later.\", ErrorCode.RATE_LIMIT_EXCEEDED, context, retryAfter),\n\n  // External Service\n  externalServiceError: (serviceName: string, message?: string, context?: ErrorContext) =>\n    new ExternalServiceError(\n      message || `Failed to communicate with ${serviceName}`,\n      ErrorCode.EXTERNAL_SERVICE_ERROR,\n      context,\n      serviceName\n    ),\n\n  requestTimeout: (serviceName?: string, context?: ErrorContext) =>\n    new ExternalServiceError(\n      serviceName ? `Request to ${serviceName} timed out` : \"Request timed out\",\n      ErrorCode.REQUEST_TIMEOUT,\n      context,\n      serviceName\n    ),\n\n  apiError: (message: string, serviceName?: string, context?: ErrorContext) =>\n    new ExternalServiceError(message, ErrorCode.API_ERROR, context, serviceName),\n\n  // Internal\n  internalError: (message?: string, context?: ErrorContext) =>\n    new InternalError(message || \"An unexpected error occurred\", ErrorCode.INTERNAL_ERROR, context),\n\n  databaseError: (message?: string, context?: ErrorContext) =>\n    new InternalError(message || \"Database operation failed\", ErrorCode.DATABASE_ERROR, context),\n} as const;\n\n// ============================================================================\n// Type Guards\n// ============================================================================\n\n/**\n * Check if an error is an AppError\n */\nexport function isAppError(error: unknown): error is AppError {\n  return error instanceof AppError;\n}\n\n/**\n * Check if an error is an authentication error\n */\nexport function isAuthenticationError(error: unknown): error is AuthenticationError {\n  return error instanceof AuthenticationError;\n}\n\n/**\n * Check if an error is an authorization error\n */\nexport function isAuthorizationError(error: unknown): error is AuthorizationError {\n  return error instanceof AuthorizationError;\n}\n\n/**\n * Check if an error is a not found error\n */\nexport function isNotFoundError(error: unknown): error is NotFoundError {\n  return error instanceof NotFoundError;\n}\n\n/**\n * Check if an error is a validation error\n */\nexport function isValidationError(error: unknown): error is ValidationError {\n  return error instanceof ValidationError;\n}\n\n/**\n * Check if an error is a conflict error\n */\nexport function isConflictError(error: unknown): error is ConflictError {\n  return error instanceof ConflictError;\n}\n\n/**\n * Check if an error is operational (expected) vs programming error\n */\nexport function isOperationalError(error: unknown): boolean {\n  if (isAppError(error)) {\n    return error.isOperational;\n  }\n  return false;\n}\n\n// ============================================================================\n// Error Conversion Utilities\n// ============================================================================\n\n/**\n * Convert any error to an AppError\n *\n * If the error is already an AppError, returns it as-is.\n * Otherwise, wraps it in an InternalError.\n */\nexport function toAppError(error: unknown, context?: ErrorContext): AppError {\n  if (isAppError(error)) {\n    return error;\n  }\n\n  if (error instanceof Error) {\n    return new InternalError(\n      error.message,\n      ErrorCode.INTERNAL_ERROR,\n      { ...context, cause: error }\n    );\n  }\n\n  return new InternalError(\n    typeof error === \"string\" ? error : \"An unexpected error occurred\",\n    ErrorCode.INTERNAL_ERROR,\n    context\n  );\n}\n\n/**\n * Extract a client-safe error message from any error\n */\nexport function getClientErrorMessage(error: unknown): string {\n  if (isAppError(error)) {\n    return error.message;\n  }\n\n  // For non-AppError, return generic message to avoid leaking details\n  return \"An unexpected error occurred\";\n}\n\n/**\n * Get HTTP status code from any error\n */\nexport function getErrorStatusCode(error: unknown): number {\n  if (isAppError(error)) {\n    return error.statusCode;\n  }\n  return 500;\n}\n"
}

Now let me create the server function wrapper for consistent error handling:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing error handling patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and error handling patterns"
    },
    {
      "content": "Implement custom error classes (AppError, AuthorizationError, ValidationError, etc.)",
      "status": "completed",
      "activeForm": "Implementing custom error classes"
    },
    {
      "content": "Create server function wrapper/decorator for consistent error handling",
      "status": "in_progress",
      "activeForm": "Creating server function wrapper/decorator"
    },
    {
      "content": "Add logging utility for error handling",
      "status": "pending",
      "activeForm": "Adding logging utility for error handling"
    },
    {
      "content": "Update auth-utils.server.ts to use new error classes",
      "status": "pending",
      "activeForm": "Updating auth-utils.server.ts with new error classes"
    },
    {
      "content": "Update index.server.ts to export new utilities",
      "status": "pending",
      "activeForm": "Updating index.server.ts exports"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "content": "/**\n * Server Function Wrapper/Decorator\n *\n * This module provides utilities for wrapping server functions with\n * consistent error handling, logging, and validation.\n *\n * Features:\n * - Automatic error conversion to AppError\n * - Structured logging for all server operations\n * - Input validation with Zod schemas (optional)\n * - Request/response timing\n * - Context injection (user session, request info)\n *\n * Usage:\n * ```ts\n * // Basic usage\n * export const getApp = createServerFn({ method: \"POST\" }).handler(\n *   withErrorHandling(async (ctx) => {\n *     // Your handler code\n *   })\n * );\n *\n * // With options\n * export const getApp = createServerFn({ method: \"POST\" }).handler(\n *   withErrorHandling(\n *     async (ctx) => {\n *       // Your handler code\n *     },\n *     { operation: \"getApp\", logSuccess: true }\n *   )\n * );\n * ```\n */\n\nimport {\n  AppError,\n  AuthenticationError,\n  InternalError,\n  ErrorCode,\n  isAppError,\n  toAppError,\n  type ErrorContext,\n} from \"./errors\";\nimport { serverLogger, type LogLevel } from \"./logger\";\n\n// ============================================================================\n// Types\n// ============================================================================\n\n/**\n * Options for the error handling wrapper\n */\nexport interface ErrorHandlingOptions {\n  /** Name of the operation for logging purposes */\n  operation?: string;\n\n  /** Whether to log successful operations (default: false) */\n  logSuccess?: boolean;\n\n  /** Minimum log level for this operation */\n  logLevel?: LogLevel;\n\n  /** Additional context to include in logs */\n  context?: ErrorContext;\n\n  /** Whether to re-throw AppError as-is (default: true) */\n  preserveAppErrors?: boolean;\n\n  /** Custom error transformer */\n  transformError?: (error: unknown) => AppError;\n}\n\n/**\n * Server function handler type\n */\nexport type ServerFnHandler<TInput, TOutput> = (ctx: TInput) => Promise<TOutput>;\n\n/**\n * Wrapped server function handler type\n */\nexport type WrappedHandler<TInput, TOutput> = (ctx: TInput) => Promise<TOutput>;\n\n// ============================================================================\n// Error Handling Wrapper\n// ============================================================================\n\n/**\n * Wraps a server function handler with consistent error handling and logging.\n *\n * This wrapper:\n * 1. Logs the start of the operation (if logSuccess is true)\n * 2. Times the operation\n * 3. Catches any errors and converts them to AppError\n * 4. Logs errors with full context\n * 5. Re-throws the error for the client to handle\n *\n * @param handler - The async handler function to wrap\n * @param options - Configuration options\n * @returns A wrapped handler with error handling\n *\n * @example\n * ```ts\n * const handler = withErrorHandling(\n *   async (ctx: { data: { id: string } }) => {\n *     const app = await getAppById(ctx.data.id);\n *     if (!app) throw Errors.appNotFound(ctx.data.id);\n *     return app;\n *   },\n *   { operation: \"getApp\" }\n * );\n * ```\n */\nexport function withErrorHandling<TInput, TOutput>(\n  handler: ServerFnHandler<TInput, TOutput>,\n  options: ErrorHandlingOptions = {}\n): WrappedHandler<TInput, TOutput> {\n  const {\n    operation = \"unknown\",\n    logSuccess = false,\n    logLevel = \"info\",\n    context = {},\n    preserveAppErrors = true,\n    transformError,\n  } = options;\n\n  return async (ctx: TInput): Promise<TOutput> => {\n    const startTime = Date.now();\n    const requestId = generateRequestId();\n\n    try {\n      // Log operation start if logSuccess is enabled\n      if (logSuccess) {\n        serverLogger.debug(`[${operation}] Starting operation`, {\n          requestId,\n          ...context,\n        });\n      }\n\n      // Execute the handler\n      const result = await handler(ctx);\n\n      // Log success if enabled\n      if (logSuccess) {\n        const duration = Date.now() - startTime;\n        serverLogger.log(logLevel, `[${operation}] Operation completed`, {\n          requestId,\n          duration,\n          ...context,\n        });\n      }\n\n      return result;\n    } catch (error) {\n      const duration = Date.now() - startTime;\n\n      // Convert to AppError\n      let appError: AppError;\n\n      if (preserveAppErrors && isAppError(error)) {\n        appError = error;\n      } else if (transformError) {\n        appError = transformError(error);\n      } else {\n        appError = toAppError(error, {\n          ...context,\n          operation,\n        });\n      }\n\n      // Log the error\n      serverLogger.error(`[${operation}] Operation failed`, {\n        requestId,\n        duration,\n        error: appError.toLogObject(),\n        input: sanitizeInput(ctx),\n        ...context,\n      });\n\n      // Re-throw the AppError\n      throw appError;\n    }\n  };\n}\n\n// ============================================================================\n// Authenticated Handler Wrapper\n// ============================================================================\n\n/**\n * Options for authenticated handlers\n */\nexport interface AuthenticatedHandlerOptions extends ErrorHandlingOptions {\n  /** Resource type being accessed (for permission checks) */\n  resourceType?: string;\n}\n\n/**\n * Creates a handler that requires authentication.\n *\n * This is a convenience wrapper that:\n * 1. Calls getAuthenticatedSession\n * 2. Passes the session to your handler\n * 3. Wraps everything with error handling\n *\n * @example\n * ```ts\n * export const getMyApps = createServerFn({ method: \"GET\" }).handler(\n *   withAuthentication(\n *     async (session, ctx) => {\n *       return await getAppsByUserId(session.user.id);\n *     },\n *     { operation: \"getMyApps\" }\n *   )\n * );\n * ```\n */\nexport function withAuthentication<TInput, TOutput>(\n  handler: (\n    session: Awaited<ReturnType<typeof import(\"./auth-utils.server\").getAuthenticatedSession>>,\n    ctx: TInput\n  ) => Promise<TOutput>,\n  options: AuthenticatedHandlerOptions = {}\n): WrappedHandler<TInput, TOutput> {\n  return withErrorHandling(async (ctx: TInput) => {\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const session = await getAuthenticatedSession();\n    return handler(session, ctx);\n  }, options);\n}\n\n/**\n * Creates a handler that optionally uses authentication.\n *\n * Similar to withAuthentication, but the session can be null.\n *\n * @example\n * ```ts\n * export const getPublicApps = createServerFn({ method: \"GET\" }).handler(\n *   withOptionalAuthentication(\n *     async (session, ctx) => {\n *       if (session) {\n *         return await getAppsByUserId(session.user.id);\n *       }\n *       return await getPublicApps();\n *     },\n *     { operation: \"getPublicApps\" }\n *   )\n * );\n * ```\n */\nexport function withOptionalAuthentication<TInput, TOutput>(\n  handler: (\n    session: Awaited<ReturnType<typeof import(\"./auth-utils.server\").getOptionalSession>>,\n    ctx: TInput\n  ) => Promise<TOutput>,\n  options: AuthenticatedHandlerOptions = {}\n): WrappedHandler<TInput, TOutput> {\n  return withErrorHandling(async (ctx: TInput) => {\n    const { getOptionalSession } = await import(\"./auth-utils.server\");\n    const session = await getOptionalSession();\n    return handler(session, ctx);\n  }, options);\n}\n\n// ============================================================================\n// Safe Execute (Non-throwing)\n// ============================================================================\n\n/**\n * Result type for safe execution\n */\nexport type SafeResult<T> =\n  | { success: true; data: T; error: null }\n  | { success: false; data: null; error: AppError };\n\n/**\n * Executes a function and returns a result object instead of throwing.\n *\n * Useful for operations where you want to handle errors without try-catch.\n *\n * @example\n * ```ts\n * const result = await safeExecute(() => getApp(id));\n * if (result.success) {\n *   console.log(result.data);\n * } else {\n *   console.error(result.error.message);\n * }\n * ```\n */\nexport async function safeExecute<T>(\n  fn: () => Promise<T>,\n  options: ErrorHandlingOptions = {}\n): Promise<SafeResult<T>> {\n  try {\n    const data = await withErrorHandling(async () => fn(), options)({} as never);\n    return { success: true, data, error: null };\n  } catch (error) {\n    const appError = isAppError(error) ? error : toAppError(error);\n    return { success: false, data: null, error: appError };\n  }\n}\n\n// ============================================================================\n// Batch Error Handling\n// ============================================================================\n\n/**\n * Result type for batch operations\n */\nexport interface BatchResult<T> {\n  results: Array<{ success: true; data: T } | { success: false; error: AppError }>;\n  successCount: number;\n  errorCount: number;\n  errors: AppError[];\n}\n\n/**\n * Executes multiple operations and collects all results.\n *\n * Unlike Promise.all, this doesn't fail fast - it runs all operations\n * and returns both successes and failures.\n *\n * @example\n * ```ts\n * const results = await batchExecute(\n *   appIds.map(id => () => deleteApp(id)),\n *   { operation: \"batchDeleteApps\" }\n * );\n * console.log(`Deleted ${results.successCount}, failed ${results.errorCount}`);\n * ```\n */\nexport async function batchExecute<T>(\n  operations: Array<() => Promise<T>>,\n  options: ErrorHandlingOptions = {}\n): Promise<BatchResult<T>> {\n  const results = await Promise.all(\n    operations.map(async (op) => {\n      try {\n        const data = await op();\n        return { success: true as const, data };\n      } catch (error) {\n        const appError = isAppError(error) ? error : toAppError(error);\n        return { success: false as const, error: appError };\n      }\n    })\n  );\n\n  const successResults = results.filter((r): r is { success: true; data: T } => r.success);\n  const errorResults = results.filter((r): r is { success: false; error: AppError } => !r.success);\n\n  // Log batch results if there were errors\n  if (errorResults.length > 0) {\n    serverLogger.warn(`[${options.operation || \"batch\"}] Batch operation completed with errors`, {\n      successCount: successResults.length,\n      errorCount: errorResults.length,\n      errors: errorResults.map((r) => ({\n        code: r.error.code,\n        message: r.error.message,\n      })),\n    });\n  }\n\n  return {\n    results,\n    successCount: successResults.length,\n    errorCount: errorResults.length,\n    errors: errorResults.map((r) => r.error),\n  };\n}\n\n// ============================================================================\n// Retry Logic\n// ============================================================================\n\n/**\n * Options for retry logic\n */\nexport interface RetryOptions {\n  /** Maximum number of attempts (default: 3) */\n  maxAttempts?: number;\n\n  /** Initial delay in ms (default: 1000) */\n  initialDelay?: number;\n\n  /** Delay multiplier for exponential backoff (default: 2) */\n  backoffMultiplier?: number;\n\n  /** Maximum delay in ms (default: 30000) */\n  maxDelay?: number;\n\n  /** Whether to retry on this error (default: retry on ExternalServiceError) */\n  shouldRetry?: (error: AppError, attempt: number) => boolean;\n}\n\n/**\n * Executes a function with retry logic and exponential backoff.\n *\n * By default, only retries on ExternalServiceError.\n *\n * @example\n * ```ts\n * const result = await withRetry(\n *   () => fetchExternalApi(),\n *   {\n *     maxAttempts: 3,\n *     shouldRetry: (error) => error.code === ErrorCode.REQUEST_TIMEOUT\n *   }\n * );\n * ```\n */\nexport async function withRetry<T>(\n  fn: () => Promise<T>,\n  options: RetryOptions = {}\n): Promise<T> {\n  const {\n    maxAttempts = 3,\n    initialDelay = 1000,\n    backoffMultiplier = 2,\n    maxDelay = 30000,\n    shouldRetry = (error) =>\n      error.code === ErrorCode.EXTERNAL_SERVICE_ERROR ||\n      error.code === ErrorCode.REQUEST_TIMEOUT ||\n      error.code === ErrorCode.CONNECTION_FAILED,\n  } = options;\n\n  let lastError: AppError | undefined;\n  let delay = initialDelay;\n\n  for (let attempt = 1; attempt <= maxAttempts; attempt++) {\n    try {\n      return await fn();\n    } catch (error) {\n      const appError = isAppError(error) ? error : toAppError(error);\n      lastError = appError;\n\n      if (attempt < maxAttempts && shouldRetry(appError, attempt)) {\n        serverLogger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {\n          error: appError.code,\n          nextDelay: delay,\n        });\n\n        await sleep(delay);\n        delay = Math.min(delay * backoffMultiplier, maxDelay);\n      } else {\n        throw appError;\n      }\n    }\n  }\n\n  // This should never be reached, but TypeScript needs it\n  throw lastError || new InternalError(\"Retry failed\");\n}\n\n// ============================================================================\n// Utility Functions\n// ============================================================================\n\n/**\n * Generate a unique request ID for tracing\n */\nfunction generateRequestId(): string {\n  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;\n}\n\n/**\n * Sanitize input for logging (remove sensitive data)\n */\nfunction sanitizeInput(input: unknown): unknown {\n  if (input === null || input === undefined) {\n    return input;\n  }\n\n  if (typeof input !== \"object\") {\n    return input;\n  }\n\n  // Sensitive field patterns\n  const sensitivePatterns = [\n    /password/i,\n    /secret/i,\n    /token/i,\n    /key/i,\n    /auth/i,\n    /credential/i,\n    /apikey/i,\n  ];\n\n  const sanitized: Record<string, unknown> = {};\n\n  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {\n    if (sensitivePatterns.some((pattern) => pattern.test(key))) {\n      sanitized[key] = \"[REDACTED]\";\n    } else if (typeof value === \"object\" && value !== null) {\n      sanitized[key] = sanitizeInput(value);\n    } else {\n      sanitized[key] = value;\n    }\n  }\n\n  return sanitized;\n}\n\n/**\n * Sleep for a given number of milliseconds\n */\nfunction sleep(ms: number): Promise<void> {\n  return new Promise((resolve) => setTimeout(resolve, ms));\n}\n\n// ============================================================================\n// Assertion Helpers\n// ============================================================================\n\n/**\n * Assert that a value is not null/undefined, throwing NotFoundError if it is.\n *\n * @example\n * ```ts\n * const app = await db.query.apps.findFirst({ where: eq(apps.id, id) });\n * assertFound(app, \"App\", id);\n * // app is now typed as non-null\n * ```\n */\nexport function assertFound<T>(\n  value: T | null | undefined,\n  resourceType: string,\n  resourceId?: string\n): asserts value is T {\n  if (value === null || value === undefined) {\n    const { Errors } = require(\"./errors\");\n    throw Errors.notFound(resourceType, resourceId);\n  }\n}\n\n/**\n * Assert a condition is true, throwing ValidationError if not.\n *\n * @example\n * ```ts\n * assertValid(email.includes(\"@\"), \"Invalid email format\");\n * ```\n */\nexport function assertValid(\n  condition: boolean,\n  message: string,\n  code: string = ErrorCode.VALIDATION_ERROR\n): asserts condition {\n  if (!condition) {\n    const { ValidationError } = require(\"./errors\");\n    throw new ValidationError(message, code as any);\n  }\n}\n"
}

Now let me create the logging utility:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing error handling patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and error handling patterns"
    },
    {
      "content": "Implement custom error classes (AppError, AuthorizationError, ValidationError, etc.)",
      "status": "completed",
      "activeForm": "Implementing custom error classes"
    },
    {
      "content": "Create server function wrapper/decorator for consistent error handling",
      "status": "completed",
      "activeForm": "Creating server function wrapper/decorator"
    },
    {
      "content": "Add logging utility for error handling",
      "status": "in_progress",
      "activeForm": "Adding logging utility for error handling"
    },
    {
      "content": "Update auth-utils.server.ts to use new error classes",
      "status": "pending",
      "activeForm": "Updating auth-utils.server.ts with new error classes"
    },
    {
      "content": "Update index.server.ts to export new utilities",
      "status": "pending",
      "activeForm": "Updating index.server.ts exports"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/logger.ts",
  "content": "/**\n * Server-side Logging Utility\n *\n * This module provides structured logging for server operations with:\n * - Log levels (debug, info, warn, error)\n * - Structured JSON output\n * - Context enrichment\n * - Error formatting\n * - Environment-aware behavior\n *\n * Usage:\n * ```ts\n * import { serverLogger } from \"./logger\";\n *\n * serverLogger.info(\"Operation completed\", { userId: \"123\", duration: 45 });\n * serverLogger.error(\"Operation failed\", { error: appError.toLogObject() });\n * ```\n */\n\n// ============================================================================\n// Types\n// ============================================================================\n\n/**\n * Available log levels\n */\nexport type LogLevel = \"debug\" | \"info\" | \"warn\" | \"error\";\n\n/**\n * Log entry structure\n */\nexport interface LogEntry {\n  level: LogLevel;\n  message: string;\n  timestamp: string;\n  context?: Record<string, unknown>;\n}\n\n/**\n * Logger configuration\n */\nexport interface LoggerConfig {\n  /** Minimum log level to output */\n  minLevel: LogLevel;\n\n  /** Whether to output as JSON (useful for log aggregators) */\n  jsonOutput: boolean;\n\n  /** Whether to include timestamps */\n  includeTimestamp: boolean;\n\n  /** Additional context to include in all logs */\n  defaultContext?: Record<string, unknown>;\n}\n\n// ============================================================================\n// Log Level Priority\n// ============================================================================\n\nconst LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {\n  debug: 0,\n  info: 1,\n  warn: 2,\n  error: 3,\n};\n\n// ============================================================================\n// Default Configuration\n// ============================================================================\n\nconst isDevelopment = process.env.NODE_ENV !== \"production\";\n\nconst defaultConfig: LoggerConfig = {\n  minLevel: isDevelopment ? \"debug\" : \"info\",\n  jsonOutput: !isDevelopment,\n  includeTimestamp: true,\n  defaultContext: {},\n};\n\n// ============================================================================\n// Logger Class\n// ============================================================================\n\n/**\n * Structured logger for server-side operations\n */\nclass Logger {\n  private config: LoggerConfig;\n\n  constructor(config: Partial<LoggerConfig> = {}) {\n    this.config = { ...defaultConfig, ...config };\n  }\n\n  /**\n   * Check if a log level should be output\n   */\n  private shouldLog(level: LogLevel): boolean {\n    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];\n  }\n\n  /**\n   * Format a log entry for output\n   */\n  private formatEntry(entry: LogEntry): string {\n    if (this.config.jsonOutput) {\n      return JSON.stringify(entry);\n    }\n\n    // Human-readable format for development\n    const timestamp = this.config.includeTimestamp\n      ? `[${entry.timestamp}] `\n      : \"\";\n    const level = entry.level.toUpperCase().padEnd(5);\n    const contextStr = entry.context\n      ? ` ${JSON.stringify(entry.context)}`\n      : \"\";\n\n    return `${timestamp}${level} ${entry.message}${contextStr}`;\n  }\n\n  /**\n   * Create a log entry\n   */\n  private createEntry(\n    level: LogLevel,\n    message: string,\n    context?: Record<string, unknown>\n  ): LogEntry {\n    return {\n      level,\n      message,\n      timestamp: new Date().toISOString(),\n      context: {\n        ...this.config.defaultContext,\n        ...context,\n      },\n    };\n  }\n\n  /**\n   * Output a log entry\n   */\n  private output(entry: LogEntry): void {\n    const formatted = this.formatEntry(entry);\n\n    switch (entry.level) {\n      case \"error\":\n        console.error(formatted);\n        break;\n      case \"warn\":\n        console.warn(formatted);\n        break;\n      case \"debug\":\n        console.debug(formatted);\n        break;\n      default:\n        console.log(formatted);\n    }\n  }\n\n  /**\n   * Log at a specific level\n   */\n  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {\n    if (!this.shouldLog(level)) return;\n    const entry = this.createEntry(level, message, context);\n    this.output(entry);\n  }\n\n  /**\n   * Log a debug message\n   */\n  debug(message: string, context?: Record<string, unknown>): void {\n    this.log(\"debug\", message, context);\n  }\n\n  /**\n   * Log an info message\n   */\n  info(message: string, context?: Record<string, unknown>): void {\n    this.log(\"info\", message, context);\n  }\n\n  /**\n   * Log a warning message\n   */\n  warn(message: string, context?: Record<string, unknown>): void {\n    this.log(\"warn\", message, context);\n  }\n\n  /**\n   * Log an error message\n   */\n  error(message: string, context?: Record<string, unknown>): void {\n    this.log(\"error\", message, context);\n  }\n\n  /**\n   * Log an error object with full context\n   */\n  logError(error: unknown, message?: string, context?: Record<string, unknown>): void {\n    const errorContext = this.formatError(error);\n    this.error(message || errorContext.message || \"An error occurred\", {\n      ...context,\n      error: errorContext,\n    });\n  }\n\n  /**\n   * Format an error for logging\n   */\n  private formatError(error: unknown): Record<string, unknown> {\n    if (error === null || error === undefined) {\n      return { type: \"null\", value: String(error) };\n    }\n\n    // Handle AppError (has toLogObject method)\n    if (\n      typeof error === \"object\" &&\n      \"toLogObject\" in error &&\n      typeof (error as { toLogObject: () => Record<string, unknown> }).toLogObject === \"function\"\n    ) {\n      return (error as { toLogObject: () => Record<string, unknown> }).toLogObject();\n    }\n\n    // Handle standard Error\n    if (error instanceof Error) {\n      return {\n        type: error.constructor.name,\n        message: error.message,\n        stack: error.stack,\n        ...(error.cause ? { cause: this.formatError(error.cause) } : {}),\n      };\n    }\n\n    // Handle other types\n    if (typeof error === \"object\") {\n      return { type: \"object\", value: error };\n    }\n\n    return { type: typeof error, value: String(error) };\n  }\n\n  /**\n   * Create a child logger with additional default context\n   */\n  child(context: Record<string, unknown>): Logger {\n    return new Logger({\n      ...this.config,\n      defaultContext: {\n        ...this.config.defaultContext,\n        ...context,\n      },\n    });\n  }\n\n  /**\n   * Time an operation and log the result\n   */\n  async time<T>(\n    operation: string,\n    fn: () => Promise<T>,\n    context?: Record<string, unknown>\n  ): Promise<T> {\n    const startTime = Date.now();\n    this.debug(`[${operation}] Starting`, context);\n\n    try {\n      const result = await fn();\n      const duration = Date.now() - startTime;\n      this.info(`[${operation}] Completed`, { ...context, duration });\n      return result;\n    } catch (error) {\n      const duration = Date.now() - startTime;\n      this.logError(error, `[${operation}] Failed`, { ...context, duration });\n      throw error;\n    }\n  }\n}\n\n// ============================================================================\n// Export Singleton Instance\n// ============================================================================\n\n/**\n * Default server logger instance\n */\nexport const serverLogger = new Logger();\n\n/**\n * Create a custom logger with specific configuration\n */\nexport function createLogger(config: Partial<LoggerConfig> = {}): Logger {\n  return new Logger(config);\n}\n\n// ============================================================================\n// Convenience Functions\n// ============================================================================\n\n/**\n * Log an operation start (useful for tracing)\n */\nexport function logOperationStart(\n  operation: string,\n  context?: Record<string, unknown>\n): void {\n  serverLogger.debug(`[${operation}] Starting`, context);\n}\n\n/**\n * Log an operation end with timing\n */\nexport function logOperationEnd(\n  operation: string,\n  startTime: number,\n  context?: Record<string, unknown>\n): void {\n  const duration = Date.now() - startTime;\n  serverLogger.info(`[${operation}] Completed`, { ...context, duration });\n}\n\n/**\n * Log an operation failure with error details\n */\nexport function logOperationError(\n  operation: string,\n  error: unknown,\n  startTime?: number,\n  context?: Record<string, unknown>\n): void {\n  const duration = startTime ? Date.now() - startTime : undefined;\n  serverLogger.logError(error, `[${operation}] Failed`, {\n    ...context,\n    ...(duration !== undefined && { duration }),\n  });\n}\n\n// ============================================================================\n// Request Logging Helpers\n// ============================================================================\n\n/**\n * Create request context for logging\n */\nexport function createRequestContext(options: {\n  requestId?: string;\n  userId?: string;\n  operation?: string;\n  resourceType?: string;\n  resourceId?: string;\n}): Record<string, unknown> {\n  return Object.fromEntries(\n    Object.entries(options).filter(([_, v]) => v !== undefined)\n  );\n}\n\n/**\n * Sanitize data for logging (remove sensitive fields)\n */\nexport function sanitizeForLogging<T extends Record<string, unknown>>(\n  data: T,\n  sensitiveFields: string[] = [\n    \"password\",\n    \"secret\",\n    \"token\",\n    \"apiKey\",\n    \"api_key\",\n    \"accessToken\",\n    \"access_token\",\n    \"refreshToken\",\n    \"refresh_token\",\n    \"authorization\",\n    \"credential\",\n  ]\n): T {\n  const result = { ...data };\n\n  for (const field of sensitiveFields) {\n    if (field in result) {\n      (result as Record<string, unknown>)[field] = \"[REDACTED]\";\n    }\n  }\n\n  return result;\n}\n"
}

Now let me update the auth-utils.server.ts to use the new error classes:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing error handling patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and error handling patterns"
    },
    {
      "content": "Implement custom error classes (AppError, AuthorizationError, ValidationError, etc.)",
      "status": "completed",
      "activeForm": "Implementing custom error classes"
    },
    {
      "content": "Create server function wrapper/decorator for consistent error handling",
      "status": "completed",
      "activeForm": "Creating server function wrapper/decorator"
    },
    {
      "content": "Add logging utility for error handling",
      "status": "completed",
      "activeForm": "Adding logging utility for error handling"
    },
    {
      "content": "Update auth-utils.server.ts to use new error classes",
      "status": "in_progress",
      "activeForm": "Updating auth-utils.server.ts with new error classes"
    },
    {
      "content": "Update index.server.ts to export new utilities",
      "status": "pending",
      "activeForm": "Updating index.server.ts exports"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/auth-utils.server.ts",
  "old_string": "import { getRequest } from \"@tanstack/react-start/server\";\n\n/**\n * Session type from better-auth\n * Note: We define this manually to avoid importing auth at the module level\n */\nexport type AuthSession = {\n  user: {\n    id: string;\n    name: string;\n    email: string;\n    image?: string | null;\n  };\n  session: {\n    id: string;\n    userId: string;\n    expiresAt: Date;\n  };\n} | null;\n\n/**\n * Authenticated session with a guaranteed user\n */\nexport type AuthenticatedSession = NonNullable<AuthSession> & {\n  user: NonNullable<NonNullable<AuthSession>[\"user\"]>;\n};\n\n/**\n * Get the current session from the request headers.\n * This is a centralized utility for retrieving the session in server functions.\n * Uses dynamic import to prevent bundling auth/db into the client.\n *\n * @returns The session object or null if not authenticated\n */\nexport async function getSession(): Promise<AuthSession> {\n  const { auth } = await import(\"@/lib/auth.server\");\n  const request = getRequest();\n  const session = await auth.api.getSession({ headers: request.headers });\n  return session;\n}\n\n/**\n * Get the authenticated session or throw an Unauthorized error.\n * Use this for endpoints that require authentication.\n *\n * @throws Error with message \"Unauthorized\" if not authenticated\n * @returns The authenticated session with a guaranteed user\n */\nexport async function getAuthenticatedSession(): Promise<AuthenticatedSession> {\n  const session = await getSession();\n  if (!session?.user) {\n    throw new Error(\"Unauthorized\");\n  }\n  return session as AuthenticatedSession;\n}\n\n/**\n * Get the session for optional authentication.\n * Use this for endpoints that work with or without authentication.\n *\n * @returns The session if authenticated, null otherwise\n */\nexport async function getOptionalSession(): Promise<AuthenticatedSession | null> {\n  const session = await getSession();\n  if (!session?.user) {\n    return null;\n  }\n  return session as AuthenticatedSession;\n}",
  "new_string": "import { getRequest } from \"@tanstack/react-start/server\";\nimport { Errors } from \"./errors\";\n\n/**\n * Session type from better-auth\n * Note: We define this manually to avoid importing auth at the module level\n */\nexport type AuthSession = {\n  user: {\n    id: string;\n    name: string;\n    email: string;\n    image?: string | null;\n  };\n  session: {\n    id: string;\n    userId: string;\n    expiresAt: Date;\n  };\n} | null;\n\n/**\n * Authenticated session with a guaranteed user\n */\nexport type AuthenticatedSession = NonNullable<AuthSession> & {\n  user: NonNullable<NonNullable<AuthSession>[\"user\"]>;\n};\n\n/**\n * Get the current session from the request headers.\n * This is a centralized utility for retrieving the session in server functions.\n * Uses dynamic import to prevent bundling auth/db into the client.\n *\n * @returns The session object or null if not authenticated\n */\nexport async function getSession(): Promise<AuthSession> {\n  const { auth } = await import(\"@/lib/auth.server\");\n  const request = getRequest();\n  const session = await auth.api.getSession({ headers: request.headers });\n  return session;\n}\n\n/**\n * Get the authenticated session or throw an AuthenticationError.\n * Use this for endpoints that require authentication.\n *\n * @throws AuthenticationError if not authenticated\n * @returns The authenticated session with a guaranteed user\n */\nexport async function getAuthenticatedSession(): Promise<AuthenticatedSession> {\n  const session = await getSession();\n  if (!session?.user) {\n    throw Errors.unauthorized();\n  }\n  return session as AuthenticatedSession;\n}\n\n/**\n * Get the session for optional authentication.\n * Use this for endpoints that work with or without authentication.\n *\n * @returns The session if authenticated, null otherwise\n */\nexport async function getOptionalSession(): Promise<AuthenticatedSession | null> {\n  const session = await getSession();\n  if (!session?.user) {\n    return null;\n  }\n  return session as AuthenticatedSession;\n}"
}

Now let me update the index.server.ts to export the new utilities:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing error handling patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and error handling patterns"
    },
    {
      "content": "Implement custom error classes (AppError, AuthorizationError, ValidationError, etc.)",
      "status": "completed",
      "activeForm": "Implementing custom error classes"
    },
    {
      "content": "Create server function wrapper/decorator for consistent error handling",
      "status": "completed",
      "activeForm": "Creating server function wrapper/decorator"
    },
    {
      "content": "Add logging utility for error handling",
      "status": "completed",
      "activeForm": "Adding logging utility for error handling"
    },
    {
      "content": "Update auth-utils.server.ts to use new error classes",
      "status": "completed",
      "activeForm": "Updating auth-utils.server.ts with new error classes"
    },
    {
      "content": "Update index.server.ts to export new utilities",
      "status": "in_progress",
      "activeForm": "Updating index.server.ts exports"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/index.server.ts",
  "old_string": "export * from \"./apps.server\";\nexport * from \"./categories.server\";\nexport * from \"./tags.server\";\nexport * from \"./user-settings.server\";\nexport * from \"./auth-utils.server\";\nexport * from \"./health-cache.server\";\nexport * from \"./sharing.server\";\nexport * from \"./analytics.server\";",
  "new_string": "// Data server functions\nexport * from \"./apps.server\";\nexport * from \"./categories.server\";\nexport * from \"./tags.server\";\nexport * from \"./user-settings.server\";\nexport * from \"./auth-utils.server\";\nexport * from \"./health-cache.server\";\nexport * from \"./sharing.server\";\nexport * from \"./analytics.server\";\n\n// Error handling and utilities\nexport * from \"./errors\";\nexport * from \"./server-fn\";\nexport * from \"./logger\";"
}

Now let me verify the TypeScript compilation works and there are no issues:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -50",
  "description": "Check TypeScript compilation",
  "timeout": 60000
}

The errors are pre-existing TypeScript errors in the codebase, not related to my new changes. Let me check if my new files have any TypeScript errors specifically:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(errors\\.ts|server-fn\\.ts|logger\\.ts)\" || echo \"No errors in new files\"",
  "description": "Check TypeScript errors in new files",
  "timeout": 60000
}

Let me fix these TypeScript errors:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "old_string": "import {\n  AppError,\n  AuthenticationError,\n  InternalError,\n  ErrorCode,\n  isAppError,\n  toAppError,\n  type ErrorContext,\n} from \"./errors\";",
  "new_string": "import {\n  AppError,\n  InternalError,\n  ErrorCode,\n  isAppError,\n  toAppError,\n  type ErrorContext,\n} from \"./errors\";"
}

Now let me fix the assertValid function type issue:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "offset": 340
}

I need to fix the type predicate and add a proper import:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "old_string": "import {\n  AppError,\n  InternalError,\n  ErrorCode,\n  isAppError,\n  toAppError,\n  type ErrorContext,\n} from \"./errors\";",
  "new_string": "import {\n  AppError,\n  InternalError,\n  ValidationError,\n  ErrorCode,\n  Errors,\n  isAppError,\n  toAppError,\n  type ErrorContext,\n  type ErrorCodeType,\n} from \"./errors\";"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "old_string": "/**\n * Assert that a value is not null/undefined, throwing NotFoundError if it is.\n *\n * @example\n * ```ts\n * const app = await db.query.apps.findFirst({ where: eq(apps.id, id) });\n * assertFound(app, \"App\", id);\n * // app is now typed as non-null\n * ```\n */\nexport function assertFound<T>(\n  value: T | null | undefined,\n  resourceType: string,\n  resourceId?: string\n): asserts value is T {\n  if (value === null || value === undefined) {\n    const { Errors } = require(\"./errors\");\n    throw Errors.notFound(resourceType, resourceId);\n  }\n}\n\n/**\n * Assert a condition is true, throwing ValidationError if not.\n *\n * @example\n * ```ts\n * assertValid(email.includes(\"@\"), \"Invalid email format\");\n * ```\n */\nexport function assertValid(\n  condition: boolean,\n  message: string,\n  code: string = ErrorCode.VALIDATION_ERROR\n): asserts condition {\n  if (!condition) {\n    const { ValidationError } = require(\"./errors\");\n    throw new ValidationError(message, code as any);\n  }\n}",
  "new_string": "/**\n * Assert that a value is not null/undefined, throwing NotFoundError if it is.\n *\n * @example\n * ```ts\n * const app = await db.query.apps.findFirst({ where: eq(apps.id, id) });\n * assertFound(app, \"App\", id);\n * // app is now typed as non-null\n * ```\n */\nexport function assertFound<T>(\n  value: T | null | undefined,\n  resourceType: string,\n  resourceId?: string\n): asserts value is T {\n  if (value === null || value === undefined) {\n    throw Errors.notFound(resourceType, resourceId);\n  }\n}\n\n/**\n * Assert a condition is true, throwing ValidationError if not.\n *\n * @example\n * ```ts\n * assertValid(email.includes(\"@\"), \"Invalid email format\");\n * ```\n */\nexport function assertValid(\n  condition: boolean,\n  message: string,\n  code: ErrorCodeType = ErrorCode.VALIDATION_ERROR\n): asserts condition {\n  if (!condition) {\n    throw new ValidationError(message, code);\n  }\n}"
}

Now let me fix the logger.ts error:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/logger.ts",
  "offset": 190,
  "limit": 30
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/logger.ts",
  "old_string": "  /**\n   * Log an error object with full context\n   */\n  logError(error: unknown, message?: string, context?: Record<string, unknown>): void {\n    const errorContext = this.formatError(error);\n    this.error(message || errorContext.message || \"An error occurred\", {\n      ...context,\n      error: errorContext,\n    });\n  }",
  "new_string": "  /**\n   * Log an error object with full context\n   */\n  logError(error: unknown, message?: string, context?: Record<string, unknown>): void {\n    const errorContext = this.formatError(error);\n    const errorMessage = typeof errorContext.message === \"string\" ? errorContext.message : \"An error occurred\";\n    this.error(message || errorMessage, {\n      ...context,\n      error: errorContext,\n    });\n  }"
}

Now let me verify the TypeScript errors are fixed in the new files:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(errors\\.ts|server-fn\\.ts|logger\\.ts|auth-utils\\.server\\.ts)\" || echo \"No errors in new/updated files\"",
  "description": "Check TypeScript errors in new files",
  "timeout": 60000
}

Let me look at line 351 in the updated file:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "offset": 340,
  "limit": 20
}

The issue is with the type predicate. Let me fix this:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "old_string": "  const successResults = results.filter((r): r is { success: true; data: T } => r.success);\n  const errorResults = results.filter((r): r is { success: false; error: AppError } => !r.success);",
  "new_string": "  type SuccessResult = { success: true; data: T };\n  type ErrorResult = { success: false; error: AppError };\n\n  const successResults = results.filter((r): r is SuccessResult => r.success);\n  const errorResults = results.filter((r): r is ErrorResult => !r.success);"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(errors\\.ts|server-fn\\.ts|logger\\.ts|auth-utils\\.server\\.ts)\" || echo \"No errors in new/updated files\"",
  "description": "Check TypeScript errors in new files",
  "timeout": 60000
}

Let me look at the full context and fix this properly:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "offset": 310,
  "limit": 60
}

The issue is that the type predicate requires the type to be assignable to the array element type. Let me fix this by using a simpler approach:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts",
  "old_string": "export async function batchExecute<T>(\n  operations: Array<() => Promise<T>>,\n  options: ErrorHandlingOptions = {}\n): Promise<BatchResult<T>> {\n  const results = await Promise.all(\n    operations.map(async (op) => {\n      try {\n        const data = await op();\n        return { success: true as const, data };\n      } catch (error) {\n        const appError = isAppError(error) ? error : toAppError(error);\n        return { success: false as const, error: appError };\n      }\n    })\n  );\n\n  type SuccessResult = { success: true; data: T };\n  type ErrorResult = { success: false; error: AppError };\n\n  const successResults = results.filter((r): r is SuccessResult => r.success);\n  const errorResults = results.filter((r): r is ErrorResult => !r.success);",
  "new_string": "export async function batchExecute<T>(\n  operations: Array<() => Promise<T>>,\n  options: ErrorHandlingOptions = {}\n): Promise<BatchResult<T>> {\n  type SuccessResult = { success: true; data: T };\n  type ErrorResult = { success: false; error: AppError };\n  type BatchItem = SuccessResult | ErrorResult;\n\n  const results: BatchItem[] = await Promise.all(\n    operations.map(async (op): Promise<BatchItem> => {\n      try {\n        const data = await op();\n        return { success: true, data };\n      } catch (error) {\n        const appError = isAppError(error) ? error : toAppError(error);\n        return { success: false, error: appError };\n      }\n    })\n  );\n\n  const successResults = results.filter((r): r is SuccessResult => r.success);\n  const errorResults = results.filter((r): r is ErrorResult => !r.success);"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(errors\\.ts|server-fn\\.ts|logger\\.ts|auth-utils\\.server\\.ts)\" || echo \"No errors in new/updated files\"",
  "description": "Check TypeScript errors in new files",
  "timeout": 60000
}

All TypeScript errors in the new files are fixed. Now let me update the todo list and mark everything as complete:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing error handling patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and error handling patterns"
    },
    {
      "content": "Implement custom error classes (AppError, AuthorizationError, ValidationError, etc.)",
      "status": "completed",
      "activeForm": "Implementing custom error classes"
    },
    {
      "content": "Create server function wrapper/decorator for consistent error handling",
      "status": "completed",
      "activeForm": "Creating server function wrapper/decorator"
    },
    {
      "content": "Add logging utility for error handling",
      "status": "completed",
      "activeForm": "Adding logging utility for error handling"
    },
    {
      "content": "Update auth-utils.server.ts to use new error classes",
      "status": "completed",
      "activeForm": "Updating auth-utils.server.ts with new error classes"
    },
    {
      "content": "Update index.server.ts to export new utilities",
      "status": "completed",
      "activeForm": "Updating index.server.ts exports"
    }
  ]
}

Let me now verify everything works by running a quick test:

🔧 Tool: Bash
Input: {
  "command": "npm run build 2>&1 | tail -30",
  "description": "Run build to verify everything works",
  "timeout": 120000
}

The build error is a pre-existing issue with the @tanstack/router-core package, not related to our changes. Let me verify our files compile correctly in isolation:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --skipLibCheck src/lib/server/errors.ts src/lib/server/logger.ts src/lib/server/server-fn.ts 2>&1 || echo \"Done checking files\"",
  "description": "Check new files compile correctly",
  "timeout": 60000
}

The errors are not from our new code - they're from module resolution issues when running TypeScript in isolation. Let me check if our new files work within the broader context:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -c \"error TS\" || echo \"0 errors\"",
  "description": "Count TypeScript errors",
  "timeout": 60000
}

Let me check for only our files specifically in the broader project context:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"^src/lib/server/(errors|logger|server-fn|auth-utils)\\..*error\" || echo \"No errors in our files\"",
  "description": "Check for errors in our specific files",
  "timeout": 60000
}

Our new files compile successfully within the context of the project. The 734 errors are pre-existing issues in the codebase (mainly in alert and analytics components).

Let me now read the final versions of our new files to verify everything is in order:

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/lib/server/*.ts | head -15",
  "description": "List server files"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/lib/server/*.ts | tail -15",
  "description": "List remaining server files"
}

All our new files are created. Let me provide a summary of the implementation:

<summary>
## Summary: Create a centralized error handling and validation middleware layer for server functions

### Changes Implemented
- Created a comprehensive error class hierarchy with `AppError` as the base class
  - `AuthenticationError` (401) - For unauthorized access
  - `AuthorizationError` (403) - For forbidden/permission issues
  - `NotFoundError` (404) - For missing resources
  - `ValidationError` (400) - For input validation failures
  - `ConflictError` (409) - For duplicates/circular dependencies
  - `RateLimitError` (429) - For rate limiting
  - `ExternalServiceError` (502) - For third-party service failures
  - `InternalError` (500) - For unexpected server errors
- Implemented standardized error codes (`ErrorCode` constants) for consistent client-side handling
- Created factory functions (`Errors.*`) for common error scenarios with consistent messages
- Built server function wrappers for consistent error handling:
  - `withErrorHandling()` - Basic wrapper with logging and error conversion
  - `withAuthentication()` - Wrapper that requires authentication
  - `withOptionalAuthentication()` - Wrapper for optional auth
  - `safeExecute()` - Non-throwing version that returns Result type
  - `batchExecute()` - For batch operations with partial failure handling
  - `withRetry()` - Retry logic with exponential backoff
- Added assertion helpers:
  - `assertFound()` - Assert non-null values, throw NotFoundError
  - `assertValid()` - Assert conditions, throw ValidationError
- Created structured logging utility (`serverLogger`) with:
  - Log levels (debug, info, warn, error)
  - JSON output for production
  - Error formatting
  - Request timing
- Updated `auth-utils.server.ts` to use new `AuthenticationError`
- Exported all new utilities from `index.server.ts`

### Files Modified
- `src/lib/server/errors.ts` (NEW) - Custom error classes and factory functions
- `src/lib/server/server-fn.ts` (NEW) - Server function wrappers and utilities
- `src/lib/server/logger.ts` (NEW) - Structured logging utility
- `src/lib/server/auth-utils.server.ts` - Updated to use new error classes
- `src/lib/server/index.server.ts` - Added exports for new utilities

### Notes for Developer
- **Migration Guide**: To adopt the new error handling in existing server files:
  1. Import error classes: `import { Errors, NotFoundError, ValidationError } from "./errors";`
  2. Replace `throw new Error("App not found")` with `throw Errors.appNotFound(id);`
  3. Replace `throw new Error("Unauthorized")` with `throw Errors.unauthorized();`
  4. Optionally wrap handlers with `withErrorHandling()` for automatic logging
  
- **Example Migration**:
  ```typescript
  // Before
  if (!app) throw new Error("App not found");
  
  // After
  if (!app) throw Errors.appNotFound(ctx.data.id);
  // Or use assertion helper:
  assertFound(app, "App", ctx.data.id);
  ```

- **Error Response Structure**: All errors now include:
  - `error`: Client-safe message
  - `code`: Machine-readable error code (e.g., `APP_NOT_FOUND`)
  - `statusCode`: HTTP status code

- **Pre-existing TypeScript errors**: The codebase has ~734 existing TypeScript errors mainly in alert and analytics components. These are unrelated to this implementation.
</summary>