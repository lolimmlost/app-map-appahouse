import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc, inArray } from "drizzle-orm";
import { db } from "@/database/db";
import { apps, appTags, type NewApp } from "@/database/schema";
import { auth } from "@/lib/auth";
import { getIconUrl } from "./icons";

async function getSession() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

export const getApps = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session?.user) return { apps: [] };

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

  return {
    apps: userApps.map((app) => ({
      ...app,
      tags: app.tags.map((t) => t.tag),
    })),
  };
});

export const getApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const { id, tagIds, ...updateData } = ctx.data;

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

    return updatedApp;
  }
);

export const deleteApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    await db.delete(apps).where(and(eq(apps.id, ctx.data.id), eq(apps.userId, session.user.id)));

    return { success: true };
  }
);

export const reorderApps = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string; sortOrder: number }[] }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    for (const { id, sortOrder } of ctx.data) {
      await db
        .update(apps)
        .set({ sortOrder })
        .where(and(eq(apps.id, id), eq(apps.userId, session.user.id)));
    }

    return { success: true };
  }
);

export const pinApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string; pinned: boolean } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
  const session = await getSession();
  if (!session?.user) return { apps: [] };

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const { ids } = ctx.data;
    if (!ids.length) return { deleted: 0 };

    // First delete app tags
    await db.delete(appTags).where(inArray(appTags.appId, ids));

    // Then delete apps (only those belonging to this user)
    const result = await db
      .delete(apps)
      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));

    return { deleted: ids.length };
  }
);

// Bulk update category
export const bulkUpdateCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[]; categoryId: string | null } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const { ids, enabled } = ctx.data;
    if (!ids.length) return { updated: 0 };

    await db
      .update(apps)
      .set({ healthCheckEnabled: enabled, updatedAt: new Date() })
      .where(and(inArray(apps.id, ids), eq(apps.userId, session.user.id)));

    return { updated: ids.length };
  }
);

// Refresh icons for apps (detect icons based on name)
export const refreshAppIcons = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { ids: string[] } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const { orderedIds } = ctx.data;
    if (!orderedIds.length) return { updated: 0 };

    // Update each app's sortOrder based on its position in the array
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(apps)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(and(eq(apps.id, orderedIds[i]), eq(apps.userId, session.user.id)));
    }

    return { updated: orderedIds.length };
  }
);
