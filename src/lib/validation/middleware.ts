/**
 * Validation Middleware
 *
 * Provides utilities for validating data in server functions using Zod schemas.
 * Integrates with the existing error handling system for consistent error responses.
 *
 * Features:
 * - Validates input data using Zod schemas
 * - Converts Zod errors to ValidationError (400 status)
 * - Returns typed, validated data for type-safe handlers
 * - Can be combined with existing error handling wrappers
 *
 * Usage:
 * ```ts
 * import { validateInput, withValidation } from "@/lib/validation/middleware";
 * import { createAppSchema } from "@/lib/validation/schemas";
 *
 * // Option 1: Validate inline
 * export const createApp = createServerFn({ method: "POST" }).handler(
 *   async (ctx: { data: unknown }) => {
 *     const validData = validateInput(createAppSchema, ctx.data);
 *     // validData is now typed and validated
 *   }
 * );
 *
 * // Option 2: Use withValidation wrapper
 * export const createApp = createServerFn({ method: "POST" }).handler(
 *   withValidation(createAppSchema, async (validData, ctx) => {
 *     // validData is typed and validated
 *   })
 * );
 * ```
 */

import { z, type ZodSchema, type ZodError } from "zod";
import { ValidationError, ErrorCode } from "../server/errors";

// ============================================================================
// Types
// ============================================================================

/**
 * Result type for validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

/**
 * Context type for server function handlers
 */
export interface ServerContext<T = unknown> {
  data: T;
}

// ============================================================================
// Error Conversion
// ============================================================================

/**
 * Convert a Zod error to field errors map
 */
function zodErrorToFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    const fieldName = path || "_root";

    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = [];
    }

    fieldErrors[fieldName].push(issue.message);
  }

  return fieldErrors;
}

/**
 * Convert a Zod error to a ValidationError
 */
function zodErrorToValidationError(error: ZodError): ValidationError {
  const fieldErrors = zodErrorToFieldErrors(error);

  // Create a human-readable message from the first issue
  const firstIssue = error.issues[0];
  const path = firstIssue?.path.join(".") || "input";
  const message = firstIssue?.message || "Validation failed";

  // For a single field error, use a more specific message
  const errorMessage =
    Object.keys(fieldErrors).length === 1
      ? `${path}: ${message}`
      : "Validation failed. Please check the highlighted fields.";

  return new ValidationError(
    errorMessage,
    ErrorCode.VALIDATION_ERROR,
    {},
    fieldErrors
  );
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate input data against a Zod schema.
 *
 * Throws a ValidationError if validation fails.
 * Returns the validated and transformed data if successful.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns The validated data with proper types
 * @throws ValidationError if validation fails
 *
 * @example
 * ```ts
 * const validated = validateInput(createAppSchema, ctx.data);
 * // validated is now typed as CreateAppInput
 * ```
 */
export function validateInput<T extends ZodSchema>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw zodErrorToValidationError(result.error);
  }

  return result.data;
}

/**
 * Safely validate input data against a Zod schema.
 *
 * Returns a result object instead of throwing.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns ValidationResult with either validated data or error
 *
 * @example
 * ```ts
 * const result = safeValidateInput(createAppSchema, ctx.data);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.fieldErrors);
 * }
 * ```
 */
export function safeValidateInput<T extends ZodSchema>(
  schema: T,
  data: unknown
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: zodErrorToValidationError(result.error),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

// ============================================================================
// Handler Wrappers
// ============================================================================

/**
 * Wraps a server function handler with input validation.
 *
 * Validates ctx.data against the provided schema before calling the handler.
 * The handler receives the validated, typed data.
 *
 * @param schema - The Zod schema to validate against
 * @param handler - The handler function that receives validated data
 * @returns A wrapped handler with validation
 *
 * @example
 * ```ts
 * export const createApp = createServerFn({ method: "POST" }).handler(
 *   withValidation(createAppSchema, async (validData, ctx) => {
 *     // validData is CreateAppInput
 *     const { getDb } = await import("./get-db");
 *     // ... rest of handler
 *   })
 * );
 * ```
 */
export function withValidation<TSchema extends ZodSchema, TOutput>(
  schema: TSchema,
  handler: (validData: z.infer<TSchema>, ctx: ServerContext<unknown>) => Promise<TOutput>
): (ctx: ServerContext<unknown>) => Promise<TOutput> {
  return async (ctx: ServerContext<unknown>): Promise<TOutput> => {
    const validData = validateInput(schema, ctx.data);
    return handler(validData, ctx);
  };
}

/**
 * Creates a validated handler factory for a specific schema.
 *
 * Useful when you want to create multiple handlers with the same schema.
 *
 * @param schema - The Zod schema to validate against
 * @returns A function that creates validated handlers
 *
 * @example
 * ```ts
 * const createAppHandler = validatedHandler(createAppSchema);
 *
 * export const createApp = createServerFn({ method: "POST" }).handler(
 *   createAppHandler(async (validData) => {
 *     // Handle creation
 *   })
 * );
 * ```
 */
export function validatedHandler<TSchema extends ZodSchema>(schema: TSchema) {
  return <TOutput>(
    handler: (validData: z.infer<TSchema>, ctx: ServerContext<unknown>) => Promise<TOutput>
  ) => withValidation(schema, handler);
}

// ============================================================================
// Combined Wrappers (with Authentication)
// ============================================================================

/**
 * Wraps a server function with both validation and authentication.
 *
 * Validates input, then fetches the authenticated session, then calls handler.
 *
 * @param schema - The Zod schema to validate against
 * @param handler - The handler receiving session and validated data
 * @returns A wrapped handler with validation and authentication
 *
 * @example
 * ```ts
 * export const createApp = createServerFn({ method: "POST" }).handler(
 *   withValidationAndAuth(createAppSchema, async (session, validData) => {
 *     // Both session and validData are available
 *   })
 * );
 * ```
 */
export function withValidationAndAuth<TSchema extends ZodSchema, TOutput>(
  schema: TSchema,
  handler: (
    session: Awaited<ReturnType<typeof import("../server/auth-utils.server").getAuthenticatedSession>>,
    validData: z.infer<TSchema>
  ) => Promise<TOutput>
): (ctx: ServerContext<unknown>) => Promise<TOutput> {
  return async (ctx: ServerContext<unknown>): Promise<TOutput> => {
    // First validate the input
    const validData = validateInput(schema, ctx.data);

    // Then authenticate
    const { getAuthenticatedSession } = await import("../server/auth-utils.server");
    const session = await getAuthenticatedSession();

    return handler(session, validData);
  };
}

/**
 * Wraps a server function with validation and optional authentication.
 *
 * Similar to withValidationAndAuth but session can be null.
 *
 * @param schema - The Zod schema to validate against
 * @param handler - The handler receiving optional session and validated data
 * @returns A wrapped handler with validation and optional authentication
 */
export function withValidationAndOptionalAuth<TSchema extends ZodSchema, TOutput>(
  schema: TSchema,
  handler: (
    session: Awaited<ReturnType<typeof import("../server/auth-utils.server").getOptionalSession>>,
    validData: z.infer<TSchema>
  ) => Promise<TOutput>
): (ctx: ServerContext<unknown>) => Promise<TOutput> {
  return async (ctx: ServerContext<unknown>): Promise<TOutput> => {
    // First validate the input
    const validData = validateInput(schema, ctx.data);

    // Then get optional session
    const { getOptionalSession } = await import("../server/auth-utils.server");
    const session = await getOptionalSession();

    return handler(session, validData);
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extracts field errors from a ValidationError for display in forms.
 *
 * @param error - The error to extract field errors from
 * @returns Field errors map or empty object if not a ValidationError
 */
export function extractFieldErrors(
  error: unknown
): Record<string, string[]> {
  if (error instanceof ValidationError && error.fieldErrors) {
    return error.fieldErrors;
  }
  return {};
}

/**
 * Checks if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
