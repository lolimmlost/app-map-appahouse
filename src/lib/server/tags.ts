import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/database/db";
import { tags, type NewTag } from "@/database/schema";
import { auth } from "@/lib/auth";

async function getSession() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

export const getTags = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session?.user) return { tags: [] };

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    await db.delete(tags).where(and(eq(tags.id, ctx.data.id), eq(tags.userId, session.user.id)));

    return { success: true };
  }
);
