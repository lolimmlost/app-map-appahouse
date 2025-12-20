import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/database/db";
import { widgets, type NewWidget, type Widget, type WidgetPosition, type WidgetConfig } from "@/database/schema/widgets";
import { integrations } from "@/database/schema/integrations";
import { auth } from "@/lib/auth";

async function getSession() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

// Get all widgets for the current user
export const getWidgets = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session?.user) return { widgets: [] };

  const result = await db.query.widgets.findMany({
    where: eq(widgets.userId, session.user.id),
    orderBy: [asc(widgets.sortOrder)],
    with: {
      integration: true,
    },
  });

  return { widgets: result };
});

// Get a single widget by ID
export const getWidget = createServerFn({ method: "GET" }).handler(
  async (ctx: { data: { id: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [widget] = await db
      .select()
      .from(widgets)
      .where(and(eq(widgets.id, ctx.data.id), eq(widgets.userId, session.user.id)))
      .limit(1);

    if (!widget) throw new Error("Widget not found");

    return { widget };
  }
);

type CreateWidgetData = {
  data: {
    type: Widget["type"];
    integrationId?: string | null;
    position?: WidgetPosition;
    config?: WidgetConfig;
    sortOrder?: number;
  };
};

// Create a new widget
export const createWidget = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateWidgetData) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // If integrationId is provided, verify it belongs to the user
    if (ctx.data.integrationId) {
      const [integration] = await db
        .select()
        .from(integrations)
        .where(and(
          eq(integrations.id, ctx.data.integrationId),
          eq(integrations.userId, session.user.id)
        ))
        .limit(1);

      if (!integration) throw new Error("Integration not found");
    }

    const [newWidget] = await db
      .insert(widgets)
      .values({
        type: ctx.data.type,
        integrationId: ctx.data.integrationId,
        position: ctx.data.position || { x: 0, y: 0, w: 2, h: 2 },
        config: ctx.data.config || {},
        sortOrder: ctx.data.sortOrder || 0,
        userId: session.user.id,
      })
      .returning();

    return newWidget;
  }
);

type UpdateWidgetData = {
  data: {
    id: string;
    config?: WidgetConfig;
    type?: Widget["type"];
    integrationId?: string | null;
    position?: WidgetPosition;
    sortOrder?: number;
  };
};

// Update an existing widget
export const updateWidget = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateWidgetData) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const { id, ...updateData } = ctx.data;

    // If integrationId is being updated, verify it belongs to the user
    if (updateData.integrationId) {
      const [integration] = await db
        .select()
        .from(integrations)
        .where(and(
          eq(integrations.id, updateData.integrationId),
          eq(integrations.userId, session.user.id)
        ))
        .limit(1);

      if (!integration) throw new Error("Integration not found");
    }

    const [updatedWidget] = await db
      .update(widgets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(widgets.id, id), eq(widgets.userId, session.user.id)))
      .returning();

    if (!updatedWidget) throw new Error("Widget not found");

    return updatedWidget;
  }
);

// Update widget positions (for drag and drop)
type UpdateWidgetPositionsData = {
  data: Array<{ id: string; position: WidgetPosition; sortOrder: number }>;
};

export const updateWidgetPositions = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateWidgetPositionsData) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // Update each widget's position
    await Promise.all(
      ctx.data.map(async (item) => {
        await db
          .update(widgets)
          .set({
            position: item.position,
            sortOrder: item.sortOrder,
            updatedAt: new Date(),
          })
          .where(and(eq(widgets.id, item.id), eq(widgets.userId, session.user.id)));
      })
    );

    return { success: true };
  }
);

// Delete a widget
export const deleteWidget = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    await db.delete(widgets).where(
      and(eq(widgets.id, ctx.data.id), eq(widgets.userId, session.user.id))
    );

    return { success: true };
  }
);

// Update widget sort order (for drag and drop reordering)
export const updateWidgetOrder = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { orderedIds: string[] } }) => {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const { orderedIds } = ctx.data;
    if (!orderedIds.length) return { updated: 0 };

    // Update each widget's sortOrder based on its position in the array
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(widgets)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(and(eq(widgets.id, orderedIds[i]), eq(widgets.userId, session.user.id)));
    }

    return { updated: orderedIds.length };
  }
);
