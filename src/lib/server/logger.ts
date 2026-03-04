/**
 * Server-side Logging Utility
 *
 * This module provides structured logging for server operations with:
 * - Log levels (debug, info, warn, error)
 * - Structured JSON output
 * - Context enrichment
 * - Error formatting
 * - Environment-aware behavior
 *
 * Usage:
 * ```ts
 * import { serverLogger } from "./logger";
 *
 * serverLogger.info("Operation completed", { userId: "123", duration: 45 });
 * serverLogger.error("Operation failed", { error: appError.toLogObject() });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Available log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;

  /** Whether to output as JSON (useful for log aggregators) */
  jsonOutput: boolean;

  /** Whether to include timestamps */
  includeTimestamp: boolean;

  /** Additional context to include in all logs */
  defaultContext?: Record<string, unknown>;
}

// ============================================================================
// Log Level Priority
// ============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================================
// Default Configuration
// ============================================================================

const isDevelopment = process.env.NODE_ENV !== "production";

const defaultConfig: LoggerConfig = {
  minLevel: isDevelopment ? "debug" : "info",
  jsonOutput: !isDevelopment,
  includeTimestamp: true,
  defaultContext: {},
};

// ============================================================================
// Logger Class
// ============================================================================

/**
 * Structured logger for server-side operations
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  /**
   * Format a log entry for output
   */
  private formatEntry(entry: LogEntry): string {
    if (this.config.jsonOutput) {
      return JSON.stringify(entry);
    }

    // Human-readable format for development
    const timestamp = this.config.includeTimestamp
      ? `[${entry.timestamp}] `
      : "";
    const level = entry.level.toUpperCase().padEnd(5);
    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : "";

    return `${timestamp}${level} ${entry.message}${contextStr}`;
  }

  /**
   * Create a log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...this.config.defaultContext,
        ...context,
      },
    };
  }

  /**
   * Output a log entry
   */
  private output(entry: LogEntry): void {
    const formatted = this.formatEntry(entry);

    switch (entry.level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "debug":
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  /**
   * Log at a specific level
   */
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;
    const entry = this.createEntry(level, message, context);
    this.output(entry);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /**
   * Log an error object with full context
   */
  logError(error: unknown, message?: string, context?: Record<string, unknown>): void {
    const errorContext = this.formatError(error);
    const errorMessage = typeof errorContext.message === "string" ? errorContext.message : "An error occurred";
    this.error(message || errorMessage, {
      ...context,
      error: errorContext,
    });
  }

  /**
   * Format an error for logging
   */
  private formatError(error: unknown): Record<string, unknown> {
    if (error === null || error === undefined) {
      return { type: "null", value: String(error) };
    }

    // Handle AppError (has toLogObject method)
    if (
      typeof error === "object" &&
      "toLogObject" in error &&
      typeof (error as { toLogObject: () => Record<string, unknown> }).toLogObject === "function"
    ) {
      return (error as { toLogObject: () => Record<string, unknown> }).toLogObject();
    }

    // Handle standard Error
    if (error instanceof Error) {
      return {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
        ...(error.cause ? { cause: this.formatError(error.cause) } : {}),
      };
    }

    // Handle other types
    if (typeof error === "object") {
      return { type: "object", value: error };
    }

    return { type: typeof error, value: String(error) };
  }

  /**
   * Create a child logger with additional default context
   */
  child(context: Record<string, unknown>): Logger {
    return new Logger({
      ...this.config,
      defaultContext: {
        ...this.config.defaultContext,
        ...context,
      },
    });
  }

  /**
   * Time an operation and log the result
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    this.debug(`[${operation}] Starting`, context);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`[${operation}] Completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError(error, `[${operation}] Failed`, { ...context, duration });
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

/**
 * Default server logger instance
 */
export const serverLogger = new Logger();

/**
 * Create a custom logger with specific configuration
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Log an operation start (useful for tracing)
 */
export function logOperationStart(
  operation: string,
  context?: Record<string, unknown>
): void {
  serverLogger.debug(`[${operation}] Starting`, context);
}

/**
 * Log an operation end with timing
 */
export function logOperationEnd(
  operation: string,
  startTime: number,
  context?: Record<string, unknown>
): void {
  const duration = Date.now() - startTime;
  serverLogger.info(`[${operation}] Completed`, { ...context, duration });
}

/**
 * Log an operation failure with error details
 */
export function logOperationError(
  operation: string,
  error: unknown,
  startTime?: number,
  context?: Record<string, unknown>
): void {
  const duration = startTime ? Date.now() - startTime : undefined;
  serverLogger.logError(error, `[${operation}] Failed`, {
    ...context,
    ...(duration !== undefined && { duration }),
  });
}

// ============================================================================
// Request Logging Helpers
// ============================================================================

/**
 * Create request context for logging
 */
export function createRequestContext(options: {
  requestId?: string;
  userId?: string;
  operation?: string;
  resourceType?: string;
  resourceId?: string;
}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(options).filter(([_, v]) => v !== undefined)
  );
}

/**
 * Sanitize data for logging (remove sensitive fields)
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: string[] = [
    "password",
    "secret",
    "token",
    "apiKey",
    "api_key",
    "accessToken",
    "access_token",
    "refreshToken",
    "refresh_token",
    "authorization",
    "credential",
  ]
): T {
  const result = { ...data };

  for (const field of sensitiveFields) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = "[REDACTED]";
    }
  }

  return result;
}
