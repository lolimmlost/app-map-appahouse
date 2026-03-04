
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing codebase structure and understand current validation patterns",
      "status": "in_progress",
      "activeForm": "Exploring codebase structure and validation patterns"
    },
    {
      "content": "Plan validation middleware implementation approach",
      "status": "pending",
      "activeForm": "Planning validation middleware implementation"
    },
    {
      "content": "Create validation schema definitions and middleware",
      "status": "pending",
      "activeForm": "Creating validation schemas and middleware"
    },
    {
      "content": "Integrate validation with existing mutations",
      "status": "pending",
      "activeForm": "Integrating validation with mutations"
    },
    {
      "content": "Test and verify the implementation",
      "status": "pending",
      "activeForm": "Testing and verifying implementation"
    }
  ]
}

Let me start by exploring the codebase to understand the existing structure, particularly focusing on mutations, validation patterns, and the @hookform/resolvers setup.

🔧 Tool: Glob
Input: {
  "pattern": "**/*.{ts,tsx}"
}

🔧 Tool: Grep
Input: {
  "pattern": "useAppMutations"
}

🔧 Tool: Grep
Input: {
  "pattern": "@hookform/resolvers"
}

🔧 Tool: Read
Input: {
  "file_path": "/package.json"
}

Let me look at the source files more specifically:

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.{ts,tsx}"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/hooks/use-app-mutations.ts"
}

Now let me look at the server functions to understand the current structure:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "createServerFn|serverFn",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-form.tsx"
}

Now let me look at more server files to understand the current patterns, check existing validation approaches if any, and also look at the database types:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/types/database.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/alerts.server.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/categories.server.ts"
}

Now let me check if zod is already in the project (since @hookform/resolvers typically works with zod) and look for any existing validation patterns:

🔧 Tool: Grep
Input: {
  "pattern": "zod|yup|joi|schema|validation",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/integrations.server.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/components/apps/**/*.tsx"
}

Let me check the existing server-fn.ts and error patterns:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/server-fn.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/errors.ts"
}

🔧 Tool: Bash
Input: {
  "command": "cat /home/default/Desktop/dev/app-map-appahouse/package.json | grep -E \"(zod|yup|joi)\" || echo \"No zod/yup/joi found in package.json\"",
  "description": "Check for zod/yup/joi in package.json"
}

Now I have a good understanding of the codebase. Let me also check if there are any form components using react-hook-form:

🔧 Tool: Grep
Input: {
  "pattern": "useForm|react-hook-form",
  "path": "/home/default/Desktop/dev/app-map-appahouse/src"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/index.ts"
}

Now I have a complete picture. Let me update my todo and start planning the implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing codebase structure and understand current validation patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and validation patterns"
    },
    {
      "content": "Plan validation middleware implementation approach",
      "status": "in_progress",
      "activeForm": "Planning validation middleware implementation"
    },
    {
      "content": "Install zod as schema validation library",
      "status": "pending",
      "activeForm": "Installing zod package"
    },
    {
      "content": "Create validation schema definitions for apps",
      "status": "pending",
      "activeForm": "Creating validation schemas for apps"
    },
    {
      "content": "Create validation middleware/helper function",
      "status": "pending",
      "activeForm": "Creating validation middleware"
    },
    {
      "content": "Integrate validation with existing server mutations",
      "status": "pending",
      "activeForm": "Integrating validation with mutations"
    },
    {
      "content": "Create validation schemas for other entities (categories, tags, etc.)",
      "status": "pending",
      "activeForm": "Creating additional validation schemas"
    }
  ]
}

Based on my exploration, here's what I understand:

1. **Current State:**
   - Server functions use `createServerFn` from TanStack Start
   - Data is passed via `ctx.data` with TypeScript types but no runtime validation
   - There's already a sophisticated error handling system in `errors.ts` with `ValidationError` class
   - The `server-fn.ts` mentions Zod schemas but Zod isn't installed
   - `@hookform/resolvers` is installed but no schema library (zod/yup) is present
   - Forms like `AppForm` use controlled inputs but no schema validation

2. **Implementation Plan:**
   - Install Zod (works best with @hookform/resolvers)
   - Create schema definitions in a new `src/lib/validation/schemas/` folder
   - Create a validation middleware helper `withValidation` that integrates with the existing error handling
   - Update server functions to use validation
   - Optionally export schemas for client-side use with react-hook-form

Let me start implementing:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing codebase structure and understand current validation patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and validation patterns"
    },
    {
      "content": "Plan validation middleware implementation approach",
      "status": "completed",
      "activeForm": "Planning validation middleware implementation"
    },
    {
      "content": "Install zod as schema validation library",
      "status": "in_progress",
      "activeForm": "Installing zod package"
    },
    {
      "content": "Create validation schema definitions for apps",
      "status": "pending",
      "activeForm": "Creating validation schemas for apps"
    },
    {
      "content": "Create validation middleware/helper function",
      "status": "pending",
      "activeForm": "Creating validation middleware"
    },
    {
      "content": "Integrate validation with existing server mutations",
      "status": "pending",
      "activeForm": "Integrating validation with mutations"
    },
    {
      "content": "Create validation schemas for other entities (categories, tags, etc.)",
      "status": "pending",
      "activeForm": "Creating additional validation schemas"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm install zod",
  "description": "Install zod package",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm install zod --legacy-peer-deps",
  "description": "Install zod with legacy peer deps",
  "timeout": 120000
}

Zod is now installed. Now let me create the validation schemas and middleware:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing codebase structure and understand current validation patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and validation patterns"
    },
    {
      "content": "Plan validation middleware implementation approach",
      "status": "completed",
      "activeForm": "Planning validation middleware implementation"
    },
    {
      "content": "Install zod as schema validation library",
      "status": "completed",
      "activeForm": "Installing zod package"
    },
    {
      "content": "Create validation schema definitions for apps",
      "status": "in_progress",
      "activeForm": "Creating validation schemas for apps"
    },
    {
      "content": "Create validation middleware/helper function",
      "status": "pending",
      "activeForm": "Creating validation middleware"
    },
    {
      "content": "Integrate validation with existing server mutations",
      "status": "pending",
      "activeForm": "Integrating validation with mutations"
    },
    {
      "content": "Create validation schemas for other entities (categories, tags, etc.)",
      "status": "pending",
      "activeForm": "Creating additional validation schemas"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "mkdir -p /home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas",
  "description": "Create validation directory structure"
}

Now let me create the validation schemas and middleware:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/app.ts",
  "content": "/**\n * App Validation Schemas\n *\n * Defines Zod schemas for app-related operations.\n * These schemas can be used for:\n * - Server-side validation in mutations\n * - Client-side form validation with react-hook-form\n * - Type inference\n */\n\nimport { z } from \"zod\";\n\n// ============================================================================\n// Constants\n// ============================================================================\n\nexport const HEALTH_CHECK_TYPES = [\"http\", \"tcp\", \"uptime_kuma\"] as const;\n\nexport const VALID_TTL_VALUES = [15, 30, 60, 120, 300, 600, 900, 1800, 3600] as const;\n\n// ============================================================================\n// Reusable Field Schemas\n// ============================================================================\n\n/**\n * URL validation that allows empty strings (optional URLs)\n */\nconst optionalUrl = z\n  .string()\n  .transform((val) => val.trim())\n  .pipe(\n    z.string().refine(\n      (val) => val === \"\" || z.string().url().safeParse(val).success,\n      { message: \"Must be a valid URL\" }\n    )\n  )\n  .transform((val) => val || null);\n\n/**\n * Non-empty string that trims whitespace\n */\nconst requiredString = z\n  .string()\n  .min(1, \"This field is required\")\n  .transform((val) => val.trim());\n\n/**\n * Optional string that transforms empty strings to null\n */\nconst optionalString = z\n  .string()\n  .transform((val) => val.trim())\n  .transform((val) => val || null);\n\n/**\n * UUID validation\n */\nconst uuid = z.string().uuid(\"Invalid ID format\");\n\n/**\n * Optional UUID that accepts null or empty string\n */\nconst optionalUuid = z\n  .string()\n  .nullable()\n  .transform((val) => (val && val.trim() ? val.trim() : null))\n  .refine(\n    (val) => val === null || z.string().uuid().safeParse(val).success,\n    { message: \"Invalid ID format\" }\n  );\n\n// ============================================================================\n// App Schemas\n// ============================================================================\n\n/**\n * Schema for creating a new app\n */\nexport const createAppSchema = z.object({\n  name: requiredString.pipe(\n    z.string().max(255, \"Name must be 255 characters or less\")\n  ),\n  description: optionalString.pipe(\n    z.string().max(1000, \"Description must be 1000 characters or less\").nullable()\n  ),\n  icon: optionalString.pipe(\n    z.string().max(500, \"Icon URL must be 500 characters or less\").nullable()\n  ),\n  localUrl: optionalUrl,\n  remoteUrl: optionalUrl,\n  categoryId: optionalUuid,\n  tagIds: z.array(uuid).default([]),\n  healthCheckEnabled: z.boolean().default(false),\n  healthCheckType: z.enum(HEALTH_CHECK_TYPES).default(\"http\"),\n  healthCheckUrl: optionalUrl,\n  healthCheckTTL: z\n    .number()\n    .int()\n    .positive()\n    .refine((val) => VALID_TTL_VALUES.includes(val as any), {\n      message: `TTL must be one of: ${VALID_TTL_VALUES.join(\", \")} seconds`,\n    })\n    .default(60),\n  uptimeKumaMonitorId: optionalString,\n  notes: optionalString.pipe(\n    z.string().max(10000, \"Notes must be 10000 characters or less\").nullable()\n  ),\n});\n\n/**\n * Schema for updating an existing app\n */\nexport const updateAppSchema = z.object({\n  id: uuid,\n  name: requiredString.pipe(\n    z.string().max(255, \"Name must be 255 characters or less\")\n  ),\n  description: optionalString.pipe(\n    z.string().max(1000, \"Description must be 1000 characters or less\").nullable()\n  ),\n  icon: optionalString.pipe(\n    z.string().max(500, \"Icon URL must be 500 characters or less\").nullable()\n  ),\n  localUrl: optionalUrl,\n  remoteUrl: optionalUrl,\n  categoryId: optionalUuid,\n  tagIds: z.array(uuid).default([]),\n  healthCheckEnabled: z.boolean().default(false),\n  healthCheckType: z.enum(HEALTH_CHECK_TYPES).default(\"http\"),\n  healthCheckUrl: optionalUrl,\n  healthCheckTTL: z\n    .number()\n    .int()\n    .positive()\n    .refine((val) => VALID_TTL_VALUES.includes(val as any), {\n      message: `TTL must be one of: ${VALID_TTL_VALUES.join(\", \")} seconds`,\n    })\n    .default(60),\n  uptimeKumaMonitorId: optionalString,\n  notes: optionalString.pipe(\n    z.string().max(10000, \"Notes must be 10000 characters or less\").nullable()\n  ),\n});\n\n/**\n * Schema for deleting an app\n */\nexport const deleteAppSchema = z.object({\n  id: uuid,\n});\n\n/**\n * Schema for getting a single app\n */\nexport const getAppSchema = z.object({\n  id: uuid,\n});\n\n/**\n * Schema for pinning/unpinning an app\n */\nexport const pinAppSchema = z.object({\n  id: uuid,\n  pinned: z.boolean(),\n});\n\n/**\n * Schema for reordering apps\n */\nexport const reorderAppsSchema = z.object({\n  orderedIds: z.array(uuid),\n});\n\n/**\n * Schema for updating app order\n */\nexport const updateAppOrderSchema = z.object({\n  orderedIds: z.array(uuid),\n});\n\n// ============================================================================\n// Bulk Operation Schemas\n// ============================================================================\n\n/**\n * Schema for bulk deleting apps\n */\nexport const bulkDeleteAppsSchema = z.object({\n  ids: z.array(uuid).min(1, \"At least one app must be selected\"),\n});\n\n/**\n * Schema for bulk updating category\n */\nexport const bulkUpdateCategorySchema = z.object({\n  ids: z.array(uuid).min(1, \"At least one app must be selected\"),\n  categoryId: z.string().nullable(),\n});\n\n/**\n * Schema for bulk toggling health check\n */\nexport const bulkToggleHealthCheckSchema = z.object({\n  ids: z.array(uuid).min(1, \"At least one app must be selected\"),\n  enabled: z.boolean(),\n});\n\n/**\n * Schema for bulk exporting apps\n */\nexport const bulkExportAppsSchema = z.object({\n  ids: z.array(uuid).min(1, \"At least one app must be selected\"),\n});\n\n/**\n * Schema for bulk updating tags\n */\nexport const bulkUpdateTagsSchema = z.object({\n  ids: z.array(uuid).min(1, \"At least one app must be selected\"),\n  tagIds: z.array(uuid),\n  mode: z.enum([\"replace\", \"append\"]),\n});\n\n/**\n * Schema for refreshing app icons\n */\nexport const refreshAppIconsSchema = z.object({\n  ids: z.array(uuid).min(1, \"At least one app must be selected\"),\n});\n\n// ============================================================================\n// Type Exports\n// ============================================================================\n\nexport type CreateAppInput = z.infer<typeof createAppSchema>;\nexport type UpdateAppInput = z.infer<typeof updateAppSchema>;\nexport type DeleteAppInput = z.infer<typeof deleteAppSchema>;\nexport type GetAppInput = z.infer<typeof getAppSchema>;\nexport type PinAppInput = z.infer<typeof pinAppSchema>;\nexport type ReorderAppsInput = z.infer<typeof reorderAppsSchema>;\nexport type UpdateAppOrderInput = z.infer<typeof updateAppOrderSchema>;\nexport type BulkDeleteAppsInput = z.infer<typeof bulkDeleteAppsSchema>;\nexport type BulkUpdateCategoryInput = z.infer<typeof bulkUpdateCategorySchema>;\nexport type BulkToggleHealthCheckInput = z.infer<typeof bulkToggleHealthCheckSchema>;\nexport type BulkExportAppsInput = z.infer<typeof bulkExportAppsSchema>;\nexport type BulkUpdateTagsInput = z.infer<typeof bulkUpdateTagsSchema>;\nexport type RefreshAppIconsInput = z.infer<typeof refreshAppIconsSchema>;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/category.ts",
  "content": "/**\n * Category Validation Schemas\n *\n * Defines Zod schemas for category-related operations.\n */\n\nimport { z } from \"zod\";\n\n// ============================================================================\n// Reusable Field Schemas\n// ============================================================================\n\n/**\n * Non-empty string that trims whitespace\n */\nconst requiredString = z\n  .string()\n  .min(1, \"This field is required\")\n  .transform((val) => val.trim());\n\n/**\n * Optional string that transforms empty strings to null\n */\nconst optionalString = z\n  .string()\n  .transform((val) => val.trim())\n  .transform((val) => val || null);\n\n/**\n * UUID validation\n */\nconst uuid = z.string().uuid(\"Invalid ID format\");\n\n/**\n * Color hex validation (optional)\n */\nconst optionalColor = z\n  .string()\n  .transform((val) => val.trim())\n  .transform((val) => val || null)\n  .refine(\n    (val) => val === null || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val),\n    { message: \"Must be a valid hex color (e.g., #FF5733)\" }\n  );\n\n// ============================================================================\n// Category Schemas\n// ============================================================================\n\n/**\n * Schema for creating a new category\n */\nexport const createCategorySchema = z.object({\n  name: requiredString.pipe(\n    z.string().max(100, \"Name must be 100 characters or less\")\n  ),\n  icon: optionalString.pipe(\n    z.string().max(100, \"Icon must be 100 characters or less\").nullable()\n  ),\n  color: optionalColor,\n  sortOrder: z.number().int().optional(),\n});\n\n/**\n * Schema for updating an existing category\n */\nexport const updateCategorySchema = z.object({\n  id: uuid,\n  name: requiredString.pipe(\n    z.string().max(100, \"Name must be 100 characters or less\")\n  ).optional(),\n  icon: optionalString.pipe(\n    z.string().max(100, \"Icon must be 100 characters or less\").nullable()\n  ).optional(),\n  color: optionalColor.optional(),\n  sortOrder: z.number().int().optional(),\n});\n\n/**\n * Schema for deleting a category\n */\nexport const deleteCategorySchema = z.object({\n  id: uuid,\n});\n\n// ============================================================================\n// Type Exports\n// ============================================================================\n\nexport type CreateCategoryInput = z.infer<typeof createCategorySchema>;\nexport type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;\nexport type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/common.ts",
  "content": "/**\n * Common Validation Schemas\n *\n * Reusable field schemas and utilities for validation across the application.\n */\n\nimport { z } from \"zod\";\n\n// ============================================================================\n// Common Field Schemas\n// ============================================================================\n\n/**\n * UUID validation\n */\nexport const uuid = z.string().uuid(\"Invalid ID format\");\n\n/**\n * Non-empty string that trims whitespace\n */\nexport const requiredString = z\n  .string()\n  .min(1, \"This field is required\")\n  .transform((val) => val.trim());\n\n/**\n * Optional string that transforms empty strings to null\n */\nexport const optionalString = z\n  .string()\n  .transform((val) => val.trim())\n  .transform((val) => val || null);\n\n/**\n * URL validation that allows empty strings (optional URLs)\n */\nexport const optionalUrl = z\n  .string()\n  .transform((val) => val.trim())\n  .pipe(\n    z.string().refine(\n      (val) => val === \"\" || z.string().url().safeParse(val).success,\n      { message: \"Must be a valid URL\" }\n    )\n  )\n  .transform((val) => val || null);\n\n/**\n * Required URL validation\n */\nexport const requiredUrl = z\n  .string()\n  .min(1, \"URL is required\")\n  .transform((val) => val.trim())\n  .pipe(z.string().url(\"Must be a valid URL\"));\n\n/**\n * Optional UUID that accepts null or empty string\n */\nexport const optionalUuid = z\n  .string()\n  .nullable()\n  .transform((val) => (val && val.trim() ? val.trim() : null))\n  .refine(\n    (val) => val === null || z.string().uuid().safeParse(val).success,\n    { message: \"Invalid ID format\" }\n  );\n\n/**\n * Color hex validation (optional)\n */\nexport const optionalColor = z\n  .string()\n  .transform((val) => val.trim())\n  .transform((val) => val || null)\n  .refine(\n    (val) => val === null || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val),\n    { message: \"Must be a valid hex color (e.g., #FF5733)\" }\n  );\n\n/**\n * Positive integer\n */\nexport const positiveInt = z.number().int().positive();\n\n/**\n * Non-negative integer\n */\nexport const nonNegativeInt = z.number().int().nonnegative();\n\n/**\n * Email validation\n */\nexport const email = z\n  .string()\n  .min(1, \"Email is required\")\n  .email(\"Must be a valid email address\")\n  .transform((val) => val.trim().toLowerCase());\n\n/**\n * Slug validation (lowercase letters, numbers, hyphens)\n */\nexport const slug = z\n  .string()\n  .min(1, \"Slug is required\")\n  .regex(/^[a-z0-9-]+$/, \"Slug must contain only lowercase letters, numbers, and hyphens\")\n  .max(100, \"Slug must be 100 characters or less\");\n\n// ============================================================================\n// Pagination Schema\n// ============================================================================\n\nexport const paginationSchema = z.object({\n  page: z.number().int().positive().default(1),\n  limit: z.number().int().positive().max(100).default(20),\n});\n\nexport type PaginationInput = z.infer<typeof paginationSchema>;\n\n// ============================================================================\n// ID-based Operation Schemas\n// ============================================================================\n\n/**\n * Schema for operations requiring just an ID\n */\nexport const idSchema = z.object({\n  id: uuid,\n});\n\nexport type IdInput = z.infer<typeof idSchema>;\n\n/**\n * Schema for operations requiring multiple IDs\n */\nexport const idsSchema = z.object({\n  ids: z.array(uuid).min(1, \"At least one ID is required\"),\n});\n\nexport type IdsInput = z.infer<typeof idsSchema>;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/integration.ts",
  "content": "/**\n * Integration Validation Schemas\n *\n * Defines Zod schemas for integration-related operations.\n */\n\nimport { z } from \"zod\";\nimport { uuid, requiredString, optionalString, requiredUrl } from \"./common\";\n\n// ============================================================================\n// Constants\n// ============================================================================\n\nexport const INTEGRATION_TYPES = [\n  \"uptime_kuma\",\n  \"docker\",\n  \"truenas\",\n  \"portainer\",\n  \"sonarr\",\n  \"radarr\",\n  \"lidarr\",\n  \"jellyfin\",\n  \"glances\",\n  \"proxmox\",\n] as const;\n\nexport type IntegrationType = (typeof INTEGRATION_TYPES)[number];\n\n// ============================================================================\n// Integration Schemas\n// ============================================================================\n\n/**\n * Schema for creating a new integration\n */\nexport const createIntegrationSchema = z.object({\n  name: requiredString.pipe(\n    z.string().max(100, \"Name must be 100 characters or less\")\n  ),\n  type: z.enum(INTEGRATION_TYPES, {\n    errorMap: () => ({ message: \"Invalid integration type\" }),\n  }),\n  url: requiredUrl,\n  apiKey: optionalString,\n  username: optionalString,\n  password: optionalString,\n  allowInsecure: z.boolean().default(false),\n  enabled: z.boolean().default(true),\n});\n\n/**\n * Schema for updating an existing integration\n */\nexport const updateIntegrationSchema = z.object({\n  id: uuid,\n  data: z.object({\n    name: requiredString.pipe(\n      z.string().max(100, \"Name must be 100 characters or less\")\n    ).optional(),\n    type: z.enum(INTEGRATION_TYPES).optional(),\n    url: requiredUrl.optional(),\n    apiKey: optionalString.optional(),\n    username: optionalString.optional(),\n    password: optionalString.optional(),\n    allowInsecure: z.boolean().optional(),\n    enabled: z.boolean().optional(),\n  }),\n});\n\n/**\n * Schema for deleting an integration\n */\nexport const deleteIntegrationSchema = z.object({\n  id: uuid,\n});\n\n/**\n * Schema for testing an integration connection\n */\nexport const testIntegrationSchema = z.object({\n  id: uuid,\n});\n\n// ============================================================================\n// Type Exports\n// ============================================================================\n\nexport type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;\nexport type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;\nexport type DeleteIntegrationInput = z.infer<typeof deleteIntegrationSchema>;\nexport type TestIntegrationInput = z.infer<typeof testIntegrationSchema>;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts",
  "content": "/**\n * Alert Validation Schemas\n *\n * Defines Zod schemas for alert-related operations.\n */\n\nimport { z } from \"zod\";\nimport { uuid, optionalUuid, requiredString, optionalString, email, optionalUrl } from \"./common\";\n\n// ============================================================================\n// Constants\n// ============================================================================\n\nexport const TRIGGER_TYPES = [\n  \"status_change\",\n  \"consecutive_failures\",\n  \"response_time\",\n  \"integration_status\",\n] as const;\n\nexport const SEVERITY_LEVELS = [\"info\", \"warning\", \"critical\"] as const;\n\nexport const ALERT_STATUSES = [\"pending\", \"triggered\", \"acknowledged\", \"resolved\"] as const;\n\nexport const DIGEST_FREQUENCIES = [\"hourly\", \"daily\", \"weekly\"] as const;\n\n// ============================================================================\n// Alert Rule Schemas\n// ============================================================================\n\n/**\n * Alert conditions schema\n */\nexport const alertConditionsSchema = z.object({\n  type: z.enum([\"status_change\", \"response_time\", \"downtime_duration\"]).optional(),\n  operator: z.enum([\"gt\", \"lt\", \"eq\", \"gte\", \"lte\"]).optional(),\n  value: z.number().optional(),\n  fromStatus: z.string().optional(),\n  toStatus: z.string().optional(),\n  consecutiveCount: z.number().int().positive().optional(),\n  thresholdMs: z.number().int().positive().optional(),\n  durationMinutes: z.number().int().positive().optional(),\n}).default({});\n\n/**\n * Alert channels schema\n */\nexport const alertChannelsSchema = z.object({\n  inApp: z.boolean().optional(),\n  email: z.boolean().optional(),\n  webhook: z.object({\n    url: z.string().url(),\n    headers: z.record(z.string()).optional(),\n  }).optional(),\n  integration: z.object({\n    id: z.string().uuid(),\n    type: z.string(),\n  }).optional(),\n}).default({ inApp: true });\n\n/**\n * Schema for creating a new alert rule\n */\nexport const createAlertRuleSchema = z.object({\n  name: requiredString.pipe(\n    z.string().max(100, \"Name must be 100 characters or less\")\n  ),\n  description: optionalString.pipe(\n    z.string().max(500, \"Description must be 500 characters or less\").nullable()\n  ).optional(),\n  enabled: z.boolean().default(true),\n  triggerType: z.enum(TRIGGER_TYPES, {\n    errorMap: () => ({ message: \"Invalid trigger type\" }),\n  }),\n  appId: optionalUuid.optional(),\n  integrationId: optionalUuid.optional(),\n  conditions: alertConditionsSchema.optional(),\n  severity: z.enum(SEVERITY_LEVELS).default(\"warning\"),\n  channels: alertChannelsSchema.optional(),\n  cooldownMinutes: z.number().int().positive().max(1440).default(15),\n});\n\n/**\n * Schema for updating an existing alert rule\n */\nexport const updateAlertRuleSchema = z.object({\n  id: uuid,\n  data: z.object({\n    name: requiredString.pipe(\n      z.string().max(100, \"Name must be 100 characters or less\")\n    ).optional(),\n    description: optionalString.optional(),\n    enabled: z.boolean().optional(),\n    triggerType: z.enum(TRIGGER_TYPES).optional(),\n    appId: optionalUuid.optional(),\n    integrationId: optionalUuid.optional(),\n    conditions: alertConditionsSchema.optional(),\n    severity: z.enum(SEVERITY_LEVELS).optional(),\n    channels: alertChannelsSchema.optional(),\n    cooldownMinutes: z.number().int().positive().max(1440).optional(),\n  }),\n});\n\n/**\n * Schema for deleting an alert rule\n */\nexport const deleteAlertRuleSchema = z.object({\n  id: uuid,\n});\n\n/**\n * Schema for toggling an alert rule\n */\nexport const toggleAlertRuleSchema = z.object({\n  id: uuid,\n  enabled: z.boolean(),\n});\n\n// ============================================================================\n// Alert History Schemas\n// ============================================================================\n\n/**\n * Schema for getting alert history\n */\nexport const getAlertHistorySchema = z.object({\n  limit: z.number().int().positive().max(100).default(50),\n  status: z.string().optional(),\n  appId: z.string().uuid().optional(),\n});\n\n/**\n * Schema for acknowledging an alert\n */\nexport const acknowledgeAlertSchema = z.object({\n  id: uuid,\n});\n\n/**\n * Schema for resolving an alert\n */\nexport const resolveAlertSchema = z.object({\n  id: uuid,\n});\n\n/**\n * Schema for bulk resolving alerts\n */\nexport const bulkResolveAlertsSchema = z.object({\n  ids: z.array(uuid).min(1, \"At least one alert must be selected\"),\n});\n\n/**\n * Schema for clearing old alert history\n */\nexport const clearOldAlertHistorySchema = z.object({\n  daysToKeep: z.number().int().positive().max(365).default(30),\n});\n\n// ============================================================================\n// Notification Preferences Schemas\n// ============================================================================\n\n/**\n * Schema for updating notification preferences\n */\nexport const updateNotificationPreferencesSchema = z.object({\n  globalEnabled: z.boolean().optional(),\n  emailEnabled: z.boolean().optional(),\n  emailAddress: z.union([email, z.literal(\"\")]).nullable().optional(),\n  webhookEnabled: z.boolean().optional(),\n  webhookUrl: optionalUrl.optional(),\n  webhookSecret: optionalString.optional(),\n  webhookHeaders: z.record(z.string()).nullable().optional(),\n  inAppEnabled: z.boolean().optional(),\n  inAppSound: z.boolean().optional(),\n  quietHoursEnabled: z.boolean().optional(),\n  quietHoursStart: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  quietHoursEnd: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  timezone: z.string().optional(),\n  digestEnabled: z.boolean().optional(),\n  digestFrequency: z.enum(DIGEST_FREQUENCIES).optional(),\n});\n\n/**\n * Schema for testing webhook\n */\nexport const testWebhookSchema = z.object({\n  webhookUrl: z.string().url(\"Must be a valid URL\"),\n  webhookSecret: z.string().optional(),\n  webhookHeaders: z.record(z.string()).optional(),\n});\n\n// ============================================================================\n// In-App Notification Schemas\n// ============================================================================\n\n/**\n * Schema for getting in-app notifications\n */\nexport const getInAppNotificationsSchema = z.object({\n  unreadOnly: z.boolean().optional(),\n  limit: z.number().int().positive().max(100).default(50),\n});\n\n/**\n * Schema for marking a notification as read\n */\nexport const markNotificationReadSchema = z.object({\n  id: uuid,\n});\n\n/**\n * Schema for dismissing a notification\n */\nexport const dismissNotificationSchema = z.object({\n  id: uuid,\n});\n\n// ============================================================================\n// Type Exports\n// ============================================================================\n\nexport type AlertConditions = z.infer<typeof alertConditionsSchema>;\nexport type AlertChannels = z.infer<typeof alertChannelsSchema>;\nexport type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;\nexport type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;\nexport type DeleteAlertRuleInput = z.infer<typeof deleteAlertRuleSchema>;\nexport type ToggleAlertRuleInput = z.infer<typeof toggleAlertRuleSchema>;\nexport type GetAlertHistoryInput = z.infer<typeof getAlertHistorySchema>;\nexport type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>;\nexport type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;\nexport type BulkResolveAlertsInput = z.infer<typeof bulkResolveAlertsSchema>;\nexport type ClearOldAlertHistoryInput = z.infer<typeof clearOldAlertHistorySchema>;\nexport type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;\nexport type TestWebhookInput = z.infer<typeof testWebhookSchema>;\nexport type GetInAppNotificationsInput = z.infer<typeof getInAppNotificationsSchema>;\nexport type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;\nexport type DismissNotificationInput = z.infer<typeof dismissNotificationSchema>;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/index.ts",
  "content": "/**\n * Validation Schemas Index\n *\n * Central export point for all validation schemas.\n * Import from here for cleaner imports throughout the application.\n */\n\n// Common utilities\nexport * from \"./common\";\n\n// Entity schemas\nexport * from \"./app\";\nexport * from \"./category\";\nexport * from \"./integration\";\nexport * from \"./alert\";\n"
}

Now let's create the validation middleware:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing codebase structure and understand current validation patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and validation patterns"
    },
    {
      "content": "Plan validation middleware implementation approach",
      "status": "completed",
      "activeForm": "Planning validation middleware implementation"
    },
    {
      "content": "Install zod as schema validation library",
      "status": "completed",
      "activeForm": "Installing zod package"
    },
    {
      "content": "Create validation schema definitions for apps",
      "status": "completed",
      "activeForm": "Creating validation schemas for apps"
    },
    {
      "content": "Create validation middleware/helper function",
      "status": "in_progress",
      "activeForm": "Creating validation middleware"
    },
    {
      "content": "Integrate validation with existing server mutations",
      "status": "pending",
      "activeForm": "Integrating validation with mutations"
    },
    {
      "content": "Create validation schemas for other entities (categories, tags, etc.)",
      "status": "completed",
      "activeForm": "Creating additional validation schemas"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/middleware.ts",
  "content": "/**\n * Validation Middleware\n *\n * Provides utilities for validating data in server functions using Zod schemas.\n * Integrates with the existing error handling system for consistent error responses.\n *\n * Features:\n * - Validates input data using Zod schemas\n * - Converts Zod errors to ValidationError (400 status)\n * - Returns typed, validated data for type-safe handlers\n * - Can be combined with existing error handling wrappers\n *\n * Usage:\n * ```ts\n * import { validateInput, withValidation } from \"@/lib/validation/middleware\";\n * import { createAppSchema } from \"@/lib/validation/schemas\";\n *\n * // Option 1: Validate inline\n * export const createApp = createServerFn({ method: \"POST\" }).handler(\n *   async (ctx: { data: unknown }) => {\n *     const validData = validateInput(createAppSchema, ctx.data);\n *     // validData is now typed and validated\n *   }\n * );\n *\n * // Option 2: Use withValidation wrapper\n * export const createApp = createServerFn({ method: \"POST\" }).handler(\n *   withValidation(createAppSchema, async (validData, ctx) => {\n *     // validData is typed and validated\n *   })\n * );\n * ```\n */\n\nimport { z, type ZodSchema, type ZodError } from \"zod\";\nimport { ValidationError, ErrorCode } from \"../server/errors\";\n\n// ============================================================================\n// Types\n// ============================================================================\n\n/**\n * Result type for validation\n */\nexport type ValidationResult<T> =\n  | { success: true; data: T }\n  | { success: false; error: ValidationError };\n\n/**\n * Context type for server function handlers\n */\nexport interface ServerContext<T = unknown> {\n  data: T;\n}\n\n// ============================================================================\n// Error Conversion\n// ============================================================================\n\n/**\n * Convert a Zod error to field errors map\n */\nfunction zodErrorToFieldErrors(error: ZodError): Record<string, string[]> {\n  const fieldErrors: Record<string, string[]> = {};\n\n  for (const issue of error.issues) {\n    const path = issue.path.join(\".\");\n    const fieldName = path || \"_root\";\n\n    if (!fieldErrors[fieldName]) {\n      fieldErrors[fieldName] = [];\n    }\n\n    fieldErrors[fieldName].push(issue.message);\n  }\n\n  return fieldErrors;\n}\n\n/**\n * Convert a Zod error to a ValidationError\n */\nfunction zodErrorToValidationError(error: ZodError): ValidationError {\n  const fieldErrors = zodErrorToFieldErrors(error);\n\n  // Create a human-readable message\n  const firstError = error.errors[0];\n  const path = firstError?.path.join(\".\") || \"input\";\n  const message = firstError?.message || \"Validation failed\";\n\n  // For a single field error, use a more specific message\n  const errorMessage =\n    Object.keys(fieldErrors).length === 1\n      ? `${path}: ${message}`\n      : \"Validation failed. Please check the highlighted fields.\";\n\n  return new ValidationError(\n    errorMessage,\n    ErrorCode.VALIDATION_ERROR,\n    {},\n    fieldErrors\n  );\n}\n\n// ============================================================================\n// Validation Functions\n// ============================================================================\n\n/**\n * Validate input data against a Zod schema.\n *\n * Throws a ValidationError if validation fails.\n * Returns the validated and transformed data if successful.\n *\n * @param schema - The Zod schema to validate against\n * @param data - The data to validate\n * @returns The validated data with proper types\n * @throws ValidationError if validation fails\n *\n * @example\n * ```ts\n * const validated = validateInput(createAppSchema, ctx.data);\n * // validated is now typed as CreateAppInput\n * ```\n */\nexport function validateInput<T extends ZodSchema>(\n  schema: T,\n  data: unknown\n): z.infer<T> {\n  const result = schema.safeParse(data);\n\n  if (!result.success) {\n    throw zodErrorToValidationError(result.error);\n  }\n\n  return result.data;\n}\n\n/**\n * Safely validate input data against a Zod schema.\n *\n * Returns a result object instead of throwing.\n *\n * @param schema - The Zod schema to validate against\n * @param data - The data to validate\n * @returns ValidationResult with either validated data or error\n *\n * @example\n * ```ts\n * const result = safeValidateInput(createAppSchema, ctx.data);\n * if (result.success) {\n *   console.log(result.data);\n * } else {\n *   console.error(result.error.fieldErrors);\n * }\n * ```\n */\nexport function safeValidateInput<T extends ZodSchema>(\n  schema: T,\n  data: unknown\n): ValidationResult<z.infer<T>> {\n  const result = schema.safeParse(data);\n\n  if (!result.success) {\n    return {\n      success: false,\n      error: zodErrorToValidationError(result.error),\n    };\n  }\n\n  return {\n    success: true,\n    data: result.data,\n  };\n}\n\n// ============================================================================\n// Handler Wrappers\n// ============================================================================\n\n/**\n * Wraps a server function handler with input validation.\n *\n * Validates ctx.data against the provided schema before calling the handler.\n * The handler receives the validated, typed data.\n *\n * @param schema - The Zod schema to validate against\n * @param handler - The handler function that receives validated data\n * @returns A wrapped handler with validation\n *\n * @example\n * ```ts\n * export const createApp = createServerFn({ method: \"POST\" }).handler(\n *   withValidation(createAppSchema, async (validData, ctx) => {\n *     // validData is CreateAppInput\n *     const { getDb } = await import(\"./get-db\");\n *     // ... rest of handler\n *   })\n * );\n * ```\n */\nexport function withValidation<TSchema extends ZodSchema, TOutput>(\n  schema: TSchema,\n  handler: (validData: z.infer<TSchema>, ctx: ServerContext<unknown>) => Promise<TOutput>\n): (ctx: ServerContext<unknown>) => Promise<TOutput> {\n  return async (ctx: ServerContext<unknown>): Promise<TOutput> => {\n    const validData = validateInput(schema, ctx.data);\n    return handler(validData, ctx);\n  };\n}\n\n/**\n * Creates a validated handler factory for a specific schema.\n *\n * Useful when you want to create multiple handlers with the same schema.\n *\n * @param schema - The Zod schema to validate against\n * @returns A function that creates validated handlers\n *\n * @example\n * ```ts\n * const createAppHandler = validatedHandler(createAppSchema);\n *\n * export const createApp = createServerFn({ method: \"POST\" }).handler(\n *   createAppHandler(async (validData) => {\n *     // Handle creation\n *   })\n * );\n * ```\n */\nexport function validatedHandler<TSchema extends ZodSchema>(schema: TSchema) {\n  return <TOutput>(\n    handler: (validData: z.infer<TSchema>, ctx: ServerContext<unknown>) => Promise<TOutput>\n  ) => withValidation(schema, handler);\n}\n\n// ============================================================================\n// Combined Wrappers (with Authentication)\n// ============================================================================\n\n/**\n * Wraps a server function with both validation and authentication.\n *\n * Validates input, then fetches the authenticated session, then calls handler.\n *\n * @param schema - The Zod schema to validate against\n * @param handler - The handler receiving session and validated data\n * @returns A wrapped handler with validation and authentication\n *\n * @example\n * ```ts\n * export const createApp = createServerFn({ method: \"POST\" }).handler(\n *   withValidationAndAuth(createAppSchema, async (session, validData) => {\n *     // Both session and validData are available\n *   })\n * );\n * ```\n */\nexport function withValidationAndAuth<TSchema extends ZodSchema, TOutput>(\n  schema: TSchema,\n  handler: (\n    session: Awaited<ReturnType<typeof import(\"../server/auth-utils.server\").getAuthenticatedSession>>,\n    validData: z.infer<TSchema>\n  ) => Promise<TOutput>\n): (ctx: ServerContext<unknown>) => Promise<TOutput> {\n  return async (ctx: ServerContext<unknown>): Promise<TOutput> => {\n    // First validate the input\n    const validData = validateInput(schema, ctx.data);\n\n    // Then authenticate\n    const { getAuthenticatedSession } = await import(\"../server/auth-utils.server\");\n    const session = await getAuthenticatedSession();\n\n    return handler(session, validData);\n  };\n}\n\n/**\n * Wraps a server function with validation and optional authentication.\n *\n * Similar to withValidationAndAuth but session can be null.\n *\n * @param schema - The Zod schema to validate against\n * @param handler - The handler receiving optional session and validated data\n * @returns A wrapped handler with validation and optional authentication\n */\nexport function withValidationAndOptionalAuth<TSchema extends ZodSchema, TOutput>(\n  schema: TSchema,\n  handler: (\n    session: Awaited<ReturnType<typeof import(\"../server/auth-utils.server\").getOptionalSession>>,\n    validData: z.infer<TSchema>\n  ) => Promise<TOutput>\n): (ctx: ServerContext<unknown>) => Promise<TOutput> {\n  return async (ctx: ServerContext<unknown>): Promise<TOutput> => {\n    // First validate the input\n    const validData = validateInput(schema, ctx.data);\n\n    // Then get optional session\n    const { getOptionalSession } = await import(\"../server/auth-utils.server\");\n    const session = await getOptionalSession();\n\n    return handler(session, validData);\n  };\n}\n\n// ============================================================================\n// Utility Functions\n// ============================================================================\n\n/**\n * Extracts field errors from a ValidationError for display in forms.\n *\n * @param error - The error to extract field errors from\n * @returns Field errors map or empty object if not a ValidationError\n */\nexport function extractFieldErrors(\n  error: unknown\n): Record<string, string[]> {\n  if (error instanceof ValidationError && error.fieldErrors) {\n    return error.fieldErrors;\n  }\n  return {};\n}\n\n/**\n * Checks if an error is a ValidationError\n */\nexport function isValidationError(error: unknown): error is ValidationError {\n  return error instanceof ValidationError;\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/index.ts",
  "content": "/**\n * Validation Module\n *\n * Central export point for validation utilities and schemas.\n *\n * Usage:\n * ```ts\n * // Server-side validation\n * import { validateInput, createAppSchema } from \"@/lib/validation\";\n *\n * const validated = validateInput(createAppSchema, ctx.data);\n *\n * // Client-side form validation with react-hook-form\n * import { zodResolver } from \"@hookform/resolvers/zod\";\n * import { createAppSchema } from \"@/lib/validation\";\n *\n * const form = useForm({\n *   resolver: zodResolver(createAppSchema),\n * });\n * ```\n */\n\n// Middleware and utilities\nexport {\n  validateInput,\n  safeValidateInput,\n  withValidation,\n  validatedHandler,\n  withValidationAndAuth,\n  withValidationAndOptionalAuth,\n  extractFieldErrors,\n  isValidationError,\n  type ValidationResult,\n  type ServerContext,\n} from \"./middleware\";\n\n// All schemas and types\nexport * from \"./schemas\";\n"
}

Now let's update the apps.server.ts to use validation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing codebase structure and understand current validation patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and validation patterns"
    },
    {
      "content": "Plan validation middleware implementation approach",
      "status": "completed",
      "activeForm": "Planning validation middleware implementation"
    },
    {
      "content": "Install zod as schema validation library",
      "status": "completed",
      "activeForm": "Installing zod package"
    },
    {
      "content": "Create validation schema definitions for apps",
      "status": "completed",
      "activeForm": "Creating validation schemas for apps"
    },
    {
      "content": "Create validation middleware/helper function",
      "status": "completed",
      "activeForm": "Creating validation middleware"
    },
    {
      "content": "Integrate validation with existing server mutations",
      "status": "in_progress",
      "activeForm": "Integrating validation with mutations"
    },
    {
      "content": "Create validation schemas for other entities (categories, tags, etc.)",
      "status": "completed",
      "activeForm": "Creating additional validation schemas"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "import { createServerFn } from \"@tanstack/react-start\";\nimport type { NewApp, GranularPermissions } from \"@/types/database\";",
  "new_string": "import { createServerFn } from \"@tanstack/react-start\";\nimport type { NewApp, GranularPermissions } from \"@/types/database\";\nimport { validateInput } from \"@/lib/validation\";\nimport {\n  createAppSchema,\n  updateAppSchema,\n  getAppSchema,\n  deleteAppSchema,\n  pinAppSchema,\n  updateAppOrderSchema,\n  bulkDeleteAppsSchema,\n  bulkUpdateCategorySchema,\n  bulkToggleHealthCheckSchema,\n  bulkExportAppsSchema,\n  bulkUpdateTagsSchema,\n  refreshAppIconsSchema,\n  type CreateAppInput,\n  type UpdateAppInput,\n} from \"@/lib/validation/schemas/app\";"
}

Now let's update the getApp function to use validation:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "export const getApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { id: string } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const app = await db.query.apps.findFirst({\n      where: and(eq(apps.id, ctx.data.id), eq(apps.userId, session.user.id)),\n      with: {\n        category: true,\n        tags: {\n          with: {\n            tag: true,\n          },\n        },\n      },\n    });\n\n    if (!app) throw new Error(\"App not found\");\n\n    return {\n      ...app,\n      tags: app.tags.map((t) => t.tag),\n    };\n  }\n);",
  "new_string": "export const getApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { id } = validateInput(getAppSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const app = await db.query.apps.findFirst({\n      where: and(eq(apps.id, id), eq(apps.userId, session.user.id)),\n      with: {\n        category: true,\n        tags: {\n          with: {\n            tag: true,\n          },\n        },\n      },\n    });\n\n    if (!app) throw new Error(\"App not found\");\n\n    return {\n      ...app,\n      tags: app.tags.map((t) => t.tag),\n    };\n  }\n);"
}

Now update the createApp function:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "type CreateAppData = {\n  data: Omit<NewApp, \"id\" | \"userId\" | \"createdAt\" | \"updatedAt\"> & { tagIds?: string[] };\n};\n\nexport const createApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: CreateAppData) => {\n    const { getDb } = await import(\"./get-db\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps, appTags } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { tagIds, ...appData } = ctx.data;\n\n    const [newApp] = await db\n      .insert(apps)\n      .values({\n        ...appData,\n        userId: session.user.id,\n      })\n      .returning();\n\n    if (tagIds?.length) {\n      await db.insert(appTags).values(\n        tagIds.map((tagId) => ({\n          appId: newApp.id,\n          tagId,\n        }))\n      );\n    }\n\n    return newApp;\n  }\n);",
  "new_string": "export const createApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input using schema\n    const validData = validateInput(createAppSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps, appTags } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { tagIds, ...appData } = validData;\n\n    const [newApp] = await db\n      .insert(apps)\n      .values({\n        ...appData,\n        userId: session.user.id,\n      })\n      .returning();\n\n    if (tagIds?.length) {\n      await db.insert(appTags).values(\n        tagIds.map((tagId) => ({\n          appId: newApp.id,\n          tagId,\n        }))\n      );\n    }\n\n    return newApp;\n  }\n);"
}

Now update the updateApp function:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "type UpdateAppData = {\n  data: { id: string } & Partial<Omit<NewApp, \"id\" | \"userId\">> & { tagIds?: string[] };\n};\n\nexport const updateApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: UpdateAppData) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { invalidateAppCache } = await import(\"./health-cache.server\");\n    const { apps, appTags } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { id, tagIds, ...updateData } = ctx.data;\n\n    // Check if any health check related fields are being updated\n    const shouldInvalidateCache = HEALTH_CHECK_FIELDS.some(\n      (field) => field in updateData\n    );\n\n    const [updatedApp] = await db\n      .update(apps)\n      .set({ ...updateData, updatedAt: new Date() })\n      .where(and(eq(apps.id, id), eq(apps.userId, session.user.id)))\n      .returning();\n\n    if (!updatedApp) throw new Error(\"App not found\");\n\n    if (tagIds !== undefined) {\n      await db.delete(appTags).where(eq(appTags.appId, id));\n      if (tagIds.length) {\n        await db.insert(appTags).values(\n          tagIds.map((tagId) => ({\n            appId: id,\n            tagId,\n          }))\n        );\n      }\n    }\n\n    // Invalidate health cache if health check settings changed\n    if (shouldInvalidateCache) {\n      await invalidateAppCache(id, session.user.id);\n    }\n\n    return updatedApp;\n  }\n);",
  "new_string": "export const updateApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input using schema\n    const validData = validateInput(updateAppSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { invalidateAppCache } = await import(\"./health-cache.server\");\n    const { apps, appTags } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { id, tagIds, ...updateData } = validData;\n\n    // Check if any health check related fields are being updated\n    const shouldInvalidateCache = HEALTH_CHECK_FIELDS.some(\n      (field) => field in updateData\n    );\n\n    const [updatedApp] = await db\n      .update(apps)\n      .set({ ...updateData, updatedAt: new Date() })\n      .where(and(eq(apps.id, id), eq(apps.userId, session.user.id)))\n      .returning();\n\n    if (!updatedApp) throw new Error(\"App not found\");\n\n    if (tagIds !== undefined) {\n      await db.delete(appTags).where(eq(appTags.appId, id));\n      if (tagIds.length) {\n        await db.insert(appTags).values(\n          tagIds.map((tagId) => ({\n            appId: id,\n            tagId,\n          }))\n        );\n      }\n    }\n\n    // Invalidate health cache if health check settings changed\n    if (shouldInvalidateCache) {\n      await invalidateAppCache(id, session.user.id);\n    }\n\n    return updatedApp;\n  }\n);"
}

Now let's update the remaining functions (deleteApp, pinApp, and bulk operations):

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "export const deleteApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { id: string } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    await db.delete(apps).where(and(eq(apps.id, ctx.data.id), eq(apps.userId, session.user.id)));\n\n    return { success: true };\n  }\n);",
  "new_string": "export const deleteApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { id } = validateInput(deleteAppSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    await db.delete(apps).where(and(eq(apps.id, id), eq(apps.userId, session.user.id)));\n\n    return { success: true };\n  }\n);"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "export const pinApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { id: string; pinned: boolean } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const [updatedApp] = await db\n      .update(apps)\n      .set({ pinned: ctx.data.pinned, updatedAt: new Date() })\n      .where(and(eq(apps.id, ctx.data.id), eq(apps.userId, session.user.id)))\n      .returning();\n\n    if (!updatedApp) throw new Error(\"App not found\");\n\n    return updatedApp;\n  }\n);",
  "new_string": "export const pinApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { id, pinned } = validateInput(pinAppSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const [updatedApp] = await db\n      .update(apps)\n      .set({ pinned, updatedAt: new Date() })\n      .where(and(eq(apps.id, id), eq(apps.userId, session.user.id)))\n      .returning();\n\n    if (!updatedApp) throw new Error(\"App not found\");\n\n    return updatedApp;\n  }\n);"
}

Now let's update the bulk operations:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "// Bulk delete apps\nexport const bulkDeleteApps = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { ids: string[] } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps, appTags } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { ids } = ctx.data;\n    if (!ids.length) return { deleted: 0 };\n\n    // First delete app tags\n    await db.delete(appTags).where(inArray(appTags.appId, ids));\n\n    // Then delete apps (only those belonging to this user)\n    await db\n      .delete(apps)\n      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));\n\n    return { deleted: ids.length };\n  }\n);",
  "new_string": "// Bulk delete apps\nexport const bulkDeleteApps = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { ids } = validateInput(bulkDeleteAppsSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps, appTags } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    // First delete app tags\n    await db.delete(appTags).where(inArray(appTags.appId, ids));\n\n    // Then delete apps (only those belonging to this user)\n    await db\n      .delete(apps)\n      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));\n\n    return { deleted: ids.length };\n  }\n);"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "// Bulk update category\nexport const bulkUpdateCategory = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { ids: string[]; categoryId: string | null } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { ids, categoryId } = ctx.data;\n    if (!ids.length) return { updated: 0 };\n\n    await db\n      .update(apps)\n      .set({ categoryId, updatedAt: new Date() })\n      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));\n\n    return { updated: ids.length };\n  }\n);",
  "new_string": "// Bulk update category\nexport const bulkUpdateCategory = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { ids, categoryId } = validateInput(bulkUpdateCategorySchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    await db\n      .update(apps)\n      .set({ categoryId, updatedAt: new Date() })\n      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));\n\n    return { updated: ids.length };\n  }\n);"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "// Bulk toggle health check\nexport const bulkToggleHealthCheck = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { ids: string[]; enabled: boolean } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { invalidateMultipleAppCaches } = await import(\"./health-cache.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { ids, enabled } = ctx.data;\n    if (!ids.length) return { updated: 0 };\n\n    await db\n      .update(apps)\n      .set({ healthCheckEnabled: enabled, updatedAt: new Date() })\n      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));\n\n    // Invalidate health cache for all affected apps\n    await invalidateMultipleAppCaches(ids, session.user.id);\n\n    return { updated: ids.length };\n  }\n);",
  "new_string": "// Bulk toggle health check\nexport const bulkToggleHealthCheck = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { ids, enabled } = validateInput(bulkToggleHealthCheckSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { invalidateMultipleAppCaches } = await import(\"./health-cache.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    await db\n      .update(apps)\n      .set({ healthCheckEnabled: enabled, updatedAt: new Date() })\n      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));\n\n    // Invalidate health cache for all affected apps\n    await invalidateMultipleAppCaches(ids, session.user.id);\n\n    return { updated: ids.length };\n  }\n);"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "// Refresh icons for apps (detect icons based on name)\nexport const refreshAppIcons = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { ids: string[] } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { getIconUrl } = await import(\"./icons.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { ids } = ctx.data;\n    if (!ids.length) return { updated: 0, icons: [] };",
  "new_string": "// Refresh icons for apps (detect icons based on name)\nexport const refreshAppIcons = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { ids } = validateInput(refreshAppIconsSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { getIconUrl } = await import(\"./icons.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "// Update app sort order (for drag and drop reordering)\nexport const updateAppOrder = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { orderedIds: string[] } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { orderedIds } = ctx.data;\n    if (!orderedIds.length) return { updated: 0 };",
  "new_string": "// Update app sort order (for drag and drop reordering)\nexport const updateAppOrder = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { orderedIds } = validateInput(updateAppOrderSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    if (!orderedIds.length) return { updated: 0 };"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "// Bulk export apps as JSON\nexport const bulkExportApps = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { ids: string[] } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { ids } = ctx.data;\n    if (!ids.length) return { data: [] };",
  "new_string": "// Bulk export apps as JSON\nexport const bulkExportApps = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { ids } = validateInput(bulkExportAppsSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "// Bulk update tags for apps\nexport const bulkUpdateTags = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { ids: string[]; tagIds: string[]; mode: \"replace\" | \"append\" } }) => {\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps, appTags } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();\n\n    const { ids, tagIds, mode } = ctx.data;\n    if (!ids.length) return { updated: 0 };",
  "new_string": "// Bulk update tags for apps\nexport const bulkUpdateTags = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input\n    const { ids, tagIds, mode } = validateInput(bulkUpdateTagsSchema, ctx.data);\n\n    const { getDb } = await import(\"./get-db\");\n    const { eq, and, inArray } = await import(\"drizzle-orm\");\n    const { getAuthenticatedSession } = await import(\"./auth-utils.server\");\n    const { apps, appTags } = await import(\"@/database/schema\");\n\n    const db = await getDb();\n\n    const session = await getAuthenticatedSession();"
}

Now let's verify the changes compile by running TypeScript check:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -60",
  "description": "Type check the codebase",
  "timeout": 120000
}

The TypeScript errors shown are pre-existing and not related to our changes. Let me check specifically for our file:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(apps\\.server|validation)\" | head -30 || echo \"No validation-related errors found\"",
  "description": "Check for validation-related errors",
  "timeout": 120000
}

Let me fix these issues:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.server.ts",
  "old_string": "import { createServerFn } from \"@tanstack/react-start\";\nimport type { NewApp, GranularPermissions } from \"@/types/database\";\nimport { validateInput } from \"@/lib/validation\";\nimport {\n  createAppSchema,\n  updateAppSchema,\n  getAppSchema,\n  deleteAppSchema,\n  pinAppSchema,\n  updateAppOrderSchema,\n  bulkDeleteAppsSchema,\n  bulkUpdateCategorySchema,\n  bulkToggleHealthCheckSchema,\n  bulkExportAppsSchema,\n  bulkUpdateTagsSchema,\n  refreshAppIconsSchema,\n  type CreateAppInput,\n  type UpdateAppInput,\n} from \"@/lib/validation/schemas/app\";",
  "new_string": "import { createServerFn } from \"@tanstack/react-start\";\nimport type { GranularPermissions } from \"@/types/database\";\nimport { validateInput } from \"@/lib/validation\";\nimport {\n  createAppSchema,\n  updateAppSchema,\n  getAppSchema,\n  deleteAppSchema,\n  pinAppSchema,\n  updateAppOrderSchema,\n  bulkDeleteAppsSchema,\n  bulkUpdateCategorySchema,\n  bulkToggleHealthCheckSchema,\n  bulkExportAppsSchema,\n  bulkUpdateTagsSchema,\n  refreshAppIconsSchema,\n} from \"@/lib/validation/schemas/app\";"
}

Now let me fix the middleware file:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/middleware.ts",
  "old_string": "  // For a single field error, use a more specific message\n  const errorMessage =\n    Object.keys(fieldErrors).length === 1\n      ? `${path}: ${message}`\n      : \"Validation failed. Please check the highlighted fields.\";\n\n  return new ValidationError(\n    errorMessage,\n    ErrorCode.VALIDATION_ERROR,\n    {},\n    fieldErrors\n  );\n}",
  "new_string": "  // For a single field error, use a more specific message\n  const errorMessage =\n    Object.keys(fieldErrors).length === 1\n      ? `${path}: ${message}`\n      : \"Validation failed. Please check the highlighted fields.\";\n\n  return new ValidationError(\n    errorMessage,\n    ErrorCode.VALIDATION_ERROR,\n    {},\n    fieldErrors\n  );\n}\n\n/**\n * Get the first error from a Zod error for simple messages\n */\nfunction getFirstZodError(error: ZodError): { path: string; message: string } {\n  const firstIssue = error.issues[0];\n  if (!firstIssue) {\n    return { path: \"input\", message: \"Validation failed\" };\n  }\n  return {\n    path: firstIssue.path.join(\".\") || \"input\",\n    message: firstIssue.message,\n  };\n}"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/middleware.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/middleware.ts",
  "old_string": "/**\n * Convert a Zod error to a ValidationError\n */\nfunction zodErrorToValidationError(error: ZodError): ValidationError {\n  const fieldErrors = zodErrorToFieldErrors(error);\n\n  // Create a human-readable message\n  const firstError = error.errors[0];\n  const path = firstError?.path.join(\".\") || \"input\";\n  const message = firstError?.message || \"Validation failed\";",
  "new_string": "/**\n * Convert a Zod error to a ValidationError\n */\nfunction zodErrorToValidationError(error: ZodError): ValidationError {\n  const fieldErrors = zodErrorToFieldErrors(error);\n\n  // Create a human-readable message from the first issue\n  const firstIssue = error.issues[0];\n  const path = firstIssue?.path.join(\".\") || \"input\";\n  const message = firstIssue?.message || \"Validation failed\";"
}

Now let me fix the alert schema issues:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts"
}

The alert schema issues are about how z.enum works with errorMap - it needs 2 arguments. Let me fix that:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts",
  "old_string": "/**\n * Schema for creating a new alert rule\n */\nexport const createAlertRuleSchema = z.object({\n  name: requiredString.pipe(\n    z.string().max(100, \"Name must be 100 characters or less\")\n  ),\n  description: optionalString.pipe(\n    z.string().max(500, \"Description must be 500 characters or less\").nullable()\n  ).optional(),\n  enabled: z.boolean().default(true),\n  triggerType: z.enum(TRIGGER_TYPES, {\n    errorMap: () => ({ message: \"Invalid trigger type\" }),\n  }),\n  appId: optionalUuid.optional(),\n  integrationId: optionalUuid.optional(),\n  conditions: alertConditionsSchema.optional(),\n  severity: z.enum(SEVERITY_LEVELS).default(\"warning\"),\n  channels: alertChannelsSchema.optional(),\n  cooldownMinutes: z.number().int().positive().max(1440).default(15),\n});",
  "new_string": "/**\n * Schema for creating a new alert rule\n */\nexport const createAlertRuleSchema = z.object({\n  name: requiredString.pipe(\n    z.string().max(100, \"Name must be 100 characters or less\")\n  ),\n  description: optionalString.pipe(\n    z.string().max(500, \"Description must be 500 characters or less\").nullable()\n  ).optional(),\n  enabled: z.boolean().default(true),\n  triggerType: z.enum(TRIGGER_TYPES),\n  appId: optionalUuid.optional(),\n  integrationId: optionalUuid.optional(),\n  conditions: alertConditionsSchema.optional(),\n  severity: z.enum(SEVERITY_LEVELS).default(\"warning\"),\n  channels: alertChannelsSchema.optional(),\n  cooldownMinutes: z.number().int().positive().max(1440).default(15),\n});"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts",
  "old_string": "/**\n * Schema for updating notification preferences\n */\nexport const updateNotificationPreferencesSchema = z.object({\n  globalEnabled: z.boolean().optional(),\n  emailEnabled: z.boolean().optional(),\n  emailAddress: z.union([email, z.literal(\"\")]).nullable().optional(),\n  webhookEnabled: z.boolean().optional(),\n  webhookUrl: optionalUrl.optional(),\n  webhookSecret: optionalString.optional(),\n  webhookHeaders: z.record(z.string()).nullable().optional(),\n  inAppEnabled: z.boolean().optional(),\n  inAppSound: z.boolean().optional(),\n  quietHoursEnabled: z.boolean().optional(),\n  quietHoursStart: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  quietHoursEnd: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  timezone: z.string().optional(),\n  digestEnabled: z.boolean().optional(),\n  digestFrequency: z.enum(DIGEST_FREQUENCIES).optional(),\n});",
  "new_string": "/**\n * Schema for updating notification preferences\n */\nexport const updateNotificationPreferencesSchema = z.object({\n  globalEnabled: z.boolean().optional(),\n  emailEnabled: z.boolean().optional(),\n  emailAddress: z.string().email().or(z.literal(\"\")).nullable().optional(),\n  webhookEnabled: z.boolean().optional(),\n  webhookUrl: optionalUrl.optional(),\n  webhookSecret: optionalString.optional(),\n  webhookHeaders: z.record(z.string()).nullable().optional(),\n  inAppEnabled: z.boolean().optional(),\n  inAppSound: z.boolean().optional(),\n  quietHoursEnabled: z.boolean().optional(),\n  quietHoursStart: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  quietHoursEnd: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  timezone: z.string().optional(),\n  digestEnabled: z.boolean().optional(),\n  digestFrequency: z.enum(DIGEST_FREQUENCIES).optional(),\n});"
}

Now let's fix the integration schema:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/integration.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/integration.ts",
  "old_string": "/**\n * Schema for creating a new integration\n */\nexport const createIntegrationSchema = z.object({\n  name: requiredString.pipe(\n    z.string().max(100, \"Name must be 100 characters or less\")\n  ),\n  type: z.enum(INTEGRATION_TYPES, {\n    errorMap: () => ({ message: \"Invalid integration type\" }),\n  }),\n  url: requiredUrl,\n  apiKey: optionalString,\n  username: optionalString,\n  password: optionalString,\n  allowInsecure: z.boolean().default(false),\n  enabled: z.boolean().default(true),\n});",
  "new_string": "/**\n * Schema for creating a new integration\n */\nexport const createIntegrationSchema = z.object({\n  name: requiredString.pipe(\n    z.string().max(100, \"Name must be 100 characters or less\")\n  ),\n  type: z.enum(INTEGRATION_TYPES),\n  url: requiredUrl,\n  apiKey: optionalString,\n  username: optionalString,\n  password: optionalString,\n  allowInsecure: z.boolean().default(false),\n  enabled: z.boolean().default(true),\n});"
}

Now let's check the errors again:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(apps\\.server|validation|lib/server/)\" | head -30 || echo \"No validation-related errors found\"",
  "description": "Check for validation-related errors",
  "timeout": 120000
}

The errors in `apps.server.ts` are related to a pre-existing issue with reorderApps function. The validation-related files are mostly clean now. Let me check specifically for our validation files:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"validation\" | head -30 || echo \"No validation errors\"",
  "description": "Check validation-specific errors",
  "timeout": 120000
}

Let me check the Zod version and fix these issues:

🔧 Tool: Bash
Input: {
  "command": "cat /home/default/Desktop/dev/app-map-appahouse/node_modules/zod/package.json | grep version",
  "description": "Check Zod version"
}

We have Zod v4, which might have some API differences. Let me update the alert schema to fix the issues:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts",
  "offset": 45,
  "limit": 30
}

The issues are in the `z.record(z.string())` usage - in Zod v4 it requires two arguments. Let me fix the alert schema:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts",
  "old_string": "import { z } from \"zod\";\nimport { uuid, optionalUuid, requiredString, optionalString, email, optionalUrl } from \"./common\";",
  "new_string": "import { z } from \"zod\";\nimport { uuid, optionalUuid, requiredString, optionalString, optionalUrl } from \"./common\";"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts",
  "old_string": "export const alertChannelsSchema = z.object({\n  inApp: z.boolean().optional(),\n  email: z.boolean().optional(),\n  webhook: z.object({\n    url: z.string().url(),\n    headers: z.record(z.string()).optional(),\n  }).optional(),\n  integration: z.object({\n    id: z.string().uuid(),\n    type: z.string(),\n  }).optional(),\n}).default({ inApp: true });",
  "new_string": "export const alertChannelsSchema = z.object({\n  inApp: z.boolean().optional(),\n  email: z.boolean().optional(),\n  webhook: z.object({\n    url: z.string().url(),\n    headers: z.record(z.string(), z.string()).optional(),\n  }).optional(),\n  integration: z.object({\n    id: z.string().uuid(),\n    type: z.string(),\n  }).optional(),\n}).default({ inApp: true });"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts",
  "old_string": "export const updateNotificationPreferencesSchema = z.object({\n  globalEnabled: z.boolean().optional(),\n  emailEnabled: z.boolean().optional(),\n  emailAddress: z.string().email().or(z.literal(\"\")).nullable().optional(),\n  webhookEnabled: z.boolean().optional(),\n  webhookUrl: optionalUrl.optional(),\n  webhookSecret: optionalString.optional(),\n  webhookHeaders: z.record(z.string()).nullable().optional(),\n  inAppEnabled: z.boolean().optional(),\n  inAppSound: z.boolean().optional(),\n  quietHoursEnabled: z.boolean().optional(),\n  quietHoursStart: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  quietHoursEnd: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  timezone: z.string().optional(),\n  digestEnabled: z.boolean().optional(),\n  digestFrequency: z.enum(DIGEST_FREQUENCIES).optional(),\n});",
  "new_string": "export const updateNotificationPreferencesSchema = z.object({\n  globalEnabled: z.boolean().optional(),\n  emailEnabled: z.boolean().optional(),\n  emailAddress: z.string().email().or(z.literal(\"\")).nullable().optional(),\n  webhookEnabled: z.boolean().optional(),\n  webhookUrl: optionalUrl.optional(),\n  webhookSecret: optionalString.optional(),\n  webhookHeaders: z.record(z.string(), z.string()).nullable().optional(),\n  inAppEnabled: z.boolean().optional(),\n  inAppSound: z.boolean().optional(),\n  quietHoursEnabled: z.boolean().optional(),\n  quietHoursStart: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  quietHoursEnd: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, \"Must be in HH:MM format\").nullable().optional(),\n  timezone: z.string().optional(),\n  digestEnabled: z.boolean().optional(),\n  digestFrequency: z.enum(DIGEST_FREQUENCIES).optional(),\n});"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/alert.ts",
  "old_string": "/**\n * Schema for testing webhook\n */\nexport const testWebhookSchema = z.object({\n  webhookUrl: z.string().url(\"Must be a valid URL\"),\n  webhookSecret: z.string().optional(),\n  webhookHeaders: z.record(z.string()).optional(),\n});",
  "new_string": "/**\n * Schema for testing webhook\n */\nexport const testWebhookSchema = z.object({\n  webhookUrl: z.string().url(\"Must be a valid URL\"),\n  webhookSecret: z.string().optional(),\n  webhookHeaders: z.record(z.string(), z.string()).optional(),\n});"
}

Now let's check again:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"validation\" | head -30 || echo \"No validation errors\"",
  "description": "Check validation-specific errors",
  "timeout": 120000
}

No validation errors! Let me also check for errors in apps.server.ts:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"apps\\.server\" | head -10 || echo \"No apps.server errors\"",
  "description": "Check apps.server errors",
  "timeout": 120000
}

This is a pre-existing error in the reorderApps function (not related to our changes). Let me run the tests to make sure everything works:

🔧 Tool: Bash
Input: {
  "command": "npm test 2>&1 | tail -30",
  "description": "Run tests",
  "timeout": 180000
}

No tests exist in the project. Let me update the todo list and complete the implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing codebase structure and understand current validation patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and validation patterns"
    },
    {
      "content": "Plan validation middleware implementation approach",
      "status": "completed",
      "activeForm": "Planning validation middleware implementation"
    },
    {
      "content": "Install zod as schema validation library",
      "status": "completed",
      "activeForm": "Installing zod package"
    },
    {
      "content": "Create validation schema definitions for apps",
      "status": "completed",
      "activeForm": "Creating validation schemas for apps"
    },
    {
      "content": "Create validation middleware/helper function",
      "status": "completed",
      "activeForm": "Creating validation middleware"
    },
    {
      "content": "Integrate validation with existing server mutations",
      "status": "completed",
      "activeForm": "Integrating validation with mutations"
    },
    {
      "content": "Create validation schemas for other entities (categories, tags, etc.)",
      "status": "completed",
      "activeForm": "Creating additional validation schemas"
    }
  ]
}

Let me verify the implementation by checking that all the files are in place:

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/lib/validation/",
  "description": "List validation directory"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/lib/validation/schemas/",
  "description": "List schemas directory"
}

All files are in place. Let me create a simple example test file to show how the validation works:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/validation/README.md",
  "content": "# Validation Module\n\nThis module provides standardized input validation for form mutations using Zod schemas.\n\n## Features\n\n- **Server-side validation**: Validate data in server functions before processing\n- **Client-side form validation**: Reuse schemas with react-hook-form\n- **Type inference**: Get TypeScript types from schemas\n- **Consistent error handling**: Integration with the existing `ValidationError` system\n\n## Usage\n\n### Server-side Validation\n\n```typescript\nimport { validateInput } from \"@/lib/validation\";\nimport { createAppSchema } from \"@/lib/validation/schemas/app\";\nimport { createServerFn } from \"@tanstack/react-start\";\n\nexport const createApp = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: unknown }) => {\n    // Validate input - throws ValidationError if invalid\n    const validData = validateInput(createAppSchema, ctx.data);\n\n    // validData is now typed as CreateAppInput\n    const { name, description, tagIds, ...rest } = validData;\n\n    // ... rest of handler\n  }\n);\n```\n\n### Using the withValidation Wrapper\n\n```typescript\nimport { withValidation } from \"@/lib/validation\";\nimport { createAppSchema } from \"@/lib/validation/schemas/app\";\n\nexport const createApp = createServerFn({ method: \"POST\" }).handler(\n  withValidation(createAppSchema, async (validData, ctx) => {\n    // validData is already validated and typed\n    // ... handler code\n  })\n);\n```\n\n### Combined with Authentication\n\n```typescript\nimport { withValidationAndAuth } from \"@/lib/validation\";\nimport { createAppSchema } from \"@/lib/validation/schemas/app\";\n\nexport const createApp = createServerFn({ method: \"POST\" }).handler(\n  withValidationAndAuth(createAppSchema, async (session, validData) => {\n    // Both authentication and validation handled\n    const userId = session.user.id;\n    // ... handler code\n  })\n);\n```\n\n### Client-side Form Validation with react-hook-form\n\n```tsx\nimport { useForm } from \"react-hook-form\";\nimport { zodResolver } from \"@hookform/resolvers/zod\";\nimport { createAppSchema, type CreateAppInput } from \"@/lib/validation\";\n\nfunction AppForm() {\n  const form = useForm<CreateAppInput>({\n    resolver: zodResolver(createAppSchema),\n    defaultValues: {\n      name: \"\",\n      description: \"\",\n      // ...\n    },\n  });\n\n  // ... form implementation\n}\n```\n\n## Available Schemas\n\n### App Schemas\n- `createAppSchema` - Create a new app\n- `updateAppSchema` - Update an existing app\n- `deleteAppSchema` - Delete an app\n- `pinAppSchema` - Pin/unpin an app\n- `bulkDeleteAppsSchema` - Bulk delete apps\n- `bulkUpdateCategorySchema` - Bulk update category\n- `bulkToggleHealthCheckSchema` - Bulk toggle health check\n\n### Category Schemas\n- `createCategorySchema` - Create a new category\n- `updateCategorySchema` - Update a category\n- `deleteCategorySchema` - Delete a category\n\n### Integration Schemas\n- `createIntegrationSchema` - Create a new integration\n- `updateIntegrationSchema` - Update an integration\n- `deleteIntegrationSchema` - Delete an integration\n- `testIntegrationSchema` - Test integration connection\n\n### Alert Schemas\n- `createAlertRuleSchema` - Create an alert rule\n- `updateAlertRuleSchema` - Update an alert rule\n- `deleteAlertRuleSchema` - Delete an alert rule\n- `updateNotificationPreferencesSchema` - Update notification preferences\n\n## Common Field Schemas\n\nReusable field validators in `@/lib/validation/schemas/common`:\n\n- `uuid` - UUID validation\n- `requiredString` - Non-empty trimmed string\n- `optionalString` - Optional string (empty becomes null)\n- `optionalUrl` - Optional URL validation\n- `requiredUrl` - Required URL validation\n- `optionalUuid` - Optional UUID (empty becomes null)\n- `optionalColor` - Hex color validation\n- `email` - Email validation\n- `slug` - URL-friendly slug validation\n\n## Error Handling\n\nWhen validation fails, a `ValidationError` is thrown with:\n\n- `message` - Human-readable error message\n- `code` - `ErrorCode.VALIDATION_ERROR`\n- `fieldErrors` - Map of field names to error messages\n\n```typescript\ntry {\n  const data = validateInput(schema, input);\n} catch (error) {\n  if (error instanceof ValidationError) {\n    console.log(error.message); // \"name: This field is required\"\n    console.log(error.fieldErrors); // { name: [\"This field is required\"] }\n  }\n}\n```\n"
}

<summary>
## Summary: Standardize input validation for form mutations

### Changes Implemented
- Installed Zod v4 as the schema validation library (works with existing @hookform/resolvers)
- Created a comprehensive validation module at `src/lib/validation/` with:
  - **Middleware functions** for validating server function inputs (`validateInput`, `withValidation`, `withValidationAndAuth`, etc.)
  - **Reusable field schemas** for common validation patterns (UUIDs, URLs, emails, colors, etc.)
  - **Entity-specific schemas** for apps, categories, integrations, and alerts
  - **Type exports** for TypeScript inference from schemas
- Integrated validation with the existing error handling system (`ValidationError` class)
- Updated `apps.server.ts` to use schema validation for all mutation operations:
  - `getApp` - validates ID parameter
  - `createApp` - validates all app creation data
  - `updateApp` - validates update data with ID
  - `deleteApp` - validates ID parameter
  - `pinApp` - validates ID and pinned state
  - All bulk operations (`bulkDeleteApps`, `bulkUpdateCategory`, `bulkToggleHealthCheck`, `bulkExportApps`, `bulkUpdateTags`, `refreshAppIcons`, `updateAppOrder`)

### Files Modified
- `package.json` - Added zod dependency

### Files Created
- `src/lib/validation/index.ts` - Main export point
- `src/lib/validation/middleware.ts` - Validation utilities and wrappers
- `src/lib/validation/schemas/index.ts` - Schema exports
- `src/lib/validation/schemas/common.ts` - Reusable field schemas
- `src/lib/validation/schemas/app.ts` - App validation schemas
- `src/lib/validation/schemas/category.ts` - Category validation schemas
- `src/lib/validation/schemas/integration.ts` - Integration validation schemas
- `src/lib/validation/schemas/alert.ts` - Alert validation schemas
- `src/lib/validation/README.md` - Documentation

### Notes for Developer
1. **Client-side usage**: The schemas can be used with react-hook-form via `zodResolver(schema)` for consistent client-server validation
2. **Gradual adoption**: Other server files (categories, integrations, alerts) can be updated to use validation in the same pattern as apps.server.ts
3. **Type safety**: All input types are inferred from schemas (e.g., `CreateAppInput`, `UpdateAppInput`)
4. **Error handling**: Validation errors are converted to `ValidationError` with field-level error messages, compatible with the existing error system
5. **Zod v4**: The project now uses Zod v4, which has some API differences (e.g., `z.record(keySchema, valueSchema)` requires two arguments)
</summary>