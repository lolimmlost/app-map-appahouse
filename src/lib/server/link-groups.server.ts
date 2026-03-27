import { createServerFn } from "@tanstack/react-start";

// Get all link groups with their links for the current user
export const getLinkGroups = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, asc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { linkGroups } = await import("@/database/schema");

  const session = await getOptionalSession();
  if (!session) return { linkGroups: [] };

  const db = await getDb();
  const { links: linksTable } = await import("@/database/schema");

  const result = await db.query.linkGroups.findMany({
    where: eq(linkGroups.userId, session.user.id),
    orderBy: [asc(linkGroups.sortOrder)],
    with: {
      links: {
        orderBy: [asc(linksTable.sortOrder)],
      },
    },
  });

  return { linkGroups: result };
});

type CreateLinkGroupData = {
  data: { name: string; icon?: string };
};

// Create a new link group
export const createLinkGroup = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateLinkGroupData) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { linkGroups } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [group] = await db
      .insert(linkGroups)
      .values({
        name: ctx.data.name,
        icon: ctx.data.icon || null,
        userId: session.user.id,
      })
      .returning();

    return { linkGroup: group };
  }
);

type UpdateLinkGroupData = {
  data: { id: string; name?: string; icon?: string; sortOrder?: number };
};

// Update a link group
export const updateLinkGroup = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateLinkGroupData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { linkGroups } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [updated] = await db
      .update(linkGroups)
      .set({
        ...(ctx.data.name !== undefined && { name: ctx.data.name }),
        ...(ctx.data.icon !== undefined && { icon: ctx.data.icon || null }),
        ...(ctx.data.sortOrder !== undefined && { sortOrder: ctx.data.sortOrder }),
        updatedAt: new Date(),
      })
      .where(and(eq(linkGroups.id, ctx.data.id), eq(linkGroups.userId, session.user.id)))
      .returning();

    if (!updated) throw new Error("Link group not found");
    return { linkGroup: updated };
  }
);

type DeleteLinkGroupData = {
  data: { id: string };
};

// Delete a link group (cascade deletes its links)
export const deleteLinkGroup = createServerFn({ method: "POST" }).handler(
  async (ctx: DeleteLinkGroupData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { linkGroups } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    await db
      .delete(linkGroups)
      .where(and(eq(linkGroups.id, ctx.data.id), eq(linkGroups.userId, session.user.id)));

    return { success: true };
  }
);

type CreateLinkData = {
  data: {
    name: string;
    url: string;
    icon?: string;
    description?: string;
    groupId: string;
  };
};

// Create a new link in a group
export const createLink = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateLinkData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { links, linkGroups } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    // Verify group belongs to user
    const [group] = await db
      .select()
      .from(linkGroups)
      .where(and(eq(linkGroups.id, ctx.data.groupId), eq(linkGroups.userId, session.user.id)))
      .limit(1);

    if (!group) throw new Error("Link group not found");

    const [link] = await db
      .insert(links)
      .values({
        name: ctx.data.name,
        url: ctx.data.url,
        icon: ctx.data.icon || null,
        description: ctx.data.description || null,
        groupId: ctx.data.groupId,
        userId: session.user.id,
      })
      .returning();

    return { link };
  }
);

type UpdateLinkData = {
  data: {
    id: string;
    name?: string;
    url?: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
    groupId?: string;
  };
};

// Update a link
export const updateLink = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateLinkData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { links } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [updated] = await db
      .update(links)
      .set({
        ...(ctx.data.name !== undefined && { name: ctx.data.name }),
        ...(ctx.data.url !== undefined && { url: ctx.data.url }),
        ...(ctx.data.icon !== undefined && { icon: ctx.data.icon || null }),
        ...(ctx.data.description !== undefined && { description: ctx.data.description || null }),
        ...(ctx.data.sortOrder !== undefined && { sortOrder: ctx.data.sortOrder }),
        ...(ctx.data.groupId !== undefined && { groupId: ctx.data.groupId }),
        updatedAt: new Date(),
      })
      .where(and(eq(links.id, ctx.data.id), eq(links.userId, session.user.id)))
      .returning();

    if (!updated) throw new Error("Link not found");
    return { link: updated };
  }
);

type DeleteLinkData = {
  data: { id: string };
};

// Delete a link
export const deleteLink = createServerFn({ method: "POST" }).handler(
  async (ctx: DeleteLinkData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { links } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    await db
      .delete(links)
      .where(and(eq(links.id, ctx.data.id), eq(links.userId, session.user.id)));

    return { success: true };
  }
);
