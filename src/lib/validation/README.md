# Validation Module

This module provides standardized input validation for form mutations using Zod schemas.

## Features

- **Server-side validation**: Validate data in server functions before processing
- **Client-side form validation**: Reuse schemas with react-hook-form
- **Type inference**: Get TypeScript types from schemas
- **Consistent error handling**: Integration with the existing `ValidationError` system

## Usage

### Server-side Validation

```typescript
import { validateInput } from "@/lib/validation";
import { createAppSchema } from "@/lib/validation/schemas/app";
import { createServerFn } from "@tanstack/react-start";

export const createApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: unknown }) => {
    // Validate input - throws ValidationError if invalid
    const validData = validateInput(createAppSchema, ctx.data);

    // validData is now typed as CreateAppInput
    const { name, description, tagIds, ...rest } = validData;

    // ... rest of handler
  }
);
```

### Using the withValidation Wrapper

```typescript
import { withValidation } from "@/lib/validation";
import { createAppSchema } from "@/lib/validation/schemas/app";

export const createApp = createServerFn({ method: "POST" }).handler(
  withValidation(createAppSchema, async (validData, ctx) => {
    // validData is already validated and typed
    // ... handler code
  })
);
```

### Combined with Authentication

```typescript
import { withValidationAndAuth } from "@/lib/validation";
import { createAppSchema } from "@/lib/validation/schemas/app";

export const createApp = createServerFn({ method: "POST" }).handler(
  withValidationAndAuth(createAppSchema, async (session, validData) => {
    // Both authentication and validation handled
    const userId = session.user.id;
    // ... handler code
  })
);
```

### Client-side Form Validation with react-hook-form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAppSchema, type CreateAppInput } from "@/lib/validation";

function AppForm() {
  const form = useForm<CreateAppInput>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      name: "",
      description: "",
      // ...
    },
  });

  // ... form implementation
}
```

## Available Schemas

### App Schemas
- `createAppSchema` - Create a new app
- `updateAppSchema` - Update an existing app
- `deleteAppSchema` - Delete an app
- `pinAppSchema` - Pin/unpin an app
- `bulkDeleteAppsSchema` - Bulk delete apps
- `bulkUpdateCategorySchema` - Bulk update category
- `bulkToggleHealthCheckSchema` - Bulk toggle health check

### Category Schemas
- `createCategorySchema` - Create a new category
- `updateCategorySchema` - Update a category
- `deleteCategorySchema` - Delete a category

### Integration Schemas
- `createIntegrationSchema` - Create a new integration
- `updateIntegrationSchema` - Update an integration
- `deleteIntegrationSchema` - Delete an integration
- `testIntegrationSchema` - Test integration connection

### Alert Schemas
- `createAlertRuleSchema` - Create an alert rule
- `updateAlertRuleSchema` - Update an alert rule
- `deleteAlertRuleSchema` - Delete an alert rule
- `updateNotificationPreferencesSchema` - Update notification preferences

## Common Field Schemas

Reusable field validators in `@/lib/validation/schemas/common`:

- `uuid` - UUID validation
- `requiredString` - Non-empty trimmed string
- `optionalString` - Optional string (empty becomes null)
- `optionalUrl` - Optional URL validation
- `requiredUrl` - Required URL validation
- `optionalUuid` - Optional UUID (empty becomes null)
- `optionalColor` - Hex color validation
- `email` - Email validation
- `slug` - URL-friendly slug validation

## Error Handling

When validation fails, a `ValidationError` is thrown with:

- `message` - Human-readable error message
- `code` - `ErrorCode.VALIDATION_ERROR`
- `fieldErrors` - Map of field names to error messages

```typescript
try {
  const data = validateInput(schema, input);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.message); // "name: This field is required"
    console.log(error.fieldErrors); // { name: ["This field is required"] }
  }
}
```
