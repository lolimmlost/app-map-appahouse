/**
 * App Repository
 *
 * Provides data access operations for apps with:
 * - Category and tag relations
 * - Health check settings management
 * - Bulk operations for batch processing
 * - Ordering and pinning support
 */

import { eq, and, asc, desc, inArray, isNotNull } from "drizzle-orm";
import { BaseRepository, type DatabaseInstance } from "./BaseRepository";
import type { App, NewApp, Tag } from "@/database/schema/apps";
import type { Category } from "@/database/schema/categories";
import type { GranularPermissions } from "@/types/database";

// App with relations
export interface AppWithRelations extends App {
  category: Category | null;
  tags: Tag[];
}

// App with full ownership info
export interface AppWithPermissions extends AppWithRelations {
  isOwner: boolean;
  permissions: GranularPermissions;
  sharedBy?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  shareId?: string;
  sharedViaCategory?: boolean;
}

// Fields that affect health check behavior
const HEALTH_CHECK_FIELDS = [
  "healthCheckEnabled",
  "healthCheckType",
  "healthCheckUrl",
  "healthCheckTTL",
  "localUrl",
  "remoteUrl",
  "uptimeKumaMonitorId",
] as const;

export class AppRepository extends BaseRepository<any, App, NewApp> {
  constructor() {
    // Lazy initialization - table will be set on first use
    super(null as any);
  }

  private async getTable() {
    const { apps } = await import("@/database/schema");
    return apps;
  }

  private async getAppTagsTable() {
    const { appTags } = await import("@/database/schema");
    return appTags;
  }

  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  /**
   * Get all apps for a user with category and tags
   */
  async findAllWithRelations(userId: string): Promise<AppWithRelations[]> {
    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const result = await db.query.apps.findMany({
      where: eq(apps.userId, userId),
      orderBy: [asc(apps.sortOrder), asc(apps.name)],
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return result.map((app) => ({
      ...app,
      tags: app.tags.map((t) => t.tag),
    }));
  }

  /**
   * Get a single app by ID with relations
   */
  async findByIdWithRelations(id: string, userId: string): Promise<AppWithRelations | null> {
    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, id), eq(apps.userId, userId)),
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!app) return null;

    return {
      ...app,
      tags: app.tags.map((t) => t.tag),
    };
  }

  /**
   * Get pinned apps for a user
   */
  async findPinned(userId: string): Promise<App[]> {
    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    return db.query.apps.findMany({
      where: and(eq(apps.userId, userId), eq(apps.pinned, true)),
      orderBy: [asc(apps.sortOrder), asc(apps.name)],
      with: {
        category: true,
      },
    });
  }

  /**
   * Get apps in a specific category
   */
  async findByCategory(categoryId: string, userId: string): Promise<AppWithRelations[]> {
    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const result = await db.query.apps.findMany({
      where: and(eq(apps.categoryId, categoryId), eq(apps.userId, userId)),
      orderBy: [asc(apps.sortOrder), asc(apps.name)],
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return result.map((app) => ({
      ...app,
      tags: app.tags.map((t) => t.tag),
    }));
  }

  /**
   * Get apps in multiple categories
   */
  async findByCategoryIds(categoryIds: string[]): Promise<AppWithRelations[]> {
    if (categoryIds.length === 0) return [];

    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const result = await db.query.apps.findMany({
      where: inArray(apps.categoryId, categoryIds),
      orderBy: [asc(apps.sortOrder), asc(apps.name)],
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return result.map((app) => ({
      ...app,
      tags: app.tags.map((t) => t.tag),
    }));
  }

  /**
   * Create an app with optional tags
   */
  async createWithTags(
    data: Omit<NewApp, "id" | "userId" | "createdAt" | "updatedAt"> & { userId: string; tagIds?: string[] }
  ): Promise<App> {
    const db = await this.getDb();
    const { apps, appTags } = await import("@/database/schema");

    const { tagIds, ...appData } = data;

    const [newApp] = await db
      .insert(apps)
      .values(appData)
      .returning();

    if (tagIds?.length) {
      await db.insert(appTags).values(
        tagIds.map((tagId) => ({
          appId: newApp.id,
          tagId,
        }))
      );
    }

    return newApp;
  }

  /**
   * Update an app with optional tag replacement
   */
  async updateWithTags(
    id: string,
    userId: string,
    data: Partial<Omit<NewApp, "id" | "userId">> & { tagIds?: string[] }
  ): Promise<{ app: App | null; healthCheckSettingsChanged: boolean }> {
    const db = await this.getDb();
    const { apps, appTags } = await import("@/database/schema");

    const { tagIds, ...updateData } = data;

    // Check if health check settings changed
    const healthCheckSettingsChanged = HEALTH_CHECK_FIELDS.some(
      (field) => field in updateData
    );

    const [updatedApp] = await db
      .update(apps)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(apps.id, id), eq(apps.userId, userId)))
      .returning();

    if (!updatedApp) {
      return { app: null, healthCheckSettingsChanged: false };
    }

    if (tagIds !== undefined) {
      await db.delete(appTags).where(eq(appTags.appId, id));
      if (tagIds.length) {
        await db.insert(appTags).values(
          tagIds.map((tagId) => ({
            appId: id,
            tagId,
          }))
        );
      }
    }

    return { app: updatedApp, healthCheckSettingsChanged };
  }

  /**
   * Delete an app (cascades to tags via FK)
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const result = await db
      .delete(apps)
      .where(and(eq(apps.id, id), eq(apps.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Bulk delete apps
   */
  async bulkDelete(ids: string[], userId: string): Promise<number> {
    if (ids.length === 0) return 0;

    const db = await this.getDb();
    const { apps, appTags } = await import("@/database/schema");

    // Delete app tags first
    await db.delete(appTags).where(inArray(appTags.appId, ids));

    // Then delete apps
    const result = await db
      .delete(apps)
      .where(and(inArray(apps.id, ids), eq(apps.userId, userId)))
      .returning();

    return result.length;
  }

  /**
   * Update the category for multiple apps
   */
  async bulkUpdateCategory(ids: string[], userId: string, categoryId: string | null): Promise<number> {
    if (ids.length === 0) return 0;

    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const result = await db
      .update(apps)
      .set({ categoryId, updatedAt: new Date() })
      .where(and(inArray(apps.id, ids), eq(apps.userId, userId)))
      .returning();

    return result.length;
  }

  /**
   * Update health check enabled status for multiple apps
   */
  async bulkToggleHealthCheck(ids: string[], userId: string, enabled: boolean): Promise<number> {
    if (ids.length === 0) return 0;

    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const result = await db
      .update(apps)
      .set({ healthCheckEnabled: enabled, updatedAt: new Date() })
      .where(and(inArray(apps.id, ids), eq(apps.userId, userId)))
      .returning();

    return result.length;
  }

  /**
   * Update sort order for multiple apps
   */
  async updateSortOrder(orderedIds: string[], userId: string): Promise<number> {
    if (orderedIds.length === 0) return 0;

    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const now = new Date();

    await db.transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          tx
            .update(apps)
            .set({ sortOrder: index, updatedAt: now })
            .where(and(eq(apps.id, id), eq(apps.userId, userId)))
        )
      );
    });

    return orderedIds.length;
  }

  /**
   * Update pinned status for an app
   */
  async updatePinned(id: string, userId: string, pinned: boolean): Promise<App | null> {
    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const [updated] = await db
      .update(apps)
      .set({ pinned, updatedAt: new Date() })
      .where(and(eq(apps.id, id), eq(apps.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Update icon for an app
   */
  async updateIcon(id: string, userId: string, icon: string): Promise<App | null> {
    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const [updated] = await db
      .update(apps)
      .set({ icon, updatedAt: new Date() })
      .where(and(eq(apps.id, id), eq(apps.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Get apps with export data format
   */
  async findManyForExport(ids: string[], userId: string): Promise<AppWithRelations[]> {
    if (ids.length === 0) return [];

    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    const result = await db.query.apps.findMany({
      where: and(inArray(apps.id, ids), eq(apps.userId, userId)),
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return result.map((app) => ({
      ...app,
      tags: app.tags.map((t) => t.tag),
    }));
  }

  /**
   * Bulk update tags for apps
   */
  async bulkUpdateTags(
    ids: string[],
    userId: string,
    tagIds: string[],
    mode: "replace" | "append"
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const db = await this.getDb();
    const { apps, appTags } = await import("@/database/schema");

    // Verify apps belong to user
    const userApps = await db.query.apps.findMany({
      where: and(inArray(apps.id, ids), eq(apps.userId, userId)),
    });
    const validIds = userApps.map((a) => a.id);
    if (validIds.length === 0) return 0;

    if (mode === "replace") {
      await db.delete(appTags).where(inArray(appTags.appId, validIds));
    }

    if (tagIds.length > 0) {
      const newTagRelations: { appId: string; tagId: string }[] = [];
      for (const appId of validIds) {
        for (const tagId of tagIds) {
          newTagRelations.push({ appId, tagId });
        }
      }

      if (mode === "append") {
        const existingTags = await db.query.appTags.findMany({
          where: inArray(appTags.appId, validIds),
        });
        const existingSet = new Set(existingTags.map((t) => `${t.appId}:${t.tagId}`));
        const toInsert = newTagRelations.filter((r) => !existingSet.has(`${r.appId}:${r.tagId}`));
        if (toInsert.length > 0) {
          await db.insert(appTags).values(toInsert);
        }
      } else {
        await db.insert(appTags).values(newTagRelations);
      }
    }

    // Update the updatedAt timestamp
    await db
      .update(apps)
      .set({ updatedAt: new Date() })
      .where(inArray(apps.id, validIds));

    return validIds.length;
  }

  /**
   * Get apps with health check enabled
   */
  async findWithHealthCheckEnabled(userId: string): Promise<App[]> {
    const db = await this.getDb();
    const { apps } = await import("@/database/schema");

    return db.query.apps.findMany({
      where: and(eq(apps.userId, userId), eq(apps.healthCheckEnabled, true)),
    });
  }
}

// Singleton instance
let appRepository: AppRepository | null = null;

export function getAppRepository(): AppRepository {
  if (!appRepository) {
    appRepository = new AppRepository();
  }
  return appRepository;
}
