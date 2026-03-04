/**
 * Integration Validation Schemas
 *
 * Defines Zod schemas for integration-related operations.
 */

import { z } from "zod";
import { uuid, requiredString, optionalString, requiredUrl } from "./common";

// ============================================================================
// Constants
// ============================================================================

export const INTEGRATION_TYPES = [
  "uptime_kuma",
  "docker",
  "truenas",
  "portainer",
  "sonarr",
  "radarr",
  "lidarr",
  "jellyfin",
  "glances",
  "proxmox",
] as const;

export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

// ============================================================================
// Integration Schemas
// ============================================================================

/**
 * Schema for creating a new integration
 */
export const createIntegrationSchema = z.object({
  name: requiredString.pipe(
    z.string().max(100, "Name must be 100 characters or less")
  ),
  type: z.enum(INTEGRATION_TYPES),
  url: requiredUrl,
  apiKey: optionalString,
  username: optionalString,
  password: optionalString,
  allowInsecure: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

/**
 * Schema for updating an existing integration
 */
export const updateIntegrationSchema = z.object({
  id: uuid,
  data: z.object({
    name: requiredString.pipe(
      z.string().max(100, "Name must be 100 characters or less")
    ).optional(),
    type: z.enum(INTEGRATION_TYPES).optional(),
    url: requiredUrl.optional(),
    apiKey: optionalString.optional(),
    username: optionalString.optional(),
    password: optionalString.optional(),
    allowInsecure: z.boolean().optional(),
    enabled: z.boolean().optional(),
  }),
});

/**
 * Schema for deleting an integration
 */
export const deleteIntegrationSchema = z.object({
  id: uuid,
});

/**
 * Schema for testing an integration connection
 */
export const testIntegrationSchema = z.object({
  id: uuid,
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
export type DeleteIntegrationInput = z.infer<typeof deleteIntegrationSchema>;
export type TestIntegrationInput = z.infer<typeof testIntegrationSchema>;
