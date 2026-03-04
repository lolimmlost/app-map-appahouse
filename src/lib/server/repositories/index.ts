/**
 * Repository Layer
 *
 * This module provides a data access layer that encapsulates
 * database queries and operations for all entities.
 *
 * Benefits:
 * - Centralized query logic
 * - Automatic userId filtering for multi-tenant isolation
 * - Type-safe operations with Drizzle ORM
 * - Easy to test and mock
 * - Consistent patterns across all entities
 *
 * Usage:
 * ```typescript
 * import { getAppRepository } from "@/lib/server/repositories";
 *
 * const appRepo = getAppRepository();
 * const apps = await appRepo.findAllWithRelations(userId);
 * ```
 */

// Base repository
export { BaseRepository, type DatabaseInstance, type FindManyOptions, type FindFirstOptions } from "./BaseRepository";

// Entity repositories
export { AppRepository, getAppRepository, type AppWithRelations, type AppWithPermissions } from "./AppRepository";
export {
  AlertRepository,
  getAlertRepository,
  type AlertRuleWithRelations,
  type AlertHistoryWithRelations,
} from "./AlertRepository";
export { CategoryRepository, getCategoryRepository } from "./CategoryRepository";
export { IntegrationRepository, getIntegrationRepository } from "./IntegrationRepository";
export { TagRepository, getTagRepository } from "./TagRepository";
export { WidgetRepository, getWidgetRepository, type WidgetWithRelations } from "./WidgetRepository";
export { SavedViewRepository, getSavedViewRepository } from "./SavedViewRepository";
export {
  UserSettingsRepository,
  getUserSettingsRepository,
  type UserSettings,
  type NewUserSettings,
} from "./UserSettingsRepository";

/**
 * Get all repositories as a single object
 * Useful for dependency injection or testing
 */
export function getRepositories() {
  return {
    apps: getAppRepository(),
    alerts: getAlertRepository(),
    categories: getCategoryRepository(),
    integrations: getIntegrationRepository(),
    tags: getTagRepository(),
    widgets: getWidgetRepository(),
    savedViews: getSavedViewRepository(),
    userSettings: getUserSettingsRepository(),
  };
}

export type Repositories = ReturnType<typeof getRepositories>;
