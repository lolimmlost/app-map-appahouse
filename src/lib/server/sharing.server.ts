import { createServerFn } from "@tanstack/react-start";
import type {
  NewAppShare,
  SharingPermission,
  GranularPermissions,
} from "@/database/schema";

// Get all shares for apps/categories owned by the current user
export const getMyShares = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { appShares } = await import("@/database/schema");

  const session = await getOptionalSession();
  if (!session) return { shares: [] };

  const db = await getDb();
  const shares = await db.query.appShares.findMany({
    where: eq(appShares.ownerId, session.user.id),
    with: {
      app: {
        with: {
          category: true,
        },
      },
      category: true,
      sharedWith: true,
    },
  });

  return {
    shares: shares.map((share) => ({
      ...share,
      sharedWith: {
        id: share.sharedWith.id,
        name: share.sharedWith.name,
        email: share.sharedWith.email,
        image: share.sharedWith.image,
      },
    })),
  };
});

// Get all apps/categories shared with the current user
export const getSharedWithMe = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { appShares } = await import("@/database/schema");

  const session = await getOptionalSession();
  if (!session) return { shares: [] };

  const db = await getDb();
  const shares = await db.query.appShares.findMany({
    where: eq(appShares.sharedWithId, session.user.id),
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
      category: true,
      owner: true,
    },
  });

  return {
    shares: shares.map((share) => ({
      ...share,
      owner: {
        id: share.owner.id,
        name: share.owner.name,
        email: share.owner.email,
        image: share.owner.image,
      },
    })),
  };
});

// Get shares for a specific app
export const getAppShares = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appShares, apps } = await import("@/database/schema");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    // Verify the user owns this app
    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, ctx.data.appId), eq(apps.userId, session.user.id)),
    });

    if (!app) {
      throw new Error("App not found or you don't have permission to view its shares");
    }

    const shares = await db.query.appShares.findMany({
      where: and(
        eq(appShares.appId, ctx.data.appId),
        eq(appShares.shareType, "app")
      ),
      with: {
        sharedWith: true,
      },
    });

    return {
      shares: shares.map((share) => ({
        ...share,
        sharedWith: {
          id: share.sharedWith.id,
          name: share.sharedWith.name,
          email: share.sharedWith.email,
          image: share.sharedWith.image,
        },
      })),
    };
  }
);

// Get shares for a specific category
export const getCategoryShares = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { categoryId: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appShares, categories } = await import("@/database/schema");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    // Verify the user owns this category
    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, ctx.data.categoryId), eq(categories.userId, session.user.id)),
    });

    if (!category) {
      throw new Error("Category not found or you don't have permission to view its shares");
    }

    const shares = await db.query.appShares.findMany({
      where: and(
        eq(appShares.categoryId, ctx.data.categoryId),
        eq(appShares.shareType, "category")
      ),
      with: {
        sharedWith: true,
      },
    });

    return {
      shares: shares.map((share) => ({
        ...share,
        sharedWith: {
          id: share.sharedWith.id,
          name: share.sharedWith.name,
          email: share.sharedWith.email,
          image: share.sharedWith.image,
        },
      })),
    };
  }
);

// Search for users to share with
export const searchUsers = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { query: string } }) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");

    const session = await getAuthenticatedSession();

    if (!ctx.data.query || ctx.data.query.length < 2) {
      return { users: [] };
    }

    const db = await getDb();
    // Search by email or name (excluding the current user)
    const searchQuery = ctx.data.query.toLowerCase();
    const allUsers = await db.query.users.findMany({
      limit: 10,
    });

    const matchedUsers = allUsers.filter(
      (user) =>
        user.id !== session.user.id &&
        (user.email.toLowerCase().includes(searchQuery) ||
          user.name.toLowerCase().includes(searchQuery))
    );

    return {
      users: matchedUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })),
    };
  }
);

type ShareAppData = {
  data: {
    appId: string;
    sharedWithEmail: string;
    permission: SharingPermission;
    customPermissions?: Partial<GranularPermissions>;
  };
};

// Share an app with another user
export const shareApp = createServerFn({ method: "POST" }).handler(
  async (ctx: ShareAppData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appShares, apps, users, PERMISSION_PRESETS } = await import("@/database/schema");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    // Verify the user owns this app
    const app = await db.query.apps.findFirst({
      where: and(eq(apps.id, ctx.data.appId), eq(apps.userId, session.user.id)),
    });

    if (!app) {
      throw new Error("App not found or you don't have permission to share it");
    }

    // Find the user to share with
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, ctx.data.sharedWithEmail.toLowerCase()),
    });

    if (!targetUser) {
      throw new Error("User not found. Make sure they have an account.");
    }

    if (targetUser.id === session.user.id) {
      throw new Error("You cannot share an app with yourself");
    }

    // Check if already shared
    const existingShare = await db.query.appShares.findFirst({
      where: and(
        eq(appShares.appId, ctx.data.appId),
        eq(appShares.sharedWithId, targetUser.id)
      ),
    });

    if (existingShare) {
      throw new Error("This app is already shared with this user");
    }

    // Get permission preset or use custom
    const permissions = ctx.data.customPermissions
      ? { ...PERMISSION_PRESETS[ctx.data.permission], ...ctx.data.customPermissions }
      : PERMISSION_PRESETS[ctx.data.permission];

    // Create the share
    const [newShare] = await db
      .insert(appShares)
      .values({
        shareType: "app",
        appId: ctx.data.appId,
        ownerId: session.user.id,
        sharedWithId: targetUser.id,
        permission: ctx.data.permission,
        ...permissions,
      })
      .returning();

    return newShare;
  }
);

type ShareCategoryData = {
  data: {
    categoryId: string;
    sharedWithEmail: string;
    permission: SharingPermission;
    customPermissions?: Partial<GranularPermissions>;
  };
};

// Share a category (and all its apps) with another user
export const shareCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: ShareCategoryData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appShares, categories, users, PERMISSION_PRESETS } = await import("@/database/schema");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    // Verify the user owns this category
    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, ctx.data.categoryId), eq(categories.userId, session.user.id)),
    });

    if (!category) {
      throw new Error("Category not found or you don't have permission to share it");
    }

    // Find the user to share with
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, ctx.data.sharedWithEmail.toLowerCase()),
    });

    if (!targetUser) {
      throw new Error("User not found. Make sure they have an account.");
    }

    if (targetUser.id === session.user.id) {
      throw new Error("You cannot share a category with yourself");
    }

    // Check if already shared
    const existingShare = await db.query.appShares.findFirst({
      where: and(
        eq(appShares.categoryId, ctx.data.categoryId),
        eq(appShares.sharedWithId, targetUser.id)
      ),
    });

    if (existingShare) {
      throw new Error("This category is already shared with this user");
    }

    // Get permission preset or use custom
    const permissions = ctx.data.customPermissions
      ? { ...PERMISSION_PRESETS[ctx.data.permission], ...ctx.data.customPermissions }
      : PERMISSION_PRESETS[ctx.data.permission];

    // Create the share
    const [newShare] = await db
      .insert(appShares)
      .values({
        shareType: "category",
        categoryId: ctx.data.categoryId,
        ownerId: session.user.id,
        sharedWithId: targetUser.id,
        permission: ctx.data.permission,
        ...permissions,
      })
      .returning();

    return newShare;
  }
);

type UpdateShareData = {
  data: {
    shareId: string;
    permission?: SharingPermission;
    customPermissions?: Partial<GranularPermissions>;
  };
};

// Update share permissions
export const updateShare = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateShareData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appShares, PERMISSION_PRESETS } = await import("@/database/schema");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    // Verify the user owns this share
    const share = await db.query.appShares.findFirst({
      where: and(eq(appShares.id, ctx.data.shareId), eq(appShares.ownerId, session.user.id)),
    });

    if (!share) {
      throw new Error("Share not found or you don't have permission to update it");
    }

    // Prepare update data
    const updateData: Partial<NewAppShare> = {
      updatedAt: new Date(),
    };

    if (ctx.data.permission) {
      updateData.permission = ctx.data.permission;
      const permissions = PERMISSION_PRESETS[ctx.data.permission];
      Object.assign(updateData, permissions);
    }

    if (ctx.data.customPermissions) {
      Object.assign(updateData, ctx.data.customPermissions);
    }

    const [updatedShare] = await db
      .update(appShares)
      .set(updateData)
      .where(eq(appShares.id, ctx.data.shareId))
      .returning();

    return updatedShare;
  }
);

// Revoke a share
export const revokeShare = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { shareId: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appShares } = await import("@/database/schema");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    // Verify the user owns this share
    const share = await db.query.appShares.findFirst({
      where: and(eq(appShares.id, ctx.data.shareId), eq(appShares.ownerId, session.user.id)),
    });

    if (!share) {
      throw new Error("Share not found or you don't have permission to revoke it");
    }

    await db.delete(appShares).where(eq(appShares.id, ctx.data.shareId));

    return { success: true };
  }
);

// Bulk share multiple apps
export const bulkShareApps = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    data: {
      appIds: string[];
      sharedWithEmail: string;
      permission: SharingPermission;
      customPermissions?: Partial<GranularPermissions>;
    };
  }) => {
    const { getDb } = await import("./get-db");
    const { eq, and, inArray } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { appShares, apps, users, PERMISSION_PRESETS } = await import("@/database/schema");

    const session = await getAuthenticatedSession();

    const db = await getDb();
    // Verify the user owns all these apps
    const userApps = await db.query.apps.findMany({
      where: and(
        inArray(apps.id, ctx.data.appIds),
        eq(apps.userId, session.user.id)
      ),
    });

    if (userApps.length !== ctx.data.appIds.length) {
      throw new Error("Some apps were not found or you don't have permission to share them");
    }

    // Find the user to share with
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, ctx.data.sharedWithEmail.toLowerCase()),
    });

    if (!targetUser) {
      throw new Error("User not found. Make sure they have an account.");
    }

    if (targetUser.id === session.user.id) {
      throw new Error("You cannot share apps with yourself");
    }

    // Get permission preset or use custom
    const permissions = ctx.data.customPermissions
      ? { ...PERMISSION_PRESETS[ctx.data.permission], ...ctx.data.customPermissions }
      : PERMISSION_PRESETS[ctx.data.permission];

    // Get existing shares to avoid duplicates
    const existingShares = await db.query.appShares.findMany({
      where: and(
        inArray(appShares.appId, ctx.data.appIds),
        eq(appShares.sharedWithId, targetUser.id)
      ),
    });

    const existingAppIds = new Set(existingShares.map((s) => s.appId));
    const newAppIds = ctx.data.appIds.filter((id) => !existingAppIds.has(id));

    if (newAppIds.length === 0) {
      return { shared: 0, skipped: ctx.data.appIds.length };
    }

    // Create the shares
    await db.insert(appShares).values(
      newAppIds.map((appId) => ({
        shareType: "app" as const,
        appId,
        ownerId: session.user.id,
        sharedWithId: targetUser.id,
        permission: ctx.data.permission,
        ...permissions,
      }))
    );

    return { shared: newAppIds.length, skipped: existingAppIds.size };
  }
);

// Check if the current user has permission to perform an action on a shared app
export const checkAppPermission = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string; action: keyof GranularPermissions } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { appShares, apps } = await import("@/database/schema");

    const session = await getOptionalSession();
    if (!session) return { hasPermission: false };

    const db = await getDb();
    // Check if user owns the app
    const app = await db.query.apps.findFirst({
      where: eq(apps.id, ctx.data.appId),
    });

    if (!app) {
      return { hasPermission: false };
    }

    // Owner has all permissions
    if (app.userId === session.user.id) {
      return { hasPermission: true, isOwner: true };
    }

    // Check direct app share
    const appShare = await db.query.appShares.findFirst({
      where: and(
        eq(appShares.appId, ctx.data.appId),
        eq(appShares.sharedWithId, session.user.id)
      ),
    });

    if (appShare) {
      return {
        hasPermission: appShare[ctx.data.action] ?? false,
        isOwner: false,
        share: appShare,
      };
    }

    // Check category share (if app has a category)
    if (app.categoryId) {
      const categoryShare = await db.query.appShares.findFirst({
        where: and(
          eq(appShares.categoryId, app.categoryId),
          eq(appShares.sharedWithId, session.user.id)
        ),
      });

      if (categoryShare) {
        return {
          hasPermission: categoryShare[ctx.data.action] ?? false,
          isOwner: false,
          share: categoryShare,
          viaCategory: true,
        };
      }
    }

    return { hasPermission: false };
  }
);

// Get effective permissions for a user on an app
export const getEffectivePermissions = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { appId: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { appShares, apps } = await import("@/database/schema");

    const session = await getOptionalSession();
    if (!session) {
      return {
        canView: false,
        canEdit: false,
        canSeeHealth: false,
        canAccessRemoteUrl: false,
        canAccessLocalUrl: false,
        canDelete: false,
        isOwner: false,
      };
    }

    const db = await getDb();
    // Check if user owns the app
    const app = await db.query.apps.findFirst({
      where: eq(apps.id, ctx.data.appId),
    });

    if (!app) {
      return {
        canView: false,
        canEdit: false,
        canSeeHealth: false,
        canAccessRemoteUrl: false,
        canAccessLocalUrl: false,
        canDelete: false,
        isOwner: false,
      };
    }

    // Owner has all permissions
    if (app.userId === session.user.id) {
      return {
        canView: true,
        canEdit: true,
        canSeeHealth: true,
        canAccessRemoteUrl: true,
        canAccessLocalUrl: true,
        canDelete: true,
        isOwner: true,
      };
    }

    // Check direct app share
    const appShare = await db.query.appShares.findFirst({
      where: and(
        eq(appShares.appId, ctx.data.appId),
        eq(appShares.sharedWithId, session.user.id)
      ),
    });

    if (appShare) {
      return {
        canView: appShare.canView,
        canEdit: appShare.canEdit,
        canSeeHealth: appShare.canSeeHealth,
        canAccessRemoteUrl: appShare.canAccessRemoteUrl,
        canAccessLocalUrl: appShare.canAccessLocalUrl,
        canDelete: appShare.canDelete,
        isOwner: false,
      };
    }

    // Check category share (if app has a category)
    if (app.categoryId) {
      const categoryShare = await db.query.appShares.findFirst({
        where: and(
          eq(appShares.categoryId, app.categoryId),
          eq(appShares.sharedWithId, session.user.id)
        ),
      });

      if (categoryShare) {
        return {
          canView: categoryShare.canView,
          canEdit: categoryShare.canEdit,
          canSeeHealth: categoryShare.canSeeHealth,
          canAccessRemoteUrl: categoryShare.canAccessRemoteUrl,
          canAccessLocalUrl: categoryShare.canAccessLocalUrl,
          canDelete: categoryShare.canDelete,
          isOwner: false,
          viaCategory: true,
        };
      }
    }

    return {
      canView: false,
      canEdit: false,
      canSeeHealth: false,
      canAccessRemoteUrl: false,
      canAccessLocalUrl: false,
      canDelete: false,
      isOwner: false,
    };
  }
);
