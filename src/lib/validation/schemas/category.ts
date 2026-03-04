/**
 * Category Validation Schemas
 *
 * Defines Zod schemas for category-related operations.
 */

import { z } from "zod";

// ============================================================================
// Reusable Field Schemas
// ============================================================================

/**
 * Non-empty string that trims whitespace
 */
const requiredString = z
  .string()
  .min(1, "This field is required")
  .transform((val) => val.trim());

/**
 * Optional string that transforms empty strings to null
 */
const optionalString = z
  .string()
  .transform((val) => val.trim())
  .transform((val) => val || null);

/**
 * UUID validation
 */
const uuid = z.string().uuid("Invalid ID format");

/**
 * Color hex validation (optional)
 */
const optionalColor = z
  .string()
  .transform((val) => val.trim())
  .transform((val) => val || null)
  .refine(
    (val) => val === null || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val),
    { message: "Must be a valid hex color (e.g., #FF5733)" }
  );

// ============================================================================
// Category Schemas
// ============================================================================

/**
 * Schema for creating a new category
 */
export const createCategorySchema = z.object({
  name: requiredString.pipe(
    z.string().max(100, "Name must be 100 characters or less")
  ),
  icon: optionalString.pipe(
    z.string().max(100, "Icon must be 100 characters or less").nullable()
  ),
  color: optionalColor,
  sortOrder: z.number().int().optional(),
});

/**
 * Schema for updating an existing category
 */
export const updateCategorySchema = z.object({
  id: uuid,
  name: requiredString.pipe(
    z.string().max(100, "Name must be 100 characters or less")
  ).optional(),
  icon: optionalString.pipe(
    z.string().max(100, "Icon must be 100 characters or less").nullable()
  ).optional(),
  color: optionalColor.optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * Schema for deleting a category
 */
export const deleteCategorySchema = z.object({
  id: uuid,
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
