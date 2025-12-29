import { createServerFn } from "@tanstack/react-start";
import type { NewTag } from "@/types/database";

export const getTags = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, asc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { tags } = await import("@/database/schema");

  const session = await getOptionalSession();
  if (!session) return { tags: [] };

  const db = await getDb();
  const result = await db.query.tags.findMany({
    where: eq(tags.userId, session.user.id),
    orderBy: [asc(tags.name)],
  });

  return { tags: result };
});

type CreateTagData = {
  data: Omit<NewTag, "id" | "userId" | "createdAt">;
};

export const createTag = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateTagData) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { tags } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [newTag] = await db
      .insert(tags)
      .values({
        ...ctx.data,
        userId: session.user.id,
      })
      .returning();

    return newTag;
  }
);

type UpdateTagData = {
  data: { id: string } & Partial<Omit<NewTag, "id" | "userId">>;
};

export const updateTag = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateTagData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { tags } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { id, ...updateData } = ctx.data;

    const [updatedTag] = await db
      .update(tags)
      .set(updateData)
      .where(and(eq(tags.id, id), eq(tags.userId, session.user.id)))
      .returning();

    if (!updatedTag) throw new Error("Tag not found");

    return updatedTag;
  }
);

export const deleteTag = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { tags } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    await db.delete(tags).where(and(eq(tags.id, ctx.data.id), eq(tags.userId, session.user.id)));

    return { success: true };
  }
);
