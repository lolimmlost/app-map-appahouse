/**
 * App Validation Schemas
 *
 * Defines Zod schemas for app-related operations.
 * These schemas can be used for:
 * - Server-side validation in mutations
 * - Client-side form validation with react-hook-form
 * - Type inference
 */

import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

export const HEALTH_CHECK_TYPES = ["http", "tcp", "uptime_kuma"] as const;

export const VALID_TTL_VALUES = [15, 30, 60, 120, 300, 600, 900, 1800, 3600] as const;

// ============================================================================
// Reusable Field Schemas
// ============================================================================

/**
 * URL validation that allows empty strings or null (optional URLs)
 */
const optionalUrl = z
  .string()
  .nullable()
  .transform((val) => (val ? val.trim() : ""))
  .pipe(
    z.string().refine(
      (val) => val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL" }
    )
  )
  .transform((val) => val || null);

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
  .nullable()
  .transform((val) => (val ? val.trim() : null));

/**
 * UUID validation
 */
const uuid = z.string().uuid("Invalid ID format");

/**
 * Optional UUID that accepts null or empty string
 */
const optionalUuid = z
  .string()
  .nullable()
  .transform((val) => (val && val.trim() ? val.trim() : null))
  .refine(
    (val) => val === null || z.string().uuid().safeParse(val).success,
    { message: "Invalid ID format" }
  );

// ============================================================================
// App Schemas
// ============================================================================

/**
 * Schema for creating a new app
 */
export const createAppSchema = z.object({
  name: requiredString.pipe(
    z.string().max(255, "Name must be 255 characters or less")
  ),
  description: optionalString.pipe(
    z.string().max(1000, "Description must be 1000 characters or less").nullable()
  ),
  icon: optionalString.pipe(
    z.string().max(500, "Icon URL must be 500 characters or less").nullable()
  ),
  localUrl: optionalUrl,
  remoteUrl: optionalUrl,
  categoryId: optionalUuid,
  tagIds: z.array(uuid).default([]),
  healthCheckEnabled: z.boolean().default(false),
  healthCheckType: z.enum(HEALTH_CHECK_TYPES).default("http"),
  healthCheckUrl: optionalUrl,
  healthCheckTTL: z
    .number()
    .int()
    .positive()
    .refine((val) => VALID_TTL_VALUES.includes(val as any), {
      message: `TTL must be one of: ${VALID_TTL_VALUES.join(", ")} seconds`,
    })
    .default(60),
  uptimeKumaMonitorId: optionalString,
  notes: optionalString.pipe(
    z.string().max(10000, "Notes must be 10000 characters or less").nullable()
  ),
});

/**
 * Schema for updating an existing app
 */
export const updateAppSchema = z.object({
  id: uuid,
  name: requiredString.pipe(
    z.string().max(255, "Name must be 255 characters or less")
  ),
  description: optionalString.pipe(
    z.string().max(1000, "Description must be 1000 characters or less").nullable()
  ),
  icon: optionalString.pipe(
    z.string().max(500, "Icon URL must be 500 characters or less").nullable()
  ),
  localUrl: optionalUrl,
  remoteUrl: optionalUrl,
  categoryId: optionalUuid,
  tagIds: z.array(uuid).default([]),
  healthCheckEnabled: z.boolean().default(false),
  healthCheckType: z.enum(HEALTH_CHECK_TYPES).default("http"),
  healthCheckUrl: optionalUrl,
  healthCheckTTL: z
    .number()
    .int()
    .positive()
    .refine((val) => VALID_TTL_VALUES.includes(val as any), {
      message: `TTL must be one of: ${VALID_TTL_VALUES.join(", ")} seconds`,
    })
    .default(60),
  uptimeKumaMonitorId: optionalString,
  notes: optionalString.pipe(
    z.string().max(10000, "Notes must be 10000 characters or less").nullable()
  ),
});

/**
 * Schema for deleting an app
 */
export const deleteAppSchema = z.object({
  id: uuid,
});

/**
 * Schema for getting a single app
 */
export const getAppSchema = z.object({
  id: uuid,
});

/**
 * Schema for pinning/unpinning an app
 */
export const pinAppSchema = z.object({
  id: uuid,
  pinned: z.boolean(),
});

/**
 * Schema for reordering apps
 */
export const reorderAppsSchema = z.object({
  orderedIds: z.array(uuid),
});

/**
 * Schema for updating app order
 */
export const updateAppOrderSchema = z.object({
  orderedIds: z.array(uuid),
});

// ============================================================================
// Bulk Operation Schemas
// ============================================================================

/**
 * Schema for bulk deleting apps
 */
export const bulkDeleteAppsSchema = z.object({
  ids: z.array(uuid).min(1, "At least one app must be selected"),
});

/**
 * Schema for bulk updating category
 */
export const bulkUpdateCategorySchema = z.object({
  ids: z.array(uuid).min(1, "At least one app must be selected"),
  categoryId: z.string().nullable(),
});

/**
 * Schema for bulk toggling health check
 */
export const bulkToggleHealthCheckSchema = z.object({
  ids: z.array(uuid).min(1, "At least one app must be selected"),
  enabled: z.boolean(),
});

/**
 * Schema for bulk exporting apps
 */
export const bulkExportAppsSchema = z.object({
  ids: z.array(uuid).min(1, "At least one app must be selected"),
});

/**
 * Schema for bulk updating tags
 */
export const bulkUpdateTagsSchema = z.object({
  ids: z.array(uuid).min(1, "At least one app must be selected"),
  tagIds: z.array(uuid),
  mode: z.enum(["replace", "append"]),
});

/**
 * Schema for refreshing app icons
 */
export const refreshAppIconsSchema = z.object({
  ids: z.array(uuid).min(1, "At least one app must be selected"),
});

/**
 * Schema for reordering apps with explicit sort orders
 * Validates the { id, sortOrder }[] shape used by reorderApps
 */
export const reorderAppsItemSchema = z.array(
  z.object({
    id: uuid,
    sortOrder: z.number().int().nonnegative(),
  })
);

// ============================================================================
// Type Exports
// ============================================================================

export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
export type DeleteAppInput = z.infer<typeof deleteAppSchema>;
export type GetAppInput = z.infer<typeof getAppSchema>;
export type PinAppInput = z.infer<typeof pinAppSchema>;
export type ReorderAppsInput = z.infer<typeof reorderAppsSchema>;
export type UpdateAppOrderInput = z.infer<typeof updateAppOrderSchema>;
export type BulkDeleteAppsInput = z.infer<typeof bulkDeleteAppsSchema>;
export type BulkUpdateCategoryInput = z.infer<typeof bulkUpdateCategorySchema>;
export type BulkToggleHealthCheckInput = z.infer<typeof bulkToggleHealthCheckSchema>;
export type BulkExportAppsInput = z.infer<typeof bulkExportAppsSchema>;
export type BulkUpdateTagsInput = z.infer<typeof bulkUpdateTagsSchema>;
export type RefreshAppIconsInput = z.infer<typeof refreshAppIconsSchema>;
export type ReorderAppsItemInput = z.infer<typeof reorderAppsItemSchema>;
