import { createServerFn } from "@tanstack/react-start";
import type { NewSavedView, SearchViewFilters } from "@/types/database";

export const getSavedViews = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, asc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { savedViews } = await import("@/database/schema");

  const session = await getOptionalSession();
  if (!session) return { views: [] };

  const db = await getDb();
  const result = await db.query.savedViews.findMany({
    where: eq(savedViews.userId, session.user.id),
    orderBy: [asc(savedViews.name)],
  });

  return { views: result };
});

type CreateSavedViewData = {
  data: Omit<NewSavedView, "id" | "userId" | "createdAt" | "updatedAt">;
};

export const createSavedView = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateSavedViewData) => {
    const { getDb } = await import("./get-db");
    const { eq } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { savedViews } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    // If this view is being set as default, unset any existing default
    if (ctx.data.isDefault) {
      await db
        .update(savedViews)
        .set({ isDefault: false })
        .where(eq(savedViews.userId, session.user.id));
    }

    const [newView] = await db
      .insert(savedViews)
      .values({
        ...ctx.data,
        userId: session.user.id,
      })
      .returning();

    return newView;
  }
);

type UpdateSavedViewData = {
  data: { id: string } & Partial<Omit<NewSavedView, "id" | "userId">>;
};

export const updateSavedView = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateSavedViewData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { savedViews } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { id, ...updateData } = ctx.data;

    // If this view is being set as default, unset any existing default
    if (updateData.isDefault) {
      await db
        .update(savedViews)
        .set({ isDefault: false })
        .where(eq(savedViews.userId, session.user.id));
    }

    const [updatedView] = await db
      .update(savedViews)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(savedViews.id, id), eq(savedViews.userId, session.user.id)))
      .returning();

    if (!updatedView) throw new Error("Saved view not found");

    return updatedView;
  }
);

export const deleteSavedView = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { savedViews } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    await db.delete(savedViews).where(
      and(eq(savedViews.id, ctx.data.id), eq(savedViews.userId, session.user.id))
    );

    return { success: true };
  }
);

export const setDefaultView = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string | null } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { savedViews } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    // First, unset all defaults for this user
    await db
      .update(savedViews)
      .set({ isDefault: false })
      .where(eq(savedViews.userId, session.user.id));

    // If an ID was provided, set that view as default
    if (ctx.data.id) {
      const [updatedView] = await db
        .update(savedViews)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(and(eq(savedViews.id, ctx.data.id), eq(savedViews.userId, session.user.id)))
        .returning();

      if (!updatedView) throw new Error("Saved view not found");

      return updatedView;
    }

    return { success: true };
  }
);
