/**
 * Centralized Error Handling System
 *
 * This module provides a hierarchical error class system for consistent error handling
 * across all server functions. It includes:
 *
 * - Custom error classes with HTTP status codes and error codes
 * - Client-safe error responses (no sensitive data leaked)
 * - Structured error logging
 * - Type-safe error handling
 *
 * Error Hierarchy:
 * - AppError (base class for all application errors)
 *   - AuthenticationError (401) - User not authenticated
 *   - AuthorizationError (403) - User not authorized to perform action
 *   - NotFoundError (404) - Resource not found
 *   - ValidationError (400) - Input validation failed
 *   - ConflictError (409) - Resource conflict (e.g., duplicate)
 *   - RateLimitError (429) - Too many requests
 *   - ExternalServiceError (502) - External service failure
 *   - InternalError (500) - Unexpected server error
 */

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Standardized error codes for client-side error handling
 */
export const ErrorCode = {
  // Authentication errors (401)
  UNAUTHORIZED: "UNAUTHORIZED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Authorization errors (403)
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ACCESS_DENIED: "ACCESS_DENIED",

  // Not found errors (404)
  NOT_FOUND: "NOT_FOUND",
  APP_NOT_FOUND: "APP_NOT_FOUND",
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  WIDGET_NOT_FOUND: "WIDGET_NOT_FOUND",
  INTEGRATION_NOT_FOUND: "INTEGRATION_NOT_FOUND",
  ALERT_NOT_FOUND: "ALERT_NOT_FOUND",
  STATUS_PAGE_NOT_FOUND: "STATUS_PAGE_NOT_FOUND",
  TAG_NOT_FOUND: "TAG_NOT_FOUND",
  SHARE_NOT_FOUND: "SHARE_NOT_FOUND",
  API_KEY_NOT_FOUND: "API_KEY_NOT_FOUND",
  SAVED_VIEW_NOT_FOUND: "SAVED_VIEW_NOT_FOUND",
  DEPENDENCY_NOT_FOUND: "DEPENDENCY_NOT_FOUND",
  INCIDENT_NOT_FOUND: "INCIDENT_NOT_FOUND",
  NOTIFICATION_NOT_FOUND: "NOTIFICATION_NOT_FOUND",

  // Validation errors (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_SLUG: "INVALID_SLUG",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  SELF_REFERENCE_ERROR: "SELF_REFERENCE_ERROR",

  // Conflict errors (409)
  CONFLICT: "CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CIRCULAR_DEPENDENCY: "CIRCULAR_DEPENDENCY",
  ALREADY_SHARED: "ALREADY_SHARED",

  // Rate limit errors (429)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // External service errors (502)
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  CONNECTION_FAILED: "CONNECTION_FAILED",
  API_ERROR: "API_ERROR",

  // Internal errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================================================
// Error Context Type
// ============================================================================

/**
 * Additional context that can be attached to errors for debugging
 * This is logged but NOT sent to clients
 */
export interface ErrorContext {
  /** The operation that was being performed */
  operation?: string;
  /** The resource type involved (e.g., 'app', 'category') */
  resourceType?: string;
  /** The resource ID involved */
  resourceId?: string;
  /** The user ID involved */
  userId?: string;
  /** Additional metadata for debugging */
  metadata?: Record<string, unknown>;
  /** The original error if this wraps another error */
  cause?: Error;
}

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * Base application error class
 *
 * All custom errors should extend this class.
 * Provides consistent error structure with HTTP status codes,
 * error codes, and context for logging.
 */
export class AppError extends Error {
  /** HTTP status code */
  public readonly statusCode: number;

  /** Machine-readable error code */
  public readonly code: ErrorCodeType;

  /** Whether this error is operational (expected) vs programming error */
  public readonly isOperational: boolean;

  /** Additional context for logging (not sent to client) */
  public readonly context: ErrorContext;

  /** Timestamp when the error occurred */
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCodeType = ErrorCode.INTERNAL_ERROR,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message);

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to a client-safe response object
   * This excludes sensitive debugging information
   */
  toClientResponse(): {
    error: string;
    code: ErrorCodeType;
    statusCode: number;
  } {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }

  /**
   * Convert error to a detailed log object
   * Includes all context for debugging
   */
  toLogObject(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause: this.context.cause
        ? {
            name: this.context.cause.name,
            message: this.context.cause.message,
            stack: this.context.cause.stack,
          }
        : undefined,
    };
  }
}

// ============================================================================
// Authentication Errors (401)
// ============================================================================

/**
 * Error thrown when user is not authenticated
 *
 * Use for:
 * - Missing session/token
 * - Expired session
 * - Invalid credentials
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = "Unauthorized",
    code: ErrorCodeType = ErrorCode.UNAUTHORIZED,
    context: ErrorContext = {}
  ) {
    super(message, 401, code, context);
  }
}

// ============================================================================
// Authorization Errors (403)
// ============================================================================

/**
 * Error thrown when user lacks permission for an action
 *
 * Use for:
 * - Accessing resources owned by others
 * - Performing actions without required permissions
 * - Accessing restricted features
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = "Access denied",
    code: ErrorCodeType = ErrorCode.FORBIDDEN,
    context: ErrorContext = {}
  ) {
    super(message, 403, code, context);
  }
}

// ============================================================================
// Not Found Errors (404)
// ============================================================================

/**
 * Error thrown when a requested resource doesn't exist
 *
 * Use for:
 * - Resource lookup failures
 * - Missing database records
 * - Invalid IDs
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = "Resource not found",
    code: ErrorCodeType = ErrorCode.NOT_FOUND,
    context: ErrorContext = {}
  ) {
    super(message, 404, code, context);
  }
}

// ============================================================================
// Validation Errors (400)
// ============================================================================

/**
 * Error thrown when input validation fails
 *
 * Use for:
 * - Invalid input format
 * - Missing required fields
 * - Business rule violations
 */
export class ValidationError extends AppError {
  /** Detailed validation errors by field */
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    code: ErrorCodeType = ErrorCode.VALIDATION_ERROR,
    context: ErrorContext = {},
    fieldErrors?: Record<string, string[]>
  ) {
    super(message, 400, code, context);
    this.fieldErrors = fieldErrors;
  }

  override toClientResponse(): {
    error: string;
    code: ErrorCodeType;
    statusCode: number;
    fieldErrors?: Record<string, string[]>;
  } {
    return {
      ...super.toClientResponse(),
      ...(this.fieldErrors && { fieldErrors: this.fieldErrors }),
    };
  }
}

// ============================================================================
// Conflict Errors (409)
// ============================================================================

/**
 * Error thrown when a resource conflict occurs
 *
 * Use for:
 * - Duplicate entries
 * - Unique constraint violations
 * - Circular dependencies
 */
export class ConflictError extends AppError {
  constructor(
    message: string = "Resource conflict",
    code: ErrorCodeType = ErrorCode.CONFLICT,
    context: ErrorContext = {}
  ) {
    super(message, 409, code, context);
  }
}

// ============================================================================
// Rate Limit Errors (429)
// ============================================================================

/**
 * Error thrown when rate limits are exceeded
 *
 * Use for:
 * - API rate limiting
 * - Too many failed attempts
 * - Resource abuse prevention
 */
export class RateLimitError extends AppError {
  /** When the rate limit will reset */
  public readonly retryAfter?: number;

  constructor(
    message: string = "Too many requests",
    code: ErrorCodeType = ErrorCode.RATE_LIMIT_EXCEEDED,
    context: ErrorContext = {},
    retryAfter?: number
  ) {
    super(message, 429, code, context);
    this.retryAfter = retryAfter;
  }

  override toClientResponse(): {
    error: string;
    code: ErrorCodeType;
    statusCode: number;
    retryAfter?: number;
  } {
    return {
      ...super.toClientResponse(),
      ...(this.retryAfter && { retryAfter: this.retryAfter }),
    };
  }
}

// ============================================================================
// External Service Errors (502)
// ============================================================================

/**
 * Error thrown when external service communication fails
 *
 * Use for:
 * - Third-party API failures
 * - Network timeouts
 * - Service unavailability
 */
export class ExternalServiceError extends AppError {
  /** Name of the external service that failed */
  public readonly serviceName?: string;

  constructor(
    message: string = "External service error",
    code: ErrorCodeType = ErrorCode.EXTERNAL_SERVICE_ERROR,
    context: ErrorContext = {},
    serviceName?: string
  ) {
    super(message, 502, code, context);
    this.serviceName = serviceName;
  }
}

// ============================================================================
// Internal Errors (500)
// ============================================================================

/**
 * Error thrown for unexpected internal errors
 *
 * Use for:
 * - Programming errors (should be rare)
 * - Database connection failures
 * - Unexpected exceptions
 *
 * Note: These errors are NOT operational and indicate bugs
 */
export class InternalError extends AppError {
  constructor(
    message: string = "An unexpected error occurred",
    code: ErrorCodeType = ErrorCode.INTERNAL_ERROR,
    context: ErrorContext = {}
  ) {
    // isOperational = false for internal errors
    super(message, 500, code, context, false);
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Factory functions for creating common errors with consistent messages
 */
export const Errors = {
  // Authentication
  unauthorized: (context?: ErrorContext) =>
    new AuthenticationError("Unauthorized", ErrorCode.UNAUTHORIZED, context),

  sessionExpired: (context?: ErrorContext) =>
    new AuthenticationError("Session expired", ErrorCode.SESSION_EXPIRED, context),

  invalidCredentials: (context?: ErrorContext) =>
    new AuthenticationError("Invalid credentials", ErrorCode.INVALID_CREDENTIALS, context),

  // Authorization
  accessDenied: (context?: ErrorContext) =>
    new AuthorizationError("Access denied", ErrorCode.ACCESS_DENIED, context),

  insufficientPermissions: (resource?: string, context?: ErrorContext) =>
    new AuthorizationError(
      resource ? `You don't have permission to access this ${resource}` : "Insufficient permissions",
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      context
    ),

  // Not Found
  notFound: (resourceType: string, resourceId?: string, context?: ErrorContext) =>
    new NotFoundError(
      `${resourceType} not found`,
      ErrorCode.NOT_FOUND,
      { ...context, resourceType, resourceId }
    ),

  appNotFound: (appId?: string, context?: ErrorContext) =>
    new NotFoundError("App not found", ErrorCode.APP_NOT_FOUND, { ...context, resourceType: "app", resourceId: appId }),

  categoryNotFound: (categoryId?: string, context?: ErrorContext) =>
    new NotFoundError("Category not found", ErrorCode.CATEGORY_NOT_FOUND, { ...context, resourceType: "category", resourceId: categoryId }),

  userNotFound: (userId?: string, context?: ErrorContext) =>
    new NotFoundError("User not found. Make sure they have an account.", ErrorCode.USER_NOT_FOUND, { ...context, resourceType: "user", resourceId: userId }),

  widgetNotFound: (widgetId?: string, context?: ErrorContext) =>
    new NotFoundError("Widget not found", ErrorCode.WIDGET_NOT_FOUND, { ...context, resourceType: "widget", resourceId: widgetId }),

  integrationNotFound: (integrationId?: string, context?: ErrorContext) =>
    new NotFoundError("Integration not found", ErrorCode.INTEGRATION_NOT_FOUND, { ...context, resourceType: "integration", resourceId: integrationId }),

  alertNotFound: (alertId?: string, context?: ErrorContext) =>
    new NotFoundError("Alert rule not found", ErrorCode.ALERT_NOT_FOUND, { ...context, resourceType: "alert", resourceId: alertId }),

  statusPageNotFound: (pageId?: string, context?: ErrorContext) =>
    new NotFoundError("Status page not found", ErrorCode.STATUS_PAGE_NOT_FOUND, { ...context, resourceType: "statusPage", resourceId: pageId }),

  tagNotFound: (tagId?: string, context?: ErrorContext) =>
    new NotFoundError("Tag not found", ErrorCode.TAG_NOT_FOUND, { ...context, resourceType: "tag", resourceId: tagId }),

  shareNotFound: (shareId?: string, context?: ErrorContext) =>
    new NotFoundError("Share not found or you don't have permission to access it", ErrorCode.SHARE_NOT_FOUND, { ...context, resourceType: "share", resourceId: shareId }),

  apiKeyNotFound: (keyId?: string, context?: ErrorContext) =>
    new NotFoundError("API key not found", ErrorCode.API_KEY_NOT_FOUND, { ...context, resourceType: "apiKey", resourceId: keyId }),

  savedViewNotFound: (viewId?: string, context?: ErrorContext) =>
    new NotFoundError("Saved view not found", ErrorCode.SAVED_VIEW_NOT_FOUND, { ...context, resourceType: "savedView", resourceId: viewId }),

  dependencyNotFound: (depId?: string, context?: ErrorContext) =>
    new NotFoundError("Dependency not found", ErrorCode.DEPENDENCY_NOT_FOUND, { ...context, resourceType: "dependency", resourceId: depId }),

  incidentNotFound: (incidentId?: string, context?: ErrorContext) =>
    new NotFoundError("Incident not found", ErrorCode.INCIDENT_NOT_FOUND, { ...context, resourceType: "incident", resourceId: incidentId }),

  notificationNotFound: (notificationId?: string, context?: ErrorContext) =>
    new NotFoundError("Notification not found", ErrorCode.NOTIFICATION_NOT_FOUND, { ...context, resourceType: "notification", resourceId: notificationId }),

  // Validation
  validationFailed: (message: string, fieldErrors?: Record<string, string[]>, context?: ErrorContext) =>
    new ValidationError(message, ErrorCode.VALIDATION_ERROR, context, fieldErrors),

  invalidInput: (message: string, context?: ErrorContext) =>
    new ValidationError(message, ErrorCode.INVALID_INPUT, context),

  invalidSlug: (context?: ErrorContext) =>
    new ValidationError(
      "Slug must contain only lowercase letters, numbers, and hyphens",
      ErrorCode.INVALID_SLUG,
      context
    ),

  invalidPassword: (context?: ErrorContext) =>
    new ValidationError("Invalid password", ErrorCode.INVALID_PASSWORD, context),

  selfReference: (message: string, context?: ErrorContext) =>
    new ValidationError(message, ErrorCode.SELF_REFERENCE_ERROR, context),

  missingRequiredField: (fieldName: string, context?: ErrorContext) =>
    new ValidationError(
      `Missing required field: ${fieldName}`,
      ErrorCode.MISSING_REQUIRED_FIELD,
      { ...context, metadata: { field: fieldName } }
    ),

  // Conflict
  duplicateEntry: (resourceType: string, context?: ErrorContext) =>
    new ConflictError(
      `A ${resourceType} with this identifier already exists`,
      ErrorCode.DUPLICATE_ENTRY,
      { ...context, resourceType }
    ),

  alreadyExists: (message: string, context?: ErrorContext) =>
    new ConflictError(message, ErrorCode.ALREADY_EXISTS, context),

  circularDependency: (message?: string, context?: ErrorContext) =>
    new ConflictError(
      message || "Adding this dependency would create a circular dependency",
      ErrorCode.CIRCULAR_DEPENDENCY,
      context
    ),

  alreadyShared: (resourceType: string, context?: ErrorContext) =>
    new ConflictError(
      `This ${resourceType} is already shared with this user`,
      ErrorCode.ALREADY_SHARED,
      { ...context, resourceType }
    ),

  // Rate Limit
  rateLimitExceeded: (retryAfter?: number, context?: ErrorContext) =>
    new RateLimitError("Too many requests. Please try again later.", ErrorCode.RATE_LIMIT_EXCEEDED, context, retryAfter),

  // External Service
  externalServiceError: (serviceName: string, message?: string, context?: ErrorContext) =>
    new ExternalServiceError(
      message || `Failed to communicate with ${serviceName}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      context,
      serviceName
    ),

  requestTimeout: (serviceName?: string, context?: ErrorContext) =>
    new ExternalServiceError(
      serviceName ? `Request to ${serviceName} timed out` : "Request timed out",
      ErrorCode.REQUEST_TIMEOUT,
      context,
      serviceName
    ),

  apiError: (message: string, serviceName?: string, context?: ErrorContext) =>
    new ExternalServiceError(message, ErrorCode.API_ERROR, context, serviceName),

  // Internal
  internalError: (message?: string, context?: ErrorContext) =>
    new InternalError(message || "An unexpected error occurred", ErrorCode.INTERNAL_ERROR, context),

  databaseError: (message?: string, context?: ErrorContext) =>
    new InternalError(message || "Database operation failed", ErrorCode.DATABASE_ERROR, context),
} as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Check if an error is an authorization error
 */
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if an error is a conflict error
 */
export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

/**
 * Check if an error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

// ============================================================================
// Error Conversion Utilities
// ============================================================================

/**
 * Convert any error to an AppError
 *
 * If the error is already an AppError, returns it as-is.
 * Otherwise, wraps it in an InternalError.
 */
export function toAppError(error: unknown, context?: ErrorContext): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      { ...context, cause: error }
    );
  }

  return new InternalError(
    typeof error === "string" ? error : "An unexpected error occurred",
    ErrorCode.INTERNAL_ERROR,
    context
  );
}

/**
 * Extract a client-safe error message from any error
 */
export function getClientErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  // For non-AppError, return generic message to avoid leaking details
  return "An unexpected error occurred";
}

/**
 * Get HTTP status code from any error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}
