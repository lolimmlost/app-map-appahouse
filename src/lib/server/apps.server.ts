import { createServerFn } from "@tanstack/react-start";
import type { NewApp, GranularPermissions } from "@/types/database";

// Fields that affect health check behavior and should trigger cache invalidation
const HEALTH_CHECK_FIELDS = [
  "healthCheckEnabled",
  "healthCheckType",
  "healthCheckUrl",
  "healthCheckTTL",
  "localUrl",
  "remoteUrl",
  "uptimeKumaMonitorId",
] as const;

export const getApps = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, and, asc, inArray, isNotNull } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { apps, appShares } = await import("@/database/schema");

  const db = await getDb();

  const session = await getOptionalSession();
  if (!session) return { apps: [], sharedApps: [] };

  // Get user's own apps
  const userApps = await db.query.apps.findMany({
    where: eq(apps.userId, session.user.id),
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

  // Get apps shared with this user
  const shares = await db.query.appShares.findMany({
    where: and(
      eq(appShares.sharedWithId, session.user.id),
      isNotNull(appShares.appId)
    ),
    with: {
      app: {
        with: {
          category: true,
          tags: {
            with: {
              tag: true,
            },
          },
        },
      },
      owner: true,
    },
  });

  // Get apps shared via category
  const categoryShares = await db.query.appShares.findMany({
    where: and(
      eq(appShares.sharedWithId, session.user.id),
      isNotNull(appShares.categoryId)
    ),
  });

  // Get apps from shared categories
  let categorySharedApps: typeof userApps = [];
  if (categoryShares.length > 0) {
    const sharedCategoryIds = categoryShares.map(s => s.categoryId).filter(Boolean) as string[];
    categorySharedApps = await db.query.apps.findMany({
      where: inArray(apps.categoryId, sharedCategoryIds),
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
  }

  // Create a map of category shares for permission lookup
  const categoryShareMap = new Map(
    categoryShares.map(s => [s.categoryId, s])
  );

  return {
    apps: userApps.map((app) => ({
      ...app,
      tags: app.tags.map((t) => t.tag),
      isOwner: true,
      permissions: {
        canView: true,
        canEdit: true,
        canSeeHealth: true,
        canAccessRemoteUrl: true,
        canAccessLocalUrl: true,
        canDelete: true,
      } as GranularPermissions,
    })),
    sharedApps: [
      // Direct app shares
      ...shares
        .filter(s => s.app)
        .map((share) => ({
          ...share.app!,
          tags: share.app!.tags.map((t) => t.tag),
          isOwner: false,
          sharedBy: {
            id: share.owner.id,
            name: share.owner.name,
            email: share.owner.email,
            image: share.owner.image,
          },
          shareId: share.id,
          permissions: {
            canView: share.canView,
            canEdit: share.canEdit,
            canSeeHealth: share.canSeeHealth,
            canAccessRemoteUrl: share.canAccessRemoteUrl,
            canAccessLocalUrl: share.canAccessLocalUrl,
            canDelete: share.canDelete,
          } as GranularPermissions,
        })),
      // Category-based shares
      ...categorySharedApps.map((app) => {
        const categoryShare = categoryShareMap.get(app.categoryId);
        return {
          ...app,
          tags: app.tags.map((t) => t.tag),
          isOwner: false,
          sharedViaCategory: true,
          shareId: categoryShare?.id,
          permissions: categoryShare ? {
            canView: categoryShare.canView,
            canEdit: categoryShare.canEdit,
            canSeeHealth: categoryShare.canSeeHealth,
            canAccessRemoteUrl: categoryShare.canAccessRemoteUrl,
            canAccessLocalUrl: categoryShare.canAccessLocalUrl,
            canDelete: categoryShare.canDelete,
          } as GranularPermissions : {
            canView: true,
            canEdit: false,
            canSeeHealth: false,
            canAccessRemoteUrl: false,
            canAccessLocalUrl: false,
            canDelete: false,
          } as GranularPermissions,
        };
      }),
    ],
  };
});

export const getApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, ctx.data.id), eq(apps.userId, session.user.id)),
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!app) throw new Error("App not found");

    return {
      ...app,
      tags: app.tags.map((t) => t.tag),
    };
  }
);

type CreateAppData = {
  data: Omit<NewApp, "id" | "userId" | "createdAt" | "updatedAt"> & { tagIds?: string[] };
};

export const createApp = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateAppData) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps, appTags } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { tagIds, ...appData } = ctx.data;

    const [newApp] = await db
      .insert(apps)
      .values({
        ...appData,
        userId: session.user.id,
      })
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
);

type UpdateAppData = {
  data: { id: string } & Partial<Omit<NewApp, "id" | "userId">> & { tagIds?: string[] };
};

export const updateApp = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateAppData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { invalidateAppCache } = await import("./health-cache.server");
    const { apps, appTags } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { id, tagIds, ...updateData } = ctx.data;

    // Check if any health check related fields are being updated
    const shouldInvalidateCache = HEALTH_CHECK_FIELDS.some(
      (field) => field in updateData
    );

    const [updatedApp] = await db
      .update(apps)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(apps.id, id), eq(apps.userId, session.user.id)))
      .returning();

    if (!updatedApp) throw new Error("App not found");

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

    // Invalidate health cache if health check settings changed
    if (shouldInvalidateCache) {
      await invalidateAppCache(id, session.user.id);
    }

    return updatedApp;
  }
);

export const deleteApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    await db.delete(apps).where(and(eq(apps.id, ctx.data.id), eq(apps.userId, session.user.id)));

    return { success: true };
  }
);

export const reorderApps = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string; sortOrder: number }[] }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    if (!ctx.data.length) return { success: true };

    // Batch update using a transaction for better performance
    await db.transaction(async (tx) => {
      await Promise.all(
        ctx.data.map(({ id, sortOrder }) =>
          tx
            .update(apps)
            .set({ sortOrder })
            .where(and(eq(apps.id, id), eq(apps.userId, session.user.id)))
        )
      );
    });

    return { success: true };
  }
);

export const pinApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string; pinned: boolean } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const [updatedApp] = await db
      .update(apps)
      .set({ pinned: ctx.data.pinned, updatedAt: new Date() })
      .where(and(eq(apps.id, ctx.data.id), eq(apps.userId, session.user.id)))
      .returning();

    if (!updatedApp) throw new Error("App not found");

    return updatedApp;
  }
);

export const getPinnedApps = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, and, asc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { apps } = await import("@/database/schema");

  const db = await getDb();

  const session = await getOptionalSession();
  if (!session) return { apps: [] };

  const pinnedApps = await db.query.apps.findMany({
    where: and(eq(apps.userId, session.user.id), eq(apps.pinned, true)),
    orderBy: [asc(apps.sortOrder), asc(apps.name)],
    with: {
      category: true,
    },
  });

  return { apps: pinnedApps };
});

// Bulk delete apps
export const bulkDeleteApps = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[] } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps, appTags } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { ids } = ctx.data;
    if (!ids.length) return { deleted: 0 };

    // First delete app tags
    await db.delete(appTags).where(inArray(appTags.appId, ids));

    // Then delete apps (only those belonging to this user)
    await db
      .delete(apps)
      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));

    return { deleted: ids.length };
  }
);

// Bulk update category
export const bulkUpdateCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[]; categoryId: string | null } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { ids, categoryId } = ctx.data;
    if (!ids.length) return { updated: 0 };

    await db
      .update(apps)
      .set({ categoryId, updatedAt: new Date() })
      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));

    return { updated: ids.length };
  }
);

// Bulk toggle health check
export const bulkToggleHealthCheck = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[]; enabled: boolean } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { invalidateMultipleAppCaches } = await import("./health-cache.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { ids, enabled } = ctx.data;
    if (!ids.length) return { updated: 0 };

    await db
      .update(apps)
      .set({ healthCheckEnabled: enabled, updatedAt: new Date() })
      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));

    // Invalidate health cache for all affected apps
    await invalidateMultipleAppCaches(ids, session.user.id);

    return { updated: ids.length };
  }
);

// Refresh icons for apps (detect icons based on name)
export const refreshAppIcons = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[] } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { getIconUrl } = await import("./icons.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { ids } = ctx.data;
    if (!ids.length) return { updated: 0, icons: [] };

    // Get the apps to refresh
    const appsToRefresh = await db.query.apps.findMany({
      where: and(inArray(apps.id, ids), eq(apps.userId, session.user.id)),
    });

    const updatedIcons: { id: string; name: string; icon: string | null }[] = [];

    for (const app of appsToRefresh) {
      const iconUrl = getIconUrl(app.name);
      if (iconUrl) {
        await db
          .update(apps)
          .set({ icon: iconUrl, updatedAt: new Date() })
          .where(eq(apps.id, app.id));
        updatedIcons.push({ id: app.id, name: app.name, icon: iconUrl });
      }
    }

    return { updated: updatedIcons.length, icons: updatedIcons };
  }
);

// Update app sort order (for drag and drop reordering)
export const updateAppOrder = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { orderedIds: string[] } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { orderedIds } = ctx.data;
    if (!orderedIds.length) return { updated: 0 };

    const now = new Date();

    // Batch update using a transaction for better performance
    await db.transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          tx
            .update(apps)
            .set({ sortOrder: index, updatedAt: now })
            .where(and(eq(apps.id, id), eq(apps.userId, session.user.id)))
        )
      );
    });

    return { updated: orderedIds.length };
  }
);

// Bulk export apps as JSON
export const bulkExportApps = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[] } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { ids } = ctx.data;
    if (!ids.length) return { data: [] };

    // Get the apps to export
    const appsToExport = await db.query.apps.findMany({
      where: and(inArray(apps.id, ids), eq(apps.userId, session.user.id)),
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    // Transform the data to a cleaner export format
    const exportData = appsToExport.map((app) => ({
      name: app.name,
      description: app.description,
      icon: app.icon,
      localUrl: app.localUrl,
      remoteUrl: app.remoteUrl,
      category: app.category?.name || null,
      tags: app.tags.map((t) => t.tag.name),
      healthCheckEnabled: app.healthCheckEnabled,
      healthCheckType: app.healthCheckType,
      healthCheckUrl: app.healthCheckUrl,
      notes: app.notes,
      pinned: app.pinned,
      sortOrder: app.sortOrder,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    return { data: exportData };
  }
);

// Bulk update tags for apps
export const bulkUpdateTags = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[]; tagIds: string[]; mode: "replace" | "append" } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { apps, appTags } = await import("@/database/schema");

    const db = await getDb();

    const session = await getAuthenticatedSession();

    const { ids, tagIds, mode } = ctx.data;
    if (!ids.length) return { updated: 0 };

    // Verify apps belong to user
    const userApps = await db.query.apps.findMany({
      where: and(inArray(apps.id, ids), eq(apps.userId, session.user.id)),
    });
    const validIds = userApps.map((a) => a.id);
    if (!validIds.length) return { updated: 0 };

    if (mode === "replace") {
      // Remove existing tags first
      await db.delete(appTags).where(inArray(appTags.appId, validIds));
    }

    // Add new tags
    if (tagIds.length > 0) {
      const newTagRelations: { appId: string; tagId: string }[] = [];
      for (const appId of validIds) {
        for (const tagId of tagIds) {
          newTagRelations.push({ appId, tagId });
        }
      }

      // Insert new tag relations (ignore duplicates for append mode)
      if (mode === "append") {
        // For append mode, get existing tags first
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

    // Update the updatedAt timestamp for all apps
    await db
      .update(apps)
      .set({ updatedAt: new Date() })
      .where(inArray(apps.id, validIds));

    return { updated: validIds.length };
  }
);
