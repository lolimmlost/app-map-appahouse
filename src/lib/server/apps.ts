import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/database/db";
import { apps, appTags, type NewApp } from "@/database/schema";
import { auth } from "@/lib/auth";

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
