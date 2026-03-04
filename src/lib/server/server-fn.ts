/**
 * Server Function Wrapper/Decorator
 *
 * This module provides utilities for wrapping server functions with
 * consistent error handling, logging, and validation.
 *
 * Features:
 * - Automatic error conversion to AppError
 * - Structured logging for all server operations
 * - Input validation with Zod schemas (optional)
 * - Request/response timing
 * - Context injection (user session, request info)
 *
 * Usage:
 * ```ts
 * // Basic usage
 * export const getApp = createServerFn({ method: "POST" }).handler(
 *   withErrorHandling(async (ctx) => {
 *     // Your handler code
 *   })
 * );
 *
 * // With options
 * export const getApp = createServerFn({ method: "POST" }).handler(
 *   withErrorHandling(
 *     async (ctx) => {
 *       // Your handler code
 *     },
 *     { operation: "getApp", logSuccess: true }
 *   )
 * );
 * ```
 */

import {
  AppError,
  InternalError,
  ValidationError,
  ErrorCode,
  Errors,
  isAppError,
  toAppError,
  type ErrorContext,
  type ErrorCodeType,
} from "./errors";
import { serverLogger, type LogLevel } from "./logger";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the error handling wrapper
 */
export interface ErrorHandlingOptions {
  /** Name of the operation for logging purposes */
  operation?: string;

  /** Whether to log successful operations (default: false) */
  logSuccess?: boolean;

  /** Minimum log level for this operation */
  logLevel?: LogLevel;

  /** Additional context to include in logs */
  context?: ErrorContext;

  /** Whether to re-throw AppError as-is (default: true) */
  preserveAppErrors?: boolean;

  /** Custom error transformer */
  transformError?: (error: unknown) => AppError;
}

/**
 * Server function handler type
 */
export type ServerFnHandler<TInput, TOutput> = (ctx: TInput) => Promise<TOutput>;

/**
 * Wrapped server function handler type
 */
export type WrappedHandler<TInput, TOutput> = (ctx: TInput) => Promise<TOutput>;

// ============================================================================
// Error Handling Wrapper
// ============================================================================

/**
 * Wraps a server function handler with consistent error handling and logging.
 *
 * This wrapper:
 * 1. Logs the start of the operation (if logSuccess is true)
 * 2. Times the operation
 * 3. Catches any errors and converts them to AppError
 * 4. Logs errors with full context
 * 5. Re-throws the error for the client to handle
 *
 * @param handler - The async handler function to wrap
 * @param options - Configuration options
 * @returns A wrapped handler with error handling
 *
 * @example
 * ```ts
 * const handler = withErrorHandling(
 *   async (ctx: { data: { id: string } }) => {
 *     const app = await getAppById(ctx.data.id);
 *     if (!app) throw Errors.appNotFound(ctx.data.id);
 *     return app;
 *   },
 *   { operation: "getApp" }
 * );
 * ```
 */
export function withErrorHandling<TInput, TOutput>(
  handler: ServerFnHandler<TInput, TOutput>,
  options: ErrorHandlingOptions = {}
): WrappedHandler<TInput, TOutput> {
  const {
    operation = "unknown",
    logSuccess = false,
    logLevel = "info",
    context = {},
    preserveAppErrors = true,
    transformError,
  } = options;

  return async (ctx: TInput): Promise<TOutput> => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    try {
      // Log operation start if logSuccess is enabled
      if (logSuccess) {
        serverLogger.debug(`[${operation}] Starting operation`, {
          requestId,
          ...context,
        });
      }

      // Execute the handler
      const result = await handler(ctx);

      // Log success if enabled
      if (logSuccess) {
        const duration = Date.now() - startTime;
        serverLogger.log(logLevel, `[${operation}] Operation completed`, {
          requestId,
          duration,
          ...context,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Convert to AppError
      let appError: AppError;

      if (preserveAppErrors && isAppError(error)) {
        appError = error;
      } else if (transformError) {
        appError = transformError(error);
      } else {
        appError = toAppError(error, {
          ...context,
          operation,
        });
      }

      // Log the error
      serverLogger.error(`[${operation}] Operation failed`, {
        requestId,
        duration,
        error: appError.toLogObject(),
        input: sanitizeInput(ctx),
        ...context,
      });

      // Re-throw the AppError
      throw appError;
    }
  };
}

// ============================================================================
// Authenticated Handler Wrapper
// ============================================================================

/**
 * Options for authenticated handlers
 */
export interface AuthenticatedHandlerOptions extends ErrorHandlingOptions {
  /** Resource type being accessed (for permission checks) */
  resourceType?: string;
}

/**
 * Creates a handler that requires authentication.
 *
 * This is a convenience wrapper that:
 * 1. Calls getAuthenticatedSession
 * 2. Passes the session to your handler
 * 3. Wraps everything with error handling
 *
 * @example
 * ```ts
 * export const getMyApps = createServerFn({ method: "GET" }).handler(
 *   withAuthentication(
 *     async (session, ctx) => {
 *       return await getAppsByUserId(session.user.id);
 *     },
 *     { operation: "getMyApps" }
 *   )
 * );
 * ```
 */
export function withAuthentication<TInput, TOutput>(
  handler: (
    session: Awaited<ReturnType<typeof import("./auth-utils.server").getAuthenticatedSession>>,
    ctx: TInput
  ) => Promise<TOutput>,
  options: AuthenticatedHandlerOptions = {}
): WrappedHandler<TInput, TOutput> {
  return withErrorHandling(async (ctx: TInput) => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const session = await getAuthenticatedSession();
    return handler(session, ctx);
  }, options);
}

/**
 * Creates a handler that optionally uses authentication.
 *
 * Similar to withAuthentication, but the session can be null.
 *
 * @example
 * ```ts
 * export const getPublicApps = createServerFn({ method: "GET" }).handler(
 *   withOptionalAuthentication(
 *     async (session, ctx) => {
 *       if (session) {
 *         return await getAppsByUserId(session.user.id);
 *       }
 *       return await getPublicApps();
 *     },
 *     { operation: "getPublicApps" }
 *   )
 * );
 * ```
 */
export function withOptionalAuthentication<TInput, TOutput>(
  handler: (
    session: Awaited<ReturnType<typeof import("./auth-utils.server").getOptionalSession>>,
    ctx: TInput
  ) => Promise<TOutput>,
  options: AuthenticatedHandlerOptions = {}
): WrappedHandler<TInput, TOutput> {
  return withErrorHandling(async (ctx: TInput) => {
    const { getOptionalSession } = await import("./auth-utils.server");
    const session = await getOptionalSession();
    return handler(session, ctx);
  }, options);
}

// ============================================================================
// Safe Execute (Non-throwing)
// ============================================================================

/**
 * Result type for safe execution
 */
export type SafeResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: AppError };

/**
 * Executes a function and returns a result object instead of throwing.
 *
 * Useful for operations where you want to handle errors without try-catch.
 *
 * @example
 * ```ts
 * const result = await safeExecute(() => getApp(id));
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<SafeResult<T>> {
  try {
    const data = await withErrorHandling(async () => fn(), options)({} as never);
    return { success: true, data, error: null };
  } catch (error) {
    const appError = isAppError(error) ? error : toAppError(error);
    return { success: false, data: null, error: appError };
  }
}

// ============================================================================
// Batch Error Handling
// ============================================================================

/**
 * Result type for batch operations
 */
export interface BatchResult<T> {
  results: Array<{ success: true; data: T } | { success: false; error: AppError }>;
  successCount: number;
  errorCount: number;
  errors: AppError[];
}

/**
 * Executes multiple operations and collects all results.
 *
 * Unlike Promise.all, this doesn't fail fast - it runs all operations
 * and returns both successes and failures.
 *
 * @example
 * ```ts
 * const results = await batchExecute(
 *   appIds.map(id => () => deleteApp(id)),
 *   { operation: "batchDeleteApps" }
 * );
 * console.log(`Deleted ${results.successCount}, failed ${results.errorCount}`);
 * ```
 */
export async function batchExecute<T>(
  operations: Array<() => Promise<T>>,
  options: ErrorHandlingOptions = {}
): Promise<BatchResult<T>> {
  type SuccessResult = { success: true; data: T };
  type ErrorResult = { success: false; error: AppError };
  type BatchItem = SuccessResult | ErrorResult;

  const results: BatchItem[] = await Promise.all(
    operations.map(async (op): Promise<BatchItem> => {
      try {
        const data = await op();
        return { success: true, data };
      } catch (error) {
        const appError = isAppError(error) ? error : toAppError(error);
        return { success: false, error: appError };
      }
    })
  );

  const successResults = results.filter((r): r is SuccessResult => r.success);
  const errorResults = results.filter((r): r is ErrorResult => !r.success);

  // Log batch results if there were errors
  if (errorResults.length > 0) {
    serverLogger.warn(`[${options.operation || "batch"}] Batch operation completed with errors`, {
      successCount: successResults.length,
      errorCount: errorResults.length,
      errors: errorResults.map((r) => ({
        code: r.error.code,
        message: r.error.message,
      })),
    });
  }

  return {
    results,
    successCount: successResults.length,
    errorCount: errorResults.length,
    errors: errorResults.map((r) => r.error),
  };
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Options for retry logic
 */
export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;

  /** Initial delay in ms (default: 1000) */
  initialDelay?: number;

  /** Delay multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;

  /** Maximum delay in ms (default: 30000) */
  maxDelay?: number;

  /** Whether to retry on this error (default: retry on ExternalServiceError) */
  shouldRetry?: (error: AppError, attempt: number) => boolean;
}

/**
 * Executes a function with retry logic and exponential backoff.
 *
 * By default, only retries on ExternalServiceError.
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetchExternalApi(),
 *   {
 *     maxAttempts: 3,
 *     shouldRetry: (error) => error.code === ErrorCode.REQUEST_TIMEOUT
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 30000,
    shouldRetry = (error) =>
      error.code === ErrorCode.EXTERNAL_SERVICE_ERROR ||
      error.code === ErrorCode.REQUEST_TIMEOUT ||
      error.code === ErrorCode.CONNECTION_FAILED,
  } = options;

  let lastError: AppError | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const appError = isAppError(error) ? error : toAppError(error);
      lastError = appError;

      if (attempt < maxAttempts && shouldRetry(appError, attempt)) {
        serverLogger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
          error: appError.code,
          nextDelay: delay,
        });

        await sleep(delay);
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      } else {
        throw appError;
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new InternalError("Retry failed");
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitize input for logging (remove sensitive data)
 */
function sanitizeInput(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== "object") {
    return input;
  }

  // Sensitive field patterns
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /auth/i,
    /credential/i,
    /apikey/i,
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (sensitivePatterns.some((pattern) => pattern.test(key))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a value is not null/undefined, throwing NotFoundError if it is.
 *
 * @example
 * ```ts
 * const app = await db.query.apps.findFirst({ where: eq(apps.id, id) });
 * assertFound(app, "App", id);
 * // app is now typed as non-null
 * ```
 */
export function assertFound<T>(
  value: T | null | undefined,
  resourceType: string,
  resourceId?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw Errors.notFound(resourceType, resourceId);
  }
}

/**
 * Assert a condition is true, throwing ValidationError if not.
 *
 * @example
 * ```ts
 * assertValid(email.includes("@"), "Invalid email format");
 * ```
 */
export function assertValid(
  condition: boolean,
  message: string,
  code: ErrorCodeType = ErrorCode.VALIDATION_ERROR
): asserts condition {
  if (!condition) {
    throw new ValidationError(message, code);
  }
}
