/**
 * Validation Module
 *
 * Central export point for validation utilities and schemas.
 *
 * Usage:
 * ```ts
 * // Server-side validation
 * import { validateInput, createAppSchema } from "@/lib/validation";
 *
 * const validated = validateInput(createAppSchema, ctx.data);
 *
 * // Client-side form validation with react-hook-form
 * import { zodResolver } from "@hookform/resolvers/zod";
 * import { createAppSchema } from "@/lib/validation";
 *
 * const form = useForm({
 *   resolver: zodResolver(createAppSchema),
 * });
 * ```
 */

// Middleware and utilities
export {
  validateInput,
  safeValidateInput,
  withValidation,
  validatedHandler,
  withValidationAndAuth,
  withValidationAndOptionalAuth,
  extractFieldErrors,
  isValidationError,
  type ValidationResult,
  type ServerContext,
} from "./middleware";

// All schemas and types
export * from "./schemas";
