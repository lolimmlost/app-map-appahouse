/**
 * Common Validation Schemas
 *
 * Reusable field schemas and utilities for validation across the application.
 */

import { z } from "zod";

// ============================================================================
// Common Field Schemas
// ============================================================================

/**
 * UUID validation
 */
export const uuid = z.string().uuid("Invalid ID format");

/**
 * Non-empty string that trims whitespace
 */
export const requiredString = z
  .string()
  .min(1, "This field is required")
  .transform((val) => val.trim());

/**
 * Optional string that transforms empty strings to null
 */
export const optionalString = z
  .string()
  .transform((val) => val.trim())
  .transform((val) => val || null);

/**
 * URL validation that allows empty strings (optional URLs)
 */
export const optionalUrl = z
  .string()
  .transform((val) => val.trim())
  .pipe(
    z.string().refine(
      (val) => val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL" }
    )
  )
  .transform((val) => val || null);

/**
 * Required URL validation
 */
export const requiredUrl = z
  .string()
  .min(1, "URL is required")
  .transform((val) => val.trim())
  .pipe(z.string().url("Must be a valid URL"));

/**
 * Optional UUID that accepts null or empty string
 */
export const optionalUuid = z
  .string()
  .nullable()
  .transform((val) => (val && val.trim() ? val.trim() : null))
  .refine(
    (val) => val === null || z.string().uuid().safeParse(val).success,
    { message: "Invalid ID format" }
  );

/**
 * Color hex validation (optional)
 */
export const optionalColor = z
  .string()
  .transform((val) => val.trim())
  .transform((val) => val || null)
  .refine(
    (val) => val === null || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val),
    { message: "Must be a valid hex color (e.g., #FF5733)" }
  );

/**
 * Positive integer
 */
export const positiveInt = z.number().int().positive();

/**
 * Non-negative integer
 */
export const nonNegativeInt = z.number().int().nonnegative();

/**
 * Email validation
 */
export const email = z
  .string()
  .min(1, "Email is required")
  .email("Must be a valid email address")
  .transform((val) => val.trim().toLowerCase());

/**
 * Slug validation (lowercase letters, numbers, hyphens)
 */
export const slug = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
  .max(100, "Slug must be 100 characters or less");

// ============================================================================
// Pagination Schema
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================================
// ID-based Operation Schemas
// ============================================================================

/**
 * Schema for operations requiring just an ID
 */
export const idSchema = z.object({
  id: uuid,
});

export type IdInput = z.infer<typeof idSchema>;

/**
 * Schema for operations requiring multiple IDs
 */
export const idsSchema = z.object({
  ids: z.array(uuid).min(1, "At least one ID is required"),
});

export type IdsInput = z.infer<typeof idsSchema>;
